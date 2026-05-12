import {
  createProjectForUser,
  deleteStoredPATForUser,
  listProjectsForUser,
  revokeStoredPATForUser,
  resolveStoredPATForUser,
  storePATForUser,
  validateGitHubRepositoryIntake,
  validateZipUploadIntake,
} from './index';
import {
  InvalidGitHubRepositoryUrlError,
  InvalidPATError,
  InvalidZipUploadError,
} from '../../utils';

describe('project-intake validation and PAT storage', () => {
  it('accepts a ZIP intake at or below the configured size limit', () => {
    const result = validateZipUploadIntake({
      fileName: 'project.zip',
      fileSizeBytes: 52_428_800,
    });

    expect(result).toEqual({
      fileName: 'project.zip',
      fileSizeBytes: 52_428_800,
      sourceType: 'zip',
    });
  });

  it('rejects invalid GitHub repository URL', () => {
    expect(() => validateGitHubRepositoryIntake({ repositoryUrl: 'https://gitlab.com/foo/bar' })).toThrow(
      'Invalid GitHub repository URL',
    );
  });

  it('classifies invalid ZIP, repository URL, and PAT failures for API error mapping', async () => {
    expect(() => validateZipUploadIntake({
      fileName: 'project.txt',
      fileSizeBytes: 128,
    })).toThrow(InvalidZipUploadError);

    expect(() => validateGitHubRepositoryIntake({ repositoryUrl: 'https://gitlab.com/foo/bar' })).toThrow(
      InvalidGitHubRepositoryUrlError,
    );

    await expect(
      storePATForUser({
        userId: 'user-invalid-pat',
        pat: '   ',
      }),
    ).rejects.toThrow(InvalidPATError);
  });

  it('stores, resolves, and deletes PAT per user without exposing plaintext in listProjects flow', async () => {
    const patRecord = await storePATForUser({
      userId: 'user-1',
      pat: 'ghp_secret_token',
      githubUsername: 'octocat',
    });

    const resolved = await resolveStoredPATForUser({
      userId: 'user-1',
      patId: patRecord.patId,
    });

    expect(resolved).toEqual({
      patId: patRecord.patId,
      pat: 'ghp_secret_token',
      githubUsername: 'octocat',
    });

    const revoked = await revokeStoredPATForUser({
      userId: 'user-1',
      patId: patRecord.patId,
    });

    expect(revoked).toBe(true);

    const revokedLookup = await resolveStoredPATForUser({
      userId: 'user-1',
      patId: patRecord.patId,
    });

    expect(revokedLookup).toBeNull();

    const deleted = await deleteStoredPATForUser({
      userId: 'user-1',
      patId: patRecord.patId,
    });

    expect(deleted).toBe(true);

    const afterDelete = await resolveStoredPATForUser({
      userId: 'user-1',
      patId: patRecord.patId,
    });

    expect(afterDelete).toBeNull();
    expect(listProjectsForUser({ userId: 'user-1' })).toEqual([]);
  });

  it('creates a project with queued initial status', () => {
    const project = createProjectForUser(
      { userId: 'user-2' },
      {
        name: 'My Project',
        sourceType: 'github',
        sourceInput: 'https://github.com/octocat/hello-world',
      },
    );

    expect(project.status).toBe('queued');
    expect(project.ownership.ownerUserId).toBe('user-2');
  });
});
