## ADDED Requirements

### Requirement: Landing page starts GitHub project imports
The system SHALL let users start a GitHub-backed project import from the landing page.

#### Scenario: User submits a GitHub repository URL
- **WHEN** the user enters a GitHub repository URL on the landing page and submits it
- **THEN** the UI sends `POST /api/projects` with `sourceType` set to `github`
- **AND** the repository URL is sent as `sourceInput`

#### Scenario: Project creation succeeds
- **WHEN** project creation returns a project id
- **THEN** the UI redirects to `/dashboard/generating?projectId={projectId}`

#### Scenario: User is unauthenticated
- **WHEN** project creation returns unauthorized
- **THEN** the UI redirects the user to `/auth/sign-in`

### Requirement: Generating dashboard renders real backend job logs
The system SHALL render project job logs from the backend on the generating dashboard.

#### Scenario: Project id is present
- **WHEN** `/dashboard/generating` is opened with a `projectId`
- **THEN** the UI connects to `/api/projects/{projectId}/logs/stream`
- **AND** incoming job log events are rendered in the terminal panel

#### Scenario: SSE is unavailable
- **WHEN** the stream connection fails
- **THEN** the UI falls back to polling `/api/projects/{projectId}/logs`
- **AND** it requests only new logs using `afterId`

### Requirement: Generating dashboard derives progress from log phases
The system SHALL derive progress display from received job log phases.

#### Scenario: Logs include processing phases
- **WHEN** logs include phases such as cloning, scanning, enriching, generating, indexing, cleanup, and completed
- **THEN** the stage list reflects completed, active, and pending states
- **AND** the terminal footer shows file count and status label from logs

### Requirement: Demo state is preserved without project id
The system SHALL keep the presentational generating screen usable without a project id.

#### Scenario: No project id is present
- **WHEN** `/dashboard/generating` is opened without `projectId`
- **THEN** the page renders the existing demo progress instead of calling project log endpoints
