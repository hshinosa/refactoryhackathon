export interface ExcludeFilterContract {
  shouldExcludePath(path: string): boolean;
  listDefaultExcludes(): readonly string[];
}

export interface ExcludeFilterOptions {
  extraPatterns?: string[];
}

const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.cache',
  'tmp',
  'temp',
] as const;

export class StandardExcludeFilter implements ExcludeFilterContract {
  private readonly patterns: readonly string[];

  constructor(options: ExcludeFilterOptions = {}) {
    this.patterns = [...DEFAULT_EXCLUDE_PATTERNS, ...(options.extraPatterns ?? [])];
  }

  shouldExcludePath(path: string): boolean {
    const normalized = path.replace(/\\/g, '/');
    const segments = normalized.split('/').filter(Boolean);
    return this.patterns.some((pattern) => segments.includes(pattern));
  }

  listDefaultExcludes(): readonly string[] {
    return this.patterns;
  }
}

export class StandardExcludeFilterStub extends StandardExcludeFilter {}
