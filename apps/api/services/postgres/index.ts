import { randomUUID } from 'node:crypto';

import { Pool, type QueryResultRow } from 'pg';

import { getBackendConfig } from '../../config';
import type {
  ChatRetrievalRequest,
  ChatRetrievalResponse,
  CreateProjectInput,
  DeleteUserPATInput,
  DocsHistoryStoreContract,
  DocsRetrievalServiceContract,
  DocumentationStoreContract,
  GeneratedDocs,
  AppendJobLogInput,
  JobLog,
  JobLogStoreContract,
  ListJobLogsInput,
  Project,
  ResolveUserPATInput,
  ResolvedUserPAT,
  RevokeUserPATInput,
  SessionIdentity,
  StoreUserPATInput,
  UserPATStorageContract,
  VectorIndexStoreContract,
  VectorIndexUpsertRequest,
  VectorIndexUpsertResult,
} from '../../types';
import { normalizeLogLimit, sanitizeJobLog } from '../job-logs';
import { encryptText, decryptText } from './pat-crypto';

let sharedPool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!sharedPool) {
    sharedPool = new Pool({ connectionString: getBackendConfig().database.url });
  }

  return sharedPool;
}

export async function initializePostgresSchema(pool = getPostgresPool()): Promise<void> {
  await pool.query('create extension if not exists vector');
  await pool.query(`
    create table if not exists projects (
      id text primary key,
      user_id text not null,
      owner_user_id text not null,
      created_by text not null,
      name text not null,
      source_type text not null check (source_type in ('zip', 'github')),
      source_input text not null,
      status text not null check (status in ('queued', 'uploading', 'cloning', 'extracting', 'scanning', 'generating', 'completed', 'failed')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists user_pats (
      id text primary key,
      user_id text not null,
      encrypted_pat text not null,
      iv_hex text not null,
      auth_tag_hex text not null,
      github_username text,
      revoked_at timestamptz,
      last_used_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists docs_current (
      project_id text primary key references projects(id) on delete cascade,
      payload jsonb not null,
      version integer not null,
      generated_at timestamptz not null
    )
  `);
  await pool.query(`
    create table if not exists docs_history (
      id bigserial primary key,
      project_id text not null references projects(id) on delete cascade,
      payload jsonb not null,
      version integer not null,
      generated_at timestamptz not null
    )
  `);
  await pool.query(`
    create table if not exists vector_chunks (
      id bigserial primary key,
      project_id text not null references projects(id) on delete cascade,
      chunk_id text not null,
      text text not null,
      embedding vector(3) not null,
      metadata jsonb not null,
      indexed_at timestamptz not null default now(),
      unique(project_id, chunk_id)
    )
  `);
  await pool.query(`
    create table if not exists job_logs (
      id bigserial primary key,
      project_id text not null references projects(id) on delete cascade,
      level text not null check (level in ('info', 'warn', 'error', 'debug')),
      phase text not null check (phase in ('queued', 'uploading', 'cloning', 'extracting', 'scanning', 'enriching', 'generating', 'indexing', 'cleanup', 'completed', 'failed')),
      message text not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query('create index if not exists job_logs_project_id_id_idx on job_logs(project_id, id)');
}

export class PostgresProjectStore {
  constructor(private readonly pool = getPostgresPool()) {}

  async createProject(identity: SessionIdentity, input: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      userId: identity.userId,
      ownership: { ownerUserId: identity.userId, createdBy: identity.userId },
      name: input.name.trim(),
      sourceType: input.sourceType,
      sourceInput: input.sourceInput.trim(),
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };

    await this.pool.query(
      `insert into projects(id, user_id, owner_user_id, created_by, name, source_type, source_input, status, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        project.id,
        project.userId,
        project.ownership.ownerUserId,
        project.ownership.createdBy,
        project.name,
        project.sourceType,
        project.sourceInput,
        project.status,
        project.createdAt,
        project.updatedAt,
      ],
    );

    return project;
  }

  async listProjects(identity: SessionIdentity): Promise<Project[]> {
    const result = await this.pool.query('select * from projects where user_id=$1 order by created_at desc', [identity.userId]);
    return result.rows.map(rowToProject);
  }

  async getProject(projectId: string): Promise<Project | null> {
    const result = await this.pool.query('select * from projects where id=$1', [projectId]);
    return result.rows[0] ? rowToProject(result.rows[0]) : null;
  }

  async updateStatus(projectId: string, status: Project['status']): Promise<Project | null> {
    const result = await this.pool.query('update projects set status=$2, updated_at=now() where id=$1 returning *', [projectId, status]);
    return result.rows[0] ? rowToProject(result.rows[0]) : null;
  }
}

