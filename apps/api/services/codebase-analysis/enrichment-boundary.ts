import type { EnrichedAnalysis, RawScanResult } from '../../types';
import type { OpenAICompatibleAIClientContract } from '../ai-doc-generation/ai-provider-client';
import type { CompactContextBuilderContract } from './context-builder';
import type { TechStackDetectorContract } from './tech-stack-detector';

export interface EnrichmentPromptSections {
  context: string;
  goal: string;
  downstream: string;
  request: string;
}

export interface EnrichmentPromptBuilderContract {
  build(input: { projectId: string; rawScan: RawScanResult }): EnrichmentPromptSections;
}

export interface AgentEnrichmentSpawnerContract {
  spawn(input: {
    projectId: string;
    prompt: EnrichmentPromptSections;
    rawScan: RawScanResult;
    timeoutMs: number;
  }): Promise<EnrichedAnalysis>;
}

export interface EnrichmentFallbackContext {
  projectId: string;
  rawScan: RawScanResult;
  reason: 'timeout' | 'failure' | 'invalid-response';
  message: string;
}

export interface EnrichmentFallbackStrategyContract {
  build(context: EnrichmentFallbackContext): EnrichedAnalysis;
}

export interface AgentEnrichmentBoundaryContract {
  enrich(input: { projectId: string; rawScan: RawScanResult }): Promise<EnrichedAnalysis>;
}

export interface AgentEnrichmentBoundaryDependencies {
  promptBuilder: EnrichmentPromptBuilderContract;
  spawner: AgentEnrichmentSpawnerContract;
  fallback: EnrichmentFallbackStrategyContract;
  timeoutMs?: number;
  onEvent?: (event: {
    projectId: string;
    type: 'start' | 'success' | 'fallback';
    reason?: EnrichmentFallbackContext['reason'];
    message?: string;
  }) => void | Promise<void>;
}

export class StructuredPromptBuilder implements EnrichmentPromptBuilderContract {
  build(input: { projectId: string; rawScan: RawScanResult }): EnrichmentPromptSections {
    return {
      context: [
        '[CONTEXT]',
        `Project: ${input.projectId}`,
        `Files: ${input.rawScan.fileCount}`,
        `Folders: ${input.rawScan.folderStructure.slice(0, 20).join(', ')}`,
        `Configs: ${input.rawScan.configFiles.map((file) => `${file.path}:${file.type}`).join(', ')}`,
        `Dependencies: ${Object.keys(input.rawScan.dependencies).slice(0, 20).join(', ')}`,
        `Source evidence files: ${(input.rawScan.sourceEvidence ?? []).map((evidence) => evidence.path).slice(0, 20).join(', ')}`,
      ].join('\n'),
      goal: '[GOAL]\nEnrich raw scan with intelligent analysis for documentation generation.',
      downstream: '[DOWNSTREAM]\nOutput will feed AI documentation generation context, section planning, and source-grounded canonical wiki pages.',
      request:
        '[REQUEST]\nInfer tech stack, prioritize important files, produce compact context with source-grounded evidence for Overview, Architecture, API Reference, Security, feature pages, and suggest documentation structure.',
    };
  }
}

export class AgentEnrichmentBoundary implements AgentEnrichmentBoundaryContract {
  private readonly timeoutMs: number;

  constructor(private readonly deps: AgentEnrichmentBoundaryDependencies) {
    this.timeoutMs = deps.timeoutMs ?? 15_000;
  }

