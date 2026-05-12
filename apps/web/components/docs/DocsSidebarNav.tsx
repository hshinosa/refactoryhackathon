'use client';

import * as React from 'react';
import { cn } from '@/components/ui/cn';
import type { DocsReaderSidebarIcon, DocsReaderSidebarItem } from './docsViewModel';

export function DocsSidebarNav({ items }: { items: DocsReaderSidebarItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <NavPage key={item.href} page={item} />
      ))}
    </ul>
  );
}

function NavPage({ page, nested = false }: { page: DocsReaderSidebarItem; nested?: boolean }) {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = Boolean(page.children?.length);

  return (
    <li className={cn(page.startsNewSection && !nested && 'mt-4 border-t border-white/10 pt-4')}>
      <div className="flex items-center gap-1">
        <a
          href={page.href}
          className={cn(
            'group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
            nested && 'ml-6 border-l border-white/10 pl-4',
            page.active
              ? 'bg-white/10 text-white shadow-[inset_3px_0_0_rgba(123,130,255,0.9)]'
              : 'text-[#a1a1aa] hover:bg-white/5 hover:text-white'
          )}
        >
          <SidebarIcon icon={page.icon} nested={nested} />
          <span className="truncate">{page.title}</span>
        </a>
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${page.title}`}
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg p-2 text-[#a1a1aa] transition hover:bg-white/5 hover:text-white"
          >
            <ChevronIcon expanded={expanded} />
          </button>
        ) : null}
      </div>
      {hasChildren && expanded ? (
        <ul className="mt-1 space-y-1">
          {page.children?.map((child) => (
            <NavPage key={child.href} page={child} nested />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SidebarIcon({ icon, nested }: { icon: DocsReaderSidebarIcon; nested: boolean }) {
  if (nested) return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />;

  const common = 'h-5 w-5 shrink-0';
  if (icon === 'overview') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 5.5h16M4 12h10M4 18.5h7" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'architecture') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 4v5M6 15v5M18 15v5M12 9 6 15M12 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 2.5h5v3h-5zM3.5 14h5v3h-5zM15.5 14h5v3h-5z" />
      </svg>
    );
  }
  if (icon === 'api') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M13.5 6.5l-3 11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'security') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3.5 19 6v5.2c0 4.2-2.8 7.8-7 9.3-4.2-1.5-7-5.1-7-9.3V6z" />
        <path d="m9.5 12 1.7 1.7 3.6-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'features') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 3.5h8l4 4v13H6z" />
      <path d="M14 3.5v4h4M8.5 12h7M8.5 15.5h5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-90')} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
