import {
  InMemoryDocsHistoryStoreStub,
  InMemoryDocumentationStoreStub,
} from './documentation-store';
import { DocumentationRetrievalServiceStub } from './index';
import type { GeneratedDocs } from '../../types';

function createDocs(version: number): GeneratedDocs {
  return {
    projectId: 'project-1',
    generatedAt: `2026-01-01T00:00:0${version}.000Z`,
    version,
    pages: [
      {
        slug: 'overview',
        title: 'Overview',
        content: `## Overview\n\nVersion ${version}`,
      },
    ],
    sidebar: [{ title: 'Overview', slug: 'overview', children: [] }],
  };
}

describe('documentation store and retrieval', () => {
  test('overwrites current docs while retaining previous docs in history', async () => {
    const docsStore = new InMemoryDocumentationStoreStub();
    const historyStore = new InMemoryDocsHistoryStoreStub();

    const first = createDocs(1);
    const second = createDocs(2);

    await docsStore.saveCurrentDocs(first);
    await docsStore.overwriteCurrentDocsWithHistoryRetention({
      previousDocs: first,
      nextDocs: second,
    });

    const current = await docsStore.getCurrentDocs('project-1');
    const history = await historyStore.listHistory('project-1');

    expect(current).toEqual({
      projectId: 'project-1',
      generatedAt: second.generatedAt,
      version: 2,
      pages: second.pages,
      sidebar: second.sidebar,
    });

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(first);
  });

  test('retrieval service returns current docs and sidebar', async () => {
    const docsStore = new InMemoryDocumentationStoreStub();
    const retrieval = new DocumentationRetrievalServiceStub(docsStore);
    const docs = createDocs(1);

    await docsStore.saveCurrentDocs(docs);
    const retrieved = await retrieval.getDocumentation('project-1');

    expect(retrieved).toEqual({
      projectId: 'project-1',
      generatedAt: docs.generatedAt,
      version: 1,
      pages: docs.pages,
      sidebar: docs.sidebar,
    });
  });
});
