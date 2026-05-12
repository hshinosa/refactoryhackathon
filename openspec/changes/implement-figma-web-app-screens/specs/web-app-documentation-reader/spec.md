## ADDED Requirements

### Requirement: Documentation reader layout
The system SHALL provide a generated documentation reader based on Figma node `5:796` as the canonical desktop layout.

#### Scenario: User opens generated documentation
- **WHEN** a user navigates to a generated documentation page
- **THEN** the page displays a top navigation bar, left documentation side navigation, article canvas, breadcrumbs, article title, body content, featured diagram area, callout block, and previous/next pagination

### Requirement: Documentation navigation
The system SHALL display generated sidebar metadata in a navigable side navigation.

#### Scenario: Sidebar metadata is available
- **WHEN** documentation sidebar items are provided
- **THEN** the side navigation displays top-level groups, nested pages, active item styling, and project/version metadata

### Requirement: Documentation callouts
The system SHALL support information, warning, and alert callouts in documentation content.

#### Scenario: Information callout renders
- **WHEN** documentation content includes an information callout
- **THEN** the reader displays the blue information callout style matching Figma node `5:1139`

#### Scenario: Warning callout renders
- **WHEN** documentation content includes a warning callout
- **THEN** the reader displays the yellow warning callout style matching Figma node `5:1148`

#### Scenario: Alert callout renders
- **WHEN** documentation content includes an alert callout
- **THEN** the reader displays the red alert callout style matching Figma node `5:1157`

### Requirement: Ask Wiki panel affordance
The system SHALL treat the Ask Wiki panel from Figma node `5:948` as an optional wide-screen documentation extension.

#### Scenario: Ask Wiki backend is unavailable
- **WHEN** semantic search or Ask Wiki backend support is unavailable
- **THEN** the UI hides or disables Ask Wiki interactions while preserving the base documentation reader

#### Scenario: Wide viewport supports Ask Wiki
- **WHEN** the Ask Wiki feature is enabled and the viewport can support the wide layout
- **THEN** the reader may display a right-side Ask Wiki panel without breaking the base article and side navigation layout

### Requirement: Placeholder content isolation
The system SHALL isolate documentation content data from documentation layout components.

#### Scenario: Backend documentation content is not connected
- **WHEN** implementing the reader before backend data is connected
- **THEN** mock article content MUST be defined as replaceable typed data and MUST NOT be hard-coded throughout layout markup
