# Customer Knowledge Hub — Developer Handoff Specification

> Ground truth for Figma-to-code mapping. Frame names, component hierarchy, design tokens, and interaction patterns.
>
> **Token source:** `src/app/tokens.ts` — import `{ tokens }` in every component.  
> **Visual reference:** Click **Tokens** in the top bar (DEV mode) to see the full design token sheet.  
> **State reference:** Click **States** in the top bar (DEV mode) to see all interaction states.  
> **Frame notes:** Click **DEV** in the top bar to see page-specific developer annotations.

---

## Figma Frame Structure

Each page is a top-level frame at **1440 × 900** (desktop, landscape only — no mobile view).

| Figma Frame Name        | Route / Component      | Description                              |
|-------------------------|------------------------|------------------------------------------|
| `Page / Dashboard`      | `Dashboard.tsx`        | KPI strip, recent updates, topic chips   |
| `Page / File Library`   | `FileLibrary.tsx`      | Searchable file table with filters       |
| `Page / Summaries`      | `Summaries.tsx`        | Summary-type-first tabbed view           |
| `Page / Ask AI`         | `AskAI.tsx`            | Contextual chat with cited sources       |
| `Page / Alerts`         | `Alerts.tsx`           | Alert inbox table with actions           |
| `Page / Settings`       | `Settings.tsx`         | Configuration panel                      |

---

## Shared Layout — AppShell

Every page uses the same shell. Do not duplicate these layers per page; use a shared component.

```
AppShell
├── TopBar                        (height: ~88px, white, border-bottom)
│   ├── TopBar / BrandRow         (brand logo, project selector, status badges)
│   └── TopBar / NavRow           (page nav tabs with active underline)
└── MainContent                   (flex-1, overflow-hidden, background: #f0f4f8)
    └── [Page content]
```

### TopBar / BrandRow

| Element            | Value                                          |
|--------------------|------------------------------------------------|
| Background         | `#ffffff`                                      |
| Border-bottom      | `1px solid rgba(0,0,0,0.08)`                  |
| Logo icon          | `Cpu` (lucide), 32×32, bg `rgba(22,163,74,0.09)`, icon `#16a34a` |
| App name           | "Customer Knowledge Hub" · 0.82rem · weight 700 · `#0f172a` |
| Sub-label          | "AI Solutioning · Local Mode" · 0.66rem · `#9ca3af` |
| Project selector   | Pill with ChevronDown · bg `#f8fafc` · border `rgba(0,0,0,0.08)` |
| Watcher badge      | Green dot + "Watcher Active" · `rgba(22,163,74,0.08)` bg |
| Model badge        | "GPT-4o" · `#f0f4f8` bg                       |

### TopBar / NavRow

Active tab: `border-bottom: 2px solid #16a34a`, color `#16a34a`, weight 600  
Inactive tab: `border-bottom: 2px solid transparent`, color `#6b7280`, weight 400  
Font size: `0.82rem`

Tabs in order: Dashboard · File Library · Summaries · Ask AI · Alerts (badge) · Settings

---

## Page Anatomy — Per-Page Layers

Each `Page / X` frame contains:

```
Page / X
├── AppShell (shared)
└── MainContent
    ├── PageHeader          (white strip, border-bottom, ~44px tall)
    │   ├── PageDescription (subtitle text, left-aligned)
    │   └── PageActions     (buttons, right-aligned)
    ├── FilterBar           (optional — white strip below header, ~44px)
    └── PageBody            (background #f0f4f8, padding 20px, scrollable)
```

---

## Page / Dashboard

```
PageBody
├── KPIStrip                     (4-column grid, gap 12px, mb 16px)
│   └── KPICard × 4             (white, rounded-xl, px-16 py-12, flex row)
│       ├── KPICard / Icon       (32×32 rounded-lg, tinted bg)
│       ├── KPICard / ValueGroup
│       │   ├── KPICard / Value  (1.1rem, weight 700, #0f172a)
│       │   └── KPICard / Delta  (0.66rem, green or amber)
│       ├── KPICard / Label      (0.74rem, #6b7280)
│       └── KPICard / Arrow      (ArrowUpRight, 12px, #d1d5db)
│
└── ContentRow                   (2-column grid, gap 12px)
    ├── RecentUpdates            (white card, rounded-xl)
    │   ├── CardHeader
    │   └── UpdateRow × 5        (clickable, hover bg-green-50)
    │       ├── FileName         (0.78rem, weight 500)
    │       ├── SourceBadge      (see badge spec below)
    │       ├── ActionLabel      (0.70rem, #9ca3af)
    │       └── Timestamp        (Clock icon + text, 0.66rem)
    └── TrackedTopics            (white card, rounded-xl)
        ├── CardHeader
        └── ChipGrid             (flex-wrap, gap 8px)
            └── TopicChip × 10   (clickable pill, see chip spec)
```

