import * as React from 'react';
import { cn } from './cn';
import { LogoMark } from './LogoMark';

interface AppShellProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  nav?: React.ReactNode;
  className?: string;
}

export function AppShell({ title = 'Codebase Wiki', children, actions, nav, className }: AppShellProps) {
  return (
    <main className={cn('min-h-screen bg-[#080f17] text-slate-100', className)}>
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-slate-500/35 bg-[#080f17]/90 px-6 backdrop-blur-xl md:px-12">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex items-center gap-3 justify-self-start">
            <LogoMark size="h-8 w-8" />
            <span className="text-xl font-bold tracking-[-0.03em] text-[#dddfff]">{title}</span>
          </div>
          {nav ? <div className="hidden flex-1 justify-center md:flex">{nav}</div> : null}
          {actions ? <div className="flex items-center justify-self-center gap-3">{actions}</div> : <div aria-hidden="true" />}
          <div aria-hidden="true" />
        </div>
      </header>
      {children}
    </main>
  );
}
