export interface Project {
  id: string;
  userId: string;
  ownership: {
    ownerUserId: string;
    createdBy: string;
  };
  name: string;
  sourceType: 'zip' | 'github';
  sourceInput: string;
  status: 'queued' | 'uploading' | 'cloning' | 'extracting' | 'scanning' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface SessionIdentity {
  userId: string;
  email?: string | null;
  name?: string | null;
}

export interface CreateProjectInput {
  name: string;
  sourceType: 'zip' | 'github';
  sourceInput: string;
}

export interface ApiDataResponse<T> {
  data: T;
}

export type ProjectsListResponse = ApiDataResponse<Project[]>;

export type ProjectResponse = ApiDataResponse<Project>;

export interface ProjectStatusSnapshot {
  projectId: string;
  status: Project['status'];
  updatedAt: string;
}

export type ProjectStatusResponse = ApiDataResponse<ProjectStatusSnapshot>;

export type JobLogLevel = 'info' | 'warn' | 'error' | 'debug';

export type JobLogPhase =
  | 'queued'
  | 'uploading'
  | 'cloning'
  | 'extracting'
  | 'scanning'
  | 'enriching'
  | 'generating'
  | 'indexing'
  | 'cleanup'
  | 'completed'
  | 'failed';

export interface JobLog {
  id: string;
  projectId: string;
  level: JobLogLevel;
  phase: JobLogPhase;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AppendJobLogInput {
  projectId: string;
  level: JobLogLevel;
  phase: JobLogPhase;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ListJobLogsInput {
  projectId: string;
  afterId?: string;
  limit?: number;
}

export interface JobLogStoreContract {
  appendLog(input: AppendJobLogInput): Promise<JobLog>;
  listLogs(input: ListJobLogsInput): Promise<JobLog[]>;
}

export interface JobLogsSnapshot {
  projectId: string;
  logs: JobLog[];
}

export type JobLogsResponse = ApiDataResponse<JobLogsSnapshot>;

export interface UserPAT {
  id: string;
  userId: string;
  encryptedPAT: string;
  ivHex: string;
  authTagHex: string;
  revokedAt?: string;
  githubUsername?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreUserPATInput {
  userId: string;
  pat: string;
  githubUsername?: string;
}

export interface RevokeUserPATInput {
  userId: string;
  patId: string;
}

export interface DeleteUserPATInput {
  userId: string;
  patId: string;
}

export interface ResolveUserPATInput {
  userId: string;
  patId?: string;
}

export interface ResolvedUserPAT {
  patId: string;
  pat: string;
  githubUsername?: string;
}

export interface GitHubClonePreparationInput {
  userId: string;
  repositoryUrl: string;
  providedPAT?: string;
  storedPatId?: string;
}

export interface GitHubClonePreparationResult {
  repositoryUrl: string;
  isPrivateClone: boolean;
  resolvedPAT?: string;
  resolvedFrom: 'none' | 'provided' | 'stored';
  resolvedPatId?: string;
}

export interface UserPATStorageContract {
  storePAT(input: StoreUserPATInput): Promise<{ patId: string }>;
  resolvePATForUser(input: ResolveUserPATInput): Promise<ResolvedUserPAT | null>;
  revokePAT(input: RevokeUserPATInput): Promise<void>;
  deletePAT(input: DeleteUserPATInput): Promise<void>;
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
  filePaths?: string[];
  sourceEvidence?: SourceEvidence[];
  excludedPaths: string[];
  scanDuration: number;
}

export type SourceEvidenceCategory = 'overview' | 'architecture' | 'api' | 'security' | 'feature' | 'configuration';

export interface SourceEvidence {
  path: string;
  language: string;
  categories: SourceEvidenceCategory[];
  excerpt: string;
  truncated: boolean;
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
  pages: GeneratedDocsPage[];
  sidebar: GeneratedSidebarItem[];
  secondarySidebar?: GeneratedSidebarItem;
  sourceFiles?: GeneratedSourceFile[];
  generatedAt: string;
  version: number;
}

export interface GeneratedDocsPage {
  slug: string;
  title: string;
  content: string;
}

export interface GeneratedSidebarItem {
  title: string;
  slug: string;
  children?: GeneratedSidebarItem[];
}

export interface GeneratedSourceFile {
  path: string;
  language: string;
  content: string;
}

export interface DocsHistoryEntry {
  projectId: string;
  version: number;
  generatedAt: string;
  pageCount: number;
  sourceType: 'zip' | 'github';
}

export interface RetrievedDocumentation {
  projectId: string;
  pages: GeneratedDocsPage[];
  sidebar: GeneratedSidebarItem[];
  secondarySidebar?: GeneratedSidebarItem;
  sourceFiles?: GeneratedSourceFile[];
  generatedAt: string;
  version: number;
}

export type RetrievedDocumentationResponse = ApiDataResponse<RetrievedDocumentation>;

export interface DocumentationStoreContract {
  saveCurrentDocs(input: GeneratedDocs): Promise<void>;
  getCurrentDocs(projectId: string): Promise<RetrievedDocumentation | null>;
  overwriteCurrentDocsWithHistoryRetention(input: {
    nextDocs: GeneratedDocs;
    previousDocs: GeneratedDocs | null;
  }): Promise<void>;
}

export interface DocsHistoryStoreContract {
  appendHistory(input: GeneratedDocs): Promise<void>;
  listHistory(projectId: string): Promise<GeneratedDocs[]>;
}

export interface DocsRetrievalServiceContract {
  getDocumentation(projectId: string): Promise<RetrievedDocumentation | null>;
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

export type GroundedKnowledgeSourceType = 'generated-docs' | 'vector-index' | 'codebase-summary';

export interface GroundedKnowledgeSource {
  source: GroundedKnowledgeSourceType;
  reference: string;
  relevanceScore: number;
  excerpt: string;
}

export interface SemanticIndexBuildRequest {
  projectId: string;
  docsPath: string;
  summary: string;
}

export interface SemanticIndexBuildResult {
  projectId: string;
  indexedAt: string;
  chunkCount: number;
}

export interface EmbeddingChunk {
  chunkId: string;
  text: string;
  embedding: number[];
  metadata: {
    source: 'docs' | 'codebase-summary';
    pageSlug?: string;
  };
}

export interface EmbeddingGenerationRequest {
  projectId: string;
  model: string;
  chunks: Array<{
    chunkId: string;
    text: string;
    metadata: {
      source: 'docs' | 'codebase-summary';
      pageSlug?: string;
    };
  }>;
}

export interface EmbeddingGenerationResponse {
  projectId: string;
  model: string;
  embeddings: EmbeddingChunk[];
  generatedAt: string;
}

export interface EmbeddingGeneratorContract {
  generateEmbeddings(input: EmbeddingGenerationRequest): Promise<EmbeddingGenerationResponse>;
}

export interface VectorIndexUpsertRequest {
  projectId: string;
  embeddings: EmbeddingChunk[];
}

export interface VectorIndexUpsertResult {
  projectId: string;
  indexedAt: string;
  chunkCount: number;
}

export interface VectorIndexStoreContract {
  upsertIndex(input: VectorIndexUpsertRequest): Promise<VectorIndexUpsertResult>;
}

export interface ChatRetrievalRequest {
  projectId: string;
  query: string;
  maxResults: number;
  allowedSources: GroundedKnowledgeSourceType[];
}

export interface ChatRetrievalResponse {
  projectId: string;
  query: string;
  groundedOnly: true;
  sources: GroundedKnowledgeSource[];
  context: string;
}

export interface ChatRetrievalContract {
  retrieveContext(input: ChatRetrievalRequest): Promise<ChatRetrievalResponse>;
}

export type RegenerateTriggerSource = 'manual' | 'github-actions';

export interface RegenerateDocsRequest {
  projectId: string;
  triggeredBy: RegenerateTriggerSource;
}

export interface RegenerateDocsResponse {
  projectId: string;
  jobId: string;
  accepted: true;
}

export interface RegenerateDocsEndpointRequest extends RegenerateDocsRequest {
  requestedByUserId: string;
}

export interface RegenerateDocsEndpointResponse extends RegenerateDocsResponse {
  requestedAt: string;
}

export type RegenerateDocsApiResponse = ApiDataResponse<RegenerateDocsEndpointResponse>;

export interface GitHubActionsTriggerRequest {
  projectId: string;
  repository: string;
  workflowRunId: string;
  ref: string;
  sha: string;
  actor: string;
  signature?: string;
}

export interface GitHubActionsTriggerResponse {
  accepted: true;
  projectId: string;
  queuedJobId: string;
  triggerSource: 'github-actions';
}

export interface GitHubActionsRegenerateContract {
  triggerFromWorkflow(input: GitHubActionsTriggerRequest): Promise<GitHubActionsTriggerResponse>;
}
