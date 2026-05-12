## 1. Shared UI Foundation

- [x] 1.1 Define shared color, typography, spacing, and gradient constants or class helpers for the dark web app screens.
- [x] 1.2 Create reusable gradient button components for primary CTA, search docs, and Ask Wiki actions.
- [x] 1.3 Create shared top navigation/app shell components for authenticated app screens.
- [x] 1.4 Create reusable glass card components for project cards and import method cards.
- [x] 1.5 Create documentation callout component variants for information, warning, and alert notes.

## 2. Dashboard States

- [x] 2.1 Reconcile existing `apps/web/app/dashboard/page.tsx` with Figma node `5:159` and shared components.
- [x] 2.2 Add upload method modal/panel with GitHub Actions, Git URL, and ZIP File options.
- [x] 2.3 Add typed dashboard mock data and view models for no-project and project-list states.
- [x] 2.4 Implement project list state matching Figma node `5:224` with search input, project cards, and add-new-project card.
- [x] 2.5 Implement project generation loading screen matching Figma node `5:438` with progress ring, stage list, and terminal logs.

## 3. Auth Pages

- [x] 3.1 Implement sign-in route matching Figma node `5:319` with semantic form controls and social auth buttons.
- [x] 3.2 Implement sign-up route matching Figma node `5:376` with corrected existing-account copy linking to sign in.
- [x] 3.3 Connect auth buttons/forms to NextAuth/Auth.js integration points when available, otherwise keep safe placeholder handlers.
- [x] 3.4 Verify keyboard focus order and accessible names for sign-in and sign-up controls.

## 4. Documentation Reader

- [x] 4.1 Implement documentation reader layout using Figma node `5:796` as the canonical base.
- [x] 4.2 Build generated sidebar navigation with project/version header, top-level nav, nested pages, and active state styling.
- [x] 4.3 Build article canvas with breadcrumbs, title, body content, featured diagram area, callouts, and previous/next pagination.
- [x] 4.4 Isolate documentation content and sidebar data into typed mock fixtures that can be replaced by backend output.
- [x] 4.5 Add optional wide-screen Ask Wiki affordance from Figma node `5:948` as hidden/disabled until backend support exists.

## 5. Asset and Integration Hygiene

- [x] 5.1 Replace any Figma localhost asset URLs with CSS/SVG recreation or stable assets under `apps/web/public`.
- [x] 5.2 Keep landing page ownership separate from this change and avoid reimplementing `implement-landing-page` scope.
- [x] 5.3 Keep backend behavior out of this UI change; use adapters/view models for future backend integration.

## 6. Verification

- [x] 6.1 Run LSP diagnostics on all changed web files.
- [x] 6.2 Run `npm run build --workspace=apps/web` and resolve errors introduced by this change.
- [x] 6.3 Verify dashboard, auth, loading, and docs routes in the existing dev server with browser snapshots.
- [x] 6.4 Run `openspec validate implement-figma-web-app-screens --strict` before marking implementation complete.