### KPI Card destinations (onClick → navigate)

| Card              | Destination                              |
|-------------------|------------------------------------------|
| Files Indexed     | `Page / File Library`                    |
| New Customer Inputs | `Page / File Library` filtered to new  |
| Open Alerts       | `Page / Alerts` filtered to New status  |
| Open Follow-ups   | `Page / Summaries` > Requirements tab   |

### TopicChip spec

```
State: default
  background: #f8fafc
  border: 1px solid rgba(0,0,0,0.08)
  color: #374151
  border-radius: 9999px
  padding: 6px 12px
  font-size: 0.78rem

State: hover
  background: rgba(22,163,74,0.08)
  border-color: rgba(22,163,74,0.30)
  color: #16a34a
```

---

## Page / File Library

```
PageHeader
  Left: "142 customer files indexed · LSEG Risk Intelligence" (subtitle)
  Right: "+ Add Folder" button (green primary)

FilterBar
  ├── SearchInput     (240px min, bg #f8fafc, border rgba(0,0,0,0.10))
  ├── CategorySelect  (dropdown with Filter icon)
  ├── TypeSelect      (dropdown)
  └── FileCount       (right-aligned, #9ca3af, 0.74rem)

PageBody
  └── FileTable
      ├── TableHeader (sticky, bg #f8fafc, ALL-CAPS labels, 0.62rem)
      │   Columns: File Name · Type · Category · Last Updated ·
      │            Summary · Customer Relevance · Tags · Actions
      └── TableRow × N  (bg white, hover bg-green-50)
          ├── FileIcon + FileName
          ├── TypeBadge            (rounded, tinted per type)
          ├── CategoryLabel
          ├── DateLabel            (#9ca3af)
          ├── SummaryStatusPill    (rounded-full, tinted)
          ├── CustomerRelevancePill
          ├── TagChips             (max 2 visible + overflow count)
          └── ActionButtons        (Summary · Evidence · Ask AI)
```

### Customer Relevance values and colors

| Value              | bg                          | text       |
|--------------------|-----------------------------|------------|
| Customer Provided  | `rgba(22,163,74,0.08)`     | `#16a34a`  |
| Meeting Note       | `rgba(59,130,246,0.08)`    | `#2563eb`  |
| Email Export       | `rgba(14,165,233,0.08)`    | `#0284c7`  |
| Internal Deck      | `rgba(217,119,6,0.08)`     | `#d97706`  |
| Schema             | `rgba(139,92,246,0.08)`    | `#7c3aed`  |
| Source List        | `rgba(107,114,128,0.08)`   | `#4b5563`  |
| Reference          | `rgba(0,0,0,0.04)`         | `#9ca3af`  |

---

## Page / Summaries

