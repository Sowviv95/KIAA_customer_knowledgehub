import { X, Database, MousePointerClick, Navigation, Info, Code } from "lucide-react";
import { Page } from "../types";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Annotation data ──────────────────────────────────────────────────────────

interface PageAnnotation {
  purpose: string;
  data: string[];
  actions: { label: string; note: string }[];
  navigation: string[];
}

const annotations: Record<Page, PageAnnotation> = {
  dashboard: {
    purpose: "Entry point showing customer update status and what needs immediate attention across the LSEG RI project.",
    data: [
      "filesIndexed: number — total files in watched folder",
      "newCustomerInputs: number — files added in last 24h",
      "openAlerts: number + severity breakdown",
      "openFollowUps: number + overdue count",
      "recentUpdates: { file, sourceType, action, topic, time }[]",
      "trackedTopics: string[] — chip labels",
    ],
    actions: [
      { label: "KPI card click",      note: "navigateTo(page, ctx) — each card has a target page and optional filter context" },
      { label: "Topic chip click",    note: "navigateTo('summaries', { summariesTab: 'topics', summariesTopic: label })" },
      { label: "Recent update click", note: "navigateTo('summaries', { summariesTab: 'timeline' })" },
      { label: "Open Ask AI button",  note: "navigateTo('ask') — no context pre-set" },
    ],
    navigation: [
      "Files Indexed → File Library (no filter)",
      "New Customer Inputs → File Library (filter: customer-provided)",
      "Open Alerts → Alerts (filter: status=New)",
      "Open Follow-ups → Summaries > Requirements tab",
      "Topic chip → Summaries > Tracked Topics (topic pre-selected)",
      "Recent update row → Summaries > Timeline tab",
    ],
  },

  files: {
    purpose: "Lists all indexed local files. Primary browsing surface for finding and acting on customer-provided documents, schemas, and source lists.",
    data: [
      "name: string — full file name",
      "type: FileType — DOCX | YAML | XLSX | PPTX | MSG | PDF | JSON | EML",
      "category: string — RFP | Meeting Notes | Email | Schema | Source List | Deck",
      "customerRelevance: CustomerRelevance — Customer Provided | Meeting Note | Email Export | Internal Deck | Schema | Source List | Reference",
      "updated: string — ISO date",
      "summaryStatus: SummaryStatus — Done | Pending | In Progress | Skipped",
      "tags: string[]",
      "excerpt: string — short AI-generated summary",
      "topic: string — linked tracked topic",
    ],
    actions: [
      { label: "View Summary",  note: "navigateTo('summaries', { summariesTab: 'files' }) — opens File Summaries tab with this file selected" },
      { label: "View Evidence", note: "openDrawer(EvidenceItem) — slides in SourceEvidenceDrawer from the right" },
      { label: "Ask AI",        note: "openAsk('Evidence — {filename}') — opens Ask AI with file as context pill" },
      { label: "Search / filter", note: "Local state: search string + selectedCategory + selectedType — all client-side filtering" },
    ],
    navigation: [
      "View Summary → Summaries > File Summaries tab",
      "View Evidence → EvidenceDrawer overlay (no page change)",
      "Ask AI → Ask AI page with ContextPill showing filename",
    ],
  },

  summaries: {
    purpose: "Project-level summary hub. Summary-type-first (not file-first). Five top tabs each provide a different synthesis view over customer files.",
    data: [
      "Executive Brief: understanding, latestUpdates, confirmedRequirements, openQuestions, followUps, risks, evidence",
      "Timeline: { date, time, source, file, topic, summary, excerpt }[] — sorted descending by date",
      "Tracked Topics: { name, understanding, updates, questions, evidence }[] — accordion cards",
      "Requirements: { text, status, topic, updated, source, file, excerpt }[] — filterable table",
      "File Summaries: fileList[] — left-panel selector + per-file detail with inner tabs",
    ],
    actions: [
      { label: "Top tab switch",       note: "setActiveTab(id) — local state, no URL change" },
      { label: "Timeline item click",  note: "openDrawer(EvidenceItem) — opens SourceEvidenceDrawer" },
      { label: "Topic card expand",    note: "setSelectedTopic(name) — accordion toggle in local state" },
      { label: "Req: View Evidence",   note: "openDrawer(EvidenceItem) built from requirement row data" },
      { label: "Req: Ask AI",          note: "openAsk('Requirement — {text}')" },
      { label: "File: View Evidence",  note: "openDrawer(EvidenceItem) from selected file" },
      { label: "File: Ask AI",         note: "openAsk('Evidence — {filename}')" },
      { label: "Filters toggle",       note: "setShowFilters(bool) — show/hide 200px right FilterPanel" },
      { label: "Topic: Ask AI button", note: "openAsk('Context: {topicName}')" },
    ],
    navigation: [
      "initialTab prop sets the default active tab (from Dashboard KPI or nav context)",
      "initialTopic prop pre-selects a Tracked Topic (from Dashboard chip click)",
      "EvidenceDrawer opens as fixed overlay — no page change",
      "Ask AI opens Ask AI page with ContextPill",
    ],
  },

  ask: {
    purpose: "Conversational interface for querying across all customer files. Supports scoped search and shows cited source snippets alongside answers.",
    data: [
      "messages: { role: 'user'|'assistant', text, sources? }[] — chat history",
      "scope: Scope — All Files | RFP | Meeting Notes | Emails | Schema | Decks",
      "context?: string — pre-set when launched from topic, alert, file or requirement",
      "sources: { file, snippet, confidence, page? }[] — from last assistant message",
      "relatedFiles: { name, relevance }[] — sidebar supporting files",
      "suggestedQuestions: string[] — clickable prompts below chat",
    ],
    actions: [
      { label: "Send message",           note: "send(text) — appends user message, triggers demo/AI response with sources" },
      { label: "Suggested question chip", note: "send(question) — same as typing and sending" },
      { label: "Scope selector",         note: "setScope(value) — filters the AI query scope; shown in input placeholder" },
      { label: "Context pill dismiss",   note: "setActiveContext(undefined) — clears context; pill disappears" },
      { label: "Source snippet card",    note: "Read-only — shows file name, excerpt, confidence bar" },
    ],
    navigation: [
      "context prop set by App.tsx when navigated from another page",
      "Context pill visible at top when context is set — e.g. 'Context: Schema/API'",
      "No outgoing navigation from Ask AI (terminal page for a session)",
    ],
  },

  alerts: {
    purpose: "Automated alert inbox for customer-relevant signals. Rows are actionable — each alert links to source evidence and can launch Ask AI in context.",
    data: [
      "severity: 'High' | 'Medium' | 'Low'",
      "type: AlertType — 8 types e.g. Schema/API Update Detected, SLA Mention Detected",
      "description: string — short explanation of what triggered the alert",
      "sourceFile: string — file that caused the alert",
      "sourceType: SourceType — used for EvidenceDrawer type badge",
      "topic: string — linked tracked topic",
      "status: 'New' | 'Reviewed' | 'Ignored' | 'Action'",
      "created: string — datetime string",
      "excerpt: string — relevant quote from the source file",
    ],
    actions: [
      { label: "View Evidence",     note: "openDrawer({ file, type, date, excerpt, topic }) — builds EvidenceItem from alert data" },
      { label: "Ask AI",            note: "openAsk('Alert — {alertType}') — pre-sets context pill in Ask AI" },
      { label: "Mark Reviewed",     note: "updateStatus(id, 'Reviewed') — local state update" },
      { label: "Dismiss (×)",       note: "updateStatus(id, 'Ignored') — local state update" },
      { label: "Status filter",     note: "setFilterStatus(value) — client-side filter on rendered alerts" },
      { label: "Severity filter",   note: "setFilterSeverity(value) — client-side filter on rendered alerts" },
      { label: "initialFilter prop", note: "If 'new', pre-sets status filter to 'New' on mount (from Dashboard KPI click)" },
    ],
    navigation: [
      "View Evidence → EvidenceDrawer overlay (no page change)",
      "Ask AI → Ask AI page with ContextPill showing alert type",
    ],
  },

  settings: {
    purpose: "Local configuration for the AI workbench. Controls the watched folder, AI model, embedding model, token limits, auto-summary and alert rules.",
    data: [
      "folderPath: string — local directory being watched",
      "modelProvider: string — selected LLM provider + model",
      "embeddingProvider: string — selected embedding model",
      "tokenBudget: number — max tokens per request (8k–128k)",
      "autoSummary: boolean — trigger summary on new file detection",
      "alertRules: { id, type, enabled, description }[] — configurable alert rule list",
    ],
    actions: [
      { label: "Save Changes",    note: "handleSave() — sets saved=true for 2.5s; in production: POST config to local API" },
      { label: "Re-index Folder", note: "handleReindex() — sets indexing=true for 2.2s; in production: trigger re-index job" },
      { label: "Browse folder",   note: "In production: invoke system file picker (Electron / Tauri shell API)" },
      { label: "Rule toggle",     note: "toggleRule(id, bool) — local state; update persisted config on Save" },
      { label: "Remove rule",     note: "removeRule(id) — local state removal from alertRules array" },
      { label: "Token slider",    note: "setTokenBudget(number) — controls context window per AI request" },
    ],
    navigation: [
      "No outgoing navigation — Settings is a self-contained configuration page",
    ],
  },
};

