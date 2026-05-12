export interface Project {
  id: string;
  userId: string;
  name: string;
  sourceType: 'zip' | 'github';
  sourceInput: string;
  status: 'queued' | 'uploading' | 'cloning' | 'extracting' | 'scanning' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UserPAT {
  userId: string;
  encryptedPAT: string;
  githubUsername?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface IngestionJob {
  projectId: string;
  sourceType: 'zip' | 'github';
  tempStoragePath: string;
  status: 'extracting' | 'cloning' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}

export interface RawScanResult {
  projectId: string;
  fileCount: number;
  folderStructure: string[];
  configFiles: Array<{
    path: string;
    type: 'package.json' | 'tsconfig.json' | 'requirements.txt' | 'go.mod' | 'Gemfile' | 'pom.xml' | 'Cargo.toml' | 'other';
  }>;
  dependencies: Record<string, string>;
  excludedPaths: string[];
  scanDuration: number;
}

export interface EnrichedAnalysis {
  techStack: string[];
  importantFiles: string[];
  compactContext: string;
  suggestedDocStructure: string[];
  enrichmentDuration: number;
  agentUsed: boolean;
}

export interface CodebaseAnalysis extends RawScanResult, EnrichedAnalysis {
  completedAt: string;
}

export interface GeneratedDocs {
  projectId: string;
  pages: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
  sidebar: Array<{
    title: string;
    slug: string;
    children?: Array<{ title: string; slug: string }>;
  }>;
  generatedAt: string;
  version: number;
}

export interface DocsHistoryEntry {
  projectId: string;
  version: number;
  generatedAt: string;
  pageCount: number;
  sourceType: 'zip' | 'github';
}

export interface VectorIndex {
  projectId: string;
  embeddings: Array<{
    chunkId: string;
    text: string;
    embedding: number[];
    metadata: {
      source: 'docs' | 'codebase';
      pageSlug?: string;
      filePath?: string;
    };
  }>;
  indexedAt: string;
}
