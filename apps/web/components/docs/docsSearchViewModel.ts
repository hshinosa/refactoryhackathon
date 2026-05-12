export type SearchDocsRawResult = {
  title: string;
  pageSlug?: string;
  excerpt: string;
  source: string;
  relevanceScore: number;
  href: string;
};

export type SearchDocsHighlightPart = {
  text: string;
  highlight: boolean;
};

export type SearchDocsViewResult = SearchDocsRawResult & {
  sourceLabel: string;
  highlightParts: SearchDocsHighlightPart[];
};

const MAX_EXCERPT_LENGTH = 220;

export function buildSearchDocsViewModel(input: {
  query: string;
  results: SearchDocsRawResult[];
}): SearchDocsViewResult[] {
  const queryTerms = tokenizeSearchQuery(input.query);
  const deduped = dedupeByPage(input.results);

  return deduped.map((result) => {
    const excerpt = trimExcerptAroundMatch(result.excerpt, queryTerms);
    return {
      ...result,
      excerpt,
      sourceLabel: formatSourceLabel(result.source),
      highlightParts: highlightQueryTerms(excerpt, queryTerms),
    };
  });
}

function dedupeByPage(results: SearchDocsRawResult[]): SearchDocsRawResult[] {
  const byKey = new Map<string, SearchDocsRawResult>();

  for (const result of results) {
    const key = result.pageSlug ?? result.href ?? result.title;
    const existing = byKey.get(key);
    if (!existing || result.relevanceScore > existing.relevanceScore || sourcePriority(result.source) > sourcePriority(existing.source)) {
      byKey.set(key, result);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function trimExcerptAroundMatch(excerpt: string, queryTerms: string[]): string {
  const normalized = excerpt.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_EXCERPT_LENGTH) return normalized;

  const lower = normalized.toLowerCase();
  const matchIndex = queryTerms
    .map((term) => lower.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(normalized.length, start + MAX_EXCERPT_LENGTH);
  const slice = normalized.slice(start, end).trim();

  return `${start > 0 ? '…' : ''}${slice}${end < normalized.length ? '…' : ''}`;
}

function highlightQueryTerms(excerpt: string, queryTerms: string[]): SearchDocsHighlightPart[] {
  const uniqueTerms = Array.from(new Set(queryTerms)).filter(Boolean);
  if (uniqueTerms.length === 0) return [{ text: excerpt, highlight: false }];

  const pattern = new RegExp(`(${uniqueTerms.map(escapeRegex).join('|')})`, 'gi');
  return excerpt
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlight: uniqueTerms.some((term) => term.toLowerCase() === part.toLowerCase()),
    }));
}

function tokenizeSearchQuery(query: string): string[] {
  const stopWords = new Set(['what', 'which', 'does', 'this', 'that', 'the', 'and', 'for', 'with', 'project', 'codebase']);
  return query
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));
}

function formatSourceLabel(source: string): string {
  if (source === 'generated-docs') return 'Generated docs';
  if (source === 'vector-index') return 'Indexed docs';
  if (source === 'codebase-summary') return 'Project summary';
  return source;
}

function sourcePriority(source: string): number {
  if (source === 'generated-docs') return 3;
  if (source === 'vector-index') return 2;
  if (source === 'codebase-summary') return 1;
  return 0;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
