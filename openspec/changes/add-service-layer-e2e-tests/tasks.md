## 1. E2E test harness

- [x] 1.1 Add shared service-layer E2E harness for wiring backend services with deterministic fakes
- [x] 1.2 Add temp workspace utilities for ZIP-like and GitHub-like source fixtures with cleanup assertions
- [x] 1.3 Add fake adapters for GitHub clone, AI docs generation, embeddings, documentation stores, vector index, and log capture where needed

## 2. ZIP source-to-docs E2E coverage

- [x] 2.1 Test authenticated project creation and ZIP source intake through ingestion job setup
- [x] 2.2 Test ZIP extraction into temporary storage and deterministic cleanup after successful pipeline completion
- [x] 2.3 Test full ZIP pipeline: ingestion → codebase analysis → AI docs generation → current docs/history persistence
- [x] 2.4 Test semantic index creation from generated docs and codebase summary
- [x] 2.5 Test docs retrieval returns UI-ready pages, sidebar, generatedAt, version, and projectId

## 3. GitHub regenerate E2E coverage

- [x] 3.1 Test manual regenerate for an owned GitHub-backed project through clone, analysis, generation, and docs overwrite
- [x] 3.2 Test GitHub Actions trigger path accepts valid workflow metadata and queues regeneration
- [x] 3.3 Test private repository regenerate uses stored/provided PAT only inside the clone boundary
- [x] 3.4 Test docs history retains previous docs when regenerate overwrites current docs

## 4. Failure-path coverage for backend readiness

- [x] 4.1 Test invalid ZIP returns safe backend error response and does not create a successful ingestion job
- [x] 4.2 Test invalid GitHub URL returns safe backend error response
- [x] 4.3 Test inaccessible repository returns safe backend error response and cleans temporary storage
- [x] 4.4 Test invalid PAT returns safe backend error response without echoing the PAT
- [x] 4.5 Test AI provider failure returns safe backend error response, marks job failed, and cleans temporary storage

## 5. Safe logging coverage

- [x] 5.1 Add log capture utility for service-layer E2E tests
- [x] 5.2 Assert logs never include plaintext PAT values
- [x] 5.3 Assert logs never include raw sensitive source file contents from fixtures
- [x] 5.4 Assert logs include useful non-sensitive context such as projectId, job status, and failure category

## 6. UI contract verification

- [x] 6.1 Verify source input contract for ZIP and GitHub intake responses
- [x] 6.2 Verify status polling contract covers queued, uploading, cloning, extracting, scanning, generating, completed, and failed states
- [x] 6.3 Verify docs retrieval contract returns multi-page docs and generated sidebar metadata
- [x] 6.4 Verify regenerate contract returns accepted response with projectId, jobId, requestedAt/queued metadata, and trigger source where applicable

## 7. Validation

- [x] 7.1 Run `npm test --workspace=apps/api`
- [x] 7.2 Run `npm run typecheck --workspace=apps/api`
- [x] 7.3 Run `npm run lint --workspace=apps/api`
- [x] 7.4 Run `npx openspec validate add-service-layer-e2e-tests --strict`
