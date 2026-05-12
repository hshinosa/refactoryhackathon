import fs from 'node:fs/promises';

import {
  createServiceLayerE2EHarness,
  createE2ETempWorkspace,
  createZipFixture,
  type JobStatus,
} from './e2e-harness';

describe('service layer E2E pipeline', () => {
  test('runs ZIP source-to-docs pipeline and returns UI-ready docs with semantic index', async () => {
    const workspace = await createE2ETempWorkspace();
    const zipPath = await createZipFixture(workspace, {
      'package.json': JSON.stringify({
        dependencies: { next: '^14.2.0', react: '^18.3.0' },
        devDependencies: { typescript: '^5.4.0' },
      }),
      'app/page.tsx': 'export default function Page() { return null; }',
      'src/secret.ts': 'export const secret = "RAW_SOURCE_SECRET";',
    });
    const harness = createServiceLayerE2EHarness();

    const result = await harness.runZipSourceToDocs({
      userId: 'user-zip',
      projectName: 'ZIP Project',
      zipPath,
      fileName: 'project.zip',
      fileSizeBytes: 1024,
    });

    expect(result.project.sourceType).toBe('zip');
    expect(result.project.status).toBe('completed');
    expect(result.docs.projectId).toBe(result.project.id);
    expect(result.docs.pages.map((page) => page.slug)).toEqual(expect.arrayContaining(['overview', 'setup-guide']));
    expect(result.docs.sidebar.length).toBeGreaterThan(0);
    expect(result.semanticIndex.chunkCount).toBeGreaterThanOrEqual(result.docs.pages.length);
    expect(result.chatContext.groundedOnly).toBe(true);
    expect(result.statuses).toEqual<JobStatus[]>(['queued', 'uploading', 'extracting', 'scanning', 'generating', 'completed']);
    await expect(fs.access(result.tempRootPath)).rejects.toThrow();
  });

  test('runs GitHub regenerate flow with PAT boundary, docs history, and GitHub Actions contract', async () => {
    const workspace = await createE2ETempWorkspace();
    await workspace.writeRepository({
      'package.json': JSON.stringify({ dependencies: { express: '^4.18.0' } }),
      'src/index.ts': 'export const app = "server";',
    });
    const harness = createServiceLayerE2EHarness();
    harness.githubCloneAdapter.registerRepository('https://github.com/acme/api', workspace.repositoryPath);

    const created = await harness.createGitHubProject({
      userId: 'user-gh',
      projectName: 'GitHub Project',
      repositoryUrl: 'https://github.com/acme/api',
    });
    const pat = await harness.storePAT({ userId: 'user-gh', pat: 'token_secret_token' });

    const first = await harness.runGitHubRegenerate({
      projectId: created.id,
      requestedByUserId: 'user-gh',
      storedPatId: pat.patId,
    });
    const second = await harness.runGitHubRegenerate({
      projectId: created.id,
      requestedByUserId: 'user-gh',
      storedPatId: pat.patId,
    });
    const workflow = await harness.triggerGitHubActionsRegenerate({
      projectId: created.id,
      repository: 'acme/api',
      workflowRunId: 'run-1',
      ref: 'refs/heads/main',
      sha: 'abc123',
      actor: 'octocat',
    });

    expect(first.accepted.projectId).toBe(created.id);
    expect(second.docs.version).toBe(2);
    expect(second.history.map((entry) => entry.version)).toEqual([1]);
    expect(workflow.triggerSource).toBe('github-actions');
    expect(harness.githubCloneAdapter.lastClone?.pat).toBe('token_secret_token');
    expect(harness.logs.serialized()).not.toContain('token_secret_token');
  });

  test('returns safe errors, cleans temp storage, and redacts logs for failure paths', async () => {
    const workspace = await createE2ETempWorkspace();
    await workspace.writeRepository({
      'package.json': JSON.stringify({ dependencies: { next: '^14.2.0' } }),
      'src/secret.ts': 'const leaked = "RAW_SOURCE_SECRET";',
    });
    const harness = createServiceLayerE2EHarness();
    harness.githubCloneAdapter.registerRepository('https://github.com/acme/fail-ai', workspace.repositoryPath);
    harness.aiClient.failNext('AI vendor unavailable');

    await expect(
      harness.runZipSourceToDocs({
        userId: 'user-errors',
        projectName: 'Bad ZIP',
        zipPath: workspace.repositoryPath,
        fileName: 'bad.txt',
        fileSizeBytes: 10,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_ZIP',
      publicMessage: 'Invalid ZIP upload.',
    });

    await expect(harness.createGitHubProject({
      userId: 'user-errors',
      projectName: 'Bad GitHub',
      repositoryUrl: 'https://gitlab.com/acme/repo',
    })).rejects.toMatchObject({
      code: 'INVALID_GITHUB_URL',
      publicMessage: 'Invalid GitHub repository URL.',
    });

    await expect(harness.runGitHubSourceToDocs({
      userId: 'user-errors',
      projectName: 'Missing Repo',
      repositoryUrl: 'https://github.com/acme/missing',
    })).rejects.toMatchObject({
      code: 'INACCESSIBLE_REPOSITORY',
      publicMessage: 'Repository could not be accessed.',
    });

    await expect(harness.runGitHubSourceToDocs({
      userId: 'user-errors',
      projectName: 'Invalid PAT',
      repositoryUrl: 'https://github.com/acme/fail-ai',
      providedPAT: 'bad_pat_secret',
    })).rejects.toMatchObject({
      code: 'INVALID_PAT',
      publicMessage: 'Repository credentials were rejected.',
    });

    await expect(harness.runGitHubSourceToDocs({
      userId: 'user-errors',
      projectName: 'AI Failure',
      repositoryUrl: 'https://github.com/acme/fail-ai',
      providedPAT: 'token_valid_secret',
    })).rejects.toMatchObject({
      code: 'AI_FAILURE',
      publicMessage: 'Documentation generation failed.',
    });

    const logOutput = harness.logs.serialized();
    expect(logOutput).toContain('projectId');
    expect(logOutput).toContain('failureCategory');
    expect(logOutput).not.toContain('bad_pat_secret');
    expect(logOutput).not.toContain('token_valid_secret');
    expect(logOutput).not.toContain('RAW_SOURCE_SECRET');
    expect(harness.getStatusContract()).toEqual([
      'queued',
      'uploading',
      'cloning',
      'extracting',
      'scanning',
      'generating',
      'completed',
      'failed',
    ]);
  });
});
