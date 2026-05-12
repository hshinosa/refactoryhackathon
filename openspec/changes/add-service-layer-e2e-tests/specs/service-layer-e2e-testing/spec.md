## ADDED Requirements

### Requirement: Service layer E2E tests cover ZIP source-to-docs pipeline
The system SHALL provide deterministic E2E tests that exercise the backend service layer from ZIP source intake through documentation retrieval.

#### Scenario: ZIP project produces retrievable docs
- **WHEN** an authenticated user submits a valid ZIP-backed project source
- **THEN** the E2E test runs project creation, source ingestion, codebase analysis, AI documentation generation, docs persistence, semantic index preparation, and docs retrieval through service contracts
- **AND** the retrieved docs include projectId, pages, generated sidebar metadata, generatedAt, and version

#### Scenario: ZIP pipeline cleans temporary source storage
- **WHEN** the ZIP source-to-docs pipeline completes successfully
- **THEN** temporary source artifacts are removed or marked for cleanup according to the backend cleanup contract

### Requirement: Service layer E2E tests cover GitHub regenerate pipeline
The system SHALL provide deterministic E2E tests that exercise GitHub-backed documentation regeneration without real network calls.

#### Scenario: Manual regenerate overwrites current docs with history retention
- **WHEN** an owner triggers regenerate for an existing GitHub-backed project
- **THEN** the E2E test runs clone, analysis, generation, current docs overwrite, and docs history retention through service contracts
- **AND** the previous generated docs remain available in history

#### Scenario: GitHub Actions trigger starts regeneration
- **WHEN** valid GitHub Actions workflow metadata is submitted for a GitHub-backed project
- **THEN** the E2E test verifies the backend accepts the trigger and returns a queued regeneration contract

### Requirement: E2E tests use deterministic external-boundary fakes
The system SHALL avoid real GitHub, AI provider, embedding provider, and browser dependencies in service-layer E2E tests.

#### Scenario: External systems are faked
- **WHEN** service-layer E2E tests run
- **THEN** GitHub clone, AI docs generation, embedding generation, documentation storage, vector indexing, and log sinks use deterministic fakes or in-memory adapters
- **AND** no real credentials or network access are required

### Requirement: E2E tests cover backend-safe error responses
The system SHALL verify safe backend error responses for invalid source input and external-boundary failures.

#### Scenario: Invalid ZIP returns safe error
- **WHEN** a ZIP upload is invalid or exceeds configured limits
- **THEN** the E2E test verifies a safe validation error response without successful ingestion completion

#### Scenario: Invalid GitHub URL returns safe error
- **WHEN** a submitted repository URL is not a valid GitHub repository URL
- **THEN** the E2E test verifies a safe validation error response

#### Scenario: Inaccessible repository returns safe error
- **WHEN** the clone boundary reports an inaccessible repository
- **THEN** the E2E test verifies a safe repository access error and temporary storage cleanup

#### Scenario: Invalid PAT returns safe error
- **WHEN** a private repository clone uses an invalid PAT
- **THEN** the E2E test verifies a safe authentication/access error that does not echo the PAT

#### Scenario: AI provider failure returns safe error
- **WHEN** documentation generation fails at the AI provider boundary
- **THEN** the E2E test verifies a safe AI failure response, failed job state, and temporary storage cleanup

### Requirement: E2E tests enforce safe logging rules
The system SHALL verify that backend logs are useful for debugging without exposing secrets or sensitive source content.

#### Scenario: Logs redact PAT and source content
- **WHEN** service-layer E2E tests exercise success and failure paths involving PATs or source fixtures
- **THEN** captured logs do not contain plaintext PAT values
- **AND** captured logs do not contain raw sensitive source file contents

#### Scenario: Logs include non-sensitive context
- **WHEN** service-layer E2E tests capture logs for job lifecycle and failures
- **THEN** logs include non-sensitive context such as projectId, job status, and failure category

### Requirement: E2E tests verify UI-facing backend contracts
The system SHALL verify service-layer contracts required by UI flows before UI integration.

#### Scenario: Source input contract is stable
- **WHEN** ZIP or GitHub source intake succeeds or fails
- **THEN** the E2E tests verify response fields needed by UI source input flows

#### Scenario: Status polling contract is stable
- **WHEN** a backend job transitions through lifecycle states
- **THEN** the E2E tests verify queued, uploading, cloning, extracting, scanning, generating, completed, and failed states are representable through the backend contract

#### Scenario: Docs retrieval contract is stable
- **WHEN** generated docs are retrieved
- **THEN** the E2E tests verify multi-page docs and generated sidebar metadata match the UI reader contract

#### Scenario: Regenerate contract is stable
- **WHEN** manual or GitHub Actions regeneration is accepted
- **THEN** the E2E tests verify the response includes projectId, jobId, acceptance metadata, and trigger source where applicable
