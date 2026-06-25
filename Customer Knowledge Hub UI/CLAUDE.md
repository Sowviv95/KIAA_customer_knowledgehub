# Customer Knowledge Hub — Claude Code Instructions

## Project Overview

We are building a locally hosted app called **Customer Knowledge Hub** for the LSEG Risk Intelligence project.

The app helps internal teams stay aligned on customer updates across meetings, emails, documents, schemas, source lists and decks.

The app should answer:

> What has the customer told us, what changed, what is open, and what do we need to act on?

This is not intended to be a generic heavy RAG platform. It should stay focused on customer updates, requirement changes, open questions, follow-ups, alerts, evidence and change history.

## Current Priority

Current priority is **Sprint 0 / Phase 0 only**.

Do not proceed to backend, database, file scanning, parsing, search, summaries or LLM features unless explicitly instructed.

## Existing Codebase

This project started from a Figma-generated UI export.

The existing design and component structure should be treated as the visual and interaction reference.

Do not recreate the app from scratch unless the existing export is unusable.

Prefer stabilising, adapting and extending the existing code.

## Core Navigation

Keep these pages:

* Dashboard
* File Library
* Summaries
* Ask AI
* Alerts
* Settings

## Product Decisions

1. App name: Customer Knowledge Hub.
2. No login.
3. No authentication.
4. No user management.
5. Add a simple "View as" role selector instead of authentication.
6. The role selector is a content lens/filter only, not access control.
7. Do not implement permissions.
8. Remove or avoid any "Ask the Folder" dashboard input because Ask AI already exists.
9. Use Tracked Topics as clickable filters/context, not separate pages.
10. File-wise summaries should exist only as a drill-down view, not the main Summaries experience.
11. Use mock data in Phase 0.
12. Do not call an LLM in Phase 0.
13. Do not build backend functionality in Phase 0.

## Supported Role Views

The top-bar role selector should support:

* Project Manager
* Web Scraping Team
* AIML Engineer
* QA Team
* Sales Team
* Senior Management
* All Views

Role selector behaviour:

* It changes the content lens or emphasis.
* It is not authentication.
* It does not hide content for security reasons.
* It does not control permissions.

## Role Emphasis

* Project Manager: open follow-ups, requirement changes, risks, next-call prep
* Web Scraping Team: source list changes, monitoring cadence, source access issues, outage mentions
* AIML Engineer: schema/API changes, extraction fields, validation rules, confidence requirements
* QA Team: acceptance criteria, changed requirements, evidence, validation issues
* Sales Team: customer priorities, scope changes, value-add opportunities, proposal/deck updates
* Senior Management: executive brief, major risks, key decisions, delivery dependencies

## Tracked Topics

Use these tracked topics:

* Scope
* Source List
* Schema/API
* SLA
* Monitoring Cadence
* Alerts
* Reports
* Support Model
* Commercials
* Open Questions

## Alert Types

Use these alert types:

* New Customer File Added
* Customer Document Changed
* New Meeting Note Added
* Schema/API Update Detected
* Source List Changed
* SLA Mention Detected
* New Open Question
* New Action Item

## Requirement Statuses

Use these statuses:

* Confirmed
* Open
* Changed
* Assumption
* Superseded

## Summaries Page Direction

The Summaries page must be summary-type-first, not file-list-first.

Tabs:

* Executive Brief
* Timeline
* Tracked Topics
* Requirements
* File Summaries

Executive Brief sections:

* Current Customer Understanding
* Latest Customer Updates
* Confirmed Requirements
* Open Questions
* Pending Follow-ups
* Risks / Assumptions
* Recently Added Evidence

Timeline should show customer updates grouped by date with source type badges such as:

* Meeting
* Email
* Document
* Deck
* Schema
* Source List

Tracked Topic cards should include:

* Current Understanding
* Recent Updates
* Open Questions
* Source Evidence

Requirements table should include:

* Requirement
* Status
* Tracked Topic
* Last Updated
* Source Evidence
* Actions

File Summaries should remain a secondary drill-down view.

## Source Evidence Drawer

Create or preserve a reusable right-side Source Evidence Drawer.

It should be openable from:

* Dashboard recent updates
* Timeline
* Tracked Topics
* Requirements
* Alerts
* File Summaries
* File Library

Drawer contents:

* Source Evidence
* Source file name
* Source type
* Date added or last updated
* Relevant excerpt
* Related tracked topic
* Buttons:

  * Open File
  * Ask AI about this
  * Mark Reviewed

In Phase 0, these can use mock data and mock interactions only.

## Ask AI

Ask AI should support contextual launches from:

* topic
* alert
* file
* evidence
* requirement

When launched with context, show a context pill, for example:

* Context: Schema/API
* Context: Alert — SLA Mention Detected
* Context: Requirement — API-based delivery
* Context: Evidence — RFP_Data_Sources_Phase1.docx

Suggested questions:

* What changed since the last customer call?
* What are the open questions for the next meeting?
* What has the customer confirmed about schema/API?
* Which files mention the 30-minute SLA?
* Summarise customer inputs on source monitoring.
* What action items are pending?
* Which requirements are still assumptions?

In Phase 0, Ask AI must use mock responses only.

Do not call any LLM.

## Mock Data Examples

Use realistic LSEG Risk Intelligence examples such as:

* RFP_Data_Sources_Phase1.docx
* RI_data_source_schema_swagger-1.0.5.yaml
* Data_sources_RFP_sanctions_law_enforcement_regulatory.xlsx
* 30-minute SLA
* API-based delivery
* source monitoring
* schema/API updates
* source list changes
* daily reports
* support model
* open questions

## Technical Stack

Preferred frontend stack:

* React
* Vite
* TypeScript
* Tailwind CSS

Do not introduce backend dependencies in Phase 0.

Future backend direction, not for Phase 0:

* FastAPI
* SQLite
* Python file scanning
* deterministic parsing
* SQLite FTS5
* cached summaries
* optional LLM provider abstraction later

## Hard Constraints

Do not:

* create a new React app unless the current export is unusable
* rebuild the UI from scratch
* add login
* add authentication
* add permissions
* add backend functionality
* add database functionality
* add file scanning
* process real files
* add LLM calls
* add embeddings
* add vector search
* require Docker
* require cloud hosting
* upload files anywhere
* overengineer

## Coding Style

* Make small incremental changes.
* Keep components reusable.
* Centralise mock data.
* Add TypeScript types for mock data where practical.
* Preserve the Figma visual direction.
* Prefer simple, readable code.
* Avoid large rewrites.
* Fix build errors before adding features.
* Report changed files after each step.
* Keep the app easy for a non-engineering user to run locally.

## Validation

After changes, run the available checks where possible:

* npm install, if dependencies are not installed
* npm run dev, where practical
* npm run build
* npm run lint, only if a lint script exists

If any command fails, report the error and fix it before moving to the next task.

## Current Sprint

Current sprint: **Sprint 0 — Repo and Figma Handover Readiness**

Sprint 0 tasks:

1. Inspect the project structure.
2. Confirm the framework and package manager.
3. Identify entry files, pages, components, styling and mock data.
4. Confirm install/dev/build commands.
5. Check whether the app runs.
6. Make only minimal fixes required to get the app running.
7. Do not add new product features yet.
8. Do not proceed to Sprint 1 unless explicitly instructed.

Sprint 0 output should include:

* framework summary
* current project structure
* package scripts
* whether the app runs
* build status
* errors found
* minimal recommended fixes
* files changed, if any
