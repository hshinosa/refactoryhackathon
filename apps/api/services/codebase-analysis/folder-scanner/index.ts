import type { RawScanResult, SourceEvidence, SourceEvidenceCategory } from '../../../types';
import type { ExcludeFilterContract } from '../exclude-filter';
import fs from 'fs/promises';
import path from 'path';

export interface FileTreeNode {
  path: string;
  kind: 'file' | 'directory';
}

export interface ConfigFileCandidate {
  path: string;
  type: RawScanResult['configFiles'][number]['type'];
}

export interface FolderScannerInput {
  projectId: string;
  sourcePath: string;
}

export interface FolderScannerOutput {
  fileTree: FileTreeNode[];
  folderStructure: string[];
  configCandidates: ConfigFileCandidate[];
  sourceEvidence: SourceEvidence[];
  excludedPaths: string[];
}

export interface FolderScannerContract {
  scan(input: FolderScannerInput): Promise<FolderScannerOutput>;
}

export interface FolderScannerDependencies {
  excludeFilter: ExcludeFilterContract;
}

export class FolderScanner implements FolderScannerContract {
  constructor(private readonly deps: FolderScannerDependencies) {}

  async scan(input: FolderScannerInput): Promise<FolderScannerOutput> {
    const fileTree: FileTreeNode[] = [];
    const folderSet = new Set<string>();
    const configCandidates: ConfigFileCandidate[] = [];
    const sourceEvidence: SourceEvidence[] = [];
    const excludedPaths = new Set<string>();

    await this.walk({
      basePath: input.sourcePath,
      currentPath: input.sourcePath,
      fileTree,
      folderSet,
      configCandidates,
      sourceEvidence,
      excludedPaths,
    });

    return {
      fileTree,
      folderStructure: Array.from(folderSet).sort(),
      configCandidates: configCandidates.sort((a, b) => a.path.localeCompare(b.path)),
      sourceEvidence: sourceEvidence.sort((a, b) => a.path.localeCompare(b.path)).slice(0, SOURCE_EVIDENCE_LIMITS.maxFiles),
      excludedPaths: Array.from(excludedPaths).sort(),
    };
  }

  private async walk(input: {
    basePath: string;
    currentPath: string;
    fileTree: FileTreeNode[];
    folderSet: Set<string>;
    configCandidates: ConfigFileCandidate[];
    sourceEvidence: SourceEvidence[];
    excludedPaths: Set<string>;
  }): Promise<void> {
    const entries = await fs.readdir(input.currentPath, { withFileTypes: true });
    const sortedEntries = [...entries].sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of sortedEntries) {
      const absolutePath = path.join(input.currentPath, entry.name);
      const relativePath = path.relative(input.basePath, absolutePath).replace(/\\/g, '/');

      if (!relativePath) {
        continue;
      }

      if (this.deps.excludeFilter.shouldExcludePath(relativePath)) {
        const topLevel = relativePath.split('/')[0] ?? relativePath;
        input.excludedPaths.add(topLevel);
        continue;
      }

      if (entry.isDirectory()) {
        input.fileTree.push({ path: relativePath, kind: 'directory' });
        input.folderSet.add(relativePath);
        await this.walk({
          ...input,
          currentPath: absolutePath,
        });
        continue;
      }

      input.fileTree.push({ path: relativePath, kind: 'file' });
      const configType = detectConfigType(relativePath);
      if (configType) {
        input.configCandidates.push({
          path: relativePath,
          type: configType,
        });
      }

      if (input.sourceEvidence.length < SOURCE_EVIDENCE_LIMITS.maxFiles) {
        const evidence = await collectSourceEvidence(absolutePath, relativePath, configType);
        if (evidence) {
          input.sourceEvidence.push(evidence);
        }
      }
    }
  }
}

export class FolderScannerStub extends FolderScanner {}

function detectConfigType(relativePath: string): RawScanResult['configFiles'][number]['type'] | null {
  const filename = relativePath.split('/').pop() ?? relativePath;

  switch (filename) {
    case 'package.json':
      return 'package.json';
    case 'tsconfig.json':
      return 'tsconfig.json';
    case 'requirements.txt':
      return 'requirements.txt';
    case 'go.mod':
      return 'go.mod';
    case 'Gemfile':
      return 'Gemfile';
    case 'pom.xml':
      return 'pom.xml';
    case 'Cargo.toml':
      return 'Cargo.toml';
    default:
      return null;
  }
}

