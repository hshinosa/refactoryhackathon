## ADDED Requirements

### Requirement: Sign-in page
The system SHALL provide a sign-in page matching Figma node `5:319`.

#### Scenario: User opens sign-in page
- **WHEN** a user navigates to the sign-in route
- **THEN** the page displays Codebase Wiki branding, "Welcome back" heading, social sign-in buttons, email/password fields, forgot-password affordance, sign-in action, and sign-up navigation text

#### Scenario: Sign-in controls preserve integration points
- **WHEN** the user activates a social or email sign-in action
- **THEN** the UI delegates to NextAuth/Auth.js integration points when available and MUST NOT implement authentication secrets or credential verification in the client

### Requirement: Sign-up page
The system SHALL provide a sign-up page matching Figma node `5:376` with corrected account-switching copy.

#### Scenario: User opens sign-up page
- **WHEN** a user navigates to the sign-up route
- **THEN** the page displays Codebase Wiki branding, "Welcome" heading, social sign-up buttons, username, email, password fields, and sign-up action

#### Scenario: Existing-account link uses correct action
- **WHEN** the sign-up page renders the existing-account footer
- **THEN** it displays copy that routes users to sign in, not another sign-up action

### Requirement: Auth page accessibility
The system SHALL render auth inputs and actions using semantic form controls.

#### Scenario: Keyboard user uses auth form
- **WHEN** a keyboard user navigates through the sign-in or sign-up page
- **THEN** focus order follows the visual order and every input/button has an accessible name
