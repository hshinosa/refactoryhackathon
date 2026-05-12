import assert from 'node:assert/strict';

import {
  deriveGenerationView,
  formatTerminalLogLine,
  type UiJobLog,
} from './jobLogView';

const logs: UiJobLog[] = [
  {
    id: '1',
    projectId: 'project-1',
    level: 'info',
    phase: 'queued',
    message: 'Project processing queued',
    metadata: {},
    createdAt: '2026-05-12T15:55:31.245Z',
  },
  {
    id: '2',
    projectId: 'project-1',
    level: 'info',
    phase: 'scanning',
    message: 'Scanned codebase files',
    metadata: { fileCount: 11, dependencyCount: 1 },
    createdAt: '2026-05-12T15:55:32.269Z',
  },
  {
    id: '3',
    projectId: 'project-1',
    level: 'info',
    phase: 'completed',
    message: 'Project processing completed',
    metadata: {},
    createdAt: '2026-05-12T15:55:33.000Z',
  },
];

assert.equal(
  formatTerminalLogLine(logs[1]),
  '[15:55:32] INFO scanning: Scanned codebase files {"fileCount":11,"dependencyCount":1}',
);

const view = deriveGenerationView(logs);
assert.equal(view.percent, 100);
assert.equal(view.filesScanned, '11');
assert.equal(view.currentStage, 'Project processing completed');
assert.deepEqual(view.stages.map((stage) => stage.status), ['complete', 'complete', 'complete', 'complete', 'complete', 'complete']);

const failedWithCleanup = deriveGenerationView([
  ...logs.slice(0, 2),
  {
    id: 'failed',
    projectId: 'project-1',
    level: 'error',
    phase: 'failed',
    message: 'Project processing failed',
    metadata: {},
    createdAt: '2026-05-12T15:55:33.000Z',
  },
  {
    id: 'cleanup',
    projectId: 'project-1',
    level: 'info',
    phase: 'cleanup',
    message: 'Cleaning temporary source storage after failure',
    metadata: {},
    createdAt: '2026-05-12T15:55:34.000Z',
  },
]);
assert.equal(failedWithCleanup.statusLabel, 'Failed');

console.log('jobLogView tests passed');