```
TopTabBar                         (white, border-bottom)
  Tabs: Executive Brief · Timeline · Tracked Topics · Requirements · File Summaries
  Right: Refresh · Export · Filters toggle

PageBody (flex row)
├── ContentArea (flex-1)
│   ├── [Tab: Executive Brief]
│   │   ├── UnderstandingCard     (full width)
│   │   ├── Row: LatestUpdates + ConfirmedRequirements
│   │   ├── Row: OpenQuestions + PendingFollowUps
│   │   └── Row: RisksAssumptions + RecentEvidence
│   │
│   ├── [Tab: Timeline]
│   │   └── DateGroup × N
│   │       ├── DateLabel         (green Calendar icon + date text)
│   │       └── TimelineItem × N  (clickable → EvidenceDrawer)
│   │           ├── Timestamp
│   │           ├── SourceBadge
│   │           ├── FileName       (#16a34a)
│   │           ├── TopicTag
│   │           ├── SummaryText
│   │           └── EyeIcon        (#d1d5db, reveals on hover)
│   │
│   ├── [Tab: Tracked Topics]
│   │   ├── FilterPill            ("Filtered by: X" with × dismiss)
│   │   └── TopicCardGrid         (3-column)
│   │       └── TopicCard         (accordion, green border when open)
│   │           ├── CardTitle + ChevronToggle
│   │           ├── CurrentUnderstanding
│   │           ├── RecentUpdates
│   │           ├── OpenQuestions
│   │           └── SourceEvidence + AskAIButton
│   │
│   ├── [Tab: Requirements]
│   │   ├── StatusFilterBar
│   │   └── RequirementsTable
│   │       Columns: Requirement · Status · Tracked Topic ·
│   │                Last Updated · Source Evidence · Actions
│   │       Actions per row: Evidence · Ask AI
│   │
│   └── [Tab: File Summaries]
│       ├── FileList              (220px, bg #fafbfc, left panel)
│       └── FileDetail
│           ├── FileDetailHeader  (file name, Evidence · Ask AI · Export)
│           ├── InnerTabBar       (Summary · Open Questions · Action Items)
│           └── InnerContent
│
└── FilterPanel                   (200px, white, border-left, collapsible)
    ├── SourceTypeFilters
    ├── CustomerOnlyToggle
    ├── IncludeDecksToggle
    ├── FreshnessRadio
    └── TrackedTopicFilters
```

### Requirements status values and colors

| Status      | bg                          | text       |
|-------------|------------------------------|------------|
| Confirmed   | `rgba(22,163,74,0.08)`      | `#16a34a`  |
| Open        | `rgba(217,119,6,0.08)`      | `#d97706`  |
| Changed     | `rgba(220,38,38,0.08)`      | `#dc2626`  |
| Assumption  | `rgba(139,92,246,0.08)`     | `#7c3aed`  |
| Superseded  | `rgba(0,0,0,0.05)`          | `#9ca3af`  |

---

## Page / Ask AI

```
PageHeader
  Left: subtitle + optional ContextPill
  Right: ScopeSelector (segmented control, green active state)

ContentRow (flex row, full height)
├── ChatArea (flex-1)
│   ├── MessageList (scrollable)
│   │   ├── AssistantMessage   (white bubble, green avatar, left-aligned)
│   │   └── UserMessage        (dark #0f172a bubble, right-aligned)
│   ├── SuggestedQuestions     (pill chips, above input)
│   └── InputBar               (bg #f8fafc, rounded-xl, Send button)
└── SourcePanel                (280px, white, border-left)
    ├── CitedSources           (confidence-ranked snippets)
    │   └── SourceCard × N     (file, excerpt, confidence bar)
    └── RelatedFiles           (list with relevance %)
```

### ContextPill spec

```
background: rgba(22,163,74,0.10)
color: #16a34a
border: 1px solid rgba(22,163,74,0.25)
border-radius: 9999px
padding: 4px 10px
font-size: 0.74rem, weight 600
contains: Tag icon + context label + × dismiss button
```

### Scope selector values
All Files · RFP · Meeting Notes · Emails · Schema · Decks

---

## Page / Alerts

```
PageHeader
  Left: subtitle + NewCount badge (red pill)
  Right: "Configure Rules" button

AlertTypeSummaryStrip           (white, border-bottom, horizontal scroll)
  └── AlertTypeChip × 8        (icon + label + count badge)

FilterBar
  ├── StatusFilters             (All · New · Reviewed · Ignored · Action)
  └── SeverityFilters           (All · High · Medium · Low)

AlertTable
  TableHeader columns:
    Severity · Alert Type · Description · Source File ·
    Tracked Topic · Status · Created · Actions

  TableRow × N
    Actions per row: Evidence · Ask AI · Reviewed · ×(Ignore)
```

### Severity colors

| Severity | bg                        | text       | dot        |
|----------|---------------------------|------------|------------|
| High     | `rgba(220,38,38,0.08)`   | `#dc2626`  | `#dc2626`  |
| Medium   | `rgba(217,119,6,0.08)`   | `#d97706`  | `#d97706`  |
| Low      | `rgba(22,163,74,0.08)`   | `#16a34a`  | `#16a34a`  |

### Alert type values
New Customer File Added · Customer Document Changed · New Meeting Note Added ·
Schema/API Update Detected · Source List Changed · SLA Mention Detected ·
New Open Question · New Action Item

---

## Page / Settings

