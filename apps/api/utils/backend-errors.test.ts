import {
  AIProviderFailureError,
  InaccessibleRepositoryError,
  InvalidGitHubRepositoryUrlError,
  InvalidPATError,
  InvalidZipUploadError,
  toBackendErrorResponse,
} from './backend-errors';

describe('backend error response mapping', () => {
  test('maps expected backend failures to machine-readable error responses', () => {
    expect(toBackendErrorResponse(new InvalidZipUploadError('Only .zip files are accepted'))).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_ZIP_UPLOAD',
          message: 'Only .zip files are accepted',
        },
      },
    });

    expect(toBackendErrorResponse(new InvalidGitHubRepositoryUrlError('Invalid GitHub repository URL'))).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_GITHUB_URL',
          message: 'Invalid GitHub repository URL',
        },
      },
    });

    expect(toBackendErrorResponse(new InvalidPATError('PAT is invalid'))).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PAT',
          message: 'PAT is invalid',
        },
      },
    });

    expect(toBackendErrorResponse(new InaccessibleRepositoryError('Repository is not accessible'))).toEqual({
      status: 422,
      body: {
        error: {
          code: 'INACCESSIBLE_REPOSITORY',
          message: 'Repository is not accessible',
        },
      },
    });

    expect(toBackendErrorResponse(new AIProviderFailureError('AI provider request failed'))).toEqual({
      status: 502,
      body: {
        error: {
          code: 'AI_PROVIDER_FAILURE',
          message: 'AI provider request failed',
        },
      },
    });
  });

  test('falls back to internal error contract for unexpected errors', () => {
    expect(toBackendErrorResponse(new Error('boom'), 'Failed to create project')).toEqual({
      status: 500,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create project',
        },
      },
    });
  });
});
