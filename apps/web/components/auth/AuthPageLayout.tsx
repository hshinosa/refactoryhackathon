import Link from 'next/link';
import * as React from 'react';
import { LogoMark } from '@/components/ui/LogoMark';
import { cn } from '@/components/ui/cn';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  aside: React.ReactNode;
}

export function AuthPageLayout({ children, aside }: AuthPageLayoutProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080f17] text-slate-100">
      <div className="relative isolate min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(64,86,255,0.2),rgba(8,15,23,0)_42%)]" />
        <div className="pointer-events-none absolute left-[-8%] top-[18%] h-72 w-72 rounded-full bg-[#312e81]/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-6%] right-[-5%] h-80 w-80 rounded-full bg-[#581c87]/20 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Codebase Wiki home">
            <LogoMark size="h-9 w-9" />
            <span className="text-lg font-bold tracking-[-0.03em] text-white">Codebase Wiki</span>
          </Link>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl gap-8 px-6 pb-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="order-2 lg:order-1">{children}</div>
          <div className="order-1 lg:order-2">{aside}</div>
        </section>
      </div>
    </main>
  );
}

export function AuthShowcaseCard() {
  const rails = [
    'Repository sync status',
    'Generated docs snapshots',
    'Project analysis progress',
  ];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(35,42,76,0.94),rgba(13,18,33,0.88))] p-8 shadow-[0_30px_80px_rgba(12,18,33,0.45)] backdrop-blur-xl',
        'min-h-[480px]'
      )}
    >
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="absolute right-[-48px] top-[-48px] h-40 w-40 rounded-full bg-[#7c3aed]/25 blur-3xl" />
      <div className="absolute bottom-[-56px] left-[-28px] h-44 w-44 rounded-full bg-[#2563eb]/20 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div>
          <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-100/90">
            Auth flow
          </span>
          <h2 className="mt-5 max-w-md text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Secure your docs pipeline before you publish it.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300/80 sm:text-base">
            Sign in to manage repositories, trigger generation flows, and read the latest documentation without exposing
            project state publicly.
          </p>
        </div>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[rgba(8,15,23,0.5)] p-5 backdrop-blur-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Workspace snapshot</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest generated context</p>
            </div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Protected
            </span>
          </div>

          <div className="space-y-3">
            {rails.map((label, index) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{label}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {index === 0
                        ? 'Connected projects stay available across sessions.'
                        : index === 1
                          ? 'Review generated markdown before publishing updates.'
                          : 'Track long-running analysis stages from one dashboard.'}
                    </p>
                  </div>
                  <div className="h-2.5 w-24 rounded-full bg-white/10">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-[#7b82ff] to-[#6618d8]"
                      style={{ width: `${80 - index * 18}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
