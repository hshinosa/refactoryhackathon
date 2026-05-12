import {
  createAIDocGenerationPipelineStub,
  createAIDocGenerationService,
  runAIDocGenerationPipelineStub,
  OpenAICompatibleAIClientStub,
  OpenAICompatibleAIClient,
  CodebaseDocPromptBuilderStub,
  MarkdownFormatterStub,
  MarkdownPageSplitterStub,
  SidebarGeneratorStub,
  DocumentationPageBudget,
} from './index';
import { InMemoryDocsHistoryStoreStub, InMemoryDocumentationStoreStub } from '../storage/documentation-store';
import { AIProviderFailureError } from '../../utils';

describe('AI documentation generation pipeline', () => {
  test('builds prompt with project context and suggested sections', () => {
    const builder = new CodebaseDocPromptBuilderStub();

    const prompt = builder.buildPrompt({
      projectId: 'project-1',
      compactContext: 'compact context payload',
      suggestedDocStructure: ['overview', 'setup-guide', 'improvement-suggestions'],
    });

    expect(prompt.systemPrompt).toContain('multiple Markdown pages');
    expect(prompt.userPrompt).toContain('Project ID: project-1');
    expect(prompt.userPrompt).toContain('- overview');
    expect(prompt.userPrompt).toContain('compact context payload');
  });

  test('maps OpenAI-compatible response into generation output', async () => {
    const client = new OpenAICompatibleAIClient({
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: '## Overview\n\nGenerated content',
                },
              },
            ],
          }),
        },
      },
    } as never);

    const response = await client.generateText({
      projectId: 'project-1',
      model: 'test-model',
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(response.projectId).toBe('project-1');
    expect(response.model).toBe('test-model');
    expect(response.content).toContain('Generated content');
  });

  test('normalizes AI provider failures into backend error classification', async () => {
    const client = new OpenAICompatibleAIClient({
      chat: {
        completions: {
          create: async () => {
            throw new Error('upstream timeout');
          },
        },
      },
    } as never);

    await expect(
      client.generateText({
        projectId: 'project-1',
        model: 'test-model',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    ).rejects.toBeInstanceOf(AIProviderFailureError);
  });

  test('builds multiple pages and sidebar from markdown sections', async () => {
    const pipeline = createAIDocGenerationPipelineStub({
      aiClient: new OpenAICompatibleAIClientStub(),
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
    });

    pipeline.aiClient.generateText = async () => ({
      projectId: 'project-1',
      model: 'test-model',
      generatedAt: '2026-01-01T00:00:00.000Z',
      content: [
        '# Codebase Wiki',
        '',
        '## Overview',
        'Overview content',
        '',
        '## Setup Guide',
        'Setup content',
        '',
        '## Improvement Suggestions',
        'Improve content',
      ].join('\n'),
    });

    const result = await runAIDocGenerationPipelineStub({
      pipeline,
      projectId: 'project-1',
      model: 'test-model',
      compactContext: 'compact context',
      suggestedDocStructure: ['overview', 'setup-guide', 'improvement-suggestions'],
    });

    expect(result.pages).toEqual([
      {
        slug: 'overview',
        title: 'Overview',
        content: '## Overview\n\nOverview content',
      },
      {
        slug: 'setup-guide',
        title: 'Setup Guide',
        content: '## Setup Guide\n\nSetup content',
      },
      {
        slug: 'improvement-suggestions',
        title: 'Improvement Suggestions',
        content: '## Improvement Suggestions\n\nImprove content',
      },
    ]);

    expect(result.sidebar).toEqual([
      { title: 'Overview', slug: 'overview', children: [] },
      { title: 'Setup Guide', slug: 'setup-guide', children: [] },
      { title: 'Improvement Suggestions', slug: 'improvement-suggestions', children: [] },
    ]);
  });

  test('caps documentation pages for small repositories and normalizes duplicate/extra sections', async () => {
    const pipeline = createAIDocGenerationPipelineStub({
      aiClient: new OpenAICompatibleAIClientStub(),
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(new DocumentationPageBudget(4)),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
    });

    pipeline.aiClient.generateText = async () => ({
      projectId: 'project-small',
      model: 'test-model',
      generatedAt: '2026-01-01T00:00:00.000Z',
      content: [
        '## Summary',
        'Summary content',
        '## Setup',
        'Setup content',
        '## Architecture',
        'Architecture content',
        '## Configuration',
        'Configuration content',
        '## Setup',
        'Duplicate setup content',
        '## Internal Detail A',
        'Too much detail',
        '## Internal Detail B',
        'Too much detail',
      ].join('\n\n'),
    });

    const result = await runAIDocGenerationPipelineStub({
      pipeline,
      projectId: 'project-small',
      model: 'test-model',
      compactContext: 'fileCount=11\ntechStack=Go',
      suggestedDocStructure: ['Summary', 'Setup', 'Architecture', 'Configuration'],
      maxPages: 4,
    });

    expect(result.prompt.systemPrompt).toContain('Do not exceed 4 pages');
    expect(result.pages).toHaveLength(4);
    expect(result.pages.map((page) => page.slug)).toEqual(['architecture', 'summary', 'setup', 'configuration']);
    expect(result.pages.find((page) => page.slug === 'setup')?.content).toContain('Setup content');
    expect(result.pages.find((page) => page.slug === 'setup')?.content).toContain('Duplicate setup content');
    expect(result.sidebar).toHaveLength(4);
  });

  test('splits canonical docs into primary sidebar and feature pages into secondary sidebar', async () => {
    const pipeline = createAIDocGenerationPipelineStub({
      aiClient: new OpenAICompatibleAIClientStub(),
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(new DocumentationPageBudget(8)),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
    });

    pipeline.aiClient.generateText = async () => ({
      projectId: 'project-canonical',
      model: 'test-model',
      generatedAt: '2026-01-01T00:00:00.000Z',
      content: [
        '## Overview',
        'Platform summary',
        '## Architecture',
        'System architecture',
        '## API Reference',
        'Available interfaces',
        '## Security',
        'Security model',
        '## Proxy Service',
        'Proxy service behavior',
        '## Config Loader',
        'Configuration loading behavior',
      ].join('\n\n'),
    });

    const result = await runAIDocGenerationPipelineStub({
      pipeline,
      projectId: 'project-canonical',
      model: 'test-model',
      compactContext: 'fileCount=11\ntechStack=Go',
      suggestedDocStructure: ['Overview', 'Architecture', 'API Reference', 'Security', 'Proxy Service'],
      maxPages: 8,
    });

    expect(result.prompt.systemPrompt).toContain('must include these four top-level documentation pages: Overview, Architecture, API Reference, Security');
    expect(result.prompt.systemPrompt).toContain('Feature pages must use human-readable feature or function names, not the label "Implementation"');
    expect(result.pages.slice(0, 4).map((page) => page.title)).toEqual([
      'Overview',
      'Architecture',
      'API Reference',
      'Security',
    ]);
    expect(result.pages.map((page) => page.title)).toEqual(
      expect.arrayContaining(['Proxy Service', 'Config Loader']),
    );
    expect(result.sidebar).toEqual([
      { title: 'Overview', slug: 'overview', children: [] },
      { title: 'Architecture', slug: 'architecture', children: [] },
      { title: 'API Reference', slug: 'api-reference', children: [] },
      { title: 'Security', slug: 'security', children: [] },
      {
        title: 'Features',
        slug: 'features',
        children: [
          { title: 'Proxy Service', slug: 'proxy-service', children: [] },
          { title: 'Config Loader', slug: 'config-loader', children: [] },
        ],
      },
    ]);
    expect(result.secondarySidebar).toBeUndefined();
  });

  test('builds living documentation prompt grounded in scanned file paths and implemented code', () => {
    const prompt = new CodebaseDocPromptBuilderStub().buildPrompt({
      projectId: 'project-living-docs',
      compactContext: [
        'fileCount=3',
        'files=main.go, internal/proxy/proxy.go, internal/config/config.go',
        'importantFiles=internal/proxy/proxy.go, internal/config/config.go',
      ].join('\n'),
      suggestedDocStructure: ['Overview', 'Architecture', 'API Reference', 'Security', 'Proxy Service'],
      maxPages: 8,
    });

    expect(prompt.systemPrompt).toContain('living documentation');
    expect(prompt.systemPrompt).toContain('ground every claim in the scanned file paths');
    expect(prompt.systemPrompt).toContain('Each feature page must name the concrete files');
    expect(prompt.userPrompt).toContain('internal/proxy/proxy.go');
    expect(prompt.userPrompt).toContain('Proxy Service');
  });

  test('requires fully populated canonical docs from source-grounded evidence', () => {
    const prompt = new CodebaseDocPromptBuilderStub().buildPrompt({
      projectId: 'project-full-docs',
      compactContext: [
        '[SOURCE_EVIDENCE]',
        'path=src/routes/users.ts categories=api,feature',
        'excerpt=router.get("/users", listUsers);',
        '[SECURITY_EVIDENCE]',
        'path=src/auth/session.ts categories=security',
        'excerpt=verifySession(request);',
      ].join('\n'),
      suggestedDocStructure: ['Overview', 'Architecture', 'API Reference', 'Security', 'Users Route'],
      maxPages: 10,
    });

    expect(prompt.systemPrompt).toContain('fully populated');
    expect(prompt.systemPrompt).toContain('Overview page must explain');
    expect(prompt.systemPrompt).toContain('Architecture page must explain');
    expect(prompt.systemPrompt).not.toContain('Mermaid flowchart');
    expect(prompt.systemPrompt).not.toContain('```mermaid');
    expect(prompt.systemPrompt).toContain('API Reference page must document');
    expect(prompt.systemPrompt).toContain('Security page must document');
    expect(prompt.systemPrompt).toContain('source evidence');
    expect(prompt.systemPrompt).not.toContain('Prefer concise high-signal pages');
    expect(prompt.userPrompt).toContain('[SOURCE_EVIDENCE]');
    expect(prompt.userPrompt).toContain('router.get("/users", listUsers);');
  });

  test('service gives enough page budget for four canonical docs plus feature pages', async () => {
    const docsStore = new InMemoryDocumentationStoreStub();
    let capturedSystemPrompt = '';
    const pipeline = createAIDocGenerationPipelineStub({
      aiClient: new OpenAICompatibleAIClientStub(),
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(new DocumentationPageBudget(10)),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
    });

    pipeline.aiClient.generateText = async (input) => {
      capturedSystemPrompt = input.messages[0].content;
      return {
        projectId: input.projectId,
        model: input.model,
        generatedAt: '2026-01-01T00:00:00.000Z',
        content: [
          '## Overview',
          'Overview with concrete file citations.',
          '## Architecture',
          'Architecture with concrete file citations.',
          '## API Reference',
          'API reference with concrete file citations.',
          '## Security',
          'Security with concrete file citations.',
          '## Users Route',
          'Users route details.',
          '## Session Middleware',
          'Session middleware details.',
        ].join('\n\n'),
      };
    };

    const service = createAIDocGenerationService({
      pipeline,
      docsStore,
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
      model: 'test-model',
      suggestedDocStructure: ['Overview', 'Architecture', 'API Reference', 'Security', 'Users Route', 'Session Middleware'],
    });

    const docs = await service.generateDocs({
      projectId: 'project-budget',
      compactContext: '[SOURCE_EVIDENCE]\npath=src/routes/users.ts\nexcerpt=router.get("/users", listUsers);',
    });

    expect(capturedSystemPrompt).toContain('Do not exceed 10 pages');
    expect(docs.pages.map((page) => page.title)).toEqual([
      'Overview',
      'Architecture',
      'API Reference',
      'Security',
      'Users Route',
      'Session Middleware',
    ]);
    expect(docs.sidebar).toContainEqual({
      title: 'Features',
      slug: 'features',
      children: [
        { title: 'Users Route', slug: 'users-route', children: [] },
        { title: 'Session Middleware', slug: 'session-middleware', children: [] },
      ],
    });
  });

  test('service stores source files parsed from source evidence context', async () => {
    const docsStore = new InMemoryDocumentationStoreStub();
    const pipeline = createAIDocGenerationPipelineStub({
      aiClient: new OpenAICompatibleAIClientStub(),
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(new DocumentationPageBudget(10)),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
    });

    pipeline.aiClient.generateText = async (input) => ({
      projectId: input.projectId,
      model: input.model,
      generatedAt: '2026-01-01T00:00:00.000Z',
      content: '## Overview\n\nOverview content',
    });

    const service = createAIDocGenerationService({
      pipeline,
      docsStore,
      docsHistoryStore: new InMemoryDocsHistoryStoreStub(),
      model: 'test-model',
      suggestedDocStructure: ['Overview'],
    });

    const docs = await service.generateDocs({
      projectId: 'project-source-files',
      compactContext: [
        '[SOURCE_EVIDENCE]',
        'path=internal/proxy/client.go',
        'language=go',
        'categories=api,feature',
        'truncated=false',
        'excerpt:',
        'func (c *Client) HandleModels(w http.ResponseWriter, r *http.Request) {}',
        'path=internal/proxy/config.go',
        'language=go',
        'categories=configuration',
        'truncated=false',
        'excerpt:',
        'func LoadConfig() (Config, error) { return Config{}, nil }',
        '[API_EVIDENCE]',
        'internal/proxy/client.go',
      ].join('\n'),
    });

    expect(docs.sourceFiles).toEqual([
      {
        path: 'internal/proxy/client.go',
        language: 'go',
        content: 'func (c *Client) HandleModels(w http.ResponseWriter, r *http.Request) {}',
      },
      {
        path: 'internal/proxy/config.go',
        language: 'go',
        content: 'func LoadConfig() (Config, error) { return Config{}, nil }',
      },
    ]);
  });

  test('overwrites current docs while retaining previous generation history', async () => {
    const docsStore = new InMemoryDocumentationStoreStub();
    const docsHistoryStore = new InMemoryDocsHistoryStoreStub();

    const pipeline = createAIDocGenerationPipelineStub({
      aiClient: new OpenAICompatibleAIClientStub(),
      promptBuilder: new CodebaseDocPromptBuilderStub(),
      markdownFormatter: new MarkdownFormatterStub(),
      pageSplitter: new MarkdownPageSplitterStub(),
      sidebarGenerator: new SidebarGeneratorStub(),
      docsHistoryStore,
    });

    const service = createAIDocGenerationService({
      pipeline,
      docsStore,
      docsHistoryStore,
      model: 'test-model',
      suggestedDocStructure: ['overview', 'setup-guide'],
    });

    pipeline.aiClient.generateText = async () => ({
      projectId: 'project-1',
      model: 'test-model',
      generatedAt: '2026-01-01T00:00:00.000Z',
      content: '## Overview\n\nFirst docs',
    });

    const first = await service.generateDocs({
      projectId: 'project-1',
      compactContext: 'first context',
    });

    pipeline.aiClient.generateText = async () => ({
      projectId: 'project-1',
      model: 'test-model',
      generatedAt: '2026-01-01T00:00:01.000Z',
      content: '## Overview\n\nSecond docs',
    });

    const second = await service.generateDocs({
      projectId: 'project-1',
      compactContext: 'second context',
    });

    const current = await docsStore.getCurrentDocs('project-1');
    const history = await docsHistoryStore.listHistory('project-1');

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(current?.version).toBe(2);
    expect(current?.pages[0]?.content).toContain('Second docs');
    expect(history).toHaveLength(1);
    expect(history[0].version).toBe(1);
    expect(history[0].pages[0]?.content).toContain('First docs');
  });
});
