const SENSITIVE_KEYS = new Set(['pat', 'token', 'authorization', 'content', 'sourceInput', 'rawSource']);
const TOKEN_PATTERN = /\b(?:ghp|github_pat|Bearer)\S+/g;

export function sanitizeForLogging<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogging(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? '[REDACTED]' : sanitizeForLogging(entryValue),
      ]),
    ) as T;
  }

  if (typeof value === 'string') {
    return value.replace(TOKEN_PATTERN, '[REDACTED]') as T;
  }

  return value;
}
