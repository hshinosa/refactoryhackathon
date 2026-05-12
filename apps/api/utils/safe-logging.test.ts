import { sanitizeForLogging } from './safe-logging';

describe('safe logging sanitization', () => {
  test('redacts PATs and raw source-like payloads recursively', () => {
    expect(sanitizeForLogging({
      pat: 'ghp_secret_token',
      sourceInput: 'const apiKey = "secret";',
      nested: {
        authorization: 'Bearer abc123',
        content: 'raw source content',
      },
    })).toEqual({
      pat: '[REDACTED]',
      sourceInput: '[REDACTED]',
      nested: {
        authorization: '[REDACTED]',
        content: '[REDACTED]',
      },
    });
  });

  test('redacts credential-like token strings embedded in log messages', () => {
    expect(sanitizeForLogging({ message: 'clone failed for token ghp_secret_token' })).toEqual({
      message: 'clone failed for token [REDACTED]',
    });
  });
});
