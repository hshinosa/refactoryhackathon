## Context

The existing backend MVP already follows the pipeline:

1. source ingestion from ZIP/GitHub into temporary storage,
2. deterministic scan,
3. agent enrichment,
4. AI documentation generation,
5. docs persistence and sidebar generation.

The current analyzer intentionally emits compact context. `CompactContextBuilder` in `apps/api/services/codebase-analysis/context-builder/index.ts` builds a short text payload from file counts, folder names, dependencies, file paths, and important file names. `RawScanResult` in `apps/api/types/index.ts` has no source excerpt field. `CodebaseDocPromptBuilderStub` in `apps/api/services/ai-doc-generation/prompt-builder.ts` defaults to `maxPages = 6`, limits suggested sections to that count, and instructs concise output. This prevents complete docs pages even when the repository contains enough useful source information.

This change keeps the backend-first architecture and adds a bounded evidence layer between scan/enrichment and documentation generation.

## Goals / Non-Goals

**Goals:**

- Generate fully populated Overview, Architecture, API Reference, and Security pages.
- Ground every important claim in scanned source evidence, config files, dependencies, or detected routes/modules.
- Include concrete file references in generated docs where useful.
- Persist selected source files alongside generated docs so the reader can show code-file tabs scoped to the active page.
- Render generated markdown as structured documentation, including lists, tables, code blocks, inline code, source evidence tables, and summary cards.
- Detect API surfaces from common backend/frontend patterns and include them in API Reference.
- Detect security-relevant implementation details such as auth/session use, PAT handling, encryption helpers, input validation, source cleanup, redaction, and risky gaps.
- Maintain context minimization and avoid sending entire repositories to the AI provider.

**Non-Goals:**

- No persistent storage of raw uploaded/cloned source beyond the existing temporary source lifecycle.
- No UI redesign.
- No Mermaid or PlantUML rendering in this change.
- No semantic chat implementation.
- No production distributed worker rewrite.
- No guarantee of perfect static analysis for every language; the MVP should use best-effort multi-language heuristics with safe fallback.

## Design

### 1. Source evidence collection

Add a bounded evidence collection step to deterministic analysis. The scanner should keep existing metadata and additionally collect source excerpts for selected files.

Selection rules:

- Always respect existing excluded paths such as `node_modules`, `.git`, `.next`, `dist`, `build`, and `coverage`.
- Include likely documentation-critical files:
  - package/config files already detected by `configFiles`
  - API route/controller files
  - service/domain files
  - auth/security/encryption/session files
  - app entrypoints and routing files
  - schema/model/config files
- Limit by file count, file size, total excerpt bytes, and per-file lines.
- Skip binary files, generated lock artifacts when not useful, build outputs, images, archives, and files that exceed safe size thresholds.

`RawScanResult` should gain a source evidence shape similar to:

```ts
sourceFiles?: Array<{
  path: string;
  language: string;
  role: 'api' | 'service' | 'auth' | 'config' | 'model' | 'ui' | 'test' | 'other';
  excerpt: string;
  truncated: boolean;
  evidenceTags: string[];
}>;
```

The exact field names can follow existing TypeScript style, but the data must provide enough source-grounding for downstream agents.

### 2. Secret redaction and context minimization

Before any excerpt reaches enrichment or documentation prompts:

- redact likely secrets, tokens, private keys, bearer values, PATs, and `.env`-style values;
- do not log raw source excerpts;
- apply the same temporary storage cleanup policy already used by ingestion;
- expose only selected excerpts and summaries, not full raw source trees.

This aligns with the current C4/ADR direction: temporary source storage remains ephemeral, PATs stay encrypted per user, and AI context is minimized.

### 3. Agentic enrichment from evidence

Update `apps/api/services/codebase-analysis/enrichment-boundary.ts` so enrichment uses both metadata and source evidence. The enrichment result should include structured sections for documentation generation:

- project purpose and capabilities,
- architecture components and data flow,
- detected API endpoints/routes/functions,
- security posture and sensitive flows,
- important files with rationale,
- citation map from claims to file paths.