  async enrich(input: { projectId: string; rawScan: RawScanResult }): Promise<EnrichedAnalysis> {
    const prompt = this.deps.promptBuilder.build({
      projectId: input.projectId,
      rawScan: input.rawScan,
    });
    await this.deps.onEvent?.({ projectId: input.projectId, type: 'start', message: 'Agent enrichment started' });

    try {
      const enriched = await withTimeout(
        this.deps.spawner.spawn({
          projectId: input.projectId,
          prompt,
          rawScan: input.rawScan,
          timeoutMs: this.timeoutMs,
        }),
        this.timeoutMs,
      );

      if (!isValidEnrichedAnalysis(enriched)) {
        await this.deps.onEvent?.({
          projectId: input.projectId,
          type: 'fallback',
          reason: 'invalid-response',
          message: 'Agent enrichment response did not include required analysis fields.',
        });
        return this.deps.fallback.build({
          projectId: input.projectId,
          rawScan: input.rawScan,
          reason: 'invalid-response',
          message: 'Agent enrichment response did not include required analysis fields.',
        });
      }

      await this.deps.onEvent?.({ projectId: input.projectId, type: 'success', message: 'Agent enrichment completed' });
      return enriched;
    } catch (error) {
      const reason = error instanceof EnrichmentTimeoutError ? 'timeout' : 'failure';
      await this.deps.onEvent?.({
        projectId: input.projectId,
        type: 'fallback',
        reason,
        message: error instanceof Error ? error.message : 'Unknown enrichment error',
      });
      return this.deps.fallback.build({
        projectId: input.projectId,
        rawScan: input.rawScan,
        reason,
        message: error instanceof Error ? error.message : 'Unknown enrichment error',
      });
    }
  }
}

export class EnrichmentFallbackStrategy implements EnrichmentFallbackStrategyContract {
  constructor(
    private readonly techStackDetector: TechStackDetectorContract,
    private readonly contextBuilder: CompactContextBuilderContract,
  ) {}

  build(context: EnrichmentFallbackContext): EnrichedAnalysis {
    const inferred = this.techStackDetector.infer({
      projectId: context.projectId,
      rawScan: context.rawScan,
    });

    const importantFiles = prioritizeImportantFiles(context.rawScan);
    const suggestedDocStructure = suggestDocStructure(inferred.techStack, context.rawScan);

    const compact = this.contextBuilder.build({
      projectId: context.projectId,
      rawScan: context.rawScan,
      techStack: inferred.techStack,
      importantFiles,
      suggestedDocStructure,
    });

    return {
      techStack: inferred.techStack,
      importantFiles,
      compactContext: compact.compactContext,
      suggestedDocStructure,
      enrichmentDuration: 0,
      agentUsed: false,
    };
  }
}

export class HeuristicAgentEnrichmentSpawner implements AgentEnrichmentSpawnerContract {
  constructor(
    private readonly deps: {
      techStackDetector: TechStackDetectorContract;
      contextBuilder: CompactContextBuilderContract;
    },
  ) {}

  async spawn(input: {
    projectId: string;
    prompt: EnrichmentPromptSections;
    rawScan: RawScanResult;
    timeoutMs: number;
  }): Promise<EnrichedAnalysis> {
    const startedAt = Date.now();
    const inferred = this.deps.techStackDetector.infer({
      projectId: input.projectId,
      rawScan: input.rawScan,
    });
    const importantFiles = prioritizeImportantFiles(input.rawScan);
    const suggestedDocStructure = suggestDocStructure(inferred.techStack, input.rawScan);
    const compact = this.deps.contextBuilder.build({
      projectId: input.projectId,
      rawScan: input.rawScan,
      techStack: inferred.techStack,
      importantFiles,
      suggestedDocStructure,
    });

    return {
      techStack: inferred.techStack,
      importantFiles,
      compactContext: compact.compactContext,
      suggestedDocStructure,
      enrichmentDuration: Date.now() - startedAt,
      agentUsed: true,
    };
  }
}

