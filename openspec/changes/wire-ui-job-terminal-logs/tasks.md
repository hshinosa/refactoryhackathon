## 1. Landing import wiring

- [x] 1.1 Add GitHub repository URL input to the landing page
- [x] 1.2 Submit GitHub imports to `POST /api/projects`
- [x] 1.3 Redirect unauthorized users to sign-in
- [x] 1.4 Redirect successful project creation to `/dashboard/generating?projectId=...`

## 2. Terminal log view model

- [x] 2.1 Define UI job log shape matching backend response
- [x] 2.2 Format job logs as terminal-style lines
- [x] 2.3 Derive progress percentage and stages from job log phases
- [x] 2.4 Add focused test coverage for log formatting and progress derivation

## 3. Generating dashboard wiring

- [x] 3.1 Read `projectId` from generating page search params
- [x] 3.2 Connect to `/api/projects/[projectId]/logs/stream`
- [x] 3.3 Trigger regeneration for the project
- [x] 3.4 Fall back to `/api/projects/[projectId]/logs?afterId=...` polling if SSE fails
- [x] 3.5 Render backend logs in the terminal panel
- [x] 3.6 Render stage/progress state from received logs

## 4. Verification

- [x] 4.1 Run `npm test --workspace=apps/api`
- [x] 4.2 Run UI log view utility test
- [x] 4.3 Run `npm run build --workspace=apps/web`
- [x] 4.4 Browser smoke-check landing and generating routes
- [x] 4.5 Run `npx openspec validate wire-ui-job-terminal-logs --strict`
