## ADDED Requirements

### Requirement: Shared dark app shell
The system SHALL provide shared UI primitives for the dark Codebase Wiki web app shell.

#### Scenario: App screen uses shared shell
- **WHEN** a dashboard, auth, loading, or documentation screen renders
- **THEN** it uses consistent dark backgrounds, top navigation typography, border colors, and purple/indigo accent styling

### Requirement: Gradient action buttons
The system SHALL provide reusable gradient action button styles matching Figma CTAs and component nodes `5:936` and `5:941`.

#### Scenario: Primary action button renders
- **WHEN** a primary action is displayed
- **THEN** it uses the shared gradient, radius, text styling, focus state, and hover affordance instead of duplicating page-specific styles

#### Scenario: Search or Ask Wiki button renders
- **WHEN** search docs or Ask Wiki affordances render
- **THEN** they use shared icon+label button structure with accessible names

### Requirement: Project and import cards
The system SHALL provide reusable card components for dashboard project cards and upload/import method cards.

#### Scenario: Project card renders
- **WHEN** project data is supplied
- **THEN** the card component displays status, icon, title, description, tags, timestamp, and action slot consistently

#### Scenario: Import method card renders
- **WHEN** an import method is supplied
- **THEN** the card component displays icon, method name, description, and import/upload action consistently

### Requirement: Documentation callout component
The system SHALL provide a reusable documentation callout component with information, warning, and alert variants.

#### Scenario: Callout variant is selected
- **WHEN** a callout variant is provided
- **THEN** the component applies the matching color, icon, heading, border, and body text style from the Figma component frames

### Requirement: Production-safe asset usage
The system SHALL avoid depending on Figma localhost asset URLs in production code.

#### Scenario: Figma asset is needed
- **WHEN** an icon or image from Figma is required for implementation
- **THEN** it is recreated with CSS/SVG or copied into a stable local asset path under `apps/web/public`
