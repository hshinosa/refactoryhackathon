export type DocsReaderPage = {
  slug: string;
  title: string;
  content: string;
};

export type DocsReaderSidebarItem = {
  title: string;
  slug: string;
  href: string;
  icon: DocsReaderSidebarIcon;
  active?: boolean;
  collapsible?: boolean;
  startsNewSection?: boolean;
  children?: DocsReaderSidebarItem[];
};

export type DocsReaderSidebarIcon = 'overview' | 'architecture' | 'api' | 'security' | 'features' | 'file';

export type DocsReaderModel = {
  projectId: string;
  projectName: string;
  version: string;
  breadcrumbs: string[];
  title: string;
  intro: string;
  sections: DocsReaderSection[];
  sourcePreview: {
    files: DocsReaderSourceFile[];
  };
  summaryCards: Array<{ label: string; value: string; description: string }>;
  fileTable: Array<{ path: string; language: string; purpose: string }>;
  sidebar: DocsReaderSidebarItem[];
  previous: { label: string; href: string };
  next: { label: string; href: string };
  viewer: {
    displayName: string;
    nameInitial: string;
  };
};

export type DocsReaderSection = {
  heading: string;
  body: string;
  blocks: DocsReaderBlock[];
};

export type DocsReaderBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'code'; language: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export type DocsReaderSourceFile = {
  path: string;
  language: string;
  content: string;
};

export type GeneratedDocsInput = {
  projectId: string;
  pages: DocsReaderPage[];
  sidebar: Array<{ title: string; slug: string; children?: Array<{ title: string; slug: string; children?: Array<{ title: string; slug: string }> }> }>;
  sourceFiles?: DocsReaderSourceFile[];
  version: number;
};

export function buildDocsReaderModel(input: { docs: GeneratedDocsInput; activeSlug?: string }): DocsReaderModel {
  const flatSidebar = flattenSidebar(input.docs.sidebar);
  const fallbackSlug = flatSidebar[0]?.slug ?? input.docs.pages[0]?.slug ?? 'overview';
  const activeSlug = input.activeSlug ?? fallbackSlug;
  const page = input.docs.pages.find((candidate) => candidate.slug === activeSlug) ?? input.docs.pages.find((candidate) => candidate.slug === fallbackSlug) ?? input.docs.pages[0];

  const currentIndex = flatSidebar.findIndex((item) => item.slug === page?.slug);
  const previous = flatSidebar[Math.max(0, currentIndex - 1)] ?? flatSidebar[0];
  const next = flatSidebar[currentIndex + 1] ?? flatSidebar[currentIndex] ?? flatSidebar[0];
  const sourcePreviewFiles = selectSourcePreviewFiles(page?.content ?? '', input.docs.sourceFiles ?? []);
  const sections = extractSections(page?.content ?? '');

  return {
    projectId: input.docs.projectId,
    projectName: input.docs.projectId.slice(0, 8),
    version: `v${input.docs.version} generated`,
    breadcrumbs: ['Docs', input.docs.projectId.slice(0, 8), page?.title ?? 'Generated Docs'],
    title: page?.title ?? 'Generated Docs',
    intro: extractIntro(page?.content ?? ''),
    sections,
    sourcePreview: {
      files: sourcePreviewFiles,
    },
    summaryCards: buildSummaryCards(sections, sourcePreviewFiles),
    fileTable: buildFileTable(sourcePreviewFiles, page?.content ?? ''),
    sidebar: input.docs.sidebar.map((item) => mapSidebarItem(item, input.docs.projectId, activeSlug)),
    previous: {
      label: previous?.title ?? 'Overview',
      href: previous ? `/docs/${input.docs.projectId}/${previous.slug}` : `/docs/${input.docs.projectId}`,
    },
    next: {
      label: next?.title ?? 'Overview',
      href: next ? `/docs/${input.docs.projectId}/${next.slug}` : `/docs/${input.docs.projectId}`,
    },
    viewer: {
      displayName: 'Guest',
      nameInitial: 'G',
    },
  };
}

function buildSummaryCards(sections: DocsReaderSection[], files: DocsReaderSourceFile[]): Array<{ label: string; value: string; description: string }> {
  return [
    { label: 'Source files', value: String(files.length), description: 'Files cited by this generated page' },
    { label: 'Sections', value: String(sections.length), description: 'Structured documentation sections' },
    { label: 'Code preview', value: files[0]?.language ?? 'n/a', description: files[0]?.path ?? 'No source preview available' },
  ];
}

function buildFileTable(files: DocsReaderSourceFile[], content: string): Array<{ path: string; language: string; purpose: string }> {
  return files.map((file) => ({
    path: file.path,
    language: file.language,
    purpose: inferFilePurpose(file.path, content),
  }));
}

