## Why

The docs generation, Search Docs, and Ask Wiki flows are now functional, but the product lacks a repeatable end-to-end QA path that proves the whole lifecycle works together. The current validation is mostly unit/build/browser-smoke based, so regressions can still slip through across project regeneration, generated docs rendering, search, Ask Wiki answer generation, citations, and history restore.

Search Docs also works, but its result UI is still raw: excerpts can be too long, source metadata is visually noisy, and users cannot quickly scan why a result matched. A small polish pass will make search feel consistent with the refined Ask Wiki panel.

## What Changes

- Add an end-to-end QA flow for the complete generated docs lifecycle:
  - authenticate with mock credentials;
  - create or reuse a project fixture;
  - verify docs reader loads generated pages;
  - run Search Docs and click a result;
  - ask Ask Wiki a grounded question;
  - verify answer formatting, citations, and chat history restore.
- Add a repeatable browser-driven QA script or test harness suitable for local validation and future CI adoption.
- Polish Search Docs results:
  - shorter excerpts;
  - query term highlighting;
  - grouped or de-duplicated results by docs page;
  - subtle source metadata;
  - clearer empty/loading/error states.
- Keep Search Docs project-scoped and owner-only.
- Capture screenshots as QA artifacts during browser validation.

## Impact

- Affected code: docs reader UI components, Search Docs result view model/helpers, API search response shaping if needed, and QA/e2e test files.
- UX: Search Docs becomes easier to scan and less noisy.
- Quality: full docs lifecycle has a documented repeatable validation path.
- Non-goal: no new Ask Wiki backend feature work unless required to stabilize QA assertions.
