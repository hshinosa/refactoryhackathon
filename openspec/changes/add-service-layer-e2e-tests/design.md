## Context

Change `build-codebase-wiki-backend-mvp` implements the backend service layer for Codebase Wiki: auth/project ownership, source intake, temporary ingestion, codebase analysis, AI documentation generation, docs storage/history, semantic search preparation, and regenerate flow. Current tests cover individual services, but they do not prove that these services compose into complete MVP flows.

This change adds E2E testing at the service layer only. It intentionally avoids browser UI automation, real GitHub network access, and real AI/embedding calls. E2E here means exercising production service contracts together with deterministic fakes for external boundaries.

## Goals / Non-Goals

**Goals:**

- Verify the full ZIP source-to-docs pipeline across service boundaries.
- Verify the full GitHub-backed regenerate pipeline across service boundaries.
- Verify backend task 10.x readiness through executable tests for errors, safe logging, and UI-facing contracts.
- Provide reusable test harness utilities for temp projects, fake repositories, fake AI responses, fake embeddings, in-memory stores, and log capture.
- Keep tests deterministic, fast, and runnable with `npm test --workspace=apps/api`.

**Non-Goals:**

- Browser/UI E2E testing.
- Real GitHub clone calls.
- Real OpenAI-compatible API calls.
- Production worker queue or distributed job orchestration.
- Large fixture repositories that slow down CI.

## Decisions

### 1. E2E scope is service-layer integration, not browser E2E

**Decision:** Add Jest-based E2E tests inside `apps/api`, using real service contracts and fake external boundaries.

**Why:** The backend MVP is currently service-layer focused. Browser E2E would test UI routing and rendering, but the current risk is backend composition and contract correctness.

**Alternative considered:** Playwright/browser E2E. Rejected for this change because UI is a separate OpenSpec scope and backend services can be validated faster without a browser.

### 2. Use deterministic fakes for external systems

**Decision:** Replace GitHub clone, AI provider, embeddings, file storage, and log sinks with deterministic fakes/stubs in the E2E harness.

**Why:** E2E tests must be reliable in CI and local development. Real network or AI calls would introduce flakiness, cost, and secrets handling risk.

**Alternative considered:** Real sandbox GitHub/AI calls. Rejected because the MVP does not require external integration smoke tests yet.

### 3. Test harness owns lifecycle and cleanup assertions

**Decision:** The E2E harness creates temporary source directories and asserts cleanup after success/failure.

**Why:** Temporary source storage and cleanup are core backend requirements. The tests should prove lifecycle behavior rather than only mocking it.

### 4. Error and logging assertions are first-class

**Decision:** Failure scenarios must assert public-safe error shapes and captured logs must not include plaintext PAT values or raw sensitive source snippets.

**Why:** This directly supports remaining backend readiness tasks 10.1 and 10.2 and prevents regressions before UI integration.

### 5. UI contract verification is snapshot-like but semantic

**Decision:** E2E tests assert required fields and state transitions for UI-facing contracts, not brittle full-object snapshots.

**Why:** UI needs stable contract guarantees for source input, status polling, docs retrieval, and regenerate flow, while implementation details should remain flexible.

## Test Architecture

### Test harness

Create reusable helpers for:

- `createE2ETempWorkspace()` to build temporary ZIP/GitHub-like source trees.
- `createServiceLayerHarness()` to wire project intake, ingestion, analysis, AI docs generation, storage, semantic search, regenerate, and logging fakes.
- `FakeGitHubCloneAdapter` for public/private/inaccessible repository outcomes.
- `FakeAIProvider` for successful docs generation and AI failure paths.
- `FakeEmbeddingGenerator` for deterministic vector values.
- `MemoryDocumentationStore`, `MemoryDocsHistoryStore`, `MemoryVectorIndexStore`, and log capture utilities when existing stores are insufficient.

### E2E suites

Add focused suites under `apps/api/services/**` or a shared E2E folder:

1. ZIP source-to-docs happy path.
2. GitHub regenerate happy path.
3. Invalid input and external-boundary failures.
4. Safe logging and sensitive data redaction.
5. UI backend contract verification.

## Data Flow Under Test

### ZIP happy path

1. Authenticated user creates project.
2. ZIP intake validates upload size/name.
3. Source ingestion extracts ZIP to temp storage.
4. Codebase analysis scans/excludes/enriches source.
5. AI doc generation produces pages/sidebar.
6. Documentation store persists current docs and history.
7. Semantic search prep indexes generated docs/codebase summary.
8. Retrieval returns UI-ready docs/sidebar/status.
9. Temp source storage is cleaned.

### GitHub regenerate happy path

1. Existing GitHub-backed project is owned by requesting user or accepted GitHub Actions trigger.
2. Stored/provided PAT is resolved only inside the clone boundary.
3. Fake clone adapter produces source in temp storage.
4. Analysis/generation/storage overwrite current docs with history retention.
5. Response returns accepted regenerate contract and job id.
6. Logs do not expose PAT.

### Failure paths

- Invalid ZIP returns a safe validation error.
- Invalid GitHub URL returns a safe validation error.
- Inaccessible repo returns a safe repository access error.
- Invalid PAT returns a safe auth/access error without echoing the PAT.
- AI failure marks job failed or returns safe AI error while cleaning temporary source storage.

## Risks / Trade-offs

- **Harness can become too broad** → Keep helpers small and use explicit scenario setup per test.
- **Tests may duplicate unit tests** → E2E assertions should focus on cross-service behavior and contracts, not internal helper details.
- **Existing service boundaries may need small refactors** → Limit refactors to dependency injection and testability improvements required to compose services.

## Rollout

1. Add E2E test harness and first ZIP happy-path test.
2. Add GitHub regenerate happy-path test.
3. Add failure-path tests for task 10.1.
4. Add safe logging tests for task 10.2.
5. Add UI contract verification tests for task 10.3.
6. Run `npm test --workspace=apps/api`, `npm run typecheck --workspace=apps/api`, and `npm run lint --workspace=apps/api`.
