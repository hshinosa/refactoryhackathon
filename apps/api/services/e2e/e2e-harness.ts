import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import AdmZip from 'adm-zip';

import type {
  ChatRetrievalResponse,
  GeneratedDocs,
  GitHubActionsTriggerRequest,
  GitHubActionsTriggerResponse,
  Project,
  ResolvedUserPAT,
  SemanticIndexBuildResult,
  UserPATStorageContract,
} from '../../types';
import {
  createProjectForUser,
  validateGitHubRepositoryIntake,
  validateZipUploadIntake,
} from '../project-intake';
import {
  cleanupSourcePath,
  createTempSourcePaths,
  extractZipToTempStorage,
  PrivateRepositoryClonePreparationService,
} from '../source-ingestion';
import {
  CodebaseAnalysisService,
  DeterministicScanner,
  DependencyScanner,
  FolderScanner,
  StandardExcludeFilter,
  AgentEnrichmentBoundary,
  StructuredPromptBuilder,
  HeuristicAgentEnrichmentSpawner,
  EnrichmentFallbackStrategy,
  CompactContextBuilder,
  TechStackDetectorFallback,
} from '../codebase-analysis';
import {
  createAIDocGenerationPipelineStub,
  createAIDocGenerationService,
  CodebaseDocPromptBuilderStub,
  MarkdownFormatterStub,
  MarkdownPageSplitterStub,
  SidebarGeneratorStub,
} from '../ai-doc-generation';
import type {
  AIGenerationRequest,
  AIGenerationResponse,
  OpenAICompatibleAIClientContract,
} from '../ai-doc-generation';
import {
  DocumentationRetrievalServiceStub,
  InMemoryDocsHistoryStoreStub,
  InMemoryDocumentationStoreStub,
} from '../storage';
import {
  buildSemanticIndex,
  GroundedDocsRetrievalService,
  InMemoryVectorIndexStore,
} from '../semantic-search';
import type {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResponse,
  EmbeddingGeneratorContract,
} from '../../types';
import {
  createRegenerateDocsEndpointService,
  createRegenerateWorkflowTriggerService,
  RegenerateServiceStub,
} from '../regenerate';

export type JobStatus =
  | 'queued'
  | 'uploading'
  | 'cloning'
  | 'extracting'
  | 'scanning'
  | 'generating'
  | 'completed'
  | 'failed';

export class SafeBackendError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_ZIP'
      | 'INVALID_GITHUB_URL'
      | 'INACCESSIBLE_REPOSITORY'
      | 'INVALID_PAT'
      | 'AI_FAILURE',
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

export interface E2ETempWorkspace {
  rootPath: string;
  repositoryPath: string;
  writeRepository(files: Record<string, string>): Promise<void>;
}

export async function createE2ETempWorkspace(): Promise<E2ETempWorkspace> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'codebase-wiki-e2e-'));
  const repositoryPath = path.join(rootPath, 'repo');

  return {
    rootPath,
    repositoryPath,
    async writeRepository(files: Record<string, string>) {
      for (const [relativePath, content] of Object.entries(files)) {
        const absolutePath = path.join(repositoryPath, relativePath);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content, 'utf-8');
      }
    },
  };
}

export async function createZipFixture(
  workspace: E2ETempWorkspace,
  files: Record<string, string>,
): Promise<string> {
  const zipPath = path.join(workspace.rootPath, 'project.zip');
  const zip = new AdmZip();

  for (const [relativePath, content] of Object.entries(files)) {
    zip.addFile(relativePath, Buffer.from(content, 'utf-8'));
  }

  zip.writeZip(zipPath);
  return zipPath;
}

export class CapturedLogs {
  private readonly entries: Array<Record<string, string>> = [];

  info(entry: Record<string, string>): void {
    this.entries.push(redactEntry(entry));
  }

  error(entry: Record<string, string>): void {
    this.entries.push(redactEntry(entry));
  }

  serialized(): string {
    return JSON.stringify(this.entries);
  }
}

export class FakeGitHubCloneAdapter {
  private readonly repositories = new Map<string, string>();
  lastClone: { repositoryUrl: string; pat?: string; outputPath: string } | null = null;

  registerRepository(repositoryUrl: string, sourcePath: string): void {
    this.repositories.set(repositoryUrl, sourcePath);
  }

