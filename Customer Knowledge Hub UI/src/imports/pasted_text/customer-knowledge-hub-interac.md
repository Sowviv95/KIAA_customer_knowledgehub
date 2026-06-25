Keep the current Customer Knowledge Hub design, navigation, visual style and page structure.

Add lightweight navigation and interaction behaviour cues across the UI so the design is ready to hand over to Claude Code. Do not create many new pages. Use existing pages and show interactions as filtered states, context pills, side drawers and action buttons.

Current navigation should remain:
- Dashboard
- File Library
- Summaries
- Ask AI
- Alerts
- Settings

Core interaction principle:
Tracked Topics are not separate pages. They are clickable filters/context chips that open existing pages in context.

1. Dashboard interactions

Make the KPI cards look clickable with subtle hover/active affordance.

Add interaction annotations or prototype links:

- Files Indexed card:
  On click → open File Library.

- New Customer Inputs card:
  On click → open File Library filtered to new/customer-provided files.

- Open Alerts card:
  On click → open Alerts filtered to open/new alerts.

- Open Follow-ups card:
  On click → open Summaries with Action Items or Open Questions context.

Recent Customer Updates:
- Each recent update row should be clickable.
- On click → open Summaries > Timeline focused on that update.
- Add small source type badges such as Meeting, Email, Document, Deck, Schema, Source List.

Tracked Topics:
- Rename/keep section as Tracked Topics.
- Show compact clickable chips:
  Scope, Source List, Schema/API, SLA, Monitoring Cadence, Alerts, Reports, Support Model, Commercials, Open Questions.
- On click of a topic chip → open Summaries > Tracked Topics with selected topic filter applied.
- Show selected topic as a context pill, e.g. “Filtered by: Schema/API”.

Remove any “Ask the Folder” dashboard input if it still exists.
Instead keep a small “Open Ask AI” button.

2. Summaries page interactions

Keep Summaries as a summary-type-first page, not file-wise-first.

Use top tabs:
- Executive Brief
- Timeline
- Tracked Topics
- Requirements
- File Summaries

Executive Brief:
- Default selected tab.
- Add sections:
  Current Customer Understanding
  Latest Customer Updates
  Confirmed Requirements
  Open Questions
  Pending Follow-ups
  Risks / Assumptions
  Recently Added Evidence

Timeline:
- Timeline items should be clickable.
- On click → open a right-side Source Evidence Drawer.
- Timeline items should show date, source type badge, short update summary and linked tracked topic.

Tracked Topics:
- Show topic cards for:
  Scope, Source List, Schema/API, SLA, Monitoring Cadence, Alerts, Reports, Support Model, Commercials, Open Questions.
- Each topic card should include:
  Current Understanding
  Recent Updates
  Open Questions
  Source Evidence
- Add a selected topic filter state at the top:
  “Filtered by: Schema/API” with a clear filter icon.

Requirements:
- Show a table with columns:
  Requirement, Status, Tracked Topic, Last Updated, Source Evidence, Actions.
- Status values:
  Confirmed, Open, Changed, Assumption, Superseded.
- Each row should have buttons:
  View Evidence
  Ask AI

File Summaries:
- Keep existing file-wise summary experience here as a secondary drill-down tab.
- File rows/cards should have:
  View Summary
  View Evidence
  Ask AI

3. Reusable Source Evidence Drawer

Add a reusable right-side drawer pattern that can open from:
- Recent Customer Updates
- Timeline
- Tracked Topics
- Requirements
- Alerts
- File Summaries

Drawer contents:
- Source Evidence
- Source file name
- Source type: Meeting / Email / Document / Deck / Schema / Source List
- Date added or last updated
- Relevant excerpt
- Related tracked topic
- Buttons:
  Open File
  Ask AI about this
  Mark Reviewed

The drawer should slide in from the right or appear as a fixed right panel.
Keep it compact and minimalist.

4. Ask AI contextual launch

Show that Ask AI can be opened with context from other pages.

When opened from a topic, alert, requirement or evidence item, show a context pill at the top of the Ask AI page.

Examples:
- Context: Schema/API
- Context: Alert — SLA Mention Detected
- Context: Requirement — API-based delivery
- Context: Evidence — RFP_Data_Sources_Phase1.docx

Ask AI page should include suggested questions relevant to customer update tracking:
- What changed since the last customer call?
- What are the open questions for the next meeting?
- What has the customer confirmed about schema/API?
- Which files mention the 30-minute SLA?
- Summarise customer inputs on source monitoring.
- What action items are pending?
- Which requirements are still assumptions?

5. Alerts page interactions

Keep Alerts page but make alert rows actionable.

Alert table columns:
- Severity
- Alert Type
- Description
- Source File
- Tracked Topic
- Status
- Created Date
- Actions

Alert types:
- New Customer File Added
- Customer Document Changed
- New Meeting Note Added
- Schema/API Update Detected
- Source List Changed
- SLA Mention Detected
- New Open Question
- New Action Item

Actions:
- View Evidence → opens Source Evidence Drawer
- Ask AI → opens Ask AI with alert context
- Mark Reviewed → changes status visually

6. File Library interactions

Keep File Library as-is but add a Customer Relevance column.

Columns:
- File Name
- Type
- Category
- Customer Relevance
- Last Updated
- Summary Status
- Tags
- Actions

Customer Relevance values:
- Customer Provided
- Meeting Note
- Email Export
- Internal Deck
- Schema
- Source List
- Reference

Actions:
- View Summary → opens Summaries > File Summaries
- View Evidence → opens Source Evidence Drawer
- Ask AI → opens Ask AI with file context

7. Visual guidelines

Keep the design minimalist and enterprise-friendly.
Use subtle interaction cues:
- Clickable cards should have a small arrow or hover state.
- Chips should look selectable.
- Selected filters should appear as small pills.
- Avoid heavy modals.
- Prefer side drawer for evidence.
- Do not add complex workflows or many extra screens.
- Keep the UI clean enough for a local desktop app.

The goal is to show how Dashboard, Summaries, Ask AI, Alerts and File Library connect through tracked topics, source evidence and contextual navigation, while keeping the existing Customer Knowledge Hub structure intact.