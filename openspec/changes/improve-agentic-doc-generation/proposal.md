## Why

Generated Codebase Wiki pages are currently constrained by a compact metadata-only analysis context and prompt instructions that intentionally favor concise output. `apps/api/services/codebase-analysis/context-builder/index.ts` reduces the codebase to file paths, folders, dependencies, and short implementation hints; `apps/api/types/index.ts` defines `RawScanResult` without source excerpts or symbol-level evidence; and `apps/api/services/ai-doc-generation/prompt-builder.ts` caps generated pages and asks for concise high-signal pages. That is useful for MVP cost control, but it prevents the four required docs pages from being fully populated with high-quality, source-grounded information.

The product now needs agentic source-grounded documentation generation so Overview, Architecture, API Reference, and Security become complete wiki pages backed by concrete scanned source files, dependency/config evidence, and code-level references without inventing unsupported behavior.

## What Changes

- Extend deterministic codebase analysis to collect bounded source evidence from relevant files instead of metadata only.
- Enrich the analysis context with source-grounded summaries, route/API detection, architecture signals, security-relevant findings, and file citations.
- Replace the compact-only generation input with a documentation evidence bundle that the AI docs generator can use for deeper pages.
- Update the AI documentation prompt so the four required pages are fully populated and explicitly grounded in scanned files and excerpts.
- Persist selected source files with generated docs so the docs reader can show code-file preview tabs for each page.
- Upgrade the generated docs reader from paragraph-only rendering to rich source-grounded documentation blocks: lists, tables, code blocks, summary cards, and source evidence tables.
- Preserve AI context minimization by applying allowlists, file-size limits, excerpt limits, secret redaction, and source-exclude rules before sending evidence to the AI provider.
- Keep generated feature pages under the existing `Features` sidebar submenu after the four canonical docs pages.
- Do not generate or render Mermaid/PlantUML diagrams in this change; architecture pages should remain text/table/code evidence based until a better diagram UX is designed.

## Impact

- Affected code: `apps/api/types/index.ts`, `apps/api/services/codebase-analysis/folder-scanner/index.ts`, `apps/api/services/codebase-analysis/context-builder/index.ts`, `apps/api/services/codebase-analysis/enrichment-boundary.ts`, `apps/api/services/ai-doc-generation/prompt-builder.ts`, `apps/api/services/ai-doc-generation`, `apps/api/services/postgres/index.ts`, `apps/web/components/docs/DocsReader.tsx`, `apps/web/components/docs/SourceCodeTabs.tsx`, `apps/web/components/docs/docsViewModel.ts`, and related API/web tests.
- Output: Overview, Architecture, API Reference, and Security pages become longer, evidence-backed, and consistently populated.
- UI: generated docs pages show relevant source-code tabs, summary cards, source evidence tables, and markdown structure instead of a generic workflow illustration or plain paragraphs.
- Security: source excerpts are bounded, redacted, filtered by existing excludes, and never include PATs or detected secrets in prompts or logs.
- MVP scope: improve generation quality and generated docs readability; do not add chat, persistent raw repository storage, Mermaid/PlantUML rendering, or new navigation surfaces.
