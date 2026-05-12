import type { GeneratedDocsPage } from '../../types';

const CANONICAL_PAGE_TITLES = ['Overview', 'Architecture', 'API Reference', 'Security'] as const;

export interface MarkdownFormattingContract {
  normalize(markdown: string): string;
}

export interface MarkdownPageSplitterContract {
  splitIntoPages(input: { projectId: string; markdown: string }): GeneratedDocsPage[];
}

export class DocumentationPageBudget {
  constructor(public readonly maxPages = 6) {}
}

export class MarkdownFormatterStub implements MarkdownFormattingContract {
  normalize(markdown: string): string {
    return markdown.replace(/\r\n/g, '\n').trim();
  }
}

export class MarkdownPageSplitterStub implements MarkdownPageSplitterContract {
  constructor(private readonly pageBudget: DocumentationPageBudget = new DocumentationPageBudget()) {}

  splitIntoPages(input: { projectId: string; markdown: string }): GeneratedDocsPage[] {
    const normalized = input.markdown.trim();

    if (!normalized) {
      return [
        {
          slug: 'overview',
          title: 'Overview',
          content: 'TODO: Markdown content is empty in stub mode.',
        },
      ];
    }

    const contentWithoutH1 = normalized.replace(/^#\s+.*\n*/m, '').trim();
    const sections = contentWithoutH1
      .split(/^##\s+/m)
      .map((section) => section.trim())
      .filter(Boolean);

    if (sections.length === 0) {
      return [
        {
          slug: 'overview',
          title: 'Overview',
          content: normalized,
        },
      ];
    }

    const pagesBySlug = new Map<string, GeneratedDocsPage>();

    for (const section of sections) {
      const [rawTitle, ...rest] = section.split('\n');
      const title = rawTitle.trim();
      const content = rest.join('\n').trim();
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const pageContent = `## ${title}\n\n${content}`.trim();

      const existing = pagesBySlug.get(slug);
      if (existing) {
        pagesBySlug.set(slug, {
          ...existing,
          content: [existing.content, content].filter(Boolean).join('\n\n'),
        });
        continue;
      }

      if (pagesBySlug.size >= this.pageBudget.maxPages) {
        continue;
      }

      pagesBySlug.set(slug, {
        slug,
        title,
        content: pageContent,
      });
    }

    return orderCanonicalPages(Array.from(pagesBySlug.values()));
  }
}

function orderCanonicalPages(pages: GeneratedDocsPage[]): GeneratedDocsPage[] {
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const canonical = CANONICAL_PAGE_TITLES
    .map((title) => slugify(title))
    .map((slug) => bySlug.get(slug))
    .filter((page): page is GeneratedDocsPage => Boolean(page));
  const rest = pages.filter((page) => !CANONICAL_PAGE_TITLES.map(slugify).includes(page.slug));
  return [...canonical, ...rest];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
