import { AppShell } from '@/components/ui/AppShell';
import { Callout } from '@/components/ui/Callout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { cn } from '@/components/ui/cn';
import { docsArticle, docsNavGroups, type DocsNavPage } from './docsData';

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

function NavPage({ page, nested = false }: { page: DocsNavPage; nested?: boolean }) {
  return (
    <li>
      <a
        href={page.href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
          nested && 'ml-6 border-l border-white/10 pl-4',
          page.active
            ? 'bg-white/10 text-white shadow-[inset_3px_0_0_rgba(123,130,255,0.9)]'
            : 'text-[#a1a1aa] hover:bg-white/5 hover:text-white'
        )}
      >
        {!nested ? <DocIcon /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
        <span>{page.title}</span>
      </a>
      {page.children ? (
        <ul className="mt-1 space-y-1">
          {page.children.map((child) => (
            <NavPage key={child.href} page={child} nested />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function DocsSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#080f17] lg:block">
      <div className="sticky top-16 flex h-[calc(100vh-64px)] flex-col">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d8dbff]">
              <DocIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{docsArticle.projectName}</p>
              <p className="text-xs text-[#a1a1aa]">{docsArticle.version}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {docsNavGroups.map((group) => (
            <div key={group.title} className="mb-7">
              <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{group.title}</p>
              <ul className="space-y-1">
                {group.pages.map((page) => (
                  <NavPage key={page.href} page={page} />
                ))}
              </ul>
            </div>
          ))}
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

function ArticleCanvas() {
  return (
    <article className="mx-auto w-full max-w-[848px] px-6 py-12 lg:px-0">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#a1a1aa]">
        {docsArticle.breadcrumbs.map((crumb, index) => (
          <span key={crumb} className="flex items-center gap-2">
            <span className={index === docsArticle.breadcrumbs.length - 1 ? 'text-white' : ''}>{crumb}</span>
            {index < docsArticle.breadcrumbs.length - 1 ? <Chevron /> : null}
          </span>
        ))}
      </div>

      <h1 className="mt-8 text-[56px] font-bold leading-tight tracking-[-0.055em] text-white">{docsArticle.title}</h1>
      <p className="mt-6 text-xl leading-9 text-[#c6c8d1]">{docsArticle.intro}</p>

      <FeaturedDiagram />

      <div className="space-y-8">
        {docsArticle.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">{section.heading}</h2>
            <p className="mt-3 text-base leading-8 text-[#a1a1aa]">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {docsArticle.callouts.map((callout) => (
          <Callout key={`${callout.variant}-${callout.title}`} variant={callout.variant} title={callout.title} description={callout.description} />
        ))}
      </div>

      <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
        <a href={docsArticle.previous.href} className="rounded-2xl border border-white/10 p-5 text-[#a1a1aa] transition hover:bg-white/5 hover:text-white">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Previous</span>
          <p className="mt-2 font-semibold">{docsArticle.previous.label}</p>
        </a>
        <a href={docsArticle.next.href} className="rounded-2xl border border-white/10 p-5 text-right text-[#a1a1aa] transition hover:bg-white/5 hover:text-white">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Next</span>
          <p className="mt-2 font-semibold">{docsArticle.next.label}</p>
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

export function DocsReader() {
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
        <DocsSidebar />
        <main className="min-w-0 flex-1">
          <ArticleCanvas />
        </main>
        <AskWikiPanel />
      </div>
    </AppShell>
  );
}