const SOURCE_EVIDENCE_LIMITS = {
  maxFiles: 40,
  maxFileBytes: 80_000,
  maxExcerptChars: 2_800,
};

async function collectSourceEvidence(
  absolutePath: string,
  relativePath: string,
  configType: ConfigFileCandidate['type'] | null,
): Promise<SourceEvidence | null> {
  if (!isDocumentationRelevantFile(relativePath, configType)) {
    return null;
  }

  const stat = await fs.stat(absolutePath);
  if (!stat.isFile() || stat.size > SOURCE_EVIDENCE_LIMITS.maxFileBytes) {
    return null;
  }

  const raw = await fs.readFile(absolutePath, 'utf-8');
  if (isLikelyBinary(raw)) {
    return null;
  }

  const redacted = redactSecrets(raw);
  const excerpt = redacted.slice(0, SOURCE_EVIDENCE_LIMITS.maxExcerptChars);

  return {
    path: relativePath,
    language: detectLanguage(relativePath),
    categories: detectEvidenceCategories(relativePath, redacted, configType),
    excerpt,
    truncated: redacted.length > excerpt.length,
  };
}

function isDocumentationRelevantFile(relativePath: string, configType: ConfigFileCandidate['type'] | null): boolean {
  if (configType) {
    return true;
  }

  if (/\.(ts|tsx|js|jsx|go|py|rs|java|rb|php|cs|cpp|c|h|json|yaml|yml|toml|md)$/i.test(relativePath) === false) {
    return false;
  }

  const normalized = relativePath.toLowerCase();
  return [
    'app/',
    'src/',
    'pages/',
    'routes/',
    'api/',
    'server',
    'main.',
    'index.',
    'auth',
    'security',
    'config',
    'service',
    'controller',
    'handler',
    'model',
    'schema',
    'component',
    'lib/',
    'internal/',
  ].some((signal) => normalized.includes(signal) || normalized.startsWith(signal));
}

function detectEvidenceCategories(
  relativePath: string,
  content: string,
  configType: ConfigFileCandidate['type'] | null,
): SourceEvidenceCategory[] {
  const categories = new Set<SourceEvidenceCategory>();
  const normalizedPath = relativePath.toLowerCase();
  const normalizedContent = content.toLowerCase();

  if (configType || /readme|package\.json|go\.mod|requirements\.txt|cargo\.toml|pom\.xml|gemfile/.test(normalizedPath)) {
    categories.add('overview');
    categories.add('configuration');
  }
  if (/main\.|index\.|app\.|server\.|layout\.|route|handler|controller|service|internal|src\//.test(normalizedPath)) {
    categories.add('architecture');
    categories.add('feature');
  }
  if (
    /route|api|handler|controller/.test(normalizedPath) ||
    /(router|app)\.(get|post|put|patch|delete)\s*\(|fetch\(|axios\.|fastify\.|gin\.|flask|@Get|@Post/.test(content)
  ) {
    categories.add('api');
  }
  if (
    /auth|security|session|token|password|secret|jwt|oauth|middleware/.test(normalizedPath) ||
    /auth|csrf|cors|session|jwt|token|password|secret|bearer|middleware|permission|encrypt|decrypt/.test(normalizedContent)
  ) {
    categories.add('security');
  }
  if (categories.size === 0) {
    categories.add('feature');
  }

  return Array.from(categories);
}

function detectLanguage(relativePath: string): string {
  const extension = relativePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript-react',
    js: 'javascript',
    jsx: 'javascript-react',
    go: 'go',
    py: 'python',
    rs: 'rust',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    h: 'c-header',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    md: 'markdown',
    mod: 'go',
    txt: 'text',
    xml: 'xml',
  };

  return extension ? map[extension] ?? extension : 'text';
}

function isLikelyBinary(content: string): boolean {
  return content.includes('\u0000');
}

function redactSecrets(content: string): string {
  return content
    .replace(/-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/g, '[REDACTED_SECRET]')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}/gi, '$1[REDACTED_SECRET]')
    .replace(/\b(sk|pk|ghp|github_pat|pat|xox[baprs])-[-A-Za-z0-9_]{10,}\b/gi, '[REDACTED_SECRET]')
    .replace(
      /\b([A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PRIVATE[_-]?KEY|PAT)[A-Z0-9_]*\s*[:=]\s*['"]?)[^'"\n\s]{8,}(['"]?)/gi,
      '$1[REDACTED_SECRET]$2',
    )
    .replace(
      /\b(apiKey|secret|token|password|privateKey|pat)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      '$1 = "[REDACTED_SECRET]"',
    );
}