```
PageHeader
  Left: subtitle
  Right: Re-index Folder + Save Changes buttons

PageBody (max-width 780px)
  └── SettingsSection × 6
      Each section: white card, rounded-xl, icon + title header
      Sections:
        LocalFolderPath     (Folder icon)
        ModelProvider       (Cpu icon)
        EmbeddingProvider   (Database icon)
        TokenBudget         (Coins icon — range slider)
        AutoSummary         (Zap icon — toggle)
        AlertRules          (Bell icon — rule list with toggles)
```

---

## RightDrawer — EvidenceDrawer

Shared overlay drawer triggered from: Timeline, Tracked Topics, Requirements, File Summaries, Alerts, File Library.

```
RightDrawer                        (width 360px, fixed right, z-50)
├── DrawerHeader                   (title "Source Evidence" + × close)
├── DrawerBody
│   ├── FileCard                   (icon + file name + SourceBadge + date)
│   ├── ExcerptBlock               (italic quote, left border #16a34a, 3px)
│   └── RelatedTopic               (Tag icon + green pill)
└── DrawerFooter
    ├── AskAIButton                (full-width, green primary)
    └── SecondaryRow
        ├── OpenFileButton         (half-width, ghost)
        └── MarkReviewedButton     (half-width, ghost)

Backdrop: rgba(0,0,0,0.12), click-to-close
```

---

## Design Tokens

### Colors

```
Page background:    #f0f4f8
Panel / card:       #ffffff
Input background:   #f8fafc
Top bar:            #ffffff

Accent:             #16a34a
Accent hover:       #15803d
Accent bg subtle:   rgba(22,163,74,0.08)
Accent border:      rgba(22,163,74,0.22)
Accent glow:        rgba(22,163,74,0.35)   ← scrollbar thumb

Text primary:       #0f172a
Text secondary:     #374151
Text muted:         #6b7280
Text faint:         #9ca3af

Border:             rgba(0,0,0,0.08)
Border subtle:      rgba(0,0,0,0.06)
Input border:       rgba(0,0,0,0.10)

Severity High:      #dc2626
Severity Medium:    #d97706
Severity Low:       #16a34a
Purple accent:      #7c3aed   ← open questions
Blue accent:        #2563eb   ← meeting source type
```

### Typography

Font family: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

| Token        | rem     | px equiv | Usage                              |
|--------------|---------|----------|------------------------------------|
| label-xs     | 0.62rem | ~10px    | ALL-CAPS section labels            |
| label-sm     | 0.66rem | ~10.6px  | Timestamps, sub-labels             |
| body-xs      | 0.74rem | ~11.8px  | Filter pills, badges               |
| body-sm      | 0.78rem | ~12.5px  | Card descriptions, table cells     |
| body-md      | 0.82rem | ~13px    | Nav items, sub-headings, body text |
| body-lg      | 0.88rem | ~14px    | Card titles, drawer headers        |
| heading-sm   | 0.9rem  | ~14.4px  | Card section headings              |
| heading-md   | 1.1rem  | ~17.6px  | KPI values                         |

Font weights: 400 (normal) · 500 (medium) · 600 (semibold) · 700 (bold) · 800 (extrabold)

### Spacing

Base unit: 4px

| Name   | px  | Tailwind equiv |
|--------|-----|----------------|
| xs     | 4   | p-1            |
| sm     | 8   | p-2            |
| md     | 12  | p-3            |
| lg     | 16  | p-4            |
| xl     | 20  | p-5            |
| 2xl    | 24  | p-6            |

Page body padding: `20px` (p-5)
Card padding: `16–20px` (px-4/px-5, py-3/py-3.5)
Section gap: `12px` (gap-3) or `16px` (gap-4)

### Border radius

```
Card:       rounded-xl  (12px)
Badge/pill: rounded-full (9999px)
Input:      rounded-lg   (8px)
Icon bg:    rounded-lg   (8px)
Button:     rounded-lg   (8px)
```

### Shadows

Cards have no box-shadow by default — borders only.  
Hover state on clickable cards: `box-shadow: 0 2px 8px rgba(22,163,74,0.08)`  
EvidenceDrawer: `box-shadow: -4px 0 24px rgba(0,0,0,0.08)`

---

## Source Type Badges

Used in: Timeline, Recent Updates, Evidence Drawer, File Library, Alerts

