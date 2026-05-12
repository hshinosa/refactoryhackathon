---
name: openspec-coding-workflow
description: Project-specific coding workflow for this repository. Use when implementing any change so work stays aligned with OpenSpec, ADR, C4, and PRD.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: project
  version: "1.0"
---

Use this skill whenever you are about to implement code in this repository.

## Core rules

1. OpenSpec change artifacts are the primary implementation source of truth.
2. Do not implement from PRD alone when an OpenSpec change exists.
3. Read ADR and C4 before coding if the task touches architecture, storage, auth, ingestion, AI, or integration boundaries.
4. Keep OpenSpec task checkboxes synchronized with actual progress.
5. Respect the active scope: do not expand implementation beyond the change.

## Required read order before coding

For an active change, read in this order:

1. `openspec/changes/<active-change>/proposal.md`
2. `openspec/changes/<active-change>/design.md`
3. `openspec/changes/<active-change>/specs/**/*.md`
4. `openspec/changes/<active-change>/tasks.md`
5. `docs/architecture/decisions/*.md`
6. `docs/architecture/c4/*.md`
7. `docs/prd/prd.md`

## Project-specific backend-first guidance

The current main backend change is `build-codebase-wiki-backend-mvp`.

When working on it:

- Prioritize `apps/api`.
- Touch `apps/web` only for minimal API contract integration if explicitly needed.
- Focus on:
  - auth/session
  - create project
  - ZIP/GitHub URL + PAT intake
  - temporary source storage + cleanup
  - analyzer
  - AI docs generation
  - docs history + generated sidebar metadata
  - semantic search prep
  - regenerate endpoint / GitHub Actions contract

## Implementation behavior

- Work only on the current unchecked OpenSpec task(s).
- If a new idea appears, stop and record it as follow-up scope.
- Do not silently add UI scope to a backend-first change.
- Do not mark a task complete until the OpenSpec checkbox is checked.

## Verification behavior

Before reporting completion:

- verify changed files
- run relevant diagnostics/tests/build checks
- ensure code still matches ADR/C4/PRD/OpenSpec decisions
- ensure local artifacts are not left behind

## Git behavior

- Commit only when the user asks.
- Keep commits atomic.
- Do not push unless explicitly requested.
- Ignore local artifacts such as `.sisyphus/` and `.DS_Store`.
