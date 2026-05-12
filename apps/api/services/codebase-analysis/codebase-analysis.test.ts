import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import type { EnrichedAnalysis, RawScanResult } from '../../types';
import { CompactContextBuilder, CompactContextBuilderStub, MaxTokenLimiter } from './context-builder';
import { DependencyScanner, DependencyScannerStub } from './dependency-scanner';
import {
  AgentEnrichmentBoundary,
  AgentEnrichmentBoundaryStub,
  EnrichmentFallbackStrategy,
  EnrichmentFallbackStrategyStub,
  HeuristicAgentEnrichmentSpawner,
  OpenAICompatibleAgentEnrichmentSpawner,
  StructuredPromptBuilderStub,
} from './enrichment-boundary';
import { StandardExcludeFilterStub } from './exclude-filter';
import { FolderScannerStub } from './folder-scanner';
import { DeterministicScanner, DeterministicScannerStub } from './deterministic-scanner';
import { TechStackDetectorFallback, TechStackDetectorFallbackStub } from './tech-stack-detector';
import { CodebaseAnalysisService } from './index';

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'codebase-analysis-'));
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

describe('codebase analysis pipeline', () => {
  test('deterministic scan traverses source, applies excludes, detects config files, and extracts dependencies', async () => {
    const sourcePath = await createTempProject();

    await writeJson(path.join(sourcePath, 'package.json'), {
      name: 'demo-app',
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
      },
      devDependencies: {
        typescript: '^5.4.0',
      },
    });
    await fs.writeFile(path.join(sourcePath, 'requirements.txt'), 'flask==3.0.0\nrequests==2.31.0\n', 'utf-8');
    await fs.writeFile(path.join(sourcePath, 'tsconfig.json'), '{"compilerOptions":{"strict":true}}', 'utf-8');
    await fs.mkdir(path.join(sourcePath, 'src'), { recursive: true });
    await fs.writeFile(path.join(sourcePath, 'src', 'index.ts'), 'export const ok = true;\n', 'utf-8');
    await fs.mkdir(path.join(sourcePath, 'node_modules', 'react'), { recursive: true });
    await fs.writeFile(path.join(sourcePath, 'node_modules', 'react', 'index.js'), 'module.exports = {};', 'utf-8');
    await fs.mkdir(path.join(sourcePath, '.next', 'cache'), { recursive: true });
    await fs.writeFile(path.join(sourcePath, '.next', 'cache', 'build.txt'), 'ignore me', 'utf-8');

    const folderScanner = new FolderScannerStub({
      excludeFilter: new StandardExcludeFilterStub(),
    });
    const dependencyScanner = new DependencyScannerStub();
    const scanner = new DeterministicScannerStub({
      folderScanner,
      dependencyScanner,
    });

    const result = await scanner.scan({
      projectId: 'project-1',
      sourcePath,
    });

    expect(result.projectId).toBe('project-1');
    expect(result.fileCount).toBe(4);
    expect(result.folderStructure).toEqual(expect.arrayContaining(['src']));
    expect(result.excludedPaths).toEqual(expect.arrayContaining(['.next', 'node_modules']));
    expect(result.configFiles).toEqual(
      expect.arrayContaining([
        { path: 'package.json', type: 'package.json' },
        { path: 'requirements.txt', type: 'requirements.txt' },
        { path: 'tsconfig.json', type: 'tsconfig.json' },
      ]),
    );
    expect(result.dependencies).toMatchObject({
      next: '^14.2.0',
      react: '^18.3.0',
      typescript: '^5.4.0',
      flask: '3.0.0',
      requests: '2.31.0',
    });
  });

  test('deterministic scan collects bounded redacted source evidence from documentation-relevant files', async () => {
    const sourcePath = await createTempProject();

    await writeJson(path.join(sourcePath, 'package.json'), {
      dependencies: { express: '^4.18.0' },
    });
    await fs.mkdir(path.join(sourcePath, 'src', 'routes'), { recursive: true });
    await fs.mkdir(path.join(sourcePath, 'src', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePath, 'src', 'routes', 'users.ts'),
      [
        'import express from "express";',
        'export const router = express.Router();',
        'router.get("/users", listUsers);',
        'router.post("/users", createUser);',
      ].join('\n'),
      'utf-8',
    );
    await fs.writeFile(
      path.join(sourcePath, 'src', 'auth', 'secrets.ts'),
      'export const apiKey = "sk-live-super-secret-value";\nexport const bearer = "Bearer abcdefghijklmnop";\n',
      'utf-8',
    );
    await fs.mkdir(path.join(sourcePath, 'dist'), { recursive: true });
    await fs.writeFile(path.join(sourcePath, 'dist', 'bundle.js'), 'router.get("/ignored", noop);', 'utf-8');

    const scanner = new DeterministicScanner({
      folderScanner: new FolderScannerStub({ excludeFilter: new StandardExcludeFilterStub() }),
      dependencyScanner: new DependencyScanner(),
    });

    const result = await scanner.scan({ projectId: 'project-source-evidence', sourcePath });

    expect(result.sourceEvidence?.map((evidence) => evidence.path)).toEqual(
      expect.arrayContaining(['package.json', 'src/auth/secrets.ts', 'src/routes/users.ts']),
    );
    expect(result.sourceEvidence?.some((evidence) => evidence.path.startsWith('dist/'))).toBe(false);
    expect(result.sourceEvidence?.find((evidence) => evidence.path === 'src/routes/users.ts')?.categories).toEqual(
      expect.arrayContaining(['api', 'feature']),
    );
    const secretEvidence = result.sourceEvidence?.find((evidence) => evidence.path === 'src/auth/secrets.ts');
    expect(secretEvidence?.categories).toEqual(expect.arrayContaining(['security']));
    expect(secretEvidence?.excerpt).toContain('[REDACTED_SECRET]');
    expect(secretEvidence?.excerpt).not.toContain('sk-live-super-secret-value');
    expect(secretEvidence?.excerpt).not.toContain('abcdefghijklmnop');
  });

  test('fallback enrichment infers tech stack and produces compact context within token limit', () => {
    const rawScan = {
      projectId: 'project-2',
      fileCount: 12,
      folderStructure: ['src', 'components', 'app'],
      configFiles: [
        { path: 'package.json', type: 'package.json' as const },
        { path: 'tsconfig.json', type: 'tsconfig.json' as const },
      ],
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
        typescript: '^5.4.0',
        'next-auth': '^4.24.0',
      },
      excludedPaths: ['node_modules'],
      scanDuration: 15,
    };

    const techStackDetector = new TechStackDetectorFallbackStub();
    const contextBuilder = new CompactContextBuilderStub();
    const fallback = new EnrichmentFallbackStrategyStub(techStackDetector, contextBuilder);

    const enriched = fallback.build({
      projectId: 'project-2',
      rawScan,
      reason: 'failure',
      message: 'agent unavailable',
    });

    expect(enriched.agentUsed).toBe(false);
    expect(enriched.techStack).toEqual(expect.arrayContaining(['Next.js', 'React', 'TypeScript', 'Auth.js / NextAuth']));
    expect(enriched.importantFiles).toEqual(expect.arrayContaining(['package.json', 'tsconfig.json']));
    expect(enriched.suggestedDocStructure).toEqual(expect.arrayContaining(['Overview', 'Architecture', 'API Reference', 'Security']));
    expect(enriched.compactContext).toContain('projectId=project-2');
    expect(Math.ceil(enriched.compactContext.length / 4)).toBeLessThanOrEqual(2000);
  });

  test('structured prompt builder fills sections and boundary falls back on spawner failure', async () => {
    const rawScan = {
      projectId: 'project-3',
      fileCount: 3,
      folderStructure: ['src'],
      configFiles: [{ path: 'package.json', type: 'package.json' as const }],
      dependencies: { express: '^4.0.0' },
      excludedPaths: [],
      scanDuration: 5,
    };

    const promptBuilder = new StructuredPromptBuilderStub();
    const prompt = promptBuilder.build({ projectId: 'project-3', rawScan });

    expect(prompt.context).toContain('project-3');
    expect(prompt.goal).toContain('intelligent analysis');
    expect(prompt.downstream).toContain('AI documentation generation');
    expect(prompt.request).toContain('compact context');

    const boundary = new AgentEnrichmentBoundaryStub({
      promptBuilder,
      spawner: {
        async spawn() {
          throw new Error('timeout');
        },
      },
      fallback: new EnrichmentFallbackStrategyStub(new TechStackDetectorFallbackStub(), new CompactContextBuilderStub()),
      timeoutMs: 500,
    });

    const enriched = await boundary.enrich({ projectId: 'project-3', rawScan });

    expect(enriched.agentUsed).toBe(false);
    expect(enriched.techStack).toEqual(expect.arrayContaining(['Express']));
    expect(enriched.compactContext).toContain('projectId=project-3');
  });

  test('deterministic scanner extracts dependencies from npm, python, go, ruby, rust, and maven configs', async () => {
    const sourcePath = await createTempProject();

    await writeJson(path.join(sourcePath, 'package.json'), {
      dependencies: { next: '^14.2.0' },
      devDependencies: { typescript: '^5.4.0' },
      peerDependencies: { react: '^18.3.0' },
    });
    await fs.writeFile(path.join(sourcePath, 'requirements.txt'), 'flask==3.0.0\nfastapi>=0.110.0\n', 'utf-8');
    await fs.writeFile(path.join(sourcePath, 'go.mod'), 'module example.com/demo\nrequire github.com/gin-gonic/gin v1.9.1\n', 'utf-8');
    await fs.writeFile(path.join(sourcePath, 'Gemfile'), 'gem "rails", "~> 7.1"\ngem "pg"\n', 'utf-8');
    await fs.writeFile(
      path.join(sourcePath, 'Cargo.toml'),
      '[package]\nname = "demo"\n[dependencies]\nserde = "1.0"\ntokio = { version = "1", features = ["full"] }\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(sourcePath, 'pom.xml'),
      '<project><dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId><version>3.2.0</version></dependency></dependencies></project>',
      'utf-8',
    );

    const scanner = new DeterministicScanner({
      folderScanner: new FolderScannerStub({ excludeFilter: new StandardExcludeFilterStub() }),
      dependencyScanner: new DependencyScanner(),
    });

    const result = await scanner.scan({ projectId: 'project-polyglot', sourcePath });

    expect(result.configFiles.map((file) => file.type)).toEqual(
      expect.arrayContaining(['package.json', 'requirements.txt', 'go.mod', 'Gemfile', 'Cargo.toml', 'pom.xml']),
    );
    expect(result.dependencies).toMatchObject({
      next: '^14.2.0',
      typescript: '^5.4.0',
      react: '^18.3.0',
      flask: '3.0.0',
      fastapi: '0.110.0',
      'github.com/gin-gonic/gin': 'v1.9.1',
      rails: '~> 7.1',
      pg: '*',
      serde: '1.0',
      tokio: '1',
      'org.springframework.boot:spring-boot-starter-web': '3.2.0',
    });
  });

  test('heuristic enrichment spawner returns enriched analysis without falling back', async () => {
    const rawScan: RawScanResult = {
      projectId: 'project-heuristic',
      fileCount: 8,
      folderStructure: ['app', 'components', 'lib', 'tests'],
      configFiles: [
        { path: 'package.json', type: 'package.json' },
        { path: 'tsconfig.json', type: 'tsconfig.json' },
      ],
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
        typescript: '^5.4.0',
      },
      excludedPaths: ['node_modules'],
      scanDuration: 6,
    };

    const boundary = new AgentEnrichmentBoundary({
      promptBuilder: new StructuredPromptBuilderStub(),
      spawner: new HeuristicAgentEnrichmentSpawner({
        techStackDetector: new TechStackDetectorFallback(),
        contextBuilder: new CompactContextBuilder(),
      }),
      fallback: new EnrichmentFallbackStrategy(new TechStackDetectorFallback(), new CompactContextBuilder()),
      timeoutMs: 1000,
    });

    const enriched = await boundary.enrich({ projectId: 'project-heuristic', rawScan });

    expect(enriched.agentUsed).toBe(true);
    expect(enriched.techStack).toEqual(expect.arrayContaining(['Next.js', 'React', 'TypeScript']));
    expect(enriched.importantFiles).toEqual(expect.arrayContaining(['package.json', 'tsconfig.json']));
    expect(enriched.suggestedDocStructure).toEqual(
      expect.arrayContaining(['Overview', 'Architecture', 'API Reference', 'Security']),
    );
    expect(enriched.compactContext).toContain('[CONTEXT]');
    expect(Math.ceil(enriched.compactContext.length / 4)).toBeLessThanOrEqual(2000);
  });

  test('OpenAI-compatible enrichment spawner sends structured prompt to external client and parses JSON response', async () => {
    const rawScan: RawScanResult = {
      projectId: 'project-agent',
      fileCount: 6,
      folderStructure: ['app', 'components'],
      configFiles: [{ path: 'package.json', type: 'package.json' }],
      dependencies: { next: '^14.2.0', react: '^18.3.0' },
      excludedPaths: ['node_modules'],
      scanDuration: 4,
    };
    const prompt = new StructuredPromptBuilderStub().build({ projectId: 'project-agent', rawScan });
    const calls: Array<{ model: string; messages: Array<{ role: string; content: string }> }> = [];
    const spawner = new OpenAICompatibleAgentEnrichmentSpawner({
      aiClient: {
        async generateText(input) {
          calls.push({ model: input.model, messages: input.messages });
          return {
            projectId: input.projectId,
            model: input.model,
            generatedAt: '2026-01-01T00:00:00.000Z',
            content: JSON.stringify({
              techStack: ['Next.js', 'React'],
              importantFiles: ['package.json', 'app/page.tsx'],
              compactContext: 'agent-generated compact context',
              suggestedDocStructure: ['Overview', 'Routes'],
            }),
          };
        },
      },
      model: 'agent-model',
    });

    const enriched = await spawner.spawn({
      projectId: 'project-agent',
      prompt,
      rawScan,
      timeoutMs: 1000,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].model).toBe('agent-model');
    expect(calls[0].messages[0].content).toContain('Return only valid JSON');
    expect(calls[0].messages[1].content).toContain('[CONTEXT]');
    expect(calls[0].messages[1].content).toContain('"projectId": "project-agent"');
    expect(enriched.agentUsed).toBe(true);
    expect(enriched.techStack).toEqual(['Next.js', 'React']);
    expect(enriched.importantFiles).toEqual(['package.json', 'app/page.tsx']);
    expect(enriched.compactContext).toBe('agent-generated compact context');
    expect(enriched.suggestedDocStructure).toEqual(['Overview', 'Architecture', 'API Reference', 'Security']);
    expect(enriched.enrichmentDuration).toBeGreaterThanOrEqual(0);
  });

  test('OpenAI-compatible enrichment spawner parses fenced JSON and rejects malformed agent output', async () => {
    const rawScan: RawScanResult = {
      projectId: 'project-fenced',
      fileCount: 1,
      folderStructure: [],
      configFiles: [{ path: 'requirements.txt', type: 'requirements.txt' }],
      dependencies: { flask: '3.0.0' },
      excludedPaths: [],
      scanDuration: 1,
    };
    const prompt = new StructuredPromptBuilderStub().build({ projectId: 'project-fenced', rawScan });
    const validSpawner = new OpenAICompatibleAgentEnrichmentSpawner({
      aiClient: {
        async generateText(input) {
          return {
            projectId: input.projectId,
            model: input.model,
            generatedAt: '2026-01-01T00:00:00.000Z',
            content: '```json\n{"techStack":["Flask"],"importantFiles":["requirements.txt"],"compactContext":"ctx","suggestedDocStructure":["Overview"]}\n```',
          };
        },
      },
      model: 'agent-model',
    });

    await expect(validSpawner.spawn({ projectId: 'project-fenced', prompt, rawScan, timeoutMs: 1000 })).resolves.toMatchObject({
      agentUsed: true,
      techStack: ['Flask'],
      importantFiles: ['requirements.txt'],
    });

    const invalidSpawner = new OpenAICompatibleAgentEnrichmentSpawner({
      aiClient: {
        async generateText(input) {
          return {
            projectId: input.projectId,
            model: input.model,
            generatedAt: '2026-01-01T00:00:00.000Z',
            content: 'not json',
          };
        },
      },
      model: 'agent-model',
    });

    await expect(invalidSpawner.spawn({ projectId: 'project-fenced', prompt, rawScan, timeoutMs: 1000 })).rejects.toThrow(
      'Agent enrichment returned invalid JSON',
    );
  });

  test('OpenAI-compatible enrichment spawner grounds compact context and implementation sections in real file paths', async () => {
    const rawScan: RawScanResult = {
      projectId: 'project-grounded',
      fileCount: 4,
      folderStructure: ['internal', 'internal/proxy'],
      configFiles: [{ path: 'go.mod', type: 'go.mod' }],
      dependencies: { 'github.com/joho/godotenv': 'v1.5.1' },
      filePaths: ['main.go', 'go.mod', 'internal/proxy/config.go', 'internal/proxy/handler.go'],
      excludedPaths: [],
      scanDuration: 1,
    };
    const prompt = new StructuredPromptBuilderStub().build({ projectId: 'project-grounded', rawScan });
    const spawner = new OpenAICompatibleAgentEnrichmentSpawner({
      aiClient: {
        async generateText(input) {
          return {
            projectId: input.projectId,
            model: input.model,
            generatedAt: '2026-01-01T00:00:00.000Z',
            content: JSON.stringify({
              techStack: ['Go'],
              importantFiles: ['internal/proxy/handler.go'],
              compactContext: 'agent summary without file list',
              suggestedDocStructure: ['Overview', 'Architecture', 'API Reference', 'Security', 'Internal Config'],
            }),
          };
        },
      },
      model: 'agent-model',
    });

    const enriched = await spawner.spawn({ projectId: 'project-grounded', prompt, rawScan, timeoutMs: 1000 });

    expect(enriched.compactContext).toContain('files=main.go, go.mod, internal/proxy/config.go, internal/proxy/handler.go');
    expect(enriched.suggestedDocStructure).toEqual([
      'Overview',
      'Architecture',
      'API Reference',
      'Security',
      'Proxy Service',
      'Application Entrypoint',
    ]);
    expect(enriched.suggestedDocStructure).not.toContain('Internal Config');
  });

  test('enrichment boundary falls back on timeout and validates invalid agent responses', async () => {
    const rawScan: RawScanResult = {
      projectId: 'project-timeout',
      fileCount: 2,
      folderStructure: ['src'],
      configFiles: [{ path: 'requirements.txt', type: 'requirements.txt' }],
      dependencies: { flask: '3.0.0' },
      excludedPaths: [],
      scanDuration: 2,
    };

    const fallback = new EnrichmentFallbackStrategy(new TechStackDetectorFallback(), new CompactContextBuilder());
    const timeoutBoundary = new AgentEnrichmentBoundary({
      promptBuilder: new StructuredPromptBuilderStub(),
      spawner: {
        spawn() {
          return new Promise<EnrichedAnalysis>((resolve) => {
            setTimeout(() => {
              resolve({
                techStack: ['Python'],
                importantFiles: ['requirements.txt'],
                compactContext: 'late',
                suggestedDocStructure: ['Overview'],
                enrichmentDuration: 20,
                agentUsed: true,
              });
            }, 30);
          });
        },
      },
      fallback,
      timeoutMs: 1,
    });

    const timedOut = await timeoutBoundary.enrich({ projectId: 'project-timeout', rawScan });
    expect(timedOut.agentUsed).toBe(false);
    expect(timedOut.techStack).toEqual(expect.arrayContaining(['Python']));

    const invalidBoundary = new AgentEnrichmentBoundary({
      promptBuilder: new StructuredPromptBuilderStub(),
      spawner: {
        async spawn() {
          return {
            techStack: [],
            importantFiles: [],
            compactContext: '',
            suggestedDocStructure: [],
            enrichmentDuration: 1,
            agentUsed: true,
          };
        },
      },
      fallback,
      timeoutMs: 1000,
    });

    const invalid = await invalidBoundary.enrich({ projectId: 'project-timeout', rawScan });
    expect(invalid.agentUsed).toBe(false);
    expect(invalid.importantFiles).toEqual(expect.arrayContaining(['requirements.txt']));
  });

  test('compact context builder prioritizes grounded analysis details and enforces configured token limit', () => {
    const rawScan: RawScanResult = {
      projectId: 'project-compact',
      fileCount: 400,
      folderStructure: Array.from({ length: 80 }, (_, index) => `folder-${index}`),
      configFiles: [{ path: 'package.json', type: 'package.json' }],
      dependencies: Object.fromEntries(Array.from({ length: 80 }, (_, index) => [`dep-${index}`, `${index}.0.0`])),
      excludedPaths: ['node_modules', 'dist'],
      scanDuration: 25,
    };

    const builder = new CompactContextBuilder(new MaxTokenLimiter(80));
    const compact = builder.build({
      projectId: 'project-compact',
      rawScan,
      techStack: ['Next.js', 'TypeScript'],
      importantFiles: Array.from({ length: 60 }, (_, index) => `src/feature-${index}.ts`),
      suggestedDocStructure: ['Overview', 'Architecture', 'Setup Guide', 'API Reference'],
    });

    expect(compact.tokenEstimate).toBeLessThanOrEqual(80);
    expect(compact.compactContext).toContain('[CONTEXT]');
    expect(compact.compactContext).toContain('projectId=project-compact');
    expect(compact.compactContext).toContain('techStack=Next.js, TypeScript');
    expect(compact.compactContext).not.toContain('dep-79');
  });

  test('compact context builder includes source-grounded evidence categories for canonical docs', () => {
    const rawScan: RawScanResult = {
      projectId: 'project-evidence-context',
      fileCount: 3,
      folderStructure: ['src', 'src/routes', 'src/auth'],
      configFiles: [{ path: 'package.json', type: 'package.json' }],
      dependencies: { express: '^4.18.0' },
      filePaths: ['package.json', 'src/routes/users.ts', 'src/auth/session.ts'],
      sourceEvidence: [
        {
          path: 'src/routes/users.ts',
          language: 'typescript',
          categories: ['api', 'feature'],
          excerpt: 'router.get("/users", listUsers);',
          truncated: false,
        },
        {
          path: 'src/auth/session.ts',
          language: 'typescript',
          categories: ['security'],
          excerpt: 'verifySession(request);',
          truncated: false,
        },
      ],
      excludedPaths: [],
      scanDuration: 4,
    };

    const compact = new CompactContextBuilder().build({
      projectId: 'project-evidence-context',
      rawScan,
      techStack: ['Express', 'TypeScript'],
      importantFiles: ['src/routes/users.ts', 'src/auth/session.ts'],
      suggestedDocStructure: ['Overview', 'Architecture', 'API Reference', 'Security', 'Users Route'],
    });

    expect(compact.compactContext).toContain('[SOURCE_EVIDENCE]');
    expect(compact.compactContext).toContain('[API_EVIDENCE]');
    expect(compact.compactContext).toContain('src/routes/users.ts');
    expect(compact.compactContext).toContain('router.get("/users", listUsers);');
    expect(compact.compactContext).toContain('[SECURITY_EVIDENCE]');
    expect(compact.compactContext).toContain('verifySession(request);');
  });

  test('deterministic analysis includes file paths and compact context exposes file breakdown', async () => {
    const sourcePath = await createTempProject();
    await writeJson(path.join(sourcePath, 'go.mod'), {
      module: 'example.com/demo',
    });
    await fs.mkdir(path.join(sourcePath, 'internal', 'proxy'), { recursive: true });
    await fs.mkdir(path.join(sourcePath, 'internal', 'config'), { recursive: true });
    await fs.writeFile(path.join(sourcePath, 'internal', 'proxy', 'proxy.go'), 'package proxy\n', 'utf-8');
    await fs.writeFile(path.join(sourcePath, 'internal', 'config', 'config.go'), 'package config\n', 'utf-8');

    const scanner = new DeterministicScanner({
      folderScanner: new FolderScannerStub({ excludeFilter: new StandardExcludeFilterStub() }),
      dependencyScanner: new DependencyScanner(),
    });

    const rawScan = await scanner.scan({ projectId: 'project-files', sourcePath });
    const compact = new CompactContextBuilder().build({
      projectId: 'project-files',
      rawScan,
      techStack: ['Go'],
      importantFiles: ['internal/proxy/proxy.go', 'internal/config/config.go'],
      suggestedDocStructure: ['Overview', 'Architecture', 'Proxy Service'],
    });

    expect(rawScan.filePaths).toEqual(
      expect.arrayContaining(['go.mod', 'internal/proxy/proxy.go', 'internal/config/config.go']),
    );
    expect(compact.compactContext).toContain('files=go.mod, internal/config/config.go, internal/proxy/proxy.go');
    expect(compact.compactContext).toContain('implementationHints=internal/proxy/proxy.go, internal/config/config.go');
  });

  test('codebase analysis service runs deterministic scan then enrichment and returns completed analysis', async () => {
    const sourcePath = await createTempProject();
    await writeJson(path.join(sourcePath, 'package.json'), {
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
      },
      devDependencies: {
        typescript: '^5.4.0',
      },
    });
    await fs.mkdir(path.join(sourcePath, 'app'), { recursive: true });
    await fs.writeFile(path.join(sourcePath, 'app', 'page.tsx'), 'export default function Page() { return null; }\n', 'utf-8');

    const service = new CodebaseAnalysisService({
      deterministicScanner: new DeterministicScanner({
        folderScanner: new FolderScannerStub({ excludeFilter: new StandardExcludeFilterStub() }),
        dependencyScanner: new DependencyScanner(),
      }),
      enrichmentBoundary: new AgentEnrichmentBoundary({
        promptBuilder: new StructuredPromptBuilderStub(),
        spawner: new HeuristicAgentEnrichmentSpawner({
          techStackDetector: new TechStackDetectorFallback(),
          contextBuilder: new CompactContextBuilder(),
        }),
        fallback: new EnrichmentFallbackStrategy(new TechStackDetectorFallback(), new CompactContextBuilder()),
      }),
    });

    const analysis = await service.analyze({ projectId: 'project-service', sourcePath });

    expect(analysis.projectId).toBe('project-service');
    expect(analysis.fileCount).toBe(2);
    expect(analysis.agentUsed).toBe(true);
    expect(analysis.techStack).toEqual(expect.arrayContaining(['Next.js', 'React', 'TypeScript']));
    expect(analysis.compactContext).toContain('projectId=project-service');
    expect(new Date(analysis.completedAt).toString()).not.toBe('Invalid Date');
  });
});
