export class BackendError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export class InvalidZipUploadError extends BackendError {
  constructor(message: string) {
    super(message, 'INVALID_ZIP_UPLOAD', 400);
  }
}

export class InvalidGitHubRepositoryUrlError extends BackendError {
  constructor(message: string) {
    super(message, 'INVALID_GITHUB_URL', 400);
  }
}

export class InvalidPATError extends BackendError {
  constructor(message: string) {
    super(message, 'INVALID_PAT', 400);
  }
}

export class InaccessibleRepositoryError extends BackendError {
  constructor(message: string) {
    super(message, 'INACCESSIBLE_REPOSITORY', 422);
  }
}

export class AIProviderFailureError extends BackendError {
  constructor(message: string) {
    super(message, 'AI_PROVIDER_FAILURE', 502);
  }
}

export class NotFoundError extends BackendError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ForbiddenError extends BackendError {
  constructor(message: string) {
    super(message, 'FORBIDDEN', 403);
  }
}

export function toBackendErrorResponse(
  error: unknown,
  fallbackMessage = 'Internal server error',
): { status: number; body: { error: { code: string; message: string } } } {
  if (error instanceof BackendError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: fallbackMessage,
      },
    },
  };
}
