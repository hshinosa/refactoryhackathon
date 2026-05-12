## MODIFIED Requirements

### Requirement: Deterministic scan provides baseline data
The system SHALL perform fast, deterministic scanning to extract file tree, config files, dependencies, bounded source evidence, and scan metadata without executing source code.

#### Scenario: Deterministic baseline scan
- **WHEN** deterministic scan runs
- **THEN** the system returns:
  - File tree structure with excluded paths filtered
  - Detected config files such as package.json, tsconfig.json, requirements.txt, go.mod, Gemfile, pom.xml, and Cargo.toml
  - Extracted dependencies from supported config files
  - File count and folder structure metadata
  - Selected source evidence from documentation-relevant files
- **AND** source evidence is bounded by file count, file size, per-file excerpt, and total excerpt limits
- **AND** source evidence excludes binary files, generated artifacts, build outputs, and standard excluded paths
- **AND** the scanner does not execute project source code

### Requirement: Agent enrichment provides intelligent inference
The system SHALL spawn an enrichment agent to interpret raw scan data and source evidence for documentation generation.

#### Scenario: Agent enrichment from raw scan and source evidence
- **WHEN** deterministic scan completes
- **THEN** the system spawns enrichment agent with raw scan metadata and selected source evidence
- **AND** agent returns:
  - Inferred tech stack from config files, file extensions, dependencies, and source evidence
  - Prioritized important files for documentation focus
  - Source-grounded evidence for Overview, Architecture, API Reference, Security, and feature pages
  - Suggested documentation structure based on project type and detected implementation
  - Citations mapping important claims to scanned file paths

### Requirement: Analysis builds compact AI context
The system SHALL transform analyzed codebase data into a bounded source-grounded evidence bundle suitable for AI generation without sending the entire raw source tree.

#### Scenario: Build source-grounded context for AI
- **WHEN** analysis is complete
- **THEN** the system produces a documentation evidence payload containing relevant structure, dependency, file, source excerpt, API, architecture, and security insights
- **AND** the payload includes evidence grouped for Overview, Architecture, API Reference, Security, and feature pages
- **AND** the payload is token-budgeted before it is sent to the AI documentation generator
- **AND** the payload redacts likely secrets, tokens, keys, PATs, and sensitive environment values

## ADDED Requirements

### Requirement: Source evidence respects security boundaries
The system SHALL minimize and sanitize source evidence before it is used by enrichment or documentation generation.

#### Scenario: Source evidence contains sensitive-looking values
- **WHEN** selected files include values that look like secrets, tokens, keys, PATs, private keys, bearer tokens, or environment secrets
- **THEN** the system redacts those values before building enrichment or documentation prompts
- **AND** raw source excerpts are not written to job logs
- **AND** PAT values are never included in scan results, prompts, persisted docs, or logs

### Requirement: Analysis detects documentation evidence categories
The system SHALL categorize selected evidence so the documentation generator can produce complete canonical wiki pages.

#### Scenario: Evidence is prepared for documentation generation
- **WHEN** deterministic scan and enrichment produce downstream context
- **THEN** the context identifies evidence for project overview, architecture, API surface, security posture, and feature/module pages
- **AND** each evidence category includes relevant file paths when supported by scanned files

### Requirement: Generated docs preserve source preview evidence
The system SHALL persist bounded source preview files with generated documentation when source evidence is available.

#### Scenario: Generated docs include source preview files
- **WHEN** documentation generation completes from source-grounded context
- **THEN** the persisted docs payload includes selected source preview files with path, language, and redacted content
- **AND** source preview files are derived only from bounded source evidence
- **AND** the generated docs payload does not persist full raw repository contents

### Requirement: Generated docs reader renders structured source-grounded content
The docs reader SHALL render generated documentation as structured technical docs instead of a paragraph-only article.

#### Scenario: Generated docs page has structured markdown and source files
- **WHEN** a generated docs page is viewed
- **THEN** the reader shows source-code tabs for files cited by the active page
- **AND** the reader renders markdown lists, tables, fenced code blocks, and inline code with dedicated styling
- **AND** the reader shows summary cards and a source evidence table for generated project docs
- **AND** the sidebar uses page-specific icons, separates feature pages from canonical pages, and allows the Features group to collapse or expand
- **AND** the header search and Ask Wiki actions are visually centered in the top bar

#### Scenario: Generated docs contain Mermaid or PlantUML text
- **WHEN** generated content includes Mermaid or PlantUML-style fenced diagrams
- **THEN** the reader does not render diagram widgets for that content in this change
- **AND** the documentation generator is not prompted to produce Mermaid or PlantUML diagrams
