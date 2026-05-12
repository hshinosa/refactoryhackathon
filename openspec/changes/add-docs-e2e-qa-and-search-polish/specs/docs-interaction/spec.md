## ADDED Requirements

### Requirement: Search Docs presents scan-friendly results
The system SHALL render Search Docs results in a concise, readable modal optimized for scanning.

#### Scenario: Result excerpt highlights query context
- **WHEN** a project owner searches docs with a non-empty query
- **THEN** each result shows a short excerpt centered near a matching query term when possible
- **AND** matching terms are visually highlighted without disrupting readability
- **AND** endpoints, file paths, or symbols remain legible in the excerpt

#### Scenario: Results contain duplicate pages
- **WHEN** retrieval returns multiple results for the same docs page
- **THEN** the Search Docs UI shows a single primary result for that page
- **AND** the result title and link prefer the docs page title over raw vector references

#### Scenario: Search returns no matches
- **WHEN** no indexed docs match the query
- **THEN** the modal shows an empty state explaining that no indexed docs matched
- **AND** suggests regenerating docs or trying a file/path/API term

### Requirement: Docs lifecycle has repeatable E2E QA
The system SHALL provide a repeatable browser QA flow covering generated docs, Search Docs, Ask Wiki, and history restore.

#### Scenario: QA verifies docs reader and Search Docs
- **WHEN** the QA workflow signs in as a project owner and opens a generated docs project
- **THEN** it verifies canonical docs navigation is visible
- **AND** opens Search Docs
- **AND** searches for endpoint-related terms
- **AND** verifies a polished search result is visible
- **AND** clicks a result to navigate to a docs page

#### Scenario: QA verifies Ask Wiki and history restore
- **WHEN** the QA workflow asks Ask Wiki what endpoints the project exposes
- **THEN** it verifies the answer contains endpoint facts in a structured format
- **AND** verifies a subtle `Sources` row is present
- **AND** refreshes or reopens the docs page
- **AND** verifies the latest chat session/history is restored

#### Scenario: QA captures visual evidence
- **WHEN** the browser QA workflow runs
- **THEN** it saves screenshots for Search Docs and Ask Wiki states
- **AND** the screenshot paths are reported in the validation output