| Type        | bg                          | text       | Icon           |
|-------------|------------------------------|------------|----------------|
| Meeting     | `rgba(59,130,246,0.08)`    | `#2563eb`  | MessageSquare  |
| Email       | `rgba(14,165,233,0.08)`    | `#0284c7`  | Mail           |
| Document    | `rgba(22,163,74,0.08)`     | `#16a34a`  | FileText       |
| Deck        | `rgba(217,119,6,0.08)`     | `#d97706`  | Presentation   |
| Schema      | `rgba(139,92,246,0.08)`    | `#7c3aed`  | Database       |
| Source List | `rgba(107,114,128,0.08)`   | `#4b5563`  | List           |

Badge shape: `rounded-full`, padding `2px 8px`, font-size `0.66rem`, weight `600`, icon `9–10px`

---

## Button Variants

| Variant        | bg                        | text     | border                         | usage                   |
|----------------|---------------------------|----------|--------------------------------|-------------------------|
| Primary        | `#16a34a`                 | `#fff`   | none                           | Export, Save, Add       |
| Primary dark   | `#0f172a`                 | `#fff`   | none                           | Open Ask AI             |
| Ghost green    | `rgba(22,163,74,0.08)`   | `#16a34a`| `rgba(22,163,74,0.22)`        | View Evidence, Reviewed |
| Ghost neutral  | `#f0f4f8` or `#f8fafc`   | `#374151`| `rgba(0,0,0,0.08)`            | Secondary actions       |
| Ghost danger   | `rgba(220,38,38,0.08)`   | `#dc2626`| `rgba(220,38,38,0.20)`        | High severity badges    |

Button font-size: `0.74–0.82rem`, weight `500–600`, border-radius `rounded-lg`

---

## Interaction Map

| Trigger                        | Action                                           |
|-------------------------------|--------------------------------------------------|
| KPI: Files Indexed             | → File Library                                   |
| KPI: New Customer Inputs       | → File Library (customer filter)                 |
| KPI: Open Alerts               | → Alerts (New status filter)                     |
| KPI: Open Follow-ups           | → Summaries > Requirements                       |
| Recent Update row              | → Summaries > Timeline                           |
| Topic chip (Dashboard)         | → Summaries > Tracked Topics (topic pre-selected)|
| Open Ask AI button (Dashboard) | → Ask AI                                         |
| Timeline item                  | → EvidenceDrawer (right slide-in)                |
| Topic card evidence row        | → EvidenceDrawer                                 |
| Topic card Ask AI button       | → Ask AI (context: topic name)                   |
| Requirements: Evidence         | → EvidenceDrawer                                 |
| Requirements: Ask AI           | → Ask AI (context: requirement text)             |
| File Summaries: Evidence       | → EvidenceDrawer                                 |
| File Summaries: Ask AI         | → Ask AI (context: file name)                    |
| Alerts: Evidence               | → EvidenceDrawer                                 |
| Alerts: Ask AI                 | → Ask AI (context: alert type)                   |
| File Library: Summary          | → Summaries > File Summaries                     |
| File Library: Evidence         | → EvidenceDrawer                                 |
| File Library: Ask AI           | → Ask AI (context: file name)                    |
| EvidenceDrawer: Ask AI         | → Ask AI (context: file name)                    |
| EvidenceDrawer: backdrop click | → close drawer                                   |
| Summaries filter pill ×        | → clear topic filter                             |
| Ask AI context pill ×          | → clear context                                  |
| Filters toggle button          | → show/hide FilterPanel (Summaries)              |

---

## File → Component Map

```
src/app/
├── App.tsx                     AppShell orchestrator, nav state, drawer state
├── types.ts                    Shared: SourceType, EvidenceItem, Page, NavContext
└── components/
    ├── TopNav.tsx              TopBar (BrandRow + NavRow)
    ├── EvidenceDrawer.tsx      RightDrawer (shared overlay)
    ├── Dashboard.tsx           Page / Dashboard
    ├── FileLibrary.tsx         Page / File Library
    ├── Summaries.tsx           Page / Summaries (all 5 tabs + FilterPanel)
    ├── AskAI.tsx               Page / Ask AI
    ├── Alerts.tsx              Page / Alerts
    └── Settings.tsx            Page / Settings
```

---

## Scrollbar Tokens (globals.css)

```css
track:        #e5e7eb
thumb:        rgba(22,163,74,0.35)
thumb-hover:  #16a34a
width:        6px
border-radius: 999px
```
