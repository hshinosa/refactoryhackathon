export interface CodebaseDocPromptInput {
  projectId: string;
  compactContext: string;
  suggestedDocStructure: string[];
  maxPages?: number;
}

export interface CodebaseDocPrompt {
  systemPrompt: string;
  userPrompt: string;
}

export interface CodebaseDocPromptBuilderContract {
  buildPrompt(input: CodebaseDocPromptInput): CodebaseDocPrompt;
}

export class CodebaseDocPromptBuilderStub implements CodebaseDocPromptBuilderContract {
  buildPrompt(input: CodebaseDocPromptInput): CodebaseDocPrompt {
    const maxPages = input.maxPages ?? 6;
    const structureHint =
      input.suggestedDocStructure.length > 0
        ? input.suggestedDocStructure.slice(0, maxPages).map((section) => `- ${section}`).join('\n')
        : '- overview\n- architecture\n- setup';

    return {
      systemPrompt: [
        'You are a technical documentation generator producing living documentation.',
        'Return output as multiple Markdown pages grouped by topic.',
        'You must include these four top-level documentation pages: Overview, Architecture, API Reference, Security.',
        'After those four pages, add feature/function pages for concrete code modules using headings like "## Proxy Service".',
        'Feature pages must use human-readable feature or function names, not the label "Implementation".',
        'ground every claim in the scanned file paths, dependencies, and compact context.',
        'Do not invent APIs, endpoints, files, or behavior that are not supported by the context.',
        'Each feature page must name the concrete files it documents and explain what is implemented there.',
        `Do not exceed ${maxPages} pages.`,
        'Use exactly one level-2 heading (##) per page.',
        'Prefer concise high-signal pages over many small sections.',
      ].join('\n'),
      userPrompt: [
        `Project ID: ${input.projectId}`,
        '',
        'Suggested sections:',
        structureHint,
        '',
        'Compact context:',
        input.compactContext,
      ].join('\n'),
    };
  }
}
