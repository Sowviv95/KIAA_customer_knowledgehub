/**
 * StateShowcase — visual reference for all interaction states.
 * Accessible via the DEV toggle in the top bar.
 * Shows every component in every state: Default, Hover, Selected, Disabled, Empty, Loading, Error.
 */

import { useState } from "react";
import {
  Files, Bell, CheckSquare, FilePlus, Eye, MessageSquare,
  FolderOpen, Tag, Database, X, AlertTriangle, RefreshCw, BookOpen,
} from "lucide-react";
import { SourceBadge } from "./ui/SourceBadge";
import { StatusBadge } from "./ui/StatusBadge";
import { EmptyState } from "./ui/EmptyState";
import { LoadingState, InlineLoader } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";
import { ContextPill } from "./ui/ContextPill";
import { ButtonPrimary, ButtonSecondary, ButtonGhost, ButtonFlat, ButtonLoading } from "./ui/Button";
import { SeverityBadge } from "./alerts/SeverityBadge";
import { AlertStatusBadge } from "./alerts/AlertStatusBadge";
import { AlertTypeBadge } from "./alerts/AlertTypeBadge";
import { FileTypeBadge } from "./file-library/FileTypeBadge";
import { CustomerRelevanceBadge } from "./file-library/CustomerRelevanceBadge";
import { SummaryStatusBadge } from "./file-library/SummaryStatusBadge";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-10">
      <div className="mb-4 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <h2 style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: 700, marginBottom: 4 }}>{title}</h2>
        {description && <p style={{ color: "#6b7280", fontSize: "0.78rem" }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function StateGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

function StateItem({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      {children}
      <div>
        <div style={{ color: "#374151", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
        {note && <div style={{ color: "#9ca3af", fontSize: "0.62rem", marginTop: 1 }}>{note}</div>}
      </div>
    </div>
  );
}

// ─── Simulated states (static representations of hover/focus) ─────────────────

/** Renders a nav tab in a given visual state */
function NavTab({ label, state }: { label: string; state: "default" | "hover" | "active" }) {
  const isActive = state === "active";
  const isHover = state === "hover";
  return (
    <div
      className="px-4 py-2.5 border-b-2"
      style={{
        borderColor: isActive ? "#16a34a" : "transparent",
        color: isActive ? "#16a34a" : isHover ? "#0f172a" : "#6b7280",
        fontSize: "0.82rem",
        fontWeight: isActive ? 600 : 400,
        background: isHover ? "rgba(0,0,0,0.02)" : "transparent",
        cursor: "default",
      }}
    >
      {label}
    </div>
  );
}

/** Renders a KPI card in a given visual state */
function KpiCardState({ state }: { state: "default" | "hover" | "loading" }) {
  if (state === "loading") {
    return (
      <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", width: 200 }}>
        <div className="rounded-lg shrink-0" style={{ width: 32, height: 32, background: "#e5e7eb" }} />
        <div className="flex-1">
          <div className="rounded" style={{ height: 14, background: "#e5e7eb", marginBottom: 6 }} />
          <div className="rounded" style={{ height: 10, background: "#f1f5f9", width: "60%" }} />
        </div>
      </div>
    );
  }
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: "#ffffff",
        border: state === "hover" ? "1px solid rgba(22,163,74,0.30)" : "1px solid rgba(0,0,0,0.06)",
        boxShadow: state === "hover" ? "0 2px 8px rgba(22,163,74,0.08)" : "none",
        width: 200,
      }}
    >
      <div className="rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.08)", width: 32, height: 32 }}>
        <Files size={15} color="#16a34a" />
      </div>
      <div>
        <div style={{ color: "#0f172a", fontSize: "1.1rem", fontWeight: 700 }}>142</div>
        <div style={{ color: "#6b7280", fontSize: "0.74rem" }}>Files Indexed</div>
      </div>
    </div>
  );
}

/** Table row states */
function TableRowState({ state }: { state: "default" | "hover" | "selected" | "disabled" | "error" }) {
  const bg = state === "hover" ? "#f0fdf4" : state === "selected" ? "rgba(22,163,74,0.06)" : state === "error" ? "rgba(220,38,38,0.04)" : "#ffffff";
  const border = state === "selected" ? "2px solid rgba(22,163,74,0.3)" : state === "error" ? "2px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.04)";

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg"
      style={{ background: bg, border, opacity: state === "disabled" ? 0.4 : 1, width: 360 }}
    >
      <div className="rounded flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.08)", width: 26, height: 26 }}>
        <FolderOpen size={12} color="#2563eb" />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ color: "#1e293b", fontSize: "0.78rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          RFP_Data_Sources_Phase1.docx
        </div>
        <div style={{ color: "#9ca3af", fontSize: "0.70rem" }}>Document · 2026-06-14</div>
      </div>
      {state === "error" && <AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0 }} />}
      {state === "selected" && <div className="rounded-full" style={{ width: 8, height: 8, background: "#16a34a", flexShrink: 0 }} />}
    </div>
  );
}

