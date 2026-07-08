# Rules

SurveyOS - AI Development Guide (Source of Truth)

## Project Overview

SurveyOS is a Survey Operations Platform built for Market Research Agencies.

SurveyOS is NOT a survey creation platform.
SurveyOS is NOT a questionnaire platform.
SurveyOS is NOT a survey programming platform.

SurveyOS never owns survey questions, survey logic, survey responses, or survey databases.

SurveyOS manages the operational side of survey fieldwork between Clients, Market Research Agencies, Suppliers, and Respondents.

This document is the permanent Source of Truth for the project.

Before implementing any feature, always understand and follow this document.

---

## Business Workflow

1. The Client creates a survey inside their own survey platform.

The Client owns:

- Survey
- Survey Questions
- Survey Logic
- Survey Programming
- Survey Database
- Survey Responses

SurveyOS never creates or stores these.

2. The Client awards a project to a Market Research Agency.

The Client provides:

- Survey Name
- Survey URL
- Country
- Target Completes
- Incidence Rate
- LOI
- CPI
- Timeline

3. The Market Research Agency creates a Project inside SurveyOS.

4. SurveyOS automatically generates callback URLs for the project.

Callbacks include:

- Complete Callback
- Terminate Callback
- Quota Full Callback
- Security Callback
- Test Callback

5. The Project Manager sends these callback URLs to the Client.

6. The Client configures these callback URLs inside their own survey platform.

7. The Client sends the final programmed Survey URL or confirms the configuration.

8. The Project Manager stores the Survey URL inside SurveyOS.

9. SurveyOS generates Supplier Tracking Links.

10. Respondents click Supplier Tracking Links.

SurveyOS:

- Creates Respondent Session
- Records Supplier
- Records Project
- Logs Device Information
- Logs IP
- Performs Validation
- Checks Project Status
- Checks Quotas
- Redirects Respondent to Client Survey

11. The Respondent completes the Client Survey.

The Client redirects the Respondent back to SurveyOS.

Possible callback results:

- Complete
- Terminate
- Quota Full
- Security Terminate

12. SurveyOS processes the callback.

SurveyOS:

- Updates Respondent Status
- Updates Supplier Statistics
- Updates Project Statistics
- Updates Dashboard
- Updates Reports
- Updates Quotas
- Creates Audit Log where applicable

13. Project Managers monitor live fieldwork using SurveyOS dashboards.

The Client continues owning survey programming and responses.

---

## Core Principles

Client owns:

- Survey
- Questions
- Logic
- Programming
- Database
- Responses

SurveyOS owns:

- Organizations
- Users
- Projects
- Suppliers
- Tracking Links
- Callback URLs
- Respondent Sessions
- Project Statistics
- Quotas
- Reports
- Dashboards
- Audit Logs
- Fraud Signals

---

## Project Integration Module

Every Project MUST contain an Integration Tab.

The Integration Tab is mandatory.

The Integration Tab includes:

- Client Survey URL
- Complete Callback URL
- Terminate Callback URL
- Quota Full Callback URL
- Security Callback URL
- Test Callback URL
- Parameter Mapping
- Copy Buttons
- Integration Status
- Test Integration Button

Integration Status values:

- Waiting
- Testing
- Live
- Failed

Workflow:

1. Project created.
2. SurveyOS generates callback URLs.
3. Project Manager sends callback URLs to Client.
4. Client configures callbacks.
5. Client sends Survey URL.
6. Project Manager stores Survey URL.
7. Test Integration runs.
8. If successful, Project becomes Ready for Launch.

This module is mandatory.

---

## Architecture Rules

SurveyOS uses a pnpm Monorepo.

Never change the project architecture without approval.

Keep existing folder structure.
Reuse shared packages.
Keep modules independent.

Every feature must include, where applicable:

- Database
- API
- Validation
- UI
- Permissions
- Audit Logs
- Documentation

---

## Coding Rules

Always:

- Use TypeScript.
- Use Prisma.
- Use PostgreSQL.
- Use Express API.
- Use Next.js.
- Use shared packages.
- Use reusable components.
- Follow REST APIs.
- Validate inputs.
- Handle errors.
- Keep code modular.
- Keep commits small.
- Write maintainable code.

Use Redis only when a caching, queue, session storage, or rate-limiting feature is explicitly approved.

Never:

- Duplicate code.
- Rename folders unnecessarily.
- Break existing APIs.
- Rewrite architecture.
- Introduce breaking changes without approval.

---

## Traffic Handling and Quality Alerts

SurveyOS supports flexible supplier traffic.

Each unique tracking click may create a separate Respondent Session when it has a unique session token, respondent identifier, or query parameters.

SurveyOS must preserve supplier query parameters such as:

- rid
- subid
- source
- campaign
- extra custom parameters

Fraud and quality checks are passive by default.

Fraud signals must not block tracking redirects or callback processing unless strict blocking is explicitly approved by the project owner.

Default mode:

- Allow traffic
- Track sessions
- Record quality alerts
- Let Project Managers review reports manually

Do not implement strict respondent blocking, device fingerprint blocking, IP blocking, or duplicate blocking unless explicitly approved.

---

## Things SurveyOS Never Does

SurveyOS never:

- Creates surveys.
- Creates questionnaires.
- Creates survey logic.
- Stores survey responses.
- Stores survey questions.
- Replaces the Client's survey platform.
- Owns survey programming.

---

## Development Order

Completed Backend Phases:

Phase 1
Project Foundation

Phase 1A
Foundation Stabilization

Phase 2
Authentication, Authorization, Sessions

Phase 3
Organization Management

Phase 4
Project Management

Phase 5
Project Integration and Callback URLs

Phase 6
Supplier Management

Phase 7
Supplier Project Assignments and Tracking Links

Phase 8
Public Tracking Redirect and Respondent Sessions

Phase 9
Callback Processing, Outcomes, and Quotas

Phase 10
Audit Logs, Fraud Signals, Dashboards, Reports, Export, and Basic Fraud Detection

MVP Final Stabilization
Smoke Testing and Backend Validation

Current Phase:

Phase 11
Frontend Dashboard

Upcoming Frontend Subphases:

Phase 11.1
Frontend Foundation and API Client

Phase 11.2
Authentication Pages

Phase 11.3
Organization Dashboard

Phase 11.4
Project Management UI

Phase 11.5
Project Integration Tab UI

Phase 11.6
Supplier Management UI

Phase 11.7
Project Supplier Assignment UI

Phase 11.8
Respondent Sessions UI

Phase 11.9
Quotas UI

Phase 11.10
Dashboard Metrics UI

Phase 11.11
Audit Logs UI

Phase 11.12
Fraud Signals UI

Phase 11.13
Reports Export UI

Phase 11.14
Final Frontend Testing

---

## AI Development Rules

Before writing any code:

- Read this document.
- Understand the business workflow.
- Preserve architecture.
- Preserve folder structure.
- Implement one module at a time.
- Never implement unrelated features.
- Never remove existing functionality.
- Explain database changes.
- Explain API changes.
- Update documentation after significant architectural changes.
- Prefer extending existing code instead of rewriting it.
- Keep business logic modular.
- Follow SOLID principles where practical.
- Build scalable enterprise-grade code.
- Optimize for maintainability over shortcuts.

This document is the permanent Source of Truth for SurveyOS. Every implementation decision must follow these rules unless explicitly changed by the project owner.