  async clone(input: { repositoryUrl: string; outputPath: string; pat?: string }): Promise<void> {
    this.lastClone = input;

    if (input.pat?.startsWith('bad_')) {
      throw new SafeBackendError('INVALID_PAT', 'Repository credentials were rejected.');
    }

    const sourcePath = this.repositories.get(input.repositoryUrl);
    if (!sourcePath) {
      throw new SafeBackendError('INACCESSIBLE_REPOSITORY', 'Repository could not be accessed.');
    }

    await fs.mkdir(input.outputPath, { recursive: true });
    await fs.cp(sourcePath, input.outputPath, { recursive: true });
  }
}

export class FakeAIClient implements OpenAICompatibleAIClientContract {
  private nextFailure: string | null = null;

  failNext(message: string): void {
    this.nextFailure = message;
  }

  async generateText(input: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (this.nextFailure) {
      this.nextFailure = null;
      throw new SafeBackendError('AI_FAILURE', 'Documentation generation failed.');
    }

    return {
      projectId: input.projectId,
      model: input.model,
      generatedAt: new Date().toISOString(),
      content: [
        '## Overview',
        '',
        `Generated docs for ${input.projectId}.`,
        '',
        '## Setup Guide',
        '',
        'Install dependencies and run the app.',
      ].join('\n'),
    };
  }
}

class FakeEmbeddingGenerator implements EmbeddingGeneratorContract {
  async generateEmbeddings(input: EmbeddingGenerationRequest): Promise<EmbeddingGenerationResponse> {
    return {
      projectId: input.projectId,
      model: input.model,
      generatedAt: new Date().toISOString(),
      embeddings: input.chunks.map((chunk, index) => ({
        chunkId: chunk.chunkId,
        text: chunk.text,
        metadata: chunk.metadata,
        embedding: [1, index + 1, chunk.text.length],
      })),
    };
  }
}

class MemoryPATStorage implements UserPATStorageContract {
  private readonly records = new Map<string, ResolvedUserPAT[]>();
  private next = 1;

  async storePAT(input: { userId: string; pat: string; githubUsername?: string }): Promise<{ patId: string }> {
    const patId = `pat-${this.next}`;
    this.next += 1;
    const current = this.records.get(input.userId) ?? [];
    current.push({ patId, pat: input.pat, githubUsername: input.githubUsername });
    this.records.set(input.userId, current);
    return { patId };
  }

  async resolvePATForUser(input: { userId: string; patId?: string }): Promise<ResolvedUserPAT | null> {
    const current = this.records.get(input.userId) ?? [];
    return input.patId ? current.find((item) => item.patId === input.patId) ?? null : current.at(-1) ?? null;
  }

  async revokePAT(): Promise<void> {
    return undefined;
  }

  async deletePAT(): Promise<void> {
    return undefined;
  }
}

export interface PipelineResult {
  project: Project;
  docs: GeneratedDocs;
  semanticIndex: SemanticIndexBuildResult;
  chatContext: ChatRetrievalResponse;
  statuses: JobStatus[];
  tempRootPath: string;
}

