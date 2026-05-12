## Why

Backend generation flow already tracks project status, but users cannot see detailed progress while source ingestion, codebase analysis, AI documentation generation, and vector indexing are running. The UI needs terminal-style progress output so users understand that work is continuing, where the job is, and why a failure happened without exposing PATs or sensitive source contents.

## What Changes

- Add persistent job log events for project processing steps.
- Add backend log writer service that records safe terminal-style messages tied to `projectId`.
- Add HTTP endpoint to retrieve historical logs for a project.
- Add optional Server-Sent Events (SSE) stream endpoint for live log updates.
- Emit job logs during clone/extract, scan, enrichment, docs generation, docs persistence, vector indexing, cleanup, completion, and failure.
- Keep logs safe by redacting PATs, tokens, raw source contents, and sensitive AI payloads.

## Capabilities

### New Capabilities

- `backend-job-terminal-logs`: persistent, user-visible job logs for long-running backend project processing.

### Modified Capabilities

- `source-ingestion`: emits safe progress log events during ZIP extraction or GitHub clone.
- `codebase-analysis`: emits file count, config detection, dependency count, enrichment start/end, and fallback events.
- `ai-doc-generation`: emits documentation generation and page/sidebar creation progress.
- `semantic-search-prep`: emits vector indexing progress and chunk count.
- `regenerate-docs-endpoint`: exposes logs through project-scoped API routes and optionally streams them live.

## Impact

- Affected code: `apps/api/services/**`, `apps/web/app/api/projects/[projectId]/logs/**`, regenerate/source processing routes.
- Database: add `job_logs` table in PostgreSQL.
- Security: logs must never contain plaintext PATs, bearer tokens, raw source file contents, or full AI prompts/responses.
- UI: can poll `GET /api/projects/[projectId]/logs` or subscribe to `GET /api/projects/[projectId]/logs/stream` for terminal panel rendering.
