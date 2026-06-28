# Rules

SurveyOS - AI Development Guide (Source of Truth)

Project Overview

SurveyOS is a Survey Operations Platform built for Market Research Agencies.

SurveyOS is NOT a survey creation platform.

SurveyOS is NOT a questionnaire platform.

SurveyOS is NOT a survey programming platform.

SurveyOS never owns survey questions, survey logic, survey responses, or survey databases.

SurveyOS manages the operational side of survey fieldwork between Clients, Market Research Agencies, Suppliers, and Respondents.

This document is the permanent Source of Truth for the project.

Before implementing any feature, always understand and follow this document.

⸻

Business Workflow

Step 1

The Client creates a survey inside their own survey platform.

The Client owns:

- Survey
- Survey Questions
- Survey Logic
- Survey Programming
- Survey Database
- Survey Responses

SurveyOS never creates or stores these.

⸻

Step 2

The Client awards a project to a Market Research Agency.

The Client provides:

- Survey Name
- Survey URL
- Country
- Target Completes
- Incidence Rate
- LOI
- CPI
- Timeline

⸻

Step 3

The Market Research Agency creates a Project inside SurveyOS.

SurveyOS becomes responsible for operational management.

⸻

Step 4

SurveyOS automatically generates callback URLs for the project.

Callbacks include:

- Complete Callback
- Terminate Callback
- Quota Full Callback
- Security Callback
- Test Callback

These URLs belong to SurveyOS.

⸻

Step 5

The Project Manager sends these callback URLs to the Client.

⸻

Step 6

The Client configures these callback URLs inside their own survey platform.

When respondents finish the survey, the Client redirects them back to SurveyOS using the appropriate callback.

⸻

Step 7

The Client sends the final programmed Survey URL or confirms the survey configuration.

⸻

Step 8

The Project Manager stores the Survey URL inside SurveyOS.

⸻

Step 9

SurveyOS generates Supplier Tracking Links.

Each supplier receives unique tracking links.

⸻

Step 10

Respondents click Supplier Tracking Links.

SurveyOS:

- Creates Respondent Session
- Creates Survey Session
- Records Supplier
- Records Project
- Logs Device Information
- Logs IP
- Performs Validation
- Checks Project Status
- Checks Quotas
- Redirects Respondent to Client Survey

⸻

Step 11

The Respondent completes the Client Survey.

The Client redirects the Respondent back to SurveyOS.

Possible callback results:

- Complete
- Terminate
- Quota Full
- Security Terminate

⸻

Step 12

SurveyOS processes the callback.

SurveyOS:

- Updates Respondent Status
- Updates Supplier Statistics
- Updates Project Statistics
- Updates Dashboard
- Updates Reports
- Updates Quotas
- Creates Audit Log

⸻

Step 13

Project Managers monitor live fieldwork using SurveyOS dashboards.

The Client continues owning survey programming and responses.

⸻

Core Principles

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

⸻

Project Integration Module

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

⸻

System Workflow

Client

↓

Client Survey Platform

↓

Market Research Agency

↓

SurveyOS

↓

Supplier

↓

Respondent

↓

Client Survey

↓

SurveyOS Callback Processing

↓

Dashboard

↓

Reports

⸻

Architecture Rules

SurveyOS uses a pnpm Monorepo.

Never change the project architecture without approval.

Keep existing folder structure.

Reuse shared packages.

Keep modules independent.

Every feature must include:

- Database
- API
- Validation
- UI
- Permissions
- Audit Logs
- Documentation

⸻

Coding Rules

Always:

- Use TypeScript.
- Use Prisma.
- Use PostgreSQL.
- Use Redis.
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

Never:

- Duplicate code.
- Rename folders unnecessarily.
- Break existing APIs.
- Rewrite architecture.
- Introduce breaking changes without approval.

⸻

Things SurveyOS Never Does

SurveyOS never:

- Creates surveys.
- Creates questionnaires.
- Creates survey logic.
- Stores survey responses.
- Stores survey questions.
- Replaces the Client’s survey platform.
- Owns survey programming.

⸻

Development Order

Development phases:

Phase 1
Foundation

Phase 1A
Foundation Stabilization

Phase 2
Authentication

Phase 3
Organizations

Phase 4
Users & Roles

Phase 5
Clients

Phase 6
Suppliers

Phase 7
Projects

Phase 8
Project Integration

Phase 9
Supplier Tracking Links

Phase 10
Respondent Tracking

Phase 11
Callback Processing

Phase 12
Quota Engine

Phase 13
Reporting

Phase 14
Dashboards

Phase 15
Notifications

Phase 16
Billing

Phase 17
Admin Panel

⸻

AI Development Rules

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
