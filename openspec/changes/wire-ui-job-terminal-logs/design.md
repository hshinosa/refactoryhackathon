## Context

The current landing page is static and the generating screen displays mock terminal logs. The backend exposes project creation plus project-scoped job log endpoints:

- `POST /api/projects`
- `GET /api/projects/[projectId]/logs`
- `GET /api/projects/[projectId]/logs/stream`
- `POST /api/projects/[projectId]/regenerate`

This change wires those contracts into the UI while preserving the existing visual system.

## UI Flow

1. User enters a GitHub repository URL on the landing page.
2. UI calls `POST /api/projects` with `{ name, sourceType: "github", sourceInput }`.
3. On `401`, UI redirects to sign-in.
4. On success, UI redirects to `/dashboard/generating?projectId=<id>`.
5. Generating page opens an SSE connection to `/logs/stream`.
6. Generating page also triggers `POST /regenerate` so processing starts for GitHub projects.
7. If SSE fails, UI polls `/logs?afterId=<lastSeenId>`.
8. Terminal panel renders incoming job log events.

## Components

### `LandingImportForm`

Client component responsible for:

- collecting GitHub repository URL
- creating the project
- handling unauthorized redirect
- redirecting to generating page after success

### `jobLogView`

Pure view-model utility responsible for:

- formatting log events into terminal lines
- deriving progress percentage
- deriving stage states from phases
- extracting file count and status labels

### `GeneratingDashboard`

Client component responsible for:

- reading `projectId`
- connecting to SSE
- falling back to polling
- rendering terminal lines and progress stages

## Error Handling

- Empty URL shows inline validation.
- Unauthorized project creation redirects to `/auth/sign-in`.
- Non-OK API responses show a concise inline error.
- SSE failure falls back to polling before showing an error state.

## Testing

- Add utility-level tests for log formatting and progress derivation.
- Run API tests to ensure backend contracts remain stable.
- Run web build to validate route/component integration.
- Smoke-check landing and generating pages in a browser.