export class PostgresPATStore implements UserPATStorageContract {
  constructor(private readonly pool = getPostgresPool()) {}

  async storePAT(input: StoreUserPATInput): Promise<{ patId: string }> {
    const encrypted = encryptText(input.pat.trim());
    const patId = randomUUID();
    await this.pool.query(
      `insert into user_pats(id,user_id,encrypted_pat,iv_hex,auth_tag_hex,github_username)
       values ($1,$2,$3,$4,$5,$6)`,
      [patId, input.userId, encrypted.encryptedText, encrypted.ivHex, encrypted.authTagHex, input.githubUsername ?? null],
    );
    return { patId };
  }

  async resolvePATForUser(input: ResolveUserPATInput): Promise<ResolvedUserPAT | null> {
    const result = await this.pool.query(
      `select * from user_pats
       where user_id=$1 and revoked_at is null and ($2::text is null or id=$2)
       order by created_at desc limit 1`,
      [input.userId, input.patId ?? null],
    );
    const row = result.rows[0];
    if (!row) return null;
    await this.pool.query('update user_pats set last_used_at=now(), updated_at=now() where id=$1', [row.id]);
    return {
      patId: row.id,
      pat: decryptText({ encryptedText: row.encrypted_pat, ivHex: row.iv_hex, authTagHex: row.auth_tag_hex }),
      githubUsername: row.github_username ?? undefined,
    };
  }

  async revokePAT(input: RevokeUserPATInput): Promise<void> {
    await this.pool.query('update user_pats set revoked_at=now(), updated_at=now() where user_id=$1 and id=$2', [input.userId, input.patId]);
  }

  async deletePAT(input: DeleteUserPATInput): Promise<void> {
    await this.pool.query('delete from user_pats where user_id=$1 and id=$2', [input.userId, input.patId]);
  }
}

export class PostgresDocumentationStore implements DocumentationStoreContract, DocsHistoryStoreContract, DocsRetrievalServiceContract {
  constructor(private readonly pool = getPostgresPool()) {}

  async saveCurrentDocs(input: GeneratedDocs): Promise<void> {
    await this.pool.query(
      `insert into docs_current(project_id,payload,version,generated_at) values ($1,$2,$3,$4)
       on conflict(project_id) do update set payload=excluded.payload, version=excluded.version, generated_at=excluded.generated_at`,
      [input.projectId, JSON.stringify(input), input.version, input.generatedAt],
    );
  }

  async getCurrentDocs(projectId: string) {
    const result = await this.pool.query('select payload from docs_current where project_id=$1', [projectId]);
    const docs = result.rows[0]?.payload as GeneratedDocs | undefined;
    if (!docs) return null;
    return {
      projectId: docs.projectId,
      pages: docs.pages,
      sidebar: docs.sidebar,
      secondarySidebar: docs.secondarySidebar,
      sourceFiles: docs.sourceFiles,
      generatedAt: docs.generatedAt,
      version: docs.version,
    };
  }

  async getDocumentation(projectId: string) {
    return this.getCurrentDocs(projectId);
  }

  async overwriteCurrentDocsWithHistoryRetention(input: { nextDocs: GeneratedDocs; previousDocs: GeneratedDocs | null }): Promise<void> {
    if (input.previousDocs) await this.appendHistory(input.previousDocs);
    await this.saveCurrentDocs(input.nextDocs);
  }

