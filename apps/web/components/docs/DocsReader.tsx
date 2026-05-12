'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { Callout } from '@/components/ui/Callout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { cn } from '@/components/ui/cn';
import { docsArticle, docsNavGroups, type DocsNavPage } from './docsData';
import { DocsSidebarNav } from './DocsSidebarNav';
import { SourceCodeTabs } from './SourceCodeTabs';
import { buildSearchDocsViewModel, type SearchDocsHighlightPart, type SearchDocsRawResult } from './docsSearchViewModel';
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

type ApiResponse<T> = { data: T };

type WikiChatSession = {
  id: string;
  title: string;
  updatedAt: string;
};

type WikiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Array<{ reference: string; excerpt: string; pageSlug?: string; title?: string }>;
};

function ChatMessageContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: Array<{ type: 'paragraph'; text: string } | { type: 'list'; items: string[] }> = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? '';
    if (!line) {
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index]?.trim() ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*[-*]\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index]?.trim() ?? '';
      if (!current || /^[-*]\s+/.test(current)) break;
      paragraph.push(current);
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) =>
        block.type === 'list' ? (
          <ul key={blockIndex} className="space-y-1.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-200/70" />
                <span>{renderInlineCode(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={blockIndex}>{renderInlineCode(block.text)}</p>
        ),
      )}
    </div>
  );
}

function HighlightedSearchExcerpt({ parts }: { parts: SearchDocsHighlightPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark key={`${part.text}-${index}`} className="rounded bg-violet-300/15 px-0.5 text-violet-100">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

async function fetchData<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Request failed');
  }
  return (payload as ApiResponse<T>).data;
}

