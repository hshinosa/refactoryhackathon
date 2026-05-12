'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/components/ui/cn';
import type { DocsReaderSourceFile } from './docsViewModel';

export function SourceCodeTabs({ files }: { files: DocsReaderSourceFile[] }) {
  const [activePath, setActivePath] = React.useState(files[0]?.path ?? '');
  const activeFile = files.find((file) => file.path === activePath) ?? files[0];

  if (!activeFile) return null;

  const lineCount = activeFile.content.split('\n').length;

  return (
    <GlassCard className="relative my-10 overflow-hidden border-white/15 bg-[#050912]">
      <div className="border-b border-white/10 bg-[#0b111d] px-4 pt-3">
        <div className="flex gap-1 overflow-x-auto">
          {files.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setActivePath(file.path)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-t-xl border border-b-0 px-4 py-2 text-sm transition',
                file.path === activeFile.path
                  ? 'border-white/15 bg-[#111827] text-white'
                  : 'border-white/5 bg-white/[0.03] text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-violet-300" />
              <span>{file.path.split('/').pop()}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative max-h-[430px] overflow-hidden bg-[#060b12]">
        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-400">
          {activeFile.language}
        </div>
        <div className="flex min-w-0 text-sm leading-6">
          <div className="select-none border-r border-white/10 bg-white/[0.02] px-4 py-5 text-right font-mono text-slate-600">
            {Array.from({ length: Math.min(lineCount, 80) }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <pre className="min-w-0 flex-1 overflow-x-auto p-5 font-mono text-[13px] leading-6 text-[#cbd5e1]">
            <code>{activeFile.content}</code>
          </pre>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#060b12] to-transparent" />
      </div>
    </GlassCard>
  );
}