  async appendHistory(input: GeneratedDocs): Promise<void> {
    await this.pool.query(
      'insert into docs_history(project_id,payload,version,generated_at) values ($1,$2,$3,$4)',
      [input.projectId, JSON.stringify(input), input.version, input.generatedAt],
    );
  }

  async listHistory(projectId: string): Promise<GeneratedDocs[]> {
    const result = await this.pool.query('select payload from docs_history where project_id=$1 order by version asc', [projectId]);
    return result.rows.map((row) => row.payload as GeneratedDocs);
  }
}

export class PostgresVectorIndexStore implements VectorIndexStoreContract {
  constructor(private readonly pool = getPostgresPool()) {}

  async upsertIndex(input: VectorIndexUpsertRequest): Promise<VectorIndexUpsertResult> {
    await this.pool.query('delete from vector_chunks where project_id=$1', [input.projectId]);
    const seenChunkIds = new Map<string, number>();
    for (const chunk of input.embeddings) {
      const occurrence = seenChunkIds.get(chunk.chunkId) ?? 0;
      seenChunkIds.set(chunk.chunkId, occurrence + 1);
      const chunkId = occurrence === 0 ? chunk.chunkId : `${chunk.chunkId}:${occurrence + 1}`;

      await this.pool.query(
        `insert into vector_chunks(project_id,chunk_id,text,embedding,metadata)
         values ($1,$2,$3,$4::vector,$5)`,
        [input.projectId, chunkId, chunk.text, toVector3(chunk.embedding), JSON.stringify(chunk.metadata)],
      );
    }
    return { projectId: input.projectId, indexedAt: new Date().toISOString(), chunkCount: input.embeddings.length };
  }

  async retrieveContext(input: ChatRetrievalRequest): Promise<ChatRetrievalResponse> {
    const result = await this.pool.query(
      `select chunk_id, text, metadata from vector_chunks
       where project_id=$1
       order by embedding <-> $2::vector
       limit $3`,
      [input.projectId, '[1,0,0]', input.maxResults],
    );
    return {
      projectId: input.projectId,
      query: input.query,
      groundedOnly: true,
      sources: result.rows.map((row) => ({
        source: row.metadata?.source === 'codebase-summary' ? 'codebase-summary' : 'vector-index',
        reference: `vector-index:${row.chunk_id}`,
        relevanceScore: 0,
        excerpt: row.text,
      })),
      context: result.rows.map((row) => row.text).join('\n\n'),
    };
  }
}

export class PostgresJobLogStore implements JobLogStoreContract {
  constructor(private readonly pool = getPostgresPool()) {}

  async appendLog(input: AppendJobLogInput): Promise<JobLog> {
    const sanitized = sanitizeJobLog({
      id: '0',
      projectId: input.projectId,
      level: input.level,
      phase: input.phase,
      message: input.message,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    });
    const result = await this.pool.query(
      `insert into job_logs(project_id, level, phase, message, metadata)
       values ($1,$2,$3,$4,$5)
       returning *`,
      [
        sanitized.projectId,
        sanitized.level,
        sanitized.phase,
        sanitized.message,
        JSON.stringify(sanitized.metadata),
      ],
    );
    return rowToJobLog(result.rows[0]);
  }

  async listLogs(input: ListJobLogsInput): Promise<JobLog[]> {
    const result = await this.pool.query(
      `select * from job_logs
       where project_id=$1 and id > $2
       order by id asc
       limit $3`,
      [input.projectId, input.afterId ?? '0', normalizeLogLimit(input.limit)],
    );
    return result.rows.map(rowToJobLog);
  }
}

function rowToProject(row: QueryResultRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    ownership: { ownerUserId: row.owner_user_id, createdBy: row.created_by },
    name: row.name,
    sourceType: row.source_type,
    sourceInput: row.source_input,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function rowToJobLog(row: QueryResultRow): JobLog {
  return {
    id: String(row.id),
    projectId: row.project_id,
    level: row.level,
    phase: row.phase,
    message: row.message,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toVector3(values: number[]): string {
  const vector = [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
  return `[${vector.join(',')}]`;
}
