## Why

Backend MVP `build-codebase-wiki-backend-mvp` sudah memiliki unit-level coverage per service, tetapi belum ada end-to-end service-layer testing yang membuktikan seluruh flow berjalan sebagai satu pipeline. Sebelum menyelesaikan task 10.x dan menghubungkan UI, kita perlu contract-level confidence bahwa source intake, ingestion, analysis, AI docs generation, storage, semantic index, regenerate, error handling, dan safe logging bekerja bersama tanpa memanggil browser UI, real GitHub, atau real AI provider.

## What Changes

- Menambahkan service-layer E2E test suite untuk backend MVP di `apps/api`.
- Menguji happy path ZIP project: create project → ingest source → analyze codebase → generate docs → persist current docs/history → build semantic index → retrieve docs/chat context.
- Menguji happy path GitHub regenerate: existing project → regenerate trigger → clone adapter stub → analysis/generation/storage update.
- Menguji failure paths yang sesuai task 10.x: invalid ZIP, invalid GitHub URL, inaccessible repo, invalid PAT, AI failure, dan cleanup/logging behavior.
- Menambahkan test harness/factories/stubs untuk filesystem temp storage, GitHub clone adapter, AI provider, embedding provider, PAT store, documentation store, dan job lifecycle.
- Memastikan E2E assertions tidak mengekspos plaintext PAT atau raw sensitive source data di logs/errors.

## Capabilities

### New Capabilities

- `service-layer-e2e-testing`: test harness dan E2E scenarios untuk seluruh service layer backend MVP.

### Modified Capabilities

- None. Existing backend behavior tetap sama; change ini menambah coverage dan contract verification.

## Impact

- Affected code: `apps/api/services/**`, terutama test files dan shared test harness under `apps/api/services/**/__tests__` atau `apps/api/test-utils`.
- Affected specs: backend readiness/task 10.x akan mendapat executable verification dari E2E suite ini.
- Dependencies: Jest/ts-jest yang sudah ada; tidak menambah Playwright/browser dependency.
- Systems: GitHub, AI provider, embeddings, dan storage diganti dengan deterministic fakes/stubs di test.
