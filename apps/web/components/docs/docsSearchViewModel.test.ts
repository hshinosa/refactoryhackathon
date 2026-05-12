import { buildSearchDocsViewModel } from './docsSearchViewModel';

describe('Search Docs view model', () => {
  test('trims excerpts around matched query terms and highlights matches', () => {
    const [result] = buildSearchDocsViewModel({
      query: 'health endpoint',
      results: [
        {
          title: 'API Reference',
          href: '/docs/project/api-reference',
          source: 'generated-docs',
          relevanceScore: 10,
          excerpt: [
            'This prefix is intentionally long and mostly unrelated to the user query.',
            'The proxy exposes GET /health as its health endpoint and returns status ok.',
            'The remaining details describe other behavior after the matched sentence.',
          ].join(' '),
        },
      ],
    });

    expect(result.excerpt).toContain('GET /health');
    expect(result.excerpt.length).toBeLessThanOrEqual(240);
    expect(result.highlightParts.some((part) => part.highlight && part.text.toLowerCase() === 'health')).toBe(true);
    expect(result.sourceLabel).toBe('Generated docs');
  });

  test('deduplicates repeated page results and keeps the strongest match', () => {
    const viewModel = buildSearchDocsViewModel({
      query: 'proxy',
      results: [
        {
          title: 'Overview',
          pageSlug: 'overview',
          href: '/docs/project/overview',
          source: 'vector-index',
          relevanceScore: 1,
          excerpt: 'Generic proxy overview.',
        },
        {
          title: 'Overview',
          pageSlug: 'overview',
          href: '/docs/project/overview',
          source: 'generated-docs',
          relevanceScore: 8,
          excerpt: 'Specific proxy endpoint details.',
        },
      ],
    });

    expect(viewModel).toHaveLength(1);
    expect(viewModel[0].excerpt).toContain('Specific proxy endpoint details');
    expect(viewModel[0].sourceLabel).toBe('Generated docs');
  });
});