function SearchDocsModal({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchDocsRawResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const viewResults = buildSearchDocsViewModel({ query, results });

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setStatus('loading');
    setError('');
    try {
      const data = await fetchData<{ results: SearchDocsRawResult[] }>(`/api/projects/${projectId}/search`, {
        method: 'POST',
        body: JSON.stringify({ query, maxResults: 8 }),
      });
      setResults(data.results);
      setStatus('idle');
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search failed');
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 px-4 py-16 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#07111d] shadow-2xl">
        <form onSubmit={submit} className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <SearchIcon />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search generated docs..."
              className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
            />
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
              Esc
            </button>
          </div>
        </form>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {status === 'loading' ? <p className="p-4 text-sm text-slate-400">Searching indexed docs...</p> : null}
          {status === 'error' ? <p className="p-4 text-sm text-red-300">{error}</p> : null}
          {status === 'idle' && query && viewResults.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
              <p className="font-medium text-slate-200">No indexed docs matched this query.</p>
              <p className="mt-1">Try regenerating docs or searching for a file, path, endpoint, or API term.</p>
            </div>
          ) : null}
          <div className="space-y-3">
            {viewResults.map((result) => (
              <a
                key={`${result.href}-${result.excerpt}`}
                href={result.href}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-300/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-white">{result.title}</p>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{result.sourceLabel}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#a1a1aa]">
                  <HighlightedSearchExcerpt parts={result.highlightParts} />
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
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

function AskWikiPanel({ projectId }: { projectId: string }) {
  const [sessions, setSessions] = useState<WikiChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState<WikiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sending' | 'error'>('loading');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSessions() {
      try {
        setStatus('loading');
        const data = await fetchData<{ sessions: WikiChatSession[] }>(`/api/projects/${projectId}/wiki-chat/sessions`);
        if (cancelled) return;
        setSessions(data.sessions);
        const latest = data.sessions[0];
        if (latest) {
          setActiveSessionId(latest.id);
          const messageData = await fetchData<{ messages: WikiChatMessage[] }>(`/api/projects/${projectId}/wiki-chat/sessions/${latest.id}/messages`);
          if (!cancelled) setMessages(messageData.messages);
        }
        if (!cancelled) setStatus('idle');
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load Ask Wiki');
          setStatus('error');
        }
      }
    }
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  async function newChat() {
    const data = await fetchData<{ session: WikiChatSession }>(`/api/projects/${projectId}/wiki-chat/sessions`, {
      method: 'POST',
      body: JSON.stringify({ title: 'New chat' }),
    });
    setSessions((current) => [data.session, ...current]);
    setActiveSessionId(data.session.id);
    setMessages([]);
  }

  async function loadSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setStatus('loading');
    const data = await fetchData<{ messages: WikiChatMessage[] }>(`/api/projects/${projectId}/wiki-chat/sessions/${sessionId}/messages`);
    setMessages(data.messages);
    setStatus('idle');
  }

  async function deleteActiveSession() {
    if (!activeSessionId) return;
    await fetchData<{ deleted: boolean }>(`/api/projects/${projectId}/wiki-chat/sessions/${activeSessionId}`, { method: 'DELETE' });
    const remaining = sessions.filter((session) => session.id !== activeSessionId);
    setSessions(remaining);
    setMessages([]);
    setActiveSessionId('');
    if (remaining[0]) {
      await loadSession(remaining[0].id);
    }
  }

  async function sendMessage() {
    const question = input.trim();
    if (!question || status === 'sending') return;
    setInput('');
    setError('');
    setStatus('sending');
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const created = await fetchData<{ session: WikiChatSession }>(`/api/projects/${projectId}/wiki-chat/sessions`, {
          method: 'POST',
          body: JSON.stringify({ title: question }),
        });
        sessionId = created.session.id;
        setActiveSessionId(sessionId);
        setSessions((current) => [created.session, ...current]);
      }
      const data = await fetchData<{ session: WikiChatSession; messages: WikiChatMessage[] }>(
        `/api/projects/${projectId}/wiki-chat/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ question }),
        },
      );
      setMessages(data.messages);
      setSessions((current) => [data.session, ...current.filter((session) => session.id !== data.session.id)]);
      setStatus('idle');
    } catch (sendError) {
      setInput(question);
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message');
      setStatus('error');
    }
  }

  return (
    <aside className="hidden w-[490px] shrink-0 border-l border-white/10 bg-[#050912] px-8 py-8 2xl:block" aria-label="Ask Wiki panel">
      <div className="sticky top-24 flex h-[calc(100vh-120px)] flex-col">
        <GlassCard className="flex min-h-0 flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Ask Wiki</p>
              <p className="mt-1 text-xs text-[#a1a1aa]">Grounded in indexed docs.</p>
            </div>
            <button onClick={newChat} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white">
              New chat
            </button>
          </div>

          {sessions.length > 0 ? (
            <div className="mt-4 flex gap-2">
              <select
                value={activeSessionId}
                onChange={(event) => loadSession(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id} className="bg-[#07111d]">
                    {session.title}
                  </option>
                ))}
              </select>
              <button onClick={deleteActiveSession} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white">
                Delete
              </button>
            </div>
          ) : null}

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            {status === 'loading' ? <p className="text-sm text-slate-400">Loading chat history...</p> : null}
            {messages.length === 0 && status !== 'loading' ? (
              <div className="space-y-3 text-sm text-[#a1a1aa]">
                <p>Ask about endpoints, authentication, architecture, or source files.</p>
                {['What endpoints does this project expose?', 'How does authentication work?', 'Which files implement the main behavior?'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-slate-300 hover:bg-white/[0.06]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn('rounded-2xl p-4 text-sm leading-6', message.role === 'user' ? 'ml-8 bg-violet-500/15 text-white' : 'mr-8 border border-white/10 bg-white/[0.03] text-[#d4d4d8]')}>
                  <ChatMessageContent content={message.content} />
                  {message.sources?.length ? (
                    <div className="mt-4 border-t border-white/10 pt-2 text-[11px] leading-5 text-slate-500">
                      <span className="mr-2 uppercase tracking-[0.14em]">Sources</span>
                      {message.sources.slice(0, 4).map((source) => (
                        <a
                          key={source.reference}
                          href={source.pageSlug ? `/docs/${projectId}/${source.pageSlug}` : `/docs/${projectId}`}
                          className="mr-2 text-slate-400 underline decoration-white/10 underline-offset-4 transition hover:text-violet-100"
                          title={source.excerpt}
                        >
                          {source.title ?? source.reference.replace(/^vector-index:/, '')}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>

          {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
          <div className="mt-4">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about this codebase..."
              className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-300/50"
            />
            <GradientButton onClick={sendMessage} disabled={status === 'sending' || !input.trim()} variant="ask" className="mt-3 w-full">
              {status === 'sending' ? 'Thinking...' : 'Send'}
            </GradientButton>
          </div>
        </GlassCard>
      </div>
    </aside>
  );
}

export function DocsReader({ model }: { model?: DocsReaderModel }) {
  const [searchOpen, setSearchOpen] = useState(false);
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
          <GradientButton onClick={() => setSearchOpen(true)} variant="search" leadingIcon={<SearchIcon />} className="hidden h-11 w-[376px] justify-start px-8 md:inline-flex">
            Search docs....
          </GradientButton>
          <GradientButton variant="ask" leadingIcon={<SparkIcon />} className="hidden h-11 px-8 xl:inline-flex">
            Ask Wiki
          </GradientButton>
        </>
      }
    >
      <SearchDocsModal projectId={readerModel.projectId} open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="flex min-h-[calc(100vh-64px)]">
        <DocsSidebar model={readerModel} />
        <main className="min-w-0 flex-1">
          <ArticleCanvas model={readerModel} />
        </main>
        <AskWikiPanel projectId={readerModel.projectId} />
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
