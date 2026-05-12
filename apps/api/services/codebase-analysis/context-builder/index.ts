import type { CodebaseAnalysis, RawScanResult } from '../../../types';

export interface CompactContextBuilderInput {
  projectId: string;
  rawScan: RawScanResult;
  techStack: string[];
  importantFiles: string[];
  suggestedDocStructure: string[];
}

export interface CompactContextBuilderOutput {
  compactContext: string;
  tokenEstimate: number;
}

export interface CompactContextBuilderContract {
  build(input: CompactContextBuilderInput): CompactContextBuilderOutput;
}

export interface CompactContextTokenLimiter {
  maxTokens: number;
  enforce(input: { text: string; maxTokens: number }): { text: string; tokenEstimate: number };
}

export class CompactContextBuilder implements CompactContextBuilderContract {
  constructor(private readonly tokenLimiter: CompactContextTokenLimiter = new MaxTokenLimiter(2000)) {}

  build(input: CompactContextBuilderInput): CompactContextBuilderOutput {
    const importantFiles = input.importantFiles.slice(0, 20);
    const folderPreview = input.rawScan.folderStructure.slice(0, 30).join(', ');
    const dependencyPreview = Object.entries(input.rawScan.dependencies)
      .slice(0, 20)
      .map(([name, version]) => `${name}@${version}`)
      .join(', ');
    const filePreview = (input.rawScan.filePaths ?? [])
      .slice(0, 40)
      .join(', ');
    const implementationHints = importantFiles
      .filter((file) => (input.rawScan.filePaths ?? []).includes(file))
      .join(', ');
    const sourceEvidence = formatSourceEvidence(input.rawScan.sourceEvidence ?? []);

    const seed = [
      '[CONTEXT]',
      `projectId=${input.projectId}`,
      `fileCount=${input.rawScan.fileCount}`,
      `techStack=${input.techStack.join(', ')}`,
      `importantFiles=${importantFiles.join(', ')}`,
      `files=${filePreview}`,
      `implementationHints=${implementationHints}`,
      `folders=${folderPreview}`,
      `dependencies=${dependencyPreview}`,
      `excludedPaths=${input.rawScan.excludedPaths.slice(0, 20).join(', ')}`,
      `docSections=${input.suggestedDocStructure.join(' | ')}`,
      sourceEvidence,
    ].join('\n');

    const enforced = this.tokenLimiter.enforce({
      text: seed,
      maxTokens: this.tokenLimiter.maxTokens,
    });

    return {
      compactContext: enforced.text,
      tokenEstimate: enforced.tokenEstimate,
    };
  }
}

function formatSourceEvidence(sourceEvidence: NonNullable<RawScanResult['sourceEvidence']>): string {
  if (sourceEvidence.length === 0) {
    return '[SOURCE_EVIDENCE]\nnone';
  }

  const sections = [
    '[SOURCE_EVIDENCE]',
    ...sourceEvidence.slice(0, 24).map((evidence) =>
      [
        `path=${evidence.path}`,
        `language=${evidence.language}`,
        `categories=${evidence.categories.join(',')}`,
        `truncated=${evidence.truncated}`,
        'excerpt:',
        evidence.excerpt.trim(),
      ].join('\n'),
    ),
  ];

  const apiEvidence = sourceEvidence.filter((evidence) => evidence.categories.includes('api')).slice(0, 8);
  if (apiEvidence.length > 0) {
    sections.push(
      '[API_EVIDENCE]',
      ...apiEvidence.map((evidence) => `${evidence.path}\n${evidence.excerpt.trim()}`),
    );
  }

  const securityEvidence = sourceEvidence.filter((evidence) => evidence.categories.includes('security')).slice(0, 8);
  if (securityEvidence.length > 0) {
    sections.push(
      '[SECURITY_EVIDENCE]',
      ...securityEvidence.map((evidence) => `${evidence.path}\n${evidence.excerpt.trim()}`),
    );
  }

  const architectureEvidence = sourceEvidence.filter((evidence) => evidence.categories.includes('architecture')).slice(0, 8);
  if (architectureEvidence.length > 0) {
    sections.push(
      '[ARCHITECTURE_EVIDENCE]',
      ...architectureEvidence.map((evidence) => `${evidence.path}\n${evidence.excerpt.trim()}`),
    );
  }

  return sections.join('\n');
}

export class MaxTokenLimiter implements CompactContextTokenLimiter {
  constructor(public readonly maxTokens: number) {}

  enforce(input: { text: string; maxTokens: number }): { text: string; tokenEstimate: number } {
    const safeText = input.text.slice(0, input.maxTokens * 4);
    const tokenEstimate = Math.ceil(safeText.length / 4);

    return {
      text: safeText,
      tokenEstimate,
    };
  }
}

export class CompactContextBuilderStub extends CompactContextBuilder {}

export class MaxTokenLimiterStub extends MaxTokenLimiter {}

export function attachCompactContextToAnalysis(input: {
  base: Omit<CodebaseAnalysis, 'compactContext'>;
  compactContext: string;
}): CodebaseAnalysis {
  return {
    ...input.base,
    compactContext: input.compactContext,
  };
}
