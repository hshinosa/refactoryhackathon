## 1. Source evidence foundation

- [x] 1.1 Extend `RawScanResult` in `apps/api/types/index.ts` with bounded source evidence fields.
- [x] 1.2 Update `apps/api/services/codebase-analysis/folder-scanner/index.ts` to collect selected source excerpts while preserving existing excludes.
- [x] 1.3 Add file selection heuristics for config, routes/controllers, services, auth/security, models/schemas, entrypoints, and core UI files.
- [x] 1.4 Add size, count, binary-file, generated-file, and total excerpt limits.
- [x] 1.5 Add secret/token/key redaction before source evidence is stored in scan results or passed downstream.

## 2. Agentic analysis enrichment

- [x] 2.1 Update `apps/api/services/codebase-analysis/enrichment-boundary.ts` prompts to consume source evidence in addition to metadata.
- [x] 2.2 Return structured evidence for Overview, Architecture, API Reference, Security, feature pages, and citations.
- [x] 2.3 Preserve fallback behavior when enrichment fails by producing conservative evidence from deterministic scan data.
- [x] 2.4 Ensure enrichment logs summarize counts/status only and never log raw excerpts or secrets.

## 3. Documentation generation prompts

- [x] 3.1 Update `apps/api/services/codebase-analysis/context-builder/index.ts` so downstream context includes source-grounded evidence, not compact metadata only.
- [x] 3.2 Update `apps/api/services/ai-doc-generation/prompt-builder.ts` to require fully populated Overview, Architecture, API Reference, and Security pages.
- [x] 3.3 Remove or relax prompt constraints that cap required documentation quality, including concise-first wording and low page limits that prevent the four required pages plus feature pages.
- [x] 3.4 Require file references and explicit evidence grounding for claims, API descriptions, architecture flows, and security findings.
- [x] 3.5 Preserve the existing generated sidebar order with feature docs under the `Features` submenu.

## 4. Generated docs reader UI

- [x] 4.1 Persist selected generated source files with docs output for reader-side preview.
- [x] 4.2 Replace the generic workflow preview on generated docs pages with source-code file tabs.
- [x] 4.3 Render markdown structure as rich blocks, including lists, tables, code blocks, and inline code.
- [x] 4.4 Add generated docs summary cards and a source evidence table.
- [x] 4.5 Keep Mermaid/PlantUML generation and rendering out of scope for this change.
- [x] 4.6 Polish docs navigation: remove redundant heading, add page-specific icons, separate feature pages, make `Features` collapsible, and center header actions.

## 5. Tests and verification

- [x] 5.1 Add unit tests for source evidence collection, limits, excludes, truncation, and redaction.
- [x] 5.2 Add unit tests for source-grounded enrichment and enrichment fallback.
- [x] 5.3 Add prompt builder tests proving all four required pages are requested as fully populated source-grounded docs.
- [x] 5.4 Add integration/fixture coverage that verifies generated Overview, Architecture, API Reference, and Security pages are non-empty, high-signal, and cite scanned files.
- [x] 5.5 Run focused API tests for codebase analysis and AI documentation generation.
- [x] 5.6 Run full project validators required by the repo before completing implementation.
- [x] 5.7 Run OpenSpec validation for `improve-agentic-doc-generation`.
- [x] 5.8 Smoke test regenerated `sixth-proxy` docs and capture screenshots.
