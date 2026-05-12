import type {
  DocumentationStoreContract,
  DocsHistoryStoreContract,
  GeneratedDocs,
  GeneratedSidebarItem,
  RetrievedDocumentation,
} from '../../types';

const currentDocsByProject = new Map<string, GeneratedDocs>();
const docsHistoryByProject = new Map<string, GeneratedDocs[]>();

export class InMemoryDocumentationStoreStub implements DocumentationStoreContract {
  async saveCurrentDocs(input: GeneratedDocs): Promise<void> {
    currentDocsByProject.set(input.projectId, input);
  }

  async getCurrentDocs(projectId: string): Promise<RetrievedDocumentation | null> {
    const current = currentDocsByProject.get(projectId);

    if (!current) {
      return null;
    }

    return {
      projectId: current.projectId,
      pages: current.pages,
      sidebar: current.sidebar,
      generatedAt: current.generatedAt,
      version: current.version,
    };
  }

  async overwriteCurrentDocsWithHistoryRetention(input: {
    nextDocs: GeneratedDocs;
    previousDocs: GeneratedDocs | null;
  }): Promise<void> {
    if (input.previousDocs) {
      const currentHistory = docsHistoryByProject.get(input.previousDocs.projectId) ?? [];
      if (!currentHistory.some((entry) => entry.projectId === input.previousDocs?.projectId && entry.version === input.previousDocs?.version)) {
        currentHistory.push(input.previousDocs);
        docsHistoryByProject.set(input.previousDocs.projectId, currentHistory);
      }
    }

    currentDocsByProject.set(input.nextDocs.projectId, input.nextDocs);
  }
}

export class InMemoryDocsHistoryStoreStub implements DocsHistoryStoreContract {
  async appendHistory(input: GeneratedDocs): Promise<void> {
    const currentHistory = docsHistoryByProject.get(input.projectId) ?? [];
    currentHistory.push(input);
    docsHistoryByProject.set(input.projectId, currentHistory);
  }

  async listHistory(projectId: string): Promise<GeneratedDocs[]> {
    return docsHistoryByProject.get(projectId) ?? [];
  }
}

export function createStubRetrievedDocumentation(input: {
  projectId: string;
  sidebar?: GeneratedSidebarItem[];
}): RetrievedDocumentation {
  return {
    projectId: input.projectId,
    pages: [],
    sidebar: input.sidebar ?? [],
    generatedAt: new Date().toISOString(),
    version: 0,
  };
}
