## 1. Backend foundation

- [x] 1.1 Set up backend module structure in `apps/api` for controllers, services, ingestion, analyzer, AI, storage, and integrations
- [x] 1.2 Add backend dependencies for auth, ZIP handling, git clone flow, encryption, markdown generation, and embeddings/vector indexing
- [x] 1.3 Define backend configuration for OpenAI-compatible API, GitHub clone flow, ZIP limit, temporary storage path, and cleanup TTL

## 2. Auth and project ownership

- [x] 2.1 Implement NextAuth/Auth.js backend session integration
- [x] 2.2 Implement project creation backend flow with per-user ownership metadata
- [x] 2.3 Enforce authenticated access for protected backend endpoints

## 3. Source input and private repository access

- [x] 3.1 Implement ZIP upload intake with 50MB validation
- [x] 3.2 Implement GitHub repository URL intake flow
- [x] 3.3 Implement encrypted PAT storage per user with revoke/delete support
- [x] 3.4 Implement private repository clone flow using stored or provided PAT

## 4. Temporary source storage and ingestion lifecycle

- [x] 4.1 Implement temporary source storage under ephemeral `/tmp`-style storage
- [x] 4.2 Implement ZIP extraction into temporary source storage
- [x] 4.3 Implement source cleanup after success/failure with fallback TTL 30 minutes
- [x] 4.4 Implement job lifecycle state tracking for queued, uploading, cloning, extracting, scanning, generating, completed, and failed

## 5. Codebase analysis pipeline

- [x] 5.1 Implement deterministic scanner for file tree traversal, config detection, and dependency extraction
- [x] 5.2 Implement exclude filter for standard non-essential folders and artifacts
- [x] 5.3 Implement OpenAI-compatible agent enrichment spawner with structured prompt ([CONTEXT] + [GOAL] + [DOWNSTREAM] + [REQUEST]) and parsed JSON response validation
- [x] 5.4 Implement agent enrichment fallback strategy for tech stack inference and important file prioritization
- [x] 5.5 Implement compact context builder for AI generation (max 2000 tokens)

## 6. AI documentation generation

- [x] 6.1 Implement OpenAI-compatible AI provider client
- [x] 6.2 Implement prompt builder for codebase documentation generation
- [x] 6.3 Implement Markdown formatter and page splitter for multi-page docs
- [x] 6.4 Implement generated sidebar metadata creation
- [x] 6.5 Implement current docs overwrite with docs history retention

## 7. Storage and retrieval

- [x] 7.1 Implement documentation store for current docs, metadata, and status
- [x] 7.2 Implement docs history storage strategy
- [x] 7.3 Implement backend retrieval contract for multi-page docs and generated sidebar

## 8. Semantic search preparation

- [x] 8.1 Implement embedding generation from generated docs and codebase summary
- [x] 8.2 Implement vector index storage/update flow
- [x] 8.3 Implement retrieval contract for future AI chat grounded on docs and vector search

## 9. Automation and regenerate flow

- [x] 9.1 Implement backend regenerate-docs endpoint for an existing project
- [x] 9.2 Implement authorization and ownership checks for regenerate requests
- [x] 9.3 Implement GitHub Actions-compatible workflow trigger contract for regenerate docs

## 10. Error handling and backend readiness

 - [x] 10.1 Implement backend error responses for invalid ZIP, invalid GitHub URL, inaccessible repo, invalid PAT, and AI failures
 - [x] 10.2 Add backend logging rules that avoid exposing PAT or raw sensitive source data
 - [x] 10.3 Verify backend contracts required by the UI for source input, status polling, docs retrieval, and regenerate flow
