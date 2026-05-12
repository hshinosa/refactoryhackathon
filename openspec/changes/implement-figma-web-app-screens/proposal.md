## Why

The product now has Figma-ready designs for the authenticated web app flow, but the implementation source of truth only covers the landing page and backend MVP. Capturing the Figma screens in OpenSpec prevents ad-hoc UI work and ensures the dashboard empty state already implemented is aligned with the rest of the web app experience.

## What Changes

- Add a frontend OpenSpec change for Figma-derived web app screens in `apps/web`.
- Include the already-created dashboard empty state route as part of the formal dashboard capability.
- Define implementation scope for:
  - dashboard empty state and upload method modal
  - project list/dashboard with project cards and add-project card
  - project generation loading state
  - sign-in and sign-up pages
  - generated documentation reader screens
  - reusable buttons, cards, top navigation, side navigation, and documentation callouts
- Keep implementation frontend-only unless an existing backend route/contract is already available from `build-codebase-wiki-backend-mvp`.
- Treat actual auth, project creation, ingestion, generation, and docs data as integration points with the backend MVP rather than reimplementing backend behavior in this change.

## Capabilities

### New Capabilities

- `web-app-dashboard`: Authenticated dashboard states for no-project, project list, upload method selection, and generation progress.
- `web-app-auth-pages`: Sign-in and sign-up pages matching Figma designs and NextAuth integration points.
- `web-app-documentation-reader`: Generated documentation reading interface with side navigation, article content, callouts, pagination, search affordance, and optional Ask Wiki panel.
- `web-ui-components`: Reusable Figma-derived UI primitives used by the web app screens.

### Modified Capabilities

- None. Existing active specs are backend-focused and no archived frontend specs exist yet.

## Impact

- Affected code: `apps/web/app/**`, `apps/web/components/**`, and web-only support files for UI state/data mocks.
- Affected APIs: None required for the static-first UI pass; future integration should consume backend MVP contracts for auth/session, project intake, analysis status, and documentation retrieval.
- Dependencies: No new dependencies expected; use existing Next.js, React, and Tailwind CSS.
- Systems: Frontend only. Backend, storage, AI generation, source ingestion, semantic search, and GitHub Actions remain governed by backend OpenSpec changes.
