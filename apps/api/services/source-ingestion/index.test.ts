import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import AdmZip from 'adm-zip';
import simpleGit from 'simple-git';

import {
  createTempSourcePaths,
  PrivateRepositoryClonePreparationService,
  cloneGitHubRepositoryToTempStorage,
  cleanupSourcePath,
  extractZipToTempStorage,
  isCleanupExpired,
} from './index';

jest.mock('simple-git', () => jest.fn());

describe('source-ingestion temp lifecycle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates predictable temp source paths under the configured root', () => {
    const paths = createTempSourcePaths({ projectId: 'project-1', sourceType: 'zip' });

    expect(paths.rootPath).toContain('project-1');
    expect(paths.sourcePath).toContain('extracted');
    expect(paths.cleanupAt).toBeGreaterThan(Date.now());
  });

  it('extracts ZIP contents into temp storage', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codebase-wiki-test-'));
    const zipFile = path.join(tempDir, 'sample.zip');
    const outDir = path.join(tempDir, 'out');

    const zip = new AdmZip();
    zip.addFile('package.json', Buffer.from('{"name":"demo"}', 'utf8'));
    zip.writeZip(zipFile);

    await extractZipToTempStorage({ zipFilePath: zipFile, outputPath: outDir });

    const extracted = await fs.readFile(path.join(outDir, 'package.json'), 'utf8');
    expect(extracted).toContain('demo');
  });

  it('cleans up temp source path when requested', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codebase-wiki-cleanup-'));
    const child = path.join(tempDir, 'child');
    await fs.mkdir(child);

    await cleanupSourcePath(child);

    await expect(fs.access(child)).rejects.toThrow();
  });

  it('reports cleanup expiration after TTL passes', () => {
    expect(isCleanupExpired(Date.now() - 1000)).toBe(true);
    expect(isCleanupExpired(Date.now() + 1000)).toBe(false);
  });

  it('prefers provided PAT over stored PAT and falls back to stored PAT if present', async () => {
    const service = new PrivateRepositoryClonePreparationService({
      async storePAT() {
        return { patId: 'ignored' };
      },
      async resolvePATForUser(input) {
        if (input.patId === 'stored-1') {
          return {
            patId: 'stored-1',
            pat: 'ghp_stored',
            githubUsername: 'octocat',
          };
        }

        return null;
      },
      async revokePAT() {
        return undefined;
      },
      async deletePAT() {
        return undefined;
      },
    });

    const provided = await service.prepareGitHubClone({
      userId: 'u1',
      repositoryUrl: 'https://github.com/octocat/hello-world',
      providedPAT: 'ghp_direct',
    });

    expect(provided.resolvedFrom).toBe('provided');
    expect(provided.resolvedPAT).toBe('ghp_direct');

    const stored = await service.prepareGitHubClone({
      userId: 'u1',
      repositoryUrl: 'https://github.com/octocat/hello-world',
      storedPatId: 'stored-1',
    });

    expect(stored.resolvedFrom).toBe('stored');
    expect(stored.resolvedPAT).toBe('ghp_stored');
  });

  it('clones private repositories without embedding PATs in clone URLs', async () => {
    const clone = jest.fn().mockResolvedValue(undefined);
    const env = jest.fn().mockReturnValue({ clone });
    jest.mocked(simpleGit).mockReturnValue({ env } as never);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codebase-wiki-clone-'));

    await cloneGitHubRepositoryToTempStorage({
      repositoryUrl: 'https://github.com/octocat/private-repo',
      outputPath: path.join(tempDir, 'repo'),
      pat: 'ghp_secret_token',
    });

    expect(clone).toHaveBeenCalledWith('https://github.com/octocat/private-repo', path.join(tempDir, 'repo'), [
      '--depth',
      '1',
    ]);
    expect(JSON.stringify(clone.mock.calls)).not.toContain('ghp_secret_token');
    expect(JSON.stringify(env.mock.calls)).toContain('GIT_ASKPASS');
    expect(JSON.stringify(env.mock.calls)).not.toContain('ghp_secret_token');
  });
});