// ─── Section components ───────────────────────────────────────────────────────

function Section({ icon: Icon, color, label, children }: { icon: React.ElementType; color: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon size={12} color={color} />
        <span style={{ color, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 mb-1.5 last:mb-0">
      <span className="shrink-0 rounded-full mt-1.5" style={{ width: 4, height: 4, background: "#d1d5db", display: "inline-block" }} />
      <span style={{ color: "#374151", fontSize: "0.74rem", lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

function ActionRow({ label, note }: { label: string; note: string }) {
  return (
    <div className="mb-2 last:mb-0 rounded-lg px-3 py-2" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)" }}>
      <div style={{ color: "#0f172a", fontSize: "0.74rem", fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: "#6b7280", fontSize: "0.70rem", lineHeight: 1.5, fontFamily: "monospace" }}>{note}</div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface DevAnnotationsProps {
  page: Page;
  onClose: () => void;
}

export function DevAnnotations({ page, onClose }: DevAnnotationsProps) {
  const a = annotations[page];
  const pageLabel = {
    dashboard: "Dashboard",
    files:     "File Library",
    summaries: "Summaries",
    ask:       "Ask AI",
    alerts:    "Alerts",
    settings:  "Settings",
  }[page];

  return (
    <aside
      className="flex flex-col h-full overflow-hidden shrink-0"
      style={{
        width: 272,
        minWidth: 272,
        background: "#fafbfc",
        borderLeft: "1px solid rgba(0,0,0,0.08)",
        fontFamily: FF,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded flex items-center justify-center" style={{ background: "rgba(100,116,139,0.10)", width: 24, height: 24 }}>
            <Code size={13} color="#64748b" />
          </div>
          <div>
            <div style={{ color: "#0f172a", fontSize: "0.78rem", fontWeight: 700 }}>Developer Notes</div>
            <div style={{ color: "#9ca3af", fontSize: "0.62rem" }}>{pageLabel}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1"
          style={{ color: "#9ca3af" }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Purpose */}
        <Section icon={Info} color="#2563eb" label="Purpose">
          <p style={{ color: "#374151", fontSize: "0.78rem", lineHeight: 1.65 }}>{a.purpose}</p>
        </Section>

        {/* Data */}
        <Section icon={Database} color="#7c3aed" label="Data Needed">
          {a.data.map((d, i) => <Bullet key={i}>{d}</Bullet>)}
        </Section>

        {/* Actions */}
        <Section icon={MousePointerClick} color="#d97706" label="User Actions">
          {a.actions.map((act, i) => (
            <ActionRow key={i} label={act.label} note={act.note} />
          ))}
        </Section>

        {/* Navigation */}
        <Section icon={Navigation} color="#16a34a" label="Navigation">
          {a.navigation.map((n, i) => <Bullet key={i}>{n}</Bullet>)}
        </Section>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#ffffff" }}
      >
        <div style={{ color: "#9ca3af", fontSize: "0.62rem", lineHeight: 1.5 }}>
          Maps to <code style={{ background: "#f0f4f8", padding: "1px 4px", borderRadius: 3, fontSize: "0.60rem" }}>HANDOFF.md</code>.
          Use the <strong style={{ color: "#475569" }}>States</strong> button in the top bar to view all interaction states.
        </div>
      </div>
    </aside>
  );
}
