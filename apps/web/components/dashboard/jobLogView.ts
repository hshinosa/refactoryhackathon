export type UiJobLog = {
  id: string;
  projectId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  phase:
    | 'queued'
    | 'uploading'
    | 'cloning'
    | 'extracting'
    | 'scanning'
    | 'enriching'
    | 'generating'
    | 'indexing'
    | 'cleanup'
    | 'completed'
    | 'failed';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type UiGenerationStage = {
  id: string;
  title: string;
  description: string;
  status: 'complete' | 'active' | 'pending';
};

const STAGES: Array<{ id: UiJobLog['phase']; title: string; description: string }> = [
  { id: 'cloning', title: 'Repository clone', description: 'Fetching repository source' },
  { id: 'scanning', title: 'Codebase scan', description: 'Counting files, configs, and dependencies' },
  { id: 'enriching', title: 'Analysis enrichment', description: 'Building structured codebase context' },
  { id: 'generating', title: 'Documentation synthesis', description: 'Generating wiki pages and sidebar' },
  { id: 'indexing', title: 'Vector indexing', description: 'Preparing semantic search chunks' },
  { id: 'cleanup', title: 'Cleanup', description: 'Removing temporary source storage' },
];

export function formatTerminalLogLine(log: UiJobLog): string {
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(log.createdAt));
  const metadata = Object.keys(log.metadata).length ? ` ${JSON.stringify(log.metadata)}` : '';
  return `[${time}] ${log.level.toUpperCase()} ${log.phase}: ${log.message}${metadata}`;
}

export function deriveGenerationView(logs: UiJobLog[]) {
  const latest = logs.at(-1);
  const completed = latest?.phase === 'completed';
  const failed = logs.some((log) => log.phase === 'failed');
  const seen = new Set(logs.map((log) => log.phase));
  const activePhase = latest?.phase;
  const stages: UiGenerationStage[] = STAGES.map((stage) => ({
    ...stage,
    status: completed || seen.has(stage.id)
      ? 'complete'
      : activePhase === stage.id
        ? 'active'
        : 'pending',
  }));
  const completeCount = stages.filter((stage) => stage.status === 'complete').length;
  const percent = failed ? Math.max(completeCount * 14, 8) : completed ? 100 : Math.min(92, Math.max(8, completeCount * 16));
  const scanLog = logs.find((log) => log.phase === 'scanning' && typeof log.metadata.fileCount === 'number');

  return {
    percent,
    currentStage: latest?.message ?? 'Waiting for project processing to start',
    filesScanned: scanLog ? String(scanLog.metadata.fileCount) : '0',
    elapsed: logs.length ? `${logs.length} events` : '00:00',
    stages,
    terminalLines: logs.length ? logs.map(formatTerminalLogLine) : ['[--:--:--] INFO queued: Waiting for backend job logs...'],
    isTerminal: completed || failed,
    statusLabel: failed ? 'Failed' : completed ? 'Completed' : 'Running analysis',
  };
}