Fallback behavior remains mandatory: if agent enrichment fails, deterministic source evidence and metadata still feed the doc generator with conservative summaries.

### 4. Evidence bundle for doc generation

Replace the current compact-only downstream context with a documentation evidence bundle. `CompactContextBuilder` may remain for summary fields, but the doc generation input should include structured evidence for the four required pages:

- `overviewEvidence`
- `architectureEvidence`
- `apiEvidence`
- `securityEvidence`
- `featureEvidence`
- `citations`

The bundle should be serialized into a prompt-friendly format and bounded by token limits. If evidence is too large, prefer summaries and representative excerpts from the highest-priority files.

### 5. Prompt changes for complete required docs

Update `apps/api/services/ai-doc-generation/prompt-builder.ts` so the AI provider is instructed to fully populate these top-level pages:

1. Overview
2. Architecture
3. API Reference
4. Security

The prompt should no longer make brevity the primary objective for those pages. It should require:

- multiple useful sections per required page,
- concrete file references,
- grounded API details only when supported by detected routes/functions,
- explicit security findings and known gaps based on source evidence,
- no invented endpoints, credentials, files, or behavior.

Feature pages should remain after the four canonical pages and continue to render under the existing `Features` submenu.

### 6. Output contract

Generated docs continue to use the current persisted multi-page Markdown and generated sidebar contract. The docs payload may additionally include selected `sourceFiles` derived from bounded source evidence:

```ts
sourceFiles?: Array<{
  path: string;
  language: string;
  content: string;
}>;
```

These source files are generated artifacts, not long-lived raw repository storage. They use already-redacted bounded excerpts and are intended only for docs reader preview tabs.

The sidebar order remains:

1. Overview
2. Architecture
3. API Reference
4. Security
5. Features

The four canonical pages must be populated even for smaller projects. If evidence is limited, pages should clearly state what was detected and what was not found, rather than inventing missing details.

### 7. Generated docs reader presentation

Generated docs pages should not render as a generic workflow diagram or a single paragraph blob. The reader should:

- choose source-code preview tabs from files cited by the active page, falling back to the highest-priority source files;
- render markdown lists as lists, markdown tables as styled tables, fenced non-Mermaid code as code blocks, and inline backtick spans as inline code;
- show summary cards for source file count, section count, and current code preview language/path;
- show a source evidence table with file path, language, and inferred purpose;
- remove the redundant "Generated Docs" sidebar heading, use title-specific icons for canonical pages and feature items, visually separate feature pages from canonical pages, and make the `Features` group collapsible/expandable with a right-side chevron;
- keep header actions visually centered by placing search and Ask Wiki in the center grid area rather than pushing them to the far right;
- ignore Mermaid code fences if they appear in generated content, because Mermaid/PlantUML UX was explicitly removed from this change.

## Risks / Trade-offs

- **More AI context can increase cost and latency** → enforce source selection, excerpt caps, and token budgeting before generation.
- **Source excerpts can contain secrets** → redact before prompts, skip env files by default, and never log excerpts.
- **Heuristics may miss APIs in some frameworks** → use best-effort detection and allow the AI enrichment step to summarize supported evidence only.
- **Longer docs may become noisy** → require source-grounded sections and file citations instead of filler.

## Verification Plan

- Unit test source evidence collection limits, excludes, binary skipping, truncation, and secret redaction.
- Unit test enrichment fallback still produces doc-generation evidence when the agent fails.
- Unit test prompt builder requires fully populated Overview, Architecture, API Reference, and Security pages without low page caps blocking them.
- Unit test generated docs reader model parsing for lists, tables, code blocks, inline code, source preview file selection, and Mermaid exclusion.
- Integration test docs generation from a representative fixture repository and assert all four required pages contain meaningful source-grounded sections and file references.
- Smoke test regenerated `sixth-proxy` docs in the browser and capture screenshots for all generated pages.
- Verify no PATs, secrets, or raw source excerpts are written to logs.
- Run OpenSpec validation for this change.