/** Tracked topic chip states */
function ChipState({ label, state }: { label: string; state: "default" | "hover" | "selected" | "disabled" }) {
  if (state === "selected") {
    return (
      <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.40)", color: "#16a34a", fontSize: "0.78rem", fontWeight: 600 }}>
        {label}
      </div>
    );
  }
  if (state === "hover") {
    return (
      <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.30)", color: "#16a34a", fontSize: "0.78rem" }}>
        {label}
      </div>
    );
  }
  if (state === "disabled") {
    return (
      <div className="px-3 py-1.5 rounded-full" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)", color: "#9ca3af", fontSize: "0.78rem", opacity: 0.45 }}>
        {label}
      </div>
    );
  }
  return (
    <div className="px-3 py-1.5 rounded-full" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)", color: "#374151", fontSize: "0.78rem" }}>
      {label}
    </div>
  );
}

// ─── Main showcase ────────────────────────────────────────────────────────────

const sections = [
  { id: "nav",      label: "Nav Tabs" },
  { id: "kpi",      label: "KPI Cards" },
  { id: "chips",    label: "Topic Chips" },
  { id: "tabs",     label: "Summary Tabs" },
  { id: "rows",     label: "Table Rows" },
  { id: "buttons",  label: "Buttons" },
  { id: "badges",   label: "Badges" },
  { id: "pills",    label: "Context Pills" },
  { id: "drawer",   label: "Evidence Drawer" },
  { id: "empty",    label: "Empty States" },
  { id: "loading",  label: "Loading States" },
  { id: "error",    label: "Error States" },
];

