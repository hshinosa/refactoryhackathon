## 1. Search Docs polish

- [x] 1.1 Add a small Search Docs view-model/helper for query tokenization, excerpt trimming, result de-duplication, and highlight spans.
- [x] 1.2 Add failing tests for excerpt trimming around matched terms.
- [x] 1.3 Add failing tests for de-duplicating repeated `pageSlug` results.
- [x] 1.4 Implement the Search Docs helper until tests pass.
- [x] 1.5 Update `DocsReader.tsx` Search Docs modal to use trimmed highlighted excerpts.
- [x] 1.6 Make result source metadata subtle and reduce badge prominence.
- [x] 1.7 Improve Search Docs empty/loading/error copy.

## 2. E2E QA workflow

- [x] 2.1 Choose the least brittle local browser QA approach from existing repo tooling.
- [x] 2.2 Add a QA script or test for mock auth and docs page load.
- [x] 2.3 Extend QA to open Search Docs, query endpoint terms, and verify highlighted result text.
- [x] 2.4 Extend QA to click a search result and verify docs navigation.
- [x] 2.5 Extend QA to ask “What endpoints does this project expose?” in Ask Wiki.
- [x] 2.6 Verify Ask Wiki answer includes bullet-form endpoint facts and a subtle `Sources` row.
- [x] 2.7 Verify chat history restores after refresh/reopen.
- [x] 2.8 Save screenshots for Search Docs and Ask Wiki QA states.

## 3. Validation

- [x] 3.1 Run focused Search Docs helper tests.
- [x] 3.2 Run existing API/service tests.
- [x] 3.3 Run workspace lint.
- [x] 3.4 Run workspace build.
- [x] 3.5 Run OpenSpec validation for `add-docs-e2e-qa-and-search-polish`.
- [x] 3.6 Run browser QA and confirm screenshots were produced.
