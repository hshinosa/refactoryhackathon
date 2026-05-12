## ADDED Requirements

### Requirement: Dashboard empty state
The system SHALL provide a dashboard empty state matching Figma node `5:159` when the authenticated user has no projects.

#### Scenario: No projects are available
- **WHEN** an authenticated user opens the dashboard and has no projects
- **THEN** the dashboard displays the Codebase Wiki top navigation, dark background, "Not Project Found" message, and "Upload Project" call to action

#### Scenario: Existing dashboard route remains available
- **WHEN** a user navigates to `/dashboard`
- **THEN** the dashboard empty state route renders without replacing the landing page at `/`

### Requirement: Upload method selection
The system SHALL provide an upload method selection modal or panel based on Figma node `5:159` Popup Upload.

#### Scenario: User starts upload from empty state
- **WHEN** the user activates "Upload Project" from the dashboard empty state
- **THEN** the system presents GitHub Actions, Git URL, and ZIP File options with descriptions and action buttons

#### Scenario: Upload methods map to backend integration points
- **WHEN** an upload method action is selected
- **THEN** the UI routes or delegates to the relevant project intake integration point without implementing backend ingestion logic in the frontend

### Requirement: Project list dashboard
The system SHALL provide a project list dashboard matching Figma node `5:224` when projects exist.

#### Scenario: Projects are available
- **WHEN** the authenticated user has projects
- **THEN** the dashboard displays the "Active Projects" header, supporting description, search input, project cards, and add-new-project card

#### Scenario: Project card content is displayed
- **WHEN** a project card renders
- **THEN** it displays project name, description, status badge, technology tags, last update time, and a "View Docs" action

### Requirement: Project generation loading state
The system SHALL provide a generation progress screen matching Figma node `5:438` while a project is being analyzed.

#### Scenario: Generation is in progress
- **WHEN** project analysis or documentation generation is running
- **THEN** the UI displays progress percentage, current stage, completed/pending stage indicators, and terminal-style activity logs

#### Scenario: Loading state remains presentational until backend status exists
- **WHEN** backend generation status is not yet connected
- **THEN** the UI MAY use typed mock progress data while keeping the component API ready for real status updates
