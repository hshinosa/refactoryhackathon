import { AppShell } from '@/components/ui/AppShell';
import { Callout } from '@/components/ui/Callout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { cn } from '@/components/ui/cn';
import { docsArticle, docsNavGroups, type DocsNavPage } from './docsData';
import { DocsSidebarNav } from './DocsSidebarNav';
import { SourceCodeTabs } from './SourceCodeTabs';
import type { DocsReaderBlock, DocsReaderModel, DocsReaderSidebarItem } from './docsViewModel';

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3 3" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 2.5 11.6 8l5.4 2-5.4 2L10 17.5 8.4 12 3 10l5.4-2L10 2.5Z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 3.5h8l4 4v13H6z" />
      <path d="M14 3.5v4h4M8.5 12h7M8.5 15.5h5" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocsSidebar({ model }: { model: DocsReaderModel }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#080f17] lg:block">
      <div className="sticky top-16 flex h-[calc(100vh-64px)] flex-col">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d8dbff]">
              <DocIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{model.projectName}</p>
              <p className="text-xs text-[#a1a1aa]">{model.version}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-7">
            <DocsSidebarNav items={model.sidebar} />
          </div>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
              A
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Agus</p>
              <p className="text-xs text-[#a1a1aa]">Upgrade</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SourceFilePreview({ model }: { model: DocsReaderModel }) {
  const files = model.sourcePreview.files;

  if (files.length === 0) {
    return (
      <GlassCard className="relative my-10 h-[360px] overflow-hidden border-white/15 bg-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,130,255,0.18),transparent_58%)]" />
        <div className="absolute left-1/2 top-1/2 grid w-[620px] -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-5">
          {['Source Intake', 'Analysis Graph', 'Docs Output'].map((label, index) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#101827]/80 p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200">
                {index + 1}
              </div>
              <p className="font-semibold text-white">{label}</p>
              <div className="mx-auto mt-4 h-2 w-24 rounded-full bg-white/10" />
              <div className="mx-auto mt-2 h-2 w-16 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return <SourceCodeTabs files={files} />;
}

function SummaryCards({ model }: { model: DocsReaderModel }) {
  return (
    <div className="my-8 grid gap-3 sm:grid-cols-3">
      {model.summaryCards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
          <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">{card.description}</p>
        </div>
      ))}
    </div>
  );
}

function FileEvidenceTable({ model }: { model: DocsReaderModel }) {
  if (model.fileTable.length === 0) return null;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-semibold text-white">Source evidence</p>
        <p className="mt-1 text-xs text-[#a1a1aa]">Files used to ground this page.</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">File</th>
            <th className="px-5 py-3 font-semibold">Language</th>
            <th className="px-5 py-3 font-semibold">Purpose</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-[#c6c8d1]">
          {model.fileTable.map((file) => (
            <tr key={file.path}>
              <td className="px-5 py-3 font-mono text-xs text-violet-200">{file.path}</td>
              <td className="px-5 py-3">{file.language}</td>
              <td className="px-5 py-3">{file.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RichBlock({ block }: { block: DocsReaderBlock }) {
  if (block.type === 'list') {
    return (
      <ul className="mt-4 space-y-2 text-base leading-8 text-[#a1a1aa]">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
            <span>{renderInlineCode(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'code') {
    return (
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#060b12] p-4 font-mono text-sm leading-6 text-[#cbd5e1]">
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              {block.headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-[#c6c8d1]">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3">
                    {renderInlineCode(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p className="mt-3 text-base leading-8 text-[#a1a1aa]">{renderInlineCode(block.text)}</p>;
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={index} className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.92em] text-violet-200">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function FeaturedDiagram() {
  return (
    <GlassCard className="relative my-10 h-[360px] overflow-hidden border-white/15 bg-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,130,255,0.18),transparent_58%)]" />
      <div className="absolute left-1/2 top-1/2 grid w-[620px] -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-5">
        {['Source Intake', 'Analysis Graph', 'Docs Output'].map((label, index) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#101827]/80 p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200">
              {index + 1}
            </div>
            <p className="font-semibold text-white">{label}</p>
            <div className="mx-auto mt-4 h-2 w-24 rounded-full bg-white/10" />
            <div className="mx-auto mt-2 h-2 w-16 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ArticleCanvas({ model }: { model: DocsReaderModel }) {
  const callouts =
    model.projectId === 'project-alpha'
      ? docsArticle.callouts
      : [
          {
            variant: 'info' as const,
            title: 'Generated content',
            description: 'This reader is rendering persisted documentation generated from the analyzed repository.',
          },
          {
            variant: 'warning' as const,
            title: 'Grounded output',
            description: 'Review generated content against source files before treating it as final project documentation.',
          },
        ];

  return (
    <article className="mx-auto w-full max-w-[848px] px-6 py-12 lg:px-0">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#a1a1aa]">
        {model.breadcrumbs.map((crumb, index) => (
          <span key={crumb} className="flex items-center gap-2">
            <span className={index === docsArticle.breadcrumbs.length - 1 ? 'text-white' : ''}>{crumb}</span>
            {index < model.breadcrumbs.length - 1 ? <Chevron /> : null}
          </span>
        ))}
      </div>

      <h1 className="mt-8 text-[56px] font-bold leading-tight tracking-[-0.055em] text-white">{model.title}</h1>
      <p className="mt-6 text-xl leading-9 text-[#c6c8d1]">{model.intro}</p>

      {model.projectId === 'project-alpha' ? <FeaturedDiagram /> : <SourceFilePreview model={model} />}
      {model.projectId !== 'project-alpha' ? (
        <>
          <SummaryCards model={model} />
          <FileEvidenceTable model={model} />
        </>
      ) : null}

      <div className="space-y-8">
        {model.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">{section.heading}</h2>
            <div className="mt-3">
              {section.blocks.map((block, index) => (
                <RichBlock key={`${section.heading}-${index}`} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {callouts.map((callout) => (
          <Callout key={`${callout.variant}-${callout.title}`} variant={callout.variant} title={callout.title} description={callout.description} />
        ))}
      </div>

      <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
        <a href={model.previous.href} className="rounded-2xl border border-white/10 p-5 text-[#a1a1aa] transition hover:bg-white/5 hover:text-white">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Previous</span>
          <p className="mt-2 font-semibold">{model.previous.label}</p>
        </a>
        <a href={model.next.href} className="rounded-2xl border border-white/10 p-5 text-right text-[#a1a1aa] transition hover:bg-white/5 hover:text-white">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Next</span>
          <p className="mt-2 font-semibold">{model.next.label}</p>
        </a>
      </div>
    </article>
  );
}

function AskWikiPanel() {
  return (
    <aside className="hidden w-[490px] shrink-0 border-l border-white/10 bg-[#050912] px-8 py-8 2xl:block" aria-label="Ask Wiki panel">
      <div className="sticky top-24">
        <GlassCard className="p-5">
          <p className="text-sm font-semibold text-white">Ask Wiki</p>
          <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
            Semantic search is not connected yet, so this wide-screen affordance is disabled until backend support is available.
          </p>
          <textarea
            disabled
            value="Ask about Project Alpha..."
            readOnly
            className="mt-5 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500 outline-none"
          />
          <GradientButton disabled variant="ask" className="mt-4 w-full">
            Send
          </GradientButton>
        </GlassCard>
      </div>
    </aside>
  );
}

export function DocsReader({ model }: { model?: DocsReaderModel }) {
  const readerModel: DocsReaderModel = model ?? {
    projectId: 'project-alpha',
    projectName: docsArticle.projectName,
    version: docsArticle.version,
    breadcrumbs: docsArticle.breadcrumbs,
    title: docsArticle.title,
    intro: docsArticle.intro,
    sections: docsArticle.sections.map((section) => ({
      ...section,
      blocks: [{ type: 'paragraph', text: section.body }],
    })),
    sidebar: docsNavGroups.flatMap((group) => group.pages.map(toReaderSidebarItem)),
    previous: docsArticle.previous,
    next: docsArticle.next,
    sourcePreview: {
      files: [],
    },
    summaryCards: [],
    fileTable: [],
  };

  return (
    <AppShell
      actions={
        <>
          <GradientButton variant="search" leadingIcon={<SearchIcon />} className="hidden h-11 w-[376px] justify-start px-8 md:inline-flex">
            Search docs....
          </GradientButton>
          <GradientButton disabled variant="ask" leadingIcon={<SparkIcon />} className="hidden h-11 px-8 xl:inline-flex">
            Ask Wiki
          </GradientButton>
        </>
      }
    >
      <div className="flex min-h-[calc(100vh-64px)]">
        <DocsSidebar model={readerModel} />
        <main className="min-w-0 flex-1">
          <ArticleCanvas model={readerModel} />
        </main>
        <AskWikiPanel />
      </div>
    </AppShell>
  );
}

function toReaderSidebarItem(page: DocsNavPage): DocsReaderSidebarItem {
  return {
    title: page.title,
    href: page.href,
    active: page.active,
    slug: page.href.split('/').filter(Boolean).at(-1) ?? page.title.toLowerCase(),
    icon: 'file',
    children: page.children?.map(toReaderSidebarItem),
  };
}
