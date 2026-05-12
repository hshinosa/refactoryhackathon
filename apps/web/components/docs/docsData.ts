export type DocsNavPage = {
  title: string;
  href: string;
  active?: boolean;
  children?: DocsNavPage[];
};

export type DocsNavGroup = {
  title: string;
  pages: DocsNavPage[];
};

export type DocsCallout = {
  variant: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
};

export type DocsArticle = {
  projectName: string;
  version: string;
  breadcrumbs: string[];
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  callouts: DocsCallout[];
  previous: {
    label: string;
    href: string;
  };
  next: {
    label: string;
    href: string;
  };
};

export const docsNavGroups: DocsNavGroup[] = [
  {
    title: 'Platform',
    pages: [
      { title: 'Overview', href: '/docs/project-alpha/overview' },
      { title: 'Architecture', href: '/docs/project-alpha/architecture', active: true },
      { title: 'API Reference', href: '/docs/project-alpha/api-reference' },
      { title: 'Data Models', href: '/docs/project-alpha/data-models' },
    ],
  },
  {
    title: 'Generated Pages',
    pages: [
      { title: 'Welcome to Project Alpha', href: '/docs/project-alpha/welcome' },
      { title: 'Auth Service', href: '/docs/project-alpha/auth-service' },
      {
        title: 'Core Modules',
        href: '/docs/project-alpha/core-modules',
        children: [
          { title: 'Overview', href: '/docs/project-alpha/core-modules/overview', active: true },
          { title: 'Dashboard', href: '/docs/project-alpha/core-modules/dashboard' },
          { title: 'Campaign Marketing', href: '/docs/project-alpha/core-modules/campaign-marketing' },
          { title: 'Report Management', href: '/docs/project-alpha/core-modules/report-management' },
        ],
      },
      { title: 'Integration Notes', href: '/docs/project-alpha/integration-notes' },
    ],
  },
];

export const docsArticle: DocsArticle = {
  projectName: 'Project Alpha',
  version: 'v0.1 generated',
  breadcrumbs: ['Docs', 'Project Alpha', 'Architecture'],
  title: 'Project Alpha Architecture',
  intro:
    'Project Alpha is organized around a small set of API routes, session utilities, and reusable UI surfaces. The generated wiki keeps source-derived context separate from presentation so backend output can replace these fixtures later.',
  sections: [
    {
      heading: 'System overview',
      body:
        'The application uses a Next.js App Router frontend with API routes for session-aware project access. UI screens consume typed view models so ingestion, analysis, and documentation generation can evolve independently.',
    },
    {
      heading: 'Documentation generation flow',
      body:
        'Source intake normalizes repository or ZIP input, analysis extracts modules and relationships, and the documentation layer renders Markdown-style sections into this reader layout.',
    },
  ],
  callouts: [
    {
      variant: 'info',
      title: 'Generated content',
      description:
        'This reader is currently backed by typed mock data and is ready to be replaced by persisted backend documentation output.',
    },
    {
      variant: 'warning',
      title: 'Backend status',
      description:
        'Ask Wiki and semantic search affordances remain disabled until indexing and chat endpoints are connected.',
    },
    {
      variant: 'alert',
      title: 'Sensitive source handling',
      description:
        'Generated documentation should avoid exposing secrets, private tokens, or raw environment values discovered during repository analysis.',
    },
  ],
  previous: {
    label: 'Overview',
    href: '/docs/project-alpha/overview',
  },
  next: {
    label: 'API Reference',
    href: '/docs/project-alpha/api-reference',
  },
};
