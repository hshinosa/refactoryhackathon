## Context

The Figma audit identified ten full-screen designs and six reusable component frames for the Codebase Wiki web app. The app already uses Next.js App Router and Tailwind CSS in `apps/web`, while backend behavior is being tracked separately in `build-codebase-wiki-backend-mvp`.

The screen inventory is:
- `2:2` Landing Page: already covered by `implement-landing-page`.
- `5:159` Halaman Project Belum Ada: dashboard empty state plus upload method modal; an initial `/dashboard` empty state has already been implemented and must be reconciled with this spec.
- `5:224` Kumpulan Project: project list dashboard.
- `5:319` Sign In and `5:376` Sign Up: auth entry screens.
- `5:438` Loading Generate Project: analysis/generation progress screen.
- `5:564`, `5:680`, `5:796`, `5:948` Dokumentasi variants: generated docs reader variants, with `5:796` as the recommended base and `5:948` as the optional wide Ask Wiki panel variant.
- `5:936`, `5:941`, `5:934`, `5:1139`, `5:1148`, `5:1157`: reusable search/ask/brand/note components.

## Goals / Non-Goals

**Goals:**
- Formalize Figma-ready web app screens in OpenSpec before additional UI implementation.
- Implement authenticated app states in `apps/web` using Next.js App Router and Tailwind CSS.
- Preserve the current backend-first architecture by treating backend behavior as API integration points.
- Reuse shared UI primitives for top navigation, cards, gradient buttons, callouts, documentation side navigation, and loading/progress states.
- Include the dashboard empty state already created under this change's dashboard capability.

**Non-Goals:**
- Implement backend source ingestion, AI generation, PAT encryption, docs history, or semantic search logic.
- Add new UI libraries, icon libraries, animation libraries, or component frameworks.
- Finalize production copy for documentation article content; placeholder docs content can be replaced by generated backend content later.
- Implement the landing page again; it remains owned by `implement-landing-page`.

## Decisions

### 1. Route structure

**Decision:** Use App Router routes for each major screen group:
- `/dashboard` for empty state and project list.
- `/dashboard/generating` or a dashboard state component for analysis progress.
- `/auth/sign-in` and `/auth/sign-up` for auth screens.
- `/docs/[projectId]/[[...slug]]` for generated documentation reading.

**Rationale:** These routes map directly to user journeys and keep UI modules focused. They also avoid overwriting the landing page at `/`, which is already handled by a separate change.

**Alternative considered:** Put all states in `/dashboard` with local conditional rendering only. This was rejected because docs and auth screens are distinct navigation destinations and easier to verify as separate routes.

### 2. Static-first UI with typed mock data

**Decision:** Build Figma screens with local typed view models first, then connect those view models to backend contracts after backend tasks are complete.

**Rationale:** The backend MVP is active and still owns business logic. Static-first UI lets the team demo and validate layout without coupling to incomplete API behavior.

**Alternative considered:** Wait for backend integration before building UI. This was rejected because the Figma screens are ready and useful for demo progress now.

### 3. Shared shell and component primitives

**Decision:** Extract reusable components for app shell, project cards, import method cards, gradient buttons, documentation nav, and callouts.

**Rationale:** The Figma screens share a dark theme, top nav, glass cards, gradient accents, and callout patterns. Reuse keeps visual consistency and avoids duplicating long Tailwind class strings.

**Alternative considered:** Inline each page as exported Figma code. This was rejected because generated Figma code uses absolute positioning and remote localhost asset URLs that are not maintainable production code.

### 4. Documentation reader canonical variant

**Decision:** Use Figma node `5:796` as the base docs reader and treat node `5:948` as a wide desktop extension with an Ask Wiki panel.

**Rationale:** `5:796` has the most complete side navigation structure at standard 1280px width. `5:948` introduces useful chat/search affordances but targets a 1770px canvas and should be responsive/optional.

**Alternative considered:** Implement all four documentation variants as separate pages. This was rejected because `5:564` and `5:680` are earlier placeholder-heavy variants and would create duplicated UX.

### 5. Asset handling

**Decision:** Prefer CSS/SVG/Tailwind recreation or local assets checked into `apps/web/public` over using Figma localhost asset URLs.

**Rationale:** Figma localhost URLs are not production-stable. Critical illustrations can be copied to `apps/web/public` only when needed and when license/source is clear.

**Alternative considered:** Reference `http://localhost:3845/assets/...` directly. This was rejected because it only works while the Figma asset server is running locally.

## Risks / Trade-offs

- **Risk:** Documentation designs contain lorem/placeholder content. → **Mitigation:** Implement layout using typed mock content and clearly isolate content data from presentation.
- **Risk:** Figma absolute positioning may not translate to responsive UI. → **Mitigation:** Rebuild with flex/grid while matching the 1280px desktop layout first.
- **Risk:** Auth screens could imply fully working credentials/social auth. → **Mitigation:** Wire controls to NextAuth integration points only when backend/auth config is available; otherwise preserve visual states and form semantics.
- **Risk:** Dashboard project list may diverge from backend project data shape. → **Mitigation:** Keep a small adapter/view-model layer between API responses and UI components.
- **Risk:** Ask Wiki panel suggests semantic search/chat functionality beyond MVP UI. → **Mitigation:** Treat Ask Wiki as optional disabled/static UI until semantic search prep is implemented.

## Migration Plan

1. Keep existing landing page route unchanged.
2. Reconcile current `apps/web/app/dashboard/page.tsx` with Figma `5:159` and shared UI components.
3. Add static/mock implementations for dashboard states, auth pages, loading state, and docs reader.
4. Verify each route via TypeScript diagnostics, Next build, and browser snapshots on the existing dev server.
5. Replace mock data with backend integration in follow-up tasks as backend endpoints stabilize.

Rollback is straightforward because the change is additive frontend routing/components; remove the new routes/components if needed.

## Open Questions

- Should sign-up footer copy be corrected from “Already have an account? Sign up” to “Already have an account? Sign in” during implementation? Recommended: yes.
- Should the upload method modal be opened from the dashboard empty-state CTA immediately, or remain static until project intake integration is ready? Recommended: open a static modal first.
- Should Ask Wiki appear in MVP as disabled/coming-soon, or stay hidden until semantic search is available? Recommended: hidden or disabled until backend support exists.