export function StateShowcase() {
  const [dismissedPill, setDismissedPill] = useState(false);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      {/* Sticky left nav */}
      <nav
        className="shrink-0 overflow-y-auto py-6 px-4"
        style={{ width: 160, background: "#ffffff", borderRight: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
          Sections
        </div>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="block px-2.5 py-1.5 rounded-lg mb-0.5 transition-colors"
            style={{ color: "#374151", fontSize: "0.78rem", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(22,163,74,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: "#0f172a", fontSize: "1.1rem", fontWeight: 800, marginBottom: 6 }}>Interaction States</h1>
          <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>
            Visual reference for all component states — Default, Hover, Selected, Disabled, Empty, Loading, Error.
            Hover states are shown as static simulations (labelled "Simulated").
          </p>
        </div>

        {/* ── Nav tabs ─────────────────────────────────────── */}
        <Section id="nav" title="Navigation Tabs" description="Top bar tab strip. Active state drives current page content.">
          <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <NavTab label="Dashboard" state="active" />
              <NavTab label="File Library" state="hover" />
              <NavTab label="Summaries" state="default" />
              <NavTab label="Ask AI" state="default" />
            </div>
            <div className="flex gap-10 px-6 py-4">
              <StateItem label="Active" note="underline + #16a34a + weight 600"><NavTab label="Dashboard" state="active" /></StateItem>
              <StateItem label="Hover (simulated)" note="slightly darker text"><NavTab label="File Library" state="hover" /></StateItem>
              <StateItem label="Default" note="#6b7280, weight 400"><NavTab label="Summaries" state="default" /></StateItem>
            </div>
          </div>
        </Section>

        {/* ── KPI cards ────────────────────────────────────── */}
        <Section id="kpi" title="KPI Cards" description="Dashboard entry cards. Clickable when onClick is provided.">
          <StateGroup>
            <StateItem label="Default"><KpiCardState state="default" /></StateItem>
            <StateItem label="Hover (simulated)" note="green border + soft shadow"><KpiCardState state="hover" /></StateItem>
            <StateItem label="Loading" note="skeleton shimmer"><KpiCardState state="loading" /></StateItem>
          </StateGroup>
        </Section>

        {/* ── Topic chips ──────────────────────────────────── */}
        <Section id="chips" title="Tracked Topic Chips" description="Dashboard chip grid. Click navigates to Summaries > Tracked Topics with topic pre-selected.">
          <StateGroup>
            <StateItem label="Default"><ChipState label="Schema/API" state="default" /></StateItem>
            <StateItem label="Hover (simulated)" note="green tint border"><ChipState label="Schema/API" state="hover" /></StateItem>
            <StateItem label="Selected" note="active filter — darker green fill"><ChipState label="Schema/API" state="selected" /></StateItem>
            <StateItem label="Disabled" note="opacity 0.45, cursor not-allowed"><ChipState label="Schema/API" state="disabled" /></StateItem>
          </StateGroup>
        </Section>

        {/* ── Summary tabs ─────────────────────────────────── */}
        <Section id="tabs" title="Summary Tabs" description="Top tab strip on the Summaries page. Controls active content view.">
          <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              {["Executive Brief", "Timeline", "Tracked Topics", "Requirements", "File Summaries"].map((t, i) => (
                <div key={t} className="px-5 py-3 border-b-2"
                  style={{ borderColor: i === 0 ? "#16a34a" : "transparent", color: i === 0 ? "#16a34a" : "#6b7280", fontSize: "0.82rem", fontWeight: i === 0 ? 600 : 400, whiteSpace: "nowrap" }}>
                  {t}
                </div>
              ))}
            </div>
            <div className="flex gap-10 px-6 py-4">
              <StateItem label="Active" note="#16a34a underline + weight 600">
                <div className="px-4 py-2.5 border-b-2" style={{ borderColor: "#16a34a", color: "#16a34a", fontSize: "0.82rem", fontWeight: 600 }}>Executive Brief</div>
              </StateItem>
              <StateItem label="Default">
                <div className="px-4 py-2.5 border-b-2" style={{ borderColor: "transparent", color: "#6b7280", fontSize: "0.82rem" }}>Timeline</div>
              </StateItem>
            </div>
          </div>
        </Section>

        {/* ── Table rows ───────────────────────────────────── */}
        <Section id="rows" title="Table Rows" description="Used in File Library, Alerts, Requirements. hover:bg-green-50 applied via className.">
          <div className="flex flex-col gap-2" style={{ maxWidth: 400 }}>
            {(["default", "hover", "selected", "disabled", "error"] as const).map((s) => (
              <div key={s} className="flex items-center gap-3">
                <TableRowState state={s} />
                <div style={{ color: "#374151", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{s}{s === "hover" ? " (sim)" : ""}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ──────────────────────────────────────── */}
        <Section id="buttons" title="Buttons" description="Four variants × four states. Ghost and Flat share the same size spec but different colours.">
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Primary */}
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>ButtonPrimary</div>
              <div className="flex flex-wrap gap-3 items-center">
                <StateItem label="Default"><ButtonPrimary size="sm">Save Changes</ButtonPrimary></StateItem>
                <StateItem label="Hover (sim)"><button className="inline-flex items-center gap-1.5 rounded-lg" style={{ background: "#15803d", color: "#fff", fontSize: "0.74rem", fontWeight: 600, padding: "6px 12px", border: "none" }}>Save Changes</button></StateItem>
                <StateItem label="Disabled"><ButtonPrimary size="sm" disabled>Save Changes</ButtonPrimary></StateItem>
                <StateItem label="Loading"><ButtonLoading size="sm">Saving</ButtonLoading></StateItem>
              </div>
            </div>

            {/* Secondary */}
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>ButtonSecondary</div>
              <div className="flex flex-wrap gap-3 items-center">
                <StateItem label="Default"><ButtonSecondary size="sm">Re-index</ButtonSecondary></StateItem>
                <StateItem label="Hover (sim)"><button className="inline-flex items-center gap-1.5 rounded-lg" style={{ background: "#f8fafc", color: "#0f172a", fontSize: "0.74rem", fontWeight: 500, padding: "6px 12px", border: "1px solid rgba(0,0,0,0.18)" }}>Re-index</button></StateItem>
                <StateItem label="Disabled"><ButtonSecondary size="sm" disabled>Re-index</ButtonSecondary></StateItem>
              </div>
            </div>

            {/* Ghost */}
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>ButtonGhost</div>
              <div className="flex flex-wrap gap-3 items-center">
                <StateItem label="Default"><ButtonGhost size="sm"><Eye size={11} /> Evidence</ButtonGhost></StateItem>
                <StateItem label="Hover (sim)"><button className="inline-flex items-center gap-1 rounded" style={{ background: "rgba(22,163,74,0.15)", color: "#16a34a", fontSize: "0.74rem", fontWeight: 500, padding: "4px 10px", border: "1px solid rgba(22,163,74,0.35)" }}><Eye size={11} /> Evidence</button></StateItem>
                <StateItem label="Disabled"><ButtonGhost size="sm" disabled><Eye size={11} /> Evidence</ButtonGhost></StateItem>
              </div>
            </div>

            {/* Flat */}
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>ButtonFlat</div>
              <div className="flex flex-wrap gap-3 items-center">
                <StateItem label="Default"><ButtonFlat size="sm"><MessageSquare size={11} /> Ask AI</ButtonFlat></StateItem>
                <StateItem label="Hover (sim)"><button className="inline-flex items-center gap-1 rounded" style={{ background: "#e2e8f0", color: "#1e293b", fontSize: "0.74rem", padding: "4px 10px", border: "1px solid rgba(0,0,0,0.12)" }}><MessageSquare size={11} /> Ask AI</button></StateItem>
                <StateItem label="Disabled"><ButtonFlat size="sm" disabled><MessageSquare size={11} /> Ask AI</ButtonFlat></StateItem>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Badges ───────────────────────────────────────── */}
        <Section id="badges" title="Badges" description="Read-only status indicators. All variants shown.">
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>SeverityBadge</div>
              <div className="flex flex-col gap-2">
                <StateItem label="High"><SeverityBadge severity="High" /></StateItem>
                <StateItem label="Medium"><SeverityBadge severity="Medium" /></StateItem>
                <StateItem label="Low"><SeverityBadge severity="Low" /></StateItem>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>AlertStatusBadge</div>
              <div className="flex flex-col gap-2">
                <StateItem label="New"><AlertStatusBadge status="New" /></StateItem>
                <StateItem label="Reviewed"><AlertStatusBadge status="Reviewed" /></StateItem>
                <StateItem label="Action"><AlertStatusBadge status="Action" /></StateItem>
                <StateItem label="Ignored"><AlertStatusBadge status="Ignored" /></StateItem>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>SourceBadge</div>
              <div className="flex flex-col gap-2">
                {(["Meeting", "Email", "Document", "Schema", "Source List", "Deck"] as const).map((t) => (
                  <StateItem key={t} label={t}><SourceBadge type={t} size="md" /></StateItem>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>SummaryStatusBadge</div>
              <div className="flex flex-col gap-2">
                {(["Done", "In Progress", "Pending", "Skipped"] as const).map((s) => (
                  <StateItem key={s} label={s}><SummaryStatusBadge status={s} /></StateItem>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>FileTypeBadge</div>
              <div className="flex flex-col gap-2">
                {(["DOCX", "YAML", "XLSX", "PPTX", "MSG", "PDF"] as const).map((t) => (
                  <StateItem key={t} label={t}><FileTypeBadge type={t} variant="label" /></StateItem>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>CustomerRelevanceBadge</div>
              <div className="flex flex-col gap-2">
                {(["Customer Provided", "Meeting Note", "Email Export", "Internal Deck", "Schema", "Source List", "Reference"] as const).map((r) => (
                  <StateItem key={r} label={r}><CustomerRelevanceBadge relevance={r} /></StateItem>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Context pills ────────────────────────────────── */}
        <Section id="pills" title="Context Pills" description="Shown at the top of Ask AI when launched with context. Dismissible with ×.">
          <StateGroup>
            <StateItem label="Default (no dismiss)"><ContextPill label="Context: Schema/API" /></StateItem>
            <StateItem label="With dismiss" note="onDismiss → clears context">
              {dismissedPill
                ? <span style={{ color: "#9ca3af", fontSize: "0.74rem" }}>(dismissed — reload to reset)</span>
                : <ContextPill label="Alert — SLA Mention Detected" onDismiss={() => setDismissedPill(true)} />}
            </StateItem>
            <StateItem label="Requirement context"><ContextPill label="Requirement — API conformance to swagger" /></StateItem>
            <StateItem label="Evidence context"><ContextPill label="Evidence — RFP_Data_Sources_Phase1.docx" /></StateItem>
          </StateGroup>
        </Section>

        {/* ── Evidence Drawer ──────────────────────────────── */}
        <Section id="drawer" title="Source Evidence Drawer" description="Slides in from the right as a fixed overlay. Shown here as an inline preview.">
          <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", maxWidth: 380 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Source Evidence</div>
              <button className="p-1 rounded" style={{ color: "#9ca3af" }}><X size={16} /></button>
            </div>
            {/* File card */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.08)", width: 34, height: 34 }}>
                  <FolderOpen size={15} color="#16a34a" />
                </div>
                <div>
                  <div style={{ color: "#1e293b", fontSize: "0.82rem", fontWeight: 600 }}>RI_data_source_schema_swagger-1.0.5.yaml</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <SourceBadge type="Schema" />
                    <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>2026-06-15</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Excerpt */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Relevant Excerpt</div>
              <div className="rounded-lg px-4 py-3" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", borderLeft: "3px solid #16a34a" }}>
                <p style={{ color: "#374151", fontSize: "0.8rem", lineHeight: 1.75, fontStyle: "italic" }}>
                  "countryCode: ISO 3166-1 alpha-2 required. sourceStatus (enum: active|suspended|delisted) is now a required field."
                </p>
              </div>
            </div>
            {/* Topic */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Related Tracked Topic</div>
              <div className="flex items-center gap-2">
                <Tag size={12} color="#16a34a" />
                <span className="px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.78rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>Schema/API</span>
              </div>
            </div>
            {/* Actions */}
            <div className="px-5 py-4">
              <div className="flex flex-col gap-2">
                <ButtonPrimary size="sm"><MessageSquare size={13} /> Ask AI about this</ButtonPrimary>
                <div className="flex gap-2">
                  <ButtonSecondary size="sm"><Database size={12} /> Open File</ButtonSecondary>
                  <ButtonSecondary size="sm"><CheckSquare size={12} /> Mark Reviewed</ButtonSecondary>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Empty states ─────────────────────────────────── */}
        <Section id="empty" title="Empty States" description="Shown when a list or table has no items. Includes context-specific copy.">
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>File Library — no folder</span>
              </div>
              <EmptyState
                icon={<FolderOpen size={28} />}
                title="No files indexed yet"
                description="No customer inputs indexed yet. Add a local folder in Settings to start watching for files."
              />
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>File Library — no matches</span>
              </div>
              <EmptyState
                icon={<FolderOpen size={28} />}
                title="No files match your filters"
                description="Try adjusting your search or filter criteria."
              />
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Alerts — none yet</span>
              </div>
              <EmptyState
                icon={<Bell size={28} />}
                title="No alerts yet"
                description="Alerts will appear here when new customer files, schema changes or SLA mentions are detected."
              />
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ask AI — no sources</span>
              </div>
              <EmptyState
                icon={<BookOpen size={28} />}
                title="No sources cited yet"
                description="Source citations appear here after you ask a question."
              />
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Requirements — filtered empty</span>
              </div>
              <EmptyState
                icon={<CheckSquare size={28} />}
                title="No requirements match"
                description="Change the status filter to show Confirmed, Open, Changed, Assumption or Superseded requirements."
              />
            </div>
          </div>
        </Section>

        {/* ── Loading states ───────────────────────────────── */}
        <Section id="loading" title="Loading States" description="Skeleton patterns and inline loaders. Use LoadingState for tables/cards, InlineLoader for inline AI responses.">
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Table / list skeleton</span>
              </div>
              <LoadingState label="Indexing files…" rows={4} />
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Inline AI loader</div>
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center" style={{ background: "#16a34a", width: 30, height: 30 }}>
                  <Database size={13} color="#fff" />
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <InlineLoader />
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>KPI card skeleton</div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="rounded-lg shrink-0" style={{ width: 32, height: 32, background: "#e5e7eb" }} />
                    <div className="flex-1">
                      <div className="rounded" style={{ height: 14, background: "#e5e7eb", marginBottom: 6 }} />
                      <div className="rounded" style={{ height: 10, background: "#f1f5f9", width: "60%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>ButtonLoading</div>
              <div className="flex items-center gap-3">
                <StateItem label="Primary loading"><ButtonLoading size="md">Saving…</ButtonLoading></StateItem>
                <StateItem label="Small"><ButtonLoading size="sm">Indexing</ButtonLoading></StateItem>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Error states ─────────────────────────────────── */}
        <Section id="error" title="Error States" description="Subtle, enterprise-friendly. Inline variant for form/row errors. Page variant for full-area failures.">
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Inline error</div>
              <ErrorState variant="inline" title="Failed to load files" description="Could not connect to the local folder. Check the folder path in Settings." onRetry={() => {}} />
              <ErrorState variant="inline" title="Schema validation failed" description="RI_data_source_schema_swagger-1.0.5.yaml could not be parsed." />
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Page error</span>
              </div>
              <ErrorState
                variant="page"
                title="Could not load summaries"
                description="The summarisation service is unavailable. Check your model provider settings or try again."
                onRetry={() => {}}
              />
            </div>
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
