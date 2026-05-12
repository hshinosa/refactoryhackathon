## Why

The backend now persists and streams terminal-style project job logs, but users need a visible UI path from landing import to the generating screen where those logs are rendered. Without UI wiring, the terminal logs feature remains an API-only capability.

## What Changes

- Add a GitHub repository import form to the landing page.
- Submit GitHub imports to `POST /api/projects`.
- Redirect successful imports to `/dashboard/generating?projectId=...`.
- Connect the generating dashboard to `/api/projects/[projectId]/logs/stream`.
- Fall back to polling `/api/projects/[projectId]/logs?afterId=...` when SSE is unavailable.
- Render backend job log events in the existing terminal-style panel.
- Derive progress stage states from received job log phases.

## Non-Goals

- Redesigning the landing page visual direction.
- Implementing ZIP upload UI.
- Implementing private PAT input UX.
- Replacing authentication/session behavior.

## Impact

- Affected files: landing page, generating dashboard, dashboard log view model utilities.
- Backend: uses existing project creation, regenerate, logs, and logs stream endpoints.
- Security: UI must not display PATs or raw source contents; backend logs are already sanitized.
