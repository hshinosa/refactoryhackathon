## ADDED Requirements

### Requirement: Backend records project job logs
The system SHALL persist terminal-style job logs for long-running project processing.

#### Scenario: Job log event is recorded
- **WHEN** the backend appends a job log for a project
- **THEN** the log is persisted with id, projectId, level, phase, message, metadata, and createdAt
- **AND** logs for the same project can be retrieved in creation order

### Requirement: Job logs are safe for user display
The system SHALL sanitize job log messages and metadata before storing or returning them.

#### Scenario: Sensitive values are redacted
- **WHEN** a log message or metadata contains PATs, bearer tokens, authorization headers, raw source contents, or AI payloads
- **THEN** the persisted and returned log redacts those sensitive values

### Requirement: Backend processing emits lifecycle logs
The system SHALL emit user-visible logs for major source ingestion, analysis, generation, indexing, cleanup, completion, and failure phases.

#### Scenario: Successful GitHub processing emits phase logs
- **WHEN** a GitHub-backed project is processed successfully
- **THEN** logs include cloning, scanning, enriching, generating, indexing, cleanup, and completed phases
- **AND** scan logs include non-sensitive counts such as file count, config count, and dependency count
- **AND** generation logs include generated page count
- **AND** indexing logs include vector chunk count

#### Scenario: Failed processing emits safe failure log
- **WHEN** project processing fails
- **THEN** logs include a failed phase with safe error category
- **AND** logs do not include plaintext secrets or raw source contents

### Requirement: Logs can be retrieved by project owner
The system SHALL provide an authenticated endpoint to retrieve job logs for projects owned by the current user.

#### Scenario: Owner retrieves logs
- **WHEN** the project owner requests `GET /api/projects/{projectId}/logs`
- **THEN** the system returns ordered logs for that project

#### Scenario: Non-owner cannot retrieve logs
- **WHEN** a user who does not own the project requests logs
- **THEN** the system returns not found or forbidden without revealing log contents

#### Scenario: Client retrieves only new logs
- **WHEN** the request includes `afterId`
- **THEN** the response includes only logs with id greater than `afterId`

### Requirement: Logs support terminal-style live updates
The system SHALL provide a streaming endpoint for live job logs.

#### Scenario: Client streams job logs
- **WHEN** the project owner connects to `GET /api/projects/{projectId}/logs/stream`
- **THEN** the system streams new log events as Server-Sent Events
- **AND** the stream ends or sends a terminal event when the project reaches completed or failed status

### Requirement: Logs preserve status polling contract
The system SHALL keep status polling separate from log retrieval.

#### Scenario: Status and logs are both available
- **WHEN** a project is processing
- **THEN** `GET /api/projects/{projectId}/status` still returns the current lifecycle status
- **AND** `GET /api/projects/{projectId}/logs` returns detailed terminal-style logs