export function createServiceLayerE2EHarness() {
  const projects = new Map<string, Project>();
  const docsStore = new InMemoryDocumentationStoreStub();
  const docsHistoryStore = new InMemoryDocsHistoryStoreStub();
  const vectorIndexStore = new InMemoryVectorIndexStore();
  const embeddingGenerator = new FakeEmbeddingGenerator();
  const aiClient = new FakeAIClient();
  const githubCloneAdapter = new FakeGitHubCloneAdapter();
  const logs = new CapturedLogs();
  const patStorage = new MemoryPATStorage();
  const clonePreparation = new PrivateRepositoryClonePreparationService(patStorage);

  const codebaseAnalysis = new CodebaseAnalysisService({
    deterministicScanner: new DeterministicScanner({
      folderScanner: new FolderScanner({ excludeFilter: new StandardExcludeFilter() }),
      dependencyScanner: new DependencyScanner(),
    }),
    enrichmentBoundary: new AgentEnrichmentBoundary({
      promptBuilder: new StructuredPromptBuilder(),
      spawner: new HeuristicAgentEnrichmentSpawner({
        techStackDetector: new TechStackDetectorFallback(),
        contextBuilder: new CompactContextBuilder(),
      }),
      fallback: new EnrichmentFallbackStrategy(new TechStackDetectorFallback(), new CompactContextBuilder()),
    }),
  });

  const aiDocGeneration = createAIDocGenerationService({
    pipeline: createAIDocGenerationPipelineStub({
      aiClient,
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore,
    }),
    docsStore,
    docsHistoryStore,
    model: 'fake-model',
    suggestedDocStructure: ['Overview', 'Setup Guide'],
  });

  const retrieval = new DocumentationRetrievalServiceStub(docsStore);
  const chatRetrieval = new GroundedDocsRetrievalService({
    embeddingGenerator,
    vectorIndexStore,
    model: 'fake-embedding-model',
  });

  async function finishPipeline(input: {
    project: Project;
    sourcePath: string;
    tempRootPath: string;
    statuses: JobStatus[];
  }): Promise<PipelineResult> {
    try {
      input.statuses.push('scanning');
      updateProjectStatus(input.project, 'scanning');
      const analysis = await codebaseAnalysis.analyze({
        projectId: input.project.id,
        sourcePath: input.sourcePath,
      });

      input.statuses.push('generating');
      updateProjectStatus(input.project, 'generating');
      const docs = await aiDocGeneration.generateDocs({
        projectId: input.project.id,
        compactContext: analysis.compactContext,
      });

      const semanticIndex = await buildSemanticIndex({
        projectId: input.project.id,
        model: 'fake-embedding-model',
        summary: analysis.compactContext,
        docs: docs.pages,
        embeddingGenerator,
        vectorIndexStore,
      });

      const retrieved = await retrieval.getDocumentation(input.project.id);
      const chatContext = await chatRetrieval.retrieveContext({
        projectId: input.project.id,
        query: 'How do I set up the project?',
        maxResults: 3,
        allowedSources: ['vector-index', 'codebase-summary'],
      });

      input.statuses.push('completed');
      updateProjectStatus(input.project, 'completed');
      logs.info({ projectId: input.project.id, status: 'completed', failureCategory: 'none' });
      await cleanupSourcePath(input.tempRootPath);

      return {
        project: input.project,
        docs: {
          projectId: retrieved?.projectId ?? docs.projectId,
          pages: retrieved?.pages ?? docs.pages,
          sidebar: retrieved?.sidebar ?? docs.sidebar,
          generatedAt: retrieved?.generatedAt ?? docs.generatedAt,
          version: retrieved?.version ?? docs.version,
        },
        semanticIndex,
        chatContext,
        statuses: input.statuses,
        tempRootPath: input.tempRootPath,
      };
    } catch (error) {
      input.statuses.push('failed');
      updateProjectStatus(input.project, 'failed');
      logs.error({
        projectId: input.project.id,
        status: 'failed',
        failureCategory: error instanceof SafeBackendError ? error.code : 'UNKNOWN',
      });
      await cleanupSourcePath(input.tempRootPath);
      throw toSafeError(error);
    }
  }

  async function createGitHubProject(input: {
    userId: string;
    projectName: string;
    repositoryUrl: string;
  }): Promise<Project> {
    try {
      validateGitHubRepositoryIntake({ repositoryUrl: input.repositoryUrl });
      const project = createProjectForUser(
        { userId: input.userId },
        { name: input.projectName, sourceType: 'github', sourceInput: input.repositoryUrl },
      );
      projects.set(project.id, project);
      return project;
    } catch (error) {
      throw toSafeError(error);
    }
  }

  async function runGitHubPipeline(input: {
    project: Project;
    userId: string;
    providedPAT?: string;
    storedPatId?: string;
    statuses: JobStatus[];
  }): Promise<PipelineResult> {
    const paths = createTempSourcePaths({ projectId: input.project.id, sourceType: 'github' });

    try {
      input.statuses.push('cloning');
      updateProjectStatus(input.project, 'cloning');
      const prepared = await clonePreparation.prepareGitHubClone({
        userId: input.userId,
        repositoryUrl: input.project.sourceInput,
        providedPAT: input.providedPAT,
        storedPatId: input.storedPatId,
      });
      await githubCloneAdapter.clone({
        repositoryUrl: prepared.repositoryUrl,
        outputPath: paths.sourcePath,
        pat: prepared.resolvedPAT,
      });
      return finishPipeline({
        project: input.project,
        sourcePath: paths.sourcePath,
        tempRootPath: paths.rootPath,
        statuses: input.statuses,
      });
    } catch (error) {
      input.statuses.push('failed');
      updateProjectStatus(input.project, 'failed');
      logs.error({
        projectId: input.project.id,
        status: 'failed',
        failureCategory: error instanceof SafeBackendError ? error.code : 'UNKNOWN',
      });
      await cleanupSourcePath(paths.rootPath);
      throw toSafeError(error);
    }
  }

  return {
    aiClient,
    githubCloneAdapter,
    logs,
    async storePAT(input: { userId: string; pat: string; githubUsername?: string }) {
      return patStorage.storePAT(input);
    },
    createGitHubProject,
    async runZipSourceToDocs(input: {
      userId: string;
      projectName: string;
      zipPath: string;
      fileName: string;
      fileSizeBytes: number;
    }): Promise<PipelineResult> {
      try {
        validateZipUploadIntake({ fileName: input.fileName, fileSizeBytes: input.fileSizeBytes });
      } catch (error) {
        throw toSafeError(error);
      }

      const project = createProjectForUser(
        { userId: input.userId },
        { name: input.projectName, sourceType: 'zip', sourceInput: input.fileName },
      );
      projects.set(project.id, project);
      const statuses: JobStatus[] = ['queued', 'uploading'];
      const paths = createTempSourcePaths({ projectId: project.id, sourceType: 'zip' });

      try {
        statuses.push('extracting');
        updateProjectStatus(project, 'extracting');
        await extractZipToTempStorage({ zipFilePath: input.zipPath, outputPath: paths.sourcePath });
        return finishPipeline({
          project,
          sourcePath: paths.sourcePath,
          tempRootPath: paths.rootPath,
          statuses,
        });
      } catch (error) {
        statuses.push('failed');
        updateProjectStatus(project, 'failed');
        logs.error({
          projectId: project.id,
          status: 'failed',
          failureCategory: error instanceof SafeBackendError ? error.code : 'INVALID_ZIP',
        });
        await cleanupSourcePath(paths.rootPath);
        throw toSafeError(error);
      }
    },
    async runGitHubSourceToDocs(input: {
      userId: string;
      projectName: string;
      repositoryUrl: string;
      providedPAT?: string;
      storedPatId?: string;
    }): Promise<PipelineResult> {
      const project = await createGitHubProject(input);
      const statuses: JobStatus[] = ['queued'];
      return runGitHubPipeline({
        project,
        userId: input.userId,
        providedPAT: input.providedPAT,
        storedPatId: input.storedPatId,
        statuses,
      });
    },
    async runGitHubRegenerate(input: {
      projectId: string;
      requestedByUserId: string;
      storedPatId?: string;
      providedPAT?: string;
    }): Promise<PipelineResult & { accepted: { projectId: string; jobId: string; accepted: true; requestedAt: string }; history: GeneratedDocs[] }> {
      const endpoint = createRegenerateDocsEndpointService({
        triggerService: new RegenerateServiceStub(),
        getProjectById: async (projectId) => projects.get(projectId) ?? null,
      });
      const accepted = await endpoint.regenerateDocs({
        projectId: input.projectId,
        triggeredBy: 'manual',
        requestedByUserId: input.requestedByUserId,
      });
      const project = projects.get(input.projectId);
      if (!project) throw new Error('Project not found');
      const result = await runGitHubPipeline({
        project,
        userId: input.requestedByUserId,
        providedPAT: input.providedPAT,
        storedPatId: input.storedPatId,
        statuses: ['queued'],
      });
      const history = await docsHistoryStore.listHistory(input.projectId);
      return { ...result, accepted, history };
    },
    async triggerGitHubActionsRegenerate(input: GitHubActionsTriggerRequest): Promise<GitHubActionsTriggerResponse> {
      const workflow = createRegenerateWorkflowTriggerService({
        triggerService: new RegenerateServiceStub(),
        getProjectById: async (projectId) => projects.get(projectId) ?? null,
      });
      return workflow.triggerFromWorkflow(input);
    },
    getStatusContract(): JobStatus[] {
      return ['queued', 'uploading', 'cloning', 'extracting', 'scanning', 'generating', 'completed', 'failed'];
    },
  };
}

function updateProjectStatus(project: Project, status: Project['status']): void {
  project.status = status;
  project.updatedAt = new Date().toISOString();
}

function toSafeError(error: unknown): SafeBackendError {
  if (error instanceof SafeBackendError) return error;
  if (error instanceof Error && error.message.includes('Invalid GitHub repository URL')) {
    return new SafeBackendError('INVALID_GITHUB_URL', 'Invalid GitHub repository URL.');
  }
  if (error instanceof Error && (error.message.includes('ZIP') || error.message.includes('zip'))) {
    return new SafeBackendError('INVALID_ZIP', 'Invalid ZIP upload.');
  }
  return new SafeBackendError('AI_FAILURE', 'Documentation generation failed.');
}

function redactEntry(entry: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [key, redact(value)]),
  );
}

function redact(value: string): string {
  return value
    .replace(/token_[A-Za-z0-9_]+/g, '[REDACTED_PAT]')
    .replace(/bad_pat_secret/g, '[REDACTED_PAT]')
    .replace(/RAW_SOURCE_SECRET/g, '[REDACTED_SOURCE]');
}