function inferFilePurpose(filePath: string, content: string): string {
  const lower = filePath.toLowerCase();
  if (lower.includes('config')) return 'Configuration and environment handling';
  if (lower.includes('handler') || lower.includes('route') || lower.includes('client')) return 'Request handling and API behavior';
  if (lower.includes('middleware') || lower.includes('auth')) return 'Security or request middleware';
  if (lower.includes('cache')) return 'Caching and runtime state';
  if (lower.endsWith('main.go') || lower.includes('/main.')) return 'Application startup entrypoint';
  const escaped = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nearby = content.match(new RegExp(`\\\`${escaped}\\\`[^\\n.]*[\\n.](.{0,160})`, 'i'))?.[1]?.trim();
  if (nearby) return nearby.replace(/^[-:\s]+/, '');
  return 'Referenced source file';
}

function selectSourcePreviewFiles(content: string, sourceFiles: DocsReaderSourceFile[]): DocsReaderSourceFile[] {
  if (sourceFiles.length === 0) {
    return [];
  }

  const referencedPaths = Array.from(content.matchAll(/`([^`]+\.[A-Za-z0-9]+)`/g)).map((match) => match[1]);
  const referenced = sourceFiles.filter((file) => referencedPaths.includes(file.path));

  return (referenced.length > 0 ? referenced : sourceFiles).slice(0, 6);
}

function mapSidebarItem(
  item: GeneratedDocsInput['sidebar'][number],
  projectId: string,
  activeSlug: string,
): DocsReaderSidebarItem {
  const children = item.children?.map((child) => mapSidebarItem(child, projectId, activeSlug));
  return {
    title: item.title,
    slug: item.slug,
    href: `/docs/${projectId}/${item.slug}`,
    icon: inferSidebarIcon(item),
    active: item.slug === activeSlug,
    collapsible: Boolean(children?.length),
    startsNewSection: item.slug === 'features',
    children,
  };
}

function inferSidebarIcon(item: GeneratedDocsInput['sidebar'][number]): DocsReaderSidebarIcon {
  if (item.slug === 'overview') return 'overview';
  if (item.slug === 'architecture') return 'architecture';
  if (item.slug === 'api-reference') return 'api';
  if (item.slug === 'security') return 'security';
  if (item.slug === 'features') return 'features';
  return 'file';
}

function flattenSidebar(items: GeneratedDocsInput['sidebar']): Array<{ title: string; slug: string }> {
  return items.flatMap((item) => [
    { title: item.title, slug: item.slug },
    ...flattenSidebar(item.children ?? []),
  ]);
}

function extractIntro(content: string): string {
  const firstParagraph = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#'));
  return firstParagraph ?? 'Generated documentation for this project.';
}

function extractSections(content: string): DocsReaderSection[] {
  const normalizedContent = content
    .replace(/^##\s+.*(?:\n|$)/, '')
    .trim();
  const sections = normalizedContent
    .split(/\n(?=#{3}\s+)/)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section, index) => {
      const [headingLine, ...bodyLines] = section.split('\n');
      const hasHeading = /^#{3}\s+/.test(headingLine);
      const heading = hasHeading ? headingLine.replace(/^#+\s*/, '').trim() : index === 0 ? 'Summary' : 'Generated content';
      const body = (hasHeading ? bodyLines.join('\n') : section).replace(/^#{2,}\s.*$/gm, '').trim();
      const normalizedBody = body || 'Generated section content.';
      return { heading, body: normalizedBody, blocks: parseMarkdownBlocks(normalizedBody) };
    })
    .filter((section) => section.heading);

  const fallbackBody = content.replace(/^#+\s.*$/gm, '').trim() || 'Generated documentation content.';
  return sections.length ? sections : [{ heading: 'Generated content', body: fallbackBody, blocks: parseMarkdownBlocks(fallbackBody) }];
}

function parseMarkdownBlocks(markdown: string): DocsReaderBlock[] {
  const lines = markdown.split('\n');
  const blocks: DocsReaderBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const codeFence = line.match(/^```(\w+)?/);
    if (codeFence) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index] ?? '')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      if ((codeFence[1] ?? '').toLowerCase() === 'mermaid') {
        return [];
      }
      blocks.push({ type: 'code', language: codeFence[1] ?? 'text', code: codeLines.join('\n') });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index] ?? '');
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\s*\|/.test(lines[index] ?? '')) {
        rows.push(splitTableRow(lines[index] ?? ''));
        index += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*[-*]\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'list', items, ordered: false });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*\d+\.\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'list', items, ordered: true });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? '').trim() &&
      !/^```/.test(lines[index] ?? '') &&
      !/^\s*[-*]\s+/.test(lines[index] ?? '') &&
      !/^\s*\d+\.\s+/.test(lines[index] ?? '') &&
      !isTableStart(lines, index)
    ) {
      paragraph.push((lines[index] ?? '').trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks.length ? blocks : [{ type: 'paragraph', text: markdown }];
}

function isTableStart(lines: string[], index: number): boolean {
  return /^\s*\|/.test(lines[index] ?? '') && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? '');
}

function splitTableRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}