export interface OpenAICompatibleAgentEnrichmentSpawnerDependencies {
  aiClient: OpenAICompatibleAIClientContract;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAICompatibleAgentEnrichmentSpawner implements AgentEnrichmentSpawnerContract {
  constructor(private readonly deps: OpenAICompatibleAgentEnrichmentSpawnerDependencies) {}

  async spawn(input: {
    projectId: string;
    prompt: EnrichmentPromptSections;
    rawScan: RawScanResult;
    timeoutMs: number;
  }): Promise<EnrichedAnalysis> {
    const startedAt = Date.now();
    const response = await this.deps.aiClient.generateText({
      projectId: input.projectId,
      model: this.deps.model,
      temperature: this.deps.temperature ?? 0,
      maxTokens: this.deps.maxTokens ?? 1200,
      messages: [
        {
          role: 'system',
          content: [
            'You are a codebase enrichment agent.',
            'Return only valid JSON matching this schema:',
            '{"techStack":string[],"importantFiles":string[],"compactContext":string,"suggestedDocStructure":string[]}',
            'Do not include markdown prose outside the JSON object.',
            'Use sourceEvidence excerpts to produce concrete, file-cited context. Do not include secrets or unsupported claims.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            input.prompt.context,
            input.prompt.goal,
            input.prompt.downstream,
            input.prompt.request,
            '',
            'Raw scan data:',
            JSON.stringify(input.rawScan, null, 2),
          ].join('\n'),
        },
      ],
    });

    const parsed = parseAgentEnrichmentResponse(response.content);
    const enriched: EnrichedAnalysis = {
      techStack: parsed.techStack,
      importantFiles: parsed.importantFiles,
      compactContext: appendGroundingContext(parsed.compactContext, input.rawScan),
      suggestedDocStructure: buildGroundedDocStructure(input.rawScan),
      enrichmentDuration: Date.now() - startedAt,
      agentUsed: true,
    };

    if (!isValidEnrichedAnalysis(enriched)) {
      throw new Error('Agent enrichment returned invalid analysis shape');
    }

    return enriched;
  }
}

export class StructuredPromptBuilderStub extends StructuredPromptBuilder {}

export class AgentEnrichmentBoundaryStub extends AgentEnrichmentBoundary {}

export class EnrichmentFallbackStrategyStub extends EnrichmentFallbackStrategy {}

class EnrichmentTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Agent enrichment timed out after ${timeoutMs}ms`);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new EnrichmentTimeoutError(timeoutMs)), timeoutMs);
    promise
      .then(resolve, reject)
      .finally(() => clearTimeout(timer));
  });
}

function isValidEnrichedAnalysis(value: EnrichedAnalysis): boolean {
  return (
    Array.isArray(value.techStack) &&
    value.techStack.length > 0 &&
    Array.isArray(value.importantFiles) &&
    value.importantFiles.length > 0 &&
    typeof value.compactContext === 'string' &&
    value.compactContext.trim().length > 0 &&
    Array.isArray(value.suggestedDocStructure) &&
    value.suggestedDocStructure.length > 0 &&
    typeof value.enrichmentDuration === 'number' &&
    typeof value.agentUsed === 'boolean'
  );
}

function parseAgentEnrichmentResponse(content: string): Pick<
  EnrichedAnalysis,
  'techStack' | 'importantFiles' | 'compactContext' | 'suggestedDocStructure'
> {
  const jsonText = extractJsonObject(content);

  try {
    const parsed = JSON.parse(jsonText) as Pick<
      EnrichedAnalysis,
      'techStack' | 'importantFiles' | 'compactContext' | 'suggestedDocStructure'
    >;

    return parsed;
  } catch {
    throw new Error('Agent enrichment returned invalid JSON');
  }
}

function extractJsonObject(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1);
  }

  return content.trim();
}

function prioritizeImportantFiles(rawScan: RawScanResult): string[] {
  const prioritized = new Set<string>();

  for (const file of rawScan.configFiles) {
    prioritized.add(file.path);
  }

  const inferredEntryFiles = [
    'README.md',
    'package.json',
    'app/page.tsx',
    'app/layout.tsx',
    'src/index.ts',
    'src/main.ts',
    'src/app.ts',
    'server.ts',
    'index.ts',
    'main.py',
    'app.py',
    'go.mod',
    'Cargo.toml',
    'Gemfile',
    'pom.xml',
  ];

  for (const file of inferredEntryFiles) {
    if (
      rawScan.configFiles.some((candidate) => candidate.path === file) ||
      rawScan.folderStructure.some((folder) => file.startsWith(`${folder}/`))
    ) {
      prioritized.add(file);
    }
  }

  return Array.from(prioritized).slice(0, 20);
}

function suggestDocStructure(techStack: string[], rawScan: RawScanResult): string[] {
  const grounded = buildGroundedDocStructure(rawScan);
  if (grounded.length > 4) {
    return grounded;
  }

  const sections = new Set(grounded);

  if (rawScan.configFiles.some((file) => file.type === 'package.json')) sections.add('Scripts and Dependencies');
  if (techStack.some((item) => ['Express', 'Flask', 'FastAPI', 'Java'].includes(item))) sections.add('API Reference');
  if (techStack.includes('Next.js') || techStack.includes('React')) sections.add('Frontend Routes');
  if (rawScan.folderStructure.some((folder) => folder.includes('test') || folder.includes('spec'))) sections.add('Testing');

  return Array.from(sections);
}

function appendGroundingContext(compactContext: string, rawScan: RawScanResult): string {
  const filePaths = rawScan.filePaths ?? [];
  if (filePaths.length === 0 || compactContext.includes('files=')) {
    return compactContext;
  }

  return [
    compactContext,
    '[GROUNDING]',
    `files=${filePaths.slice(0, 50).join(', ')}`,
    `implementationHints=${buildImplementationSections(filePaths)
      .join(', ')}`,
  ].join('\n');
}

function buildGroundedDocStructure(rawScan: RawScanResult): string[] {
  return [
    'Overview',
    'Architecture',
    'API Reference',
    'Security',
    ...buildImplementationSections(rawScan.filePaths ?? []),
  ];
}

function buildImplementationSections(filePaths: string[]): string[] {
  const codeFiles = filePaths.filter(isImplementationFile);
  const byDirectory = new Map<string, number>();

  for (const filePath of codeFiles) {
    const segments = filePath.split('/');
    if (segments.length > 1) {
      const directory = segments.slice(0, -1).join('/');
      byDirectory.set(directory, (byDirectory.get(directory) ?? 0) + 1);
    }
  }

  const directorySections = Array.from(byDirectory.entries())
    .filter(([, count]) => count >= 2)
    .map(([directory]) => humanizeFeatureName(directory));

  const groupedDirectories = new Set(
    Array.from(byDirectory.entries())
      .filter(([, count]) => count >= 2)
      .map(([directory]) => directory),
  );
  const rootFileSections = codeFiles
    .filter((filePath) => !filePath.includes('/') || !groupedDirectories.has(filePath.split('/').slice(0, -1).join('/')))
    .slice(0, 3)
    .map((filePath) => humanizeFeatureName(filePath));

  return [...directorySections, ...rootFileSections].slice(0, 4);
}

function isImplementationFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|go|py|rs|java|rb|php|cs|cpp|c|h)$/.test(filePath);
}

function humanizeFeatureName(fileOrDirectory: string): string {
  if (fileOrDirectory === 'main.go' || fileOrDirectory.endsWith('/main.go')) {
    return 'Application Entrypoint';
  }

  const normalized = fileOrDirectory
    .replace(/^internal\//, '')
    .replace(/^src\//, '')
    .replace(/\.[^.]+$/, '');
  const lastSegment = normalized.split('/').filter(Boolean).at(-1) ?? normalized;

  if (lastSegment === 'proxy') return 'Proxy Service';
  if (lastSegment === 'config') return 'Configuration';
  if (lastSegment === 'auth') return 'Authentication';
  if (lastSegment === 'dashboard') return 'Dashboard';

  return lastSegment
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
