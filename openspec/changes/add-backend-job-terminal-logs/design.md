## Context

The backend now runs real source processing through GitHub clone/ZIP extraction, deterministic scan, OpenAI-compatible enrichment, AI docs generation, PostgreSQL persistence, pgvector indexing, and status updates. Current user-visible progress is limited to a status snapshot such as `scanning` or `generating`.

This change adds job logs as a product-facing contract. The logs should look like terminal output in the UI but be structured enough for storage, filtering, testing, and safe streaming.

## Goals / Non-Goals

**Goals:**

- Persist job log events per `projectId`.
- Provide a polling endpoint for historical logs.
- Provide an optional SSE endpoint for live updates.
- Emit logs for every major backend phase.
- Preserve current project status polling contract.
- Keep logs sanitized and safe for display.

**Non-Goals:**

- Full distributed observability platform.
- Cross-service tracing.
- Browser UI implementation in this change.
- Storing raw source files or AI prompt/response bodies in logs.

## Decisions

### 1. Logs are persisted in PostgreSQL

**Decision:** Store logs in a `job_logs` table keyed by `project_id`, ordered by monotonically increasing `id` and timestamp.

**Why:** Logs must survive refreshes and allow UI polling. PostgreSQL is already the system of record for projects/docs/vector metadata.

### 2. Logs are structured but terminal-friendly

**Decision:** Each log has:

- `id`
- `projectId`
- `level`: `info | warn | error | debug`
- `phase`: `queued | uploading | cloning | extracting | scanning | enriching | generating | indexing | cleanup | completed | failed`
- `message`
- `metadata`
- `createdAt`

**Why:** UI can render terminal text from `message`, while backend/tests can assert safe structured context.

### 3. Polling endpoint is required, SSE is optional but planned

**Decision:** Implement `GET /api/projects/[projectId]/logs` as required. Implement `GET /api/projects/[projectId]/logs/stream` if feasible in this change.

**Why:** Polling is robust and simple. SSE improves UX for terminal-style streaming but should not block the core logging contract.

### 4. Logs must be sanitized at write time

**Decision:** The job log writer must sanitize message and metadata before storage.

**Why:** If sensitive data is never persisted, retrieval/streaming endpoints remain safer.

### 5. Log emission follows backend lifecycle phases

**Decision:** Emit logs at major milestones:

1. queued / request accepted
2. uploading or cloning started
3. source ready in temp storage
4. scan started
5. file/config/dependency scan result
6. enrichment started/completed/fallback
7. docs generation started/completed with page count
8. vector indexing started/completed with chunk count
9. cleanup started/completed
10. completed or failed

## Data Model

```sql
create table job_logs (
  id bigserial primary key,
  project_id text not null references projects(id) on delete cascade,
  level text not null,
  phase text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index job_logs_project_id_id_idx on job_logs(project_id, id);
```

## API Contract

### `GET /api/projects/[projectId]/logs`

Query parameters:

- `afterId` optional: return only logs with `id > afterId`
- `limit` optional: default 100, max 500

Response:

```json
{
  "data": {
    "projectId": "project-id",
    "logs": [
      {
        "id": "123",
        "level": "info",
        "phase": "scanning",
        "message": "Found 11 files and 1 config file",
        "metadata": { "fileCount": 11, "configCount": 1 },
        "createdAt": "2026-05-12T00:00:00.000Z"
      }
    ]
  }
}
```

### `GET /api/projects/[projectId]/logs/stream`

SSE events:

```text
event: job-log
data: {"id":"123","level":"info","phase":"scanning","message":"Found 11 files","metadata":{"fileCount":11},"createdAt":"..."}
```

The stream should end or send a terminal event when project status becomes `completed` or `failed`.

## Security

- Never log plaintext PATs.
- Never log bearer tokens or authorization headers.
- Never log raw file contents.
- Never log full AI prompts or AI responses.
- Metadata should include counts, filenames, phases, and error categories, not secrets.
- Endpoints must enforce project ownership.

## Testing

- Unit test log sanitization and storage.
- Service-layer E2E should assert expected phases are emitted.
- API tests should assert ownership and `afterId` behavior.
- Failure-path tests should assert logs include safe failure category and no secrets.
