## Context

The current docs stack has:

- generated docs persisted in Postgres;
- `POST /api/projects/[projectId]/search` returning UI-ready search results;
- right-side Ask Wiki chat panel with persisted sessions/messages;
- browser smoke screenshots captured manually with `agent-browser`;
- Jest tests for API/service behavior.

The missing layer is a repeatable E2E QA scenario that exercises all pieces together and produces screenshots/artifacts. Search Docs also needs a small presentation polish pass so results are scan-friendly.

## Goals / Non-Goals

**Goals:**

- Add a reliable local E2E QA workflow for docs lifecycle validation.
- Cover generated docs page rendering, Search Docs, Ask Wiki answer/citation behavior, and chat history restore.
- Improve Search Docs result readability without changing core retrieval architecture.
- Capture screenshots during QA runs.

**Non-Goals:**

- No external browser service integration.
- No full CI rollout unless existing scripts make it trivial.
- No streaming Ask Wiki responses.
- No redesign of docs sidebar/header beyond Search Docs modal/result polish.

## Design

### 1. E2E QA workflow

Add a browser-based QA scenario that uses the same local app surfaces a user would use:

1. Start from `/auth/sign-in`.
2. Sign in with mock credentials for the seeded/generated project owner.
3. Open the docs reader for the target project.
4. Assert the canonical docs pages are visible in the sidebar.
5. Open Search Docs, query an endpoint term, and verify grouped/highlighted result content.
6. Click a search result and verify navigation to the expected docs page.
7. Ask Wiki “What endpoints does this project expose?”
8. Verify the answer has a short summary, bullet list, inline endpoint formatting, and a subtle `Sources` row.
9. Refresh/reopen docs and verify the latest chat session/history restores.
10. Capture screenshots for the search modal and Ask Wiki panel.

Implementation may use a Playwright-style test if the repo already has or accepts browser test dependencies. If no browser test framework exists, add a small scripted QA command around `agent-browser` only if it can run locally without adding brittle secrets or hidden state.

### 2. Fixture strategy

Prefer an existing generated project fixture when running locally:

- project id: `4dae49de-1f02-44c7-b3ec-7ef162f732d1`;
- owner: `demo@example.com`;
- expected endpoint facts:
  - `GET /v1/models`;
  - `POST /v1/chat/completions`;
  - `GET /health`;
  - `GET /`.

If CI/test isolation is needed later, introduce a deterministic seeded fixture through service-level setup rather than relying on a developer database.

### 3. Search Docs polish

Search result rendering should become scan-first:

- collapse duplicate results for the same `pageSlug`;
- prefer `generated-docs` result titles over raw `vector-index:*` references;
- trim excerpts to roughly 220 characters around the best query match;
- highlight matching query terms with subtle violet text/background;
- render source metadata as a small muted row, not a badge that competes with titles;
- show improved empty state: “No indexed docs matched this query. Try regenerating docs or searching a file/path term.”

### 4. API/view model boundary

Keep search API response backward-compatible by returning `results` as today. If needed, add optional fields only:

```ts
{
  title: string;
  pageSlug?: string;
  excerpt: string;
  source: string;
  relevanceScore: number;
  href: string;
  matchedTerms?: string[];
}
```

UI can compute trimmed excerpts and highlighting client-side to avoid expanding backend scope.

### 5. Verification

Required validation before completing implementation:

- focused Search Docs helper tests;
- existing API tests;
- workspace lint;
- workspace build;
- OpenSpec strict validation;
- browser QA with screenshots for:
  - Search Docs polished result state;
  - Ask Wiki formatted answer/history restore state.

## Risks / Trade-offs

- **Browser QA brittleness**: keep assertions on stable text/roles, not CSS internals.
- **Local database dependency**: document fixture assumptions and prefer service seeding if tests are promoted to CI.
- **Search highlighting overreach**: implement lightweight term highlighting only; do not add a search parser.
