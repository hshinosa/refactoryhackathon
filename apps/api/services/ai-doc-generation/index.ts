import type {
  DocsHistoryStoreContract,
  DocumentationStoreContract,
  GeneratedDocs,
  GeneratedDocsPage,
  GeneratedSidebarItem,
  GeneratedSourceFile,
} from '../../types';

import type {
  AIGenerationRequest,
  AIGenerationResponse,
  OpenAICompatibleAIClientContract,
} from './ai-provider-client';
import type { MarkdownFormattingContract, MarkdownPageSplitterContract } from './markdown-formatter';
import type { CodebaseDocPrompt, CodebaseDocPromptBuilderContract, CodebaseDocPromptInput } from './prompt-builder';
import type { SidebarGenerationContract } from './sidebar-generator';

export interface AIDocGenerationServiceContract {
  generateDocs(input: { projectId: string; compactContext: string }): Promise<GeneratedDocs>;
}

export interface AIDocGenerationPipelineContract {
  aiClient: OpenAICompatibleAIClientContract;
  promptBuilder: CodebaseDocPromptBuilderContract;
  markdownFormatter: MarkdownFormattingContract;
  pageSplitter: MarkdownPageSplitterContract;
  sidebarGenerator: SidebarGenerationContract;
  docsHistoryStore: DocsHistoryStoreContract;
}

export interface AIDocGenerationPreparedArtifacts {
  prompt: CodebaseDocPrompt;
  modelInput: AIGenerationRequest;
  modelOutput: AIGenerationResponse;
  pages: GeneratedDocsPage[];
  sidebar: GeneratedSidebarItem[];
  secondarySidebar?: GeneratedSidebarItem;
}

export interface AIDocGenerationServiceInput {
  pipeline: AIDocGenerationPipelineContract;
  docsStore: DocumentationStoreContract;
  docsHistoryStore: DocsHistoryStoreContract;
  model: string;
  suggestedDocStructure: string[];
}

export function createAIDocGenerationPipelineStub(input: AIDocGenerationPipelineContract): AIDocGenerationPipelineContract {
  return input;
}

export function buildAIDocPromptStub(
  builder: CodebaseDocPromptBuilderContract,
  input: CodebaseDocPromptInput,
): CodebaseDocPrompt {
  return builder.buildPrompt(input);
}

export async function runAIDocGenerationPipelineStub(input: {
  pipeline: AIDocGenerationPipelineContract;
  projectId: string;
  model: string;
  compactContext: string;
  suggestedDocStructure: string[];
  maxPages?: number;
}): Promise<AIDocGenerationPreparedArtifacts> {
  const prompt = input.pipeline.promptBuilder.buildPrompt({
    projectId: input.projectId,
    compactContext: input.compactContext,
    suggestedDocStructure: input.suggestedDocStructure,
    maxPages: input.maxPages,
  });

  const modelInput: AIGenerationRequest = {
    projectId: input.projectId,
    model: input.model,
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userPrompt },
    ],
  };

  const modelOutput = await input.pipeline.aiClient.generateText(modelInput);
  const formattedMarkdown = input.pipeline.markdownFormatter.normalize(modelOutput.content);
  const pages = input.pipeline.pageSplitter.splitIntoPages({
    projectId: input.projectId,
    markdown: formattedMarkdown,
  });
  const split = splitDocumentationSidebars(pages);
  const primarySidebar = input.pipeline.sidebarGenerator.generateSidebar({
    projectId: input.projectId,
    pages: split.primaryPages,
  });
  const sidebar = split.featureSubmenu ? [...primarySidebar, split.featureSubmenu] : primarySidebar;

  // TODO(Wave 1 dependency): history retention behavior must be finalized
  // after current-doc persistence and versioning source-of-truth are implemented.

  return {
    prompt,
    modelInput,
    modelOutput,
    pages,
    sidebar,
  };
}

export function createAIDocGenerationService(input: AIDocGenerationServiceInput): AIDocGenerationServiceContract {
  return {
    async generateDocs(args: { projectId: string; compactContext: string }): Promise<GeneratedDocs> {
      const prepared = await runAIDocGenerationPipelineStub({
        pipeline: input.pipeline,
        projectId: args.projectId,
        model: input.model,
        compactContext: args.compactContext,
        suggestedDocStructure: input.suggestedDocStructure,
        maxPages: Math.min(Math.max(input.suggestedDocStructure.length || 10, 10), 12),
      });

      const previousDocs = await input.docsStore.getCurrentDocs(args.projectId);
      const nextDocs: GeneratedDocs = {
        projectId: args.projectId,
        pages: prepared.pages,
        sidebar: prepared.sidebar,
        secondarySidebar: prepared.secondarySidebar,
        sourceFiles: extractSourceFilesFromContext(args.compactContext),
        generatedAt: prepared.modelOutput.generatedAt,
        version: previousDocs ? previousDocs.version + 1 : 1,
      };

      await input.docsStore.overwriteCurrentDocsWithHistoryRetention({
        nextDocs,
        previousDocs,
      });

      return nextDocs;
    },
  };
}

function extractSourceFilesFromContext(compactContext: string): GeneratedSourceFile[] {
  const sourceSection = compactContext.match(/\[SOURCE_EVIDENCE\]\n([\s\S]*?)(?:\n\[(?:API|SECURITY|ARCHITECTURE)_EVIDENCE\]|$)/)?.[1] ?? '';
  const entries = sourceSection
    .split(/\n(?=path=)/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('path='));

  return entries
    .map((entry) => {
      const pathMatch = entry.match(/^path=(.+)$/m);
      const languageMatch = entry.match(/^language=(.+)$/m);
      const excerptMatch = entry.match(/^excerpt:\n([\s\S]*)$/m);
      const filePath = pathMatch?.[1]?.trim();
      const content = excerptMatch?.[1]?.trim();

      if (!filePath || !content) {
        return null;
      }

      return {
        path: filePath,
        language: languageMatch?.[1]?.trim() || 'text',
        content,
      };
    })
    .filter((file): file is GeneratedSourceFile => file !== null)
    .slice(0, 24);
}

export * from './ai-provider-client';
export * from './markdown-formatter';
export * from './prompt-builder';
export * from './sidebar-generator';

const CANONICAL_SLUGS = new Set(['overview', 'architecture', 'api-reference', 'security']);

function splitDocumentationSidebars(pages: GeneratedDocsPage[]): {
  primaryPages: GeneratedDocsPage[];
  featureSubmenu?: GeneratedSidebarItem;
} {
  const hasCanonicalDocs = ['overview', 'architecture', 'api-reference', 'security'].every((slug) =>
    pages.some((page) => page.slug === slug),
  );

  if (!hasCanonicalDocs) {
    return { primaryPages: pages };
  }

  const primaryPages = pages.filter((page) => CANONICAL_SLUGS.has(page.slug));
  const featurePages = pages.filter((page) => !CANONICAL_SLUGS.has(page.slug));
  const featureSidebar =
    featurePages.length > 0
      ? {
          title: 'Features',
          slug: 'features',
          children: featurePages.map((page) => ({
            title: page.title.replace(/^Implementation:\s*/i, ''),
            slug: page.slug,
            children: [],
          })),
        }
      : undefined;

  return {
    primaryPages,
    featureSubmenu: featureSidebar,
  };
}
