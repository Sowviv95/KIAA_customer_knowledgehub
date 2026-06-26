import { useState, useEffect, useCallback } from "react";
import {
  FileText, CheckCircle, AlertCircle, Clock, Download, Search,
  RefreshCw, ChevronDown, ChevronUp, SlidersHorizontal, Calendar,
  MessageSquare, Mail, Presentation, Database, List, X, Eye, Tag,
  Filter, Plus, Check, Loader2, ClipboardList,
} from "lucide-react";
import { EvidenceItem, SourceType, Page, NavContext, Role, ReqStatus, Priority } from "../types";
import { roleConfig } from "../roleConfig";
import { EmptyState } from "./ui/EmptyState";
import { getActions, createAction, updateAction, type BackendAction } from "../api/actionsApi";
import { getRequirements, createRequirement, updateRequirement, type BackendRequirement } from "../api/requirementsApi";
import { getTopicSummary, type TopicSummaryItem } from "../api/topicsApi";
import { getTimelineEvents, type TimelineEvent } from "../api/timelineApi";
import { listChangeLog, type ChangeLogEvent } from "../api/changeLogApi";
import { getDashboardStats, type DashboardStats } from "../api/dashboardApi";
import { apiGet } from "../api/client";
import { downloadCsv, downloadMarkdown } from "../api/exportUtils";
import {
  getAIStatus, extractAICandidates, listAICandidates, reviewAICandidate,
  convertCandidateToRequirement, convertCandidateToAction,
  type AIStatus, type AIUpdateCandidate,
} from "../api/aiCandidatesApi";

interface FileSummaryItem {
  id: number; name: string; file_type: string; category: string;
  customer_relevance: string; summary_status: string;
  indexed_at: string; updated_at: string;
  chunk_count: number; first_chunk_excerpt: string | null; alert_count: number;
}

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Source styling ───────────────────────────────────────────────────────────

const sourceStyle: Record<SourceType, { bg: string; text: string; icon: React.ElementType }> = {
  Meeting:       { bg: "rgba(59,130,246,0.08)",  text: "#2563eb", icon: MessageSquare },
  Email:         { bg: "rgba(14,165,233,0.08)",  text: "#0284c7", icon: Mail },
  Document:      { bg: "rgba(22,163,74,0.08)",   text: "#16a34a", icon: FileText },
  Deck:          { bg: "rgba(217,119,6,0.08)",   text: "#d97706", icon: Presentation },
  Schema:        { bg: "rgba(139,92,246,0.08)",  text: "#7c3aed", icon: Database },
  "Source List": { bg: "rgba(107,114,128,0.08)", text: "#4b5563", icon: List },
};

function SourceBadge({ type }: { type: SourceType }) {
  const s = sourceStyle[type];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text, fontSize: "0.66rem", fontWeight: 600 }}>
      <Icon size={10} /> {type}
    </span>
  );
}

const reqStatusStyle: Record<ReqStatus, { bg: string; text: string }> = {
  Confirmed:  { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  Open:       { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
  Changed:    { bg: "rgba(220,38,38,0.08)",  text: "#dc2626" },
  Assumption: { bg: "rgba(139,92,246,0.08)", text: "#7c3aed" },
  Superseded: { bg: "rgba(0,0,0,0.05)",      text: "#9ca3af" },
};

const priorityStyle: Record<Priority, { bg: string; text: string }> = {
  High:   { bg: "rgba(220,38,38,0.08)", text: "#dc2626" },
  Medium: { bg: "rgba(217,119,6,0.08)", text: "#d97706" },
  Low:    { bg: "rgba(22,163,74,0.08)", text: "#16a34a" },
};

// ─── Filter panel ─────────────────────────────────────────────────────────────

const allSourceTypes: SourceType[] = ["Meeting", "Email", "Document", "Deck", "Schema", "Source List"];
const allTopicNames = [
  "Scope", "Source List", "Schema/API", "SLA", "Monitoring Cadence",
  "Alerts", "Reports", "Support Model", "Commercials", "Open Questions", "Meeting Notes",
];

interface Filters {
  sourceTypes: SourceType[];
  customerOnly: boolean;
  includeDecks: boolean;
  topics: string[];
  freshness: "all" | "7d" | "30d";
}

const defaultFilters: Filters = { sourceTypes: allSourceTypes, customerOnly: false, includeDecks: true, topics: [], freshness: "all" };

function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const toggleSrc = (t: SourceType) => {
    const next = filters.sourceTypes.includes(t) ? filters.sourceTypes.filter((s) => s !== t) : [...filters.sourceTypes, t];
    onChange({ ...filters, sourceTypes: next });
  };
  const toggleTopic = (t: string) => {
    const next = filters.topics.includes(t) ? filters.topics.filter((s) => s !== t) : [...filters.topics, t];
    onChange({ ...filters, topics: next });
  };
  return (
    <div className="overflow-y-auto px-4 py-4" style={{ width: 200, minWidth: 200, background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5" style={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: 700 }}>
          <SlidersHorizontal size={13} color="#16a34a" /> Filters
        </div>
        <button onClick={() => onChange(defaultFilters)} style={{ color: "#9ca3af", fontSize: "0.66rem" }}>Reset</button>
      </div>

      <div className="mb-5">
        <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Source Type</div>
        {allSourceTypes.map((t) => {
          const s = sourceStyle[t]; const Icon = s.icon; const active = filters.sourceTypes.includes(t);
          return (
            <button key={t} onClick={() => toggleSrc(t)} className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg mb-1 text-left"
              style={{ background: active ? s.bg : "transparent", border: `1px solid ${active ? "rgba(0,0,0,0.06)" : "transparent"}` }}>
              <Icon size={11} color={active ? s.text : "#9ca3af"} />
              <span style={{ fontSize: "0.76rem", color: active ? s.text : "#6b7280", fontWeight: active ? 600 : 400 }}>{t}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-5">
        <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Options</div>
        {([["customerOnly", "Customer-provided only"], ["includeDecks", "Include internal decks"]] as const).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between mb-3">
            <span style={{ color: "#374151", fontSize: "0.76rem" }}>{label}</span>
            <button onClick={() => onChange({ ...filters, [key]: !filters[key] })} className="rounded-full flex items-center"
              style={{ width: 34, height: 18, background: filters[key] ? "#16a34a" : "#e5e7eb", padding: 2, flexShrink: 0 }}>
              <span className="rounded-full" style={{ width: 14, height: 14, background: "#fff", display: "block", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transform: filters[key] ? "translateX(16px)" : "translateX(0)", transition: "transform 0.15s" }} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Freshness</div>
        {([["all", "All time"], ["7d", "Last 7 days"], ["30d", "Last 30 days"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => onChange({ ...filters, freshness: val })} className="w-full text-left px-2.5 py-1.5 rounded-lg mb-1 transition-colors"
            style={{ background: filters.freshness === val ? "rgba(22,163,74,0.08)" : "transparent", color: filters.freshness === val ? "#16a34a" : "#6b7280", fontSize: "0.76rem", fontWeight: filters.freshness === val ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      <div>
        <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Tracked Topic</div>
        {allTopicNames.map((t) => {
          const active = filters.topics.includes(t);
          return (
            <button key={t} onClick={() => toggleTopic(t)} className="w-full text-left px-2.5 py-1.5 rounded-lg mb-0.5 transition-colors"
              style={{ background: active ? "rgba(22,163,74,0.08)" : "transparent", color: active ? "#16a34a" : "#6b7280", fontSize: "0.74rem", fontWeight: active ? 600 : 400 }}>
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl overflow-hidden ${className}`} style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>{children}</div>;
}
function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>{title}</div>
      {sub && <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Tab views ────────────────────────────────────────────────────────────────

function RequirementsView({ onOpenDrawer, onOpenAsk, highlightedTopics, filters }: { onOpenDrawer: (e: EvidenceItem) => void; onOpenAsk: (ctx: string) => void; highlightedTopics: string[]; filters: Filters }) {
  const [statusFilter, setStatusFilter] = useState<ReqStatus | "All">("All");
  const [backendReqs, setBackendReqs] = useState<BackendRequirement[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newText, setNewText] = useState("");
  const [newStatus, setNewStatus] = useState<ReqStatus>("Open");
  const [newTopic, setNewTopic] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReqs = useCallback(async () => {
    try {
      const data = await getRequirements();
      setBackendReqs(data);
    } catch {
      setBackendReqs(null);
    }
  }, []);

  useEffect(() => { loadReqs(); }, [loadReqs]);

  // Backend requirements only
  type MergedReq = { id?: number; text: string; status: ReqStatus; topic: string; updated: string; source: SourceType; file: string; excerpt: string; isBackend: boolean };
  const mergedReqs: MergedReq[] = [
    ...(backendReqs || []).map((r): MergedReq => ({
      id: r.id, text: r.text,
      status: (["Confirmed","Open","Changed","Assumption","Superseded"].includes(r.status) ? r.status : "Open") as ReqStatus,
      topic: r.topic || "", updated: r.updated_at.slice(0, 10),
      source: (r.source_type && r.source_type in sourceStyle ? r.source_type : "Document") as SourceType,
      file: r.source_file || "", excerpt: r.excerpt || r.text, isBackend: true,
    })),
  ];

  const filtered = mergedReqs.filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (!filters.sourceTypes.includes(r.source)) return false;
    if (filters.topics.length > 0 && r.topic && !filters.topics.includes(r.topic)) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      await createRequirement({ text: newText.trim(), status: newStatus, topic: newTopic || undefined });
      setNewText(""); setNewTopic(""); setNewStatus("Open"); setShowCreate(false);
      await loadReqs();
    } catch { /* keep form open on error */ }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newSt: ReqStatus) => {
    try {
      await updateRequirement(id, { status: newSt });
      await loadReqs();
    } catch { /* silently fail */ }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span style={{ color: "#6b7280", fontSize: "0.74rem" }}>Status:</span>
        {(["All", "Confirmed", "Open", "Changed", "Assumption", "Superseded"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1 rounded-full transition-colors"
            style={{ background: statusFilter === s ? "#16a34a" : "transparent", color: statusFilter === s ? "#fff" : "#6b7280", border: `1px solid ${statusFilter === s ? "#16a34a" : "rgba(0,0,0,0.08)"}`, fontSize: "0.74rem", fontWeight: statusFilter === s ? 600 : 400 }}>
            {s}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: "0.74rem" }}>{filtered.length} requirements</span>
        {filtered.length > 0 && (
          <button onClick={() => downloadCsv(
            ["ID", "Requirement", "Status", "Topic", "Source Type", "Source File", "Evidence Excerpt", "Last Updated"],
            filtered.map((r) => [r.id, r.text, r.status, r.topic, r.source, r.file, r.excerpt, r.updated]),
            "requirements_export",
          )} className="flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ background: "#f8fafc", color: "#6b7280", fontSize: "0.74rem", border: "1px solid rgba(0,0,0,0.08)" }}>
            <Download size={11} /> Export
          </button>
        )}
        <button onClick={() => setShowCreate((v) => !v)} className="flex items-center gap-1 px-3 py-1 rounded-full"
          style={{ background: showCreate ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
          <Plus size={12} /> Add
        </button>
      </div>

      {showCreate && (
        <div className="px-5 py-3 flex items-end gap-3 flex-wrap" style={{ background: "#fafbfc", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex-1" style={{ minWidth: 200 }}>
            <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Requirement text</label>
            <input value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="e.g. API latency must be < 500ms p99"
              className="w-full px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ReqStatus)}
              className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }}>
              {(["Open", "Confirmed", "Changed", "Assumption", "Superseded"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Topic</label>
            <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="e.g. Schema/API"
              className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none", width: 140 }} />
          </div>
          <button onClick={handleCreate} disabled={saving || !newText.trim()} className="flex items-center gap-1 px-4 py-1.5 rounded-lg"
            style={{ background: "#16a34a", color: "#fff", fontSize: "0.78rem", fontWeight: 600, opacity: saving || !newText.trim() ? 0.5 : 1 }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
          </button>
          <button onClick={() => setShowCreate(false)} style={{ color: "#9ca3af", fontSize: "0.74rem" }}>Cancel</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Filter size={28} />}
            title="No requirements match your filters"
            description="Try adjusting the status, source type or tracked topic filters, or click Reset."
          />
        )}
        {filtered.length > 0 && (
        <table className="w-full border-collapse">
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {["Requirement", "Status", "Tracked Topic", "Last Updated", "Source Evidence", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3" style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const ss = reqStatusStyle[r.status];
              const evItem: EvidenceItem = { file: r.file, type: r.source, date: r.updated, excerpt: r.excerpt, topic: r.topic };
              const isRoleRelevant = highlightedTopics.length > 0 && r.topic && highlightedTopics.includes(r.topic);
              return (
                <tr key={r.id ?? `req-${i}`} className="hover:bg-green-50 transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: isRoleRelevant ? "rgba(22,163,74,0.025)" : "#ffffff" }}>
                  <td className="px-4 py-3" style={{ maxWidth: 320 }}>
                    <div className="flex items-center gap-1.5">
                      {isRoleRelevant && <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: "#16a34a", display: "inline-block" }} />}
                      <span style={{ color: "#1e293b", fontSize: "0.8rem" }}>{r.text}</span>
                    </div>
                    {r.isBackend && r.excerpt && r.excerpt !== r.text && (
                      <div className="mt-1 px-2 py-1 rounded" style={{ background: "rgba(107,114,128,0.05)", borderLeft: "2px solid rgba(107,114,128,0.15)" }}>
                        <p style={{ color: "#6b7280", fontSize: "0.64rem", lineHeight: 1.5, fontStyle: "italic" }}>
                          {r.excerpt.length > 140 ? r.excerpt.slice(0, 140) + "..." : r.excerpt}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.isBackend && r.id ? (
                      <select value={r.status} onChange={(e) => handleStatusChange(r.id!, e.target.value as ReqStatus)}
                        className="px-2 py-0.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: ss.bg, color: ss.text, fontSize: "0.74rem", fontWeight: 600, border: "none", outline: "none" }}>
                        {(["Confirmed", "Open", "Changed", "Assumption", "Superseded"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.text, fontSize: "0.74rem", fontWeight: 600 }}>{r.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full" style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.74rem" }}>{r.topic || "—"}</span></td>
                  <td className="px-4 py-3"><span style={{ color: "#9ca3af", fontSize: "0.76rem" }}>{r.updated}</span></td>
                  <td className="px-4 py-3">
                    {r.file ? (
                      <div className="flex items-center gap-2">
                        <SourceBadge type={r.source} />
                        <span style={{ color: "#16a34a", fontSize: "0.72rem" }}>{r.file}</span>
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.72rem" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {r.file && (
                        <button onClick={() => onOpenDrawer(evItem)} className="flex items-center gap-1 px-2.5 py-1 rounded" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.72rem", border: "1px solid rgba(22,163,74,0.22)" }}>
                          <Eye size={10} /> Evidence
                        </button>
                      )}
                      <button onClick={() => onOpenAsk(`Requirement — ${r.text}`)} className="flex items-center gap-1 px-2.5 py-1 rounded" style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.72rem", border: "1px solid rgba(0,0,0,0.08)" }}>
                        <MessageSquare size={10} /> Ask AI
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

function FollowupsView({ onOpenDrawer, onOpenAsk }: { onOpenDrawer: (e: EvidenceItem) => void; onOpenAsk: (ctx: string) => void }) {
  const [actions, setActions] = useState<BackendAction[]>([]);
  const [reqs, setReqs] = useState<BackendRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([getActions(), getRequirements()]);
      setActions(a);
      setReqs(r);
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openActions = actions.filter((a) => ["Open", "In Progress", "Blocked"].includes(a.status));
  const openReqs = reqs.filter((r) => ["Open", "Changed", "Assumption"].includes(r.status));

  const handleActionDone = async (id: number) => {
    try { await updateAction(id, { status: "Done" }); await load(); } catch { /* */ }
  };
  const handleReqStatus = async (id: number, status: string) => {
    try { await updateRequirement(id, { status }); await load(); } catch { /* */ }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: "#9ca3af", fontSize: "0.82rem" }}>
          <Loader2 size={14} className="animate-spin" /> Loading follow-ups...
        </div>
      </div>
    );
  }

  const total = openActions.length + openReqs.length;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} color="#d97706" />
          <span style={{ color: "#0f172a", fontSize: "0.92rem", fontWeight: 700 }}>Open Follow-ups</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.74rem", fontWeight: 600 }}>
          {total} open
        </span>
        {openActions.length > 0 && (
          <button onClick={() => downloadCsv(
            ["ID", "Text", "Owner", "Due Date", "Priority", "Status", "Source File", "Evidence Excerpt", "Created"],
            openActions.map((a) => [a.id, a.text, a.owner, a.due_date, a.priority, a.status, a.source_file, a.excerpt, a.created_at]),
            "followups_export",
          )} className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ marginLeft: "auto", background: "#f8fafc", color: "#6b7280", fontSize: "0.74rem", border: "1px solid rgba(0,0,0,0.08)" }}>
            <Download size={11} /> Export
          </button>
        )}
      </div>

      {total === 0 && (
        <EmptyState
          icon={<CheckCircle size={28} />}
          title="No open follow-ups"
          description="All actions and requirements are resolved. Create new ones from the Evidence Drawer or the Requirements tab."
        />
      )}

      {/* Open Actions */}
      {openActions.length > 0 && (
        <Card className="mb-4">
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2">
              <span style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Actions</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.66rem", fontWeight: 600 }}>{openActions.length}</span>
            </div>
          </div>
          {openActions.map((a) => {
            const pr = (["High","Medium","Low"].includes(a.priority) ? a.priority : "Medium") as Priority;
            const ps = priorityStyle[pr];
            const hasSource = !!a.source_file;
            const excerptSnippet = a.excerpt ? (a.excerpt.length > 150 ? a.excerpt.slice(0, 150) + "..." : a.excerpt) : null;
            return (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <AlertCircle size={14} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: "#374151", fontSize: "0.82rem" }}>{a.text}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span style={{ color: "#9ca3af", fontSize: "0.68rem" }}>{a.owner || "Unassigned"}{a.due_date ? ` · Due ${a.due_date}` : ""}</span>
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.text, fontSize: "0.62rem", fontWeight: 600 }}>{pr}</span>
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.62rem", fontWeight: 600 }}>{a.status}</span>
                  </div>
                  {hasSource && (
                    <button
                      onClick={() => onOpenDrawer({ file: a.source_file!, type: "Document", date: a.created_at.slice(0, 10), excerpt: a.excerpt || a.text, topic: "" })}
                      className="flex items-center gap-1.5 mt-1.5 text-left"
                      style={{ color: "#16a34a", fontSize: "0.66rem" }}
                    >
                      <FileText size={9} /> {a.source_file}
                    </button>
                  )}
                  {excerptSnippet && (
                    <div className="mt-1.5 px-2.5 py-1.5 rounded" style={{ background: "rgba(107,114,128,0.05)", borderLeft: "2px solid rgba(107,114,128,0.15)" }}>
                      <p style={{ color: "#6b7280", fontSize: "0.68rem", lineHeight: 1.55, fontStyle: "italic" }}>{excerptSnippet}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => handleActionDone(a.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg shrink-0"
                  style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                  <Check size={10} /> Done
                </button>
              </div>
            );
          })}
        </Card>
      )}

      {/* Open Requirements */}
      {openReqs.length > 0 && (
        <Card>
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2">
              <span style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Requirements</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", fontSize: "0.66rem", fontWeight: 600 }}>{openReqs.length}</span>
            </div>
          </div>
          {openReqs.map((r) => {
            const ss = reqStatusStyle[r.status as ReqStatus] || reqStatusStyle.Open;
            const hasSource = !!r.source_file;
            const excerptSnippet = r.excerpt && r.excerpt !== r.text ? (r.excerpt.length > 150 ? r.excerpt.slice(0, 150) + "..." : r.excerpt) : null;
            return (
              <div key={r.id} className="flex items-start gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <ClipboardList size={14} color="#7c3aed" style={{ marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: "#374151", fontSize: "0.82rem" }}>{r.text}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <select value={r.status} onChange={(e) => handleReqStatus(r.id, e.target.value)}
                      className="px-2 py-0.5 rounded-full appearance-none cursor-pointer"
                      style={{ background: ss.bg, color: ss.text, fontSize: "0.68rem", fontWeight: 600, border: "none", outline: "none" }}>
                      {(["Confirmed", "Open", "Changed", "Assumption", "Superseded"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {r.topic && (
                      <span className="px-2 py-0.5 rounded-full" style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.66rem" }}>{r.topic}</span>
                    )}
                    <span style={{ color: "#9ca3af", fontSize: "0.64rem" }}>{r.updated_at.slice(0, 10)}</span>
                  </div>
                  {hasSource && (
                    <button
                      onClick={() => onOpenDrawer({ file: r.source_file!, type: "Document", date: r.updated_at.slice(0, 10), excerpt: r.excerpt || r.text, topic: r.topic || "" })}
                      className="flex items-center gap-1.5 mt-1.5 text-left"
                      style={{ color: "#16a34a", fontSize: "0.66rem" }}
                    >
                      <FileText size={9} /> {r.source_file}
                    </button>
                  )}
                  {excerptSnippet && (
                    <div className="mt-1.5 px-2.5 py-1.5 rounded" style={{ background: "rgba(107,114,128,0.05)", borderLeft: "2px solid rgba(107,114,128,0.15)" }}>
                      <p style={{ color: "#6b7280", fontSize: "0.68rem", lineHeight: 1.55, fontStyle: "italic" }}>{excerptSnippet}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => onOpenAsk(`Requirement — ${r.text}`)} className="flex items-center gap-1 px-2.5 py-1 rounded shrink-0"
                  style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.72rem", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <MessageSquare size={10} /> Ask AI
                </button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ─── Backend-connected Tracked Topics ────────────────────────────────────────

function BackendTrackedTopicsView({ initialTopic, onOpenAsk, highlightedTopics }: { initialTopic?: string; onOpenAsk: (ctx: string) => void; highlightedTopics: string[] }) {
  const [topics, setTopics] = useState<TopicSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic || null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getTopicSummary();
        if (!cancelled) { setTopics(data); setLoading(false); }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: "#9ca3af", fontSize: "0.82rem" }}>
          <Loader2 size={14} className="animate-spin" /> Loading tracked topics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<AlertCircle size={28} />} title="Backend unavailable" description="Start the backend server to view tracked topics." />
      </div>
    );
  }

  const activeTopics = topics.filter((t) => t.total_items > 0);
  const emptyTopics = topics.filter((t) => t.total_items === 0);

  if (activeTopics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<Tag size={28} />} title="No topic activity yet" description="Scan and parse customer files to see tracked topic summaries here." />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {selectedTopic && (
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: "#6b7280", fontSize: "0.74rem" }}>Filtered by:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: "0.78rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.25)" }}>
            <Tag size={11} /> {selectedTopic}
            <button onClick={() => setSelectedTopic(null)} className="ml-1" style={{ color: "#16a34a" }}><X size={11} /></button>
          </span>
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {(selectedTopic ? activeTopics.filter((t) => t.topic === selectedTopic) : activeTopics).map((t) => {
          const isOpen = selectedTopic === t.topic;
          const isHighlighted = highlightedTopics.includes(t.topic);
          return (
            <div key={t.topic} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: `1px solid ${isOpen ? "rgba(22,163,74,0.3)" : isHighlighted ? "rgba(22,163,74,0.18)" : "rgba(0,0,0,0.06)"}` }}>
              <button onClick={() => setSelectedTopic(isOpen ? null : t.topic)} className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background: isOpen ? "rgba(22,163,74,0.05)" : isHighlighted ? "rgba(22,163,74,0.03)" : "transparent" }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#0f172a", fontSize: "0.85rem", fontWeight: 700 }}>{t.topic}</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.62rem", fontWeight: 600 }}>{t.total_items}</span>
                  {isHighlighted && !isOpen && (
                    <span className="rounded-full" style={{ width: 6, height: 6, background: "#16a34a", display: "inline-block", flexShrink: 0 }} />
                  )}
                </div>
                {isOpen ? <ChevronUp size={14} color="#16a34a" /> : <ChevronDown size={14} color="#9ca3af" />}
              </button>
              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    <StatPill label="Files" value={t.files_count} color="#16a34a" bg="rgba(22,163,74,0.08)" />
                    <StatPill label="Alerts" value={t.alerts_count} color="#dc2626" bg="rgba(220,38,38,0.08)" />
                    <StatPill label="Open Actions" value={t.open_actions_count} color="#d97706" bg="rgba(217,119,6,0.08)" />
                    <StatPill label="Open Req" value={t.open_requirements_count} color="#7c3aed" bg="rgba(139,92,246,0.08)" />
                  </div>
                  {t.last_activity_at && (
                    <div className="px-4 pb-2 flex items-center gap-1.5" style={{ color: "#9ca3af", fontSize: "0.66rem" }}>
                      <Clock size={10} /> Last activity: {t.last_activity_at.slice(0, 16).replace("T", " ")}
                    </div>
                  )}
                  <div className="px-4 pb-3 pt-1">
                    <button onClick={() => onOpenAsk(`Topic: ${t.topic}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-full justify-center"
                      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.74rem" }}>
                      <MessageSquare size={11} /> Ask AI about {t.topic}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {emptyTopics.length > 0 && !selectedTopic && (
        <div className="mt-4">
          <div style={{ color: "#9ca3af", fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>No activity yet</div>
          <div className="flex flex-wrap gap-2">
            {emptyTopics.map((t) => (
              <span key={t.topic} className="px-3 py-1 rounded-full" style={{ background: "#f8fafc", color: "#9ca3af", fontSize: "0.74rem", border: "1px solid rgba(0,0,0,0.06)" }}>
                {t.topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: bg }}>
      <span style={{ color: "#6b7280", fontSize: "0.72rem" }}>{label}</span>
      <span style={{ color, fontSize: "0.82rem", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─── Backend-connected Timeline ──────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  file_indexed:       { label: "File Indexed",      color: "#16a34a", bg: "rgba(22,163,74,0.08)",  icon: FileText },
  file_parsed:        { label: "File Parsed",       color: "#2563eb", bg: "rgba(59,130,246,0.08)", icon: Database },
  file_missing:       { label: "File Missing",      color: "#dc2626", bg: "rgba(220,38,38,0.08)",  icon: AlertCircle },
  alert_created:      { label: "Alert",             color: "#d97706", bg: "rgba(217,119,6,0.08)",  icon: AlertCircle },
  action_created:     { label: "Follow-up Created", color: "#d97706", bg: "rgba(217,119,6,0.08)",  icon: ClipboardList },
  action_updated:     { label: "Follow-up Updated", color: "#d97706", bg: "rgba(217,119,6,0.08)",  icon: ClipboardList },
  requirement_created:{ label: "Requirement",       color: "#7c3aed", bg: "rgba(139,92,246,0.08)", icon: ClipboardList },
  requirement_updated:{ label: "Req. Updated",      color: "#7c3aed", bg: "rgba(139,92,246,0.08)", icon: ClipboardList },
  candidate_extracted:{ label: "AI Candidate",      color: "#2563eb", bg: "rgba(59,130,246,0.08)", icon: Plus },
  candidate_accepted: { label: "Accepted",          color: "#16a34a", bg: "rgba(22,163,74,0.08)",  icon: Check },
  candidate_rejected: { label: "Rejected",          color: "#9ca3af", bg: "rgba(107,114,128,0.08)", icon: X },
  candidate_reset:    { label: "Reset",             color: "#d97706", bg: "rgba(217,119,6,0.08)",  icon: RefreshCw },
  candidate_converted_to_requirement: { label: "Converted to Req.", color: "#7c3aed", bg: "rgba(139,92,246,0.08)", icon: CheckCircle },
  candidate_converted_to_action:      { label: "Converted to Follow-up", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: CheckCircle },
};

// Unified timeline entry merging both legacy timeline events and change log
interface UnifiedTimelineEntry {
  id: string;
  event_type: string;
  title: string;
  description: string;
  source_file: string | null;
  topic: string | null;
  occurred_at: string;
  source_excerpt: string | null;
}

// Event group quick-filter definitions
const EVENT_GROUPS: { key: string; label: string; types: string[] }[] = [
  { key: "all", label: "All", types: [] },
  { key: "decisions", label: "Customer decisions", types: ["candidate_converted_to_requirement", "candidate_converted_to_action", "requirement_created", "requirement_updated"] },
  { key: "ai", label: "AI candidate lifecycle", types: ["candidate_extracted", "candidate_accepted", "candidate_rejected", "candidate_reset", "candidate_converted_to_requirement", "candidate_converted_to_action"] },
  { key: "reqs", label: "Requirements & follow-ups", types: ["requirement_created", "requirement_updated", "action_created", "action_updated"] },
  { key: "files", label: "Files & alerts", types: ["file_indexed", "file_parsed", "file_missing", "alert_created"] },
];

function _dateLabel(dateStr: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(dateStr + "T00:00:00");
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return dateStr;
}

function _matchesSearch(ev: UnifiedTimelineEntry, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    ev.title.toLowerCase().includes(lower) ||
    ev.description.toLowerCase().includes(lower) ||
    (ev.topic || "").toLowerCase().includes(lower) ||
    (ev.source_file || "").toLowerCase().includes(lower) ||
    (ev.source_excerpt || "").toLowerCase().includes(lower) ||
    ev.event_type.toLowerCase().includes(lower)
  );
}

function BackendTimelineView({ onOpenDrawer, onOpenAsk, highlightedTopics }: { onOpenDrawer: (e: EvidenceItem) => void; onOpenAsk: (ctx: string) => void; highlightedTopics: string[] }) {
  const [events, setEvents] = useState<UnifiedTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExcerpts, setExpandedExcerpts] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [legacy, changeLog] = await Promise.all([
          getTimelineEvents({ limit: 100 }).catch(() => []),
          listChangeLog({ limit: 150 }).catch(() => []),
        ]);

        const legacyEntries: UnifiedTimelineEntry[] = legacy.map((ev) => ({
          id: `legacy-${ev.id}`,
          event_type: ev.event_type,
          title: ev.description.length > 80 ? ev.description.slice(0, 80) + "..." : ev.description,
          description: ev.description,
          source_file: ev.source_file,
          topic: ev.topic,
          occurred_at: ev.occurred_at,
          source_excerpt: null,
        }));

        const changeEntries: UnifiedTimelineEntry[] = changeLog.map((ev) => ({
          id: `cl-${ev.id}`,
          event_type: ev.event_type,
          title: ev.title,
          description: ev.description || ev.title,
          source_file: ev.source_file,
          topic: ev.topic,
          occurred_at: ev.created_at,
          source_excerpt: ev.source_excerpt,
        }));

        const all = [...legacyEntries, ...changeEntries].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
        if (!cancelled) { setEvents(all); setLoading(false); }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleExcerpt = (id: string) => {
    setExpandedExcerpts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: "#9ca3af", fontSize: "0.82rem" }}>
          <Loader2 size={14} className="animate-spin" /> Loading timeline...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<AlertCircle size={28} />} title="Backend unavailable" description="Start the backend server to view the timeline." />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<Calendar size={28} />} title="No timeline events yet" description="Events will appear as candidates are reviewed, converted, or manual follow-ups and requirements are created." />
      </div>
    );
  }

  // Apply group filter
  const activeGroup = EVENT_GROUPS.find((g) => g.key === groupFilter);
  let filtered = activeGroup && activeGroup.types.length > 0
    ? events.filter((e) => activeGroup.types.includes(e.event_type))
    : events;

  // Apply search
  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    filtered = filtered.filter((e) => _matchesSearch(e, trimmedSearch));
  }

  // Group by date
  const grouped: Record<string, UnifiedTimelineEntry[]> = {};
  for (const ev of filtered) {
    const date = ev.occurred_at.slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(ev);
  }
  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Group quick-filter chips */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {EVENT_GROUPS.map((g) => {
          const isActive = groupFilter === g.key;
          const count = g.types.length > 0 ? events.filter((e) => g.types.includes(e.event_type)).length : events.length;
          return (
            <button key={g.key} onClick={() => setGroupFilter(isActive && g.key !== "all" ? "all" : g.key)}
              className="px-3 py-1 rounded-full transition-colors"
              style={{ background: isActive ? "#16a34a" : "transparent", color: isActive ? "#fff" : "#6b7280",
                border: `1px solid ${isActive ? "#16a34a" : "rgba(0,0,0,0.08)"}`, fontSize: "0.72rem", fontWeight: isActive ? 600 : 400 }}>
              {g.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search box */}
      <div className="mb-4 relative" style={{ maxWidth: 400 }}>
        <Search size={13} color="#9ca3af" style={{ position: "absolute", left: 10, top: 8 }} />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search timeline events..."
          className="w-full pl-8 pr-8 py-1.5 rounded-lg"
          style={{ border: "1px solid rgba(0,0,0,0.10)", fontSize: "0.78rem", outline: "none", background: "#ffffff" }} />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 8, top: 7, color: "#9ca3af" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 && (
        <EmptyState icon={<Filter size={28} />} title="No events match these filters" description="Try a different group filter or search term." />
      )}

      <div style={{ maxWidth: 780 }}>
        {dates.map((date) => {
          const label = _dateLabel(date);
          return (
            <div key={date} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5" style={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: 700 }}>
                  <Calendar size={13} color="#16a34a" /> {label}
                </div>
                {label !== date && <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>{date}</span>}
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>{grouped[date].length} event{grouped[date].length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex flex-col gap-2 pl-1">
                {grouped[date].map((ev) => {
                  const cfg = EVENT_TYPE_CONFIG[ev.event_type] || { label: ev.event_type, color: "#6b7280", bg: "rgba(0,0,0,0.04)", icon: FileText };
                  const Icon = cfg.icon;
                  const isHighlighted = ev.topic ? highlightedTopics.includes(ev.topic) : false;
                  const hasExcerpt = !!(ev.source_excerpt);
                  const isExpanded = expandedExcerpts.has(ev.id);
                  return (
                    <div key={ev.id} className="rounded-xl transition-all hover:bg-green-50"
                      style={{ background: "#ffffff", border: `1px solid ${isHighlighted ? "rgba(22,163,74,0.25)" : "rgba(0,0,0,0.06)"}` }}>
                      <div className="flex items-start gap-3 px-4 py-3">
                        {/* Time */}
                        <div className="flex items-center gap-1 shrink-0" style={{ color: "#9ca3af", fontSize: "0.66rem", marginTop: 3, minWidth: 40 }}>
                          <Clock size={10} /> {ev.occurred_at.slice(11, 16) || "—"}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, fontSize: "0.62rem", fontWeight: 600 }}>
                              <Icon size={9} /> {cfg.label}
                            </span>
                            {ev.source_file && (
                              <button onClick={() => onOpenDrawer({ file: ev.source_file!, type: "Document", date: ev.occurred_at.slice(0, 10), excerpt: ev.source_excerpt || ev.description, topic: ev.topic || "" })}
                                style={{ color: "#16a34a", fontSize: "0.66rem" }}>{ev.source_file.length > 35 ? ev.source_file.slice(0, 35) + "..." : ev.source_file}</button>
                            )}
                          </div>
                          <p style={{ color: "#374151", fontSize: "0.78rem", lineHeight: 1.55 }}>
                            {ev.title.length > 120 ? ev.title.slice(0, 120) + "..." : ev.title}
                          </p>
                          {/* Expandable source excerpt */}
                          {hasExcerpt && (
                            isExpanded ? (
                              <div className="mt-1.5 px-2 py-1.5 rounded" style={{ background: "rgba(107,114,128,0.04)", borderLeft: "2px solid rgba(22,163,74,0.2)" }}>
                                <p style={{ color: "#6b7280", fontSize: "0.68rem", lineHeight: 1.5, fontStyle: "italic" }}>{ev.source_excerpt}</p>
                                <button onClick={() => toggleExcerpt(ev.id)} style={{ color: "#16a34a", fontSize: "0.62rem", fontWeight: 600, marginTop: 4 }}>Collapse</button>
                              </div>
                            ) : (
                              <button onClick={() => toggleExcerpt(ev.id)} className="flex items-center gap-1 mt-1" style={{ color: "#16a34a", fontSize: "0.62rem", fontWeight: 600 }}>
                                <Eye size={9} /> View source excerpt
                              </button>
                            )
                          )}
                          {ev.topic && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Tag size={9} color={isHighlighted ? "#16a34a" : "#9ca3af"} />
                              <span className="px-2 py-0.5 rounded-full" style={{ background: isHighlighted ? "rgba(22,163,74,0.10)" : "#f0f4f8", color: isHighlighted ? "#16a34a" : "#6b7280", fontSize: "0.62rem", fontWeight: isHighlighted ? 600 : 400 }}>{ev.topic}</span>
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ev.source_file && (
                            <button onClick={() => onOpenDrawer({ file: ev.source_file!, type: "Document", date: ev.occurred_at.slice(0, 10), excerpt: ev.source_excerpt || ev.description, topic: ev.topic || "" })}
                              className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.62rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                              <Eye size={9} /> Evidence
                            </button>
                          )}
                          <button onClick={() => onOpenAsk(ev.topic ? `Topic: ${ev.topic}` : ev.source_file ? `Evidence — ${ev.source_file}` : "")}
                            className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.62rem", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <MessageSquare size={9} /> Ask AI
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Backend-connected File Summaries ────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Done:    { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  Pending: { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
  Skipped: { bg: "rgba(0,0,0,0.04)",      text: "#9ca3af" },
  Missing: { bg: "rgba(220,38,38,0.08)",  text: "#dc2626" },
};

function BackendFileSummariesView({ onOpenDrawer, onOpenAsk }: { onOpenDrawer: (e: EvidenceItem) => void; onOpenAsk: (ctx: string) => void }) {
  const [files, setFiles] = useState<FileSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<FileSummaryItem[]>("/files/summary");
        if (!cancelled) { setFiles(data); setLoading(false); }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: "#9ca3af", fontSize: "0.82rem" }}>
          <Loader2 size={14} className="animate-spin" /> Loading file summaries...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<AlertCircle size={28} />} title="Backend unavailable" description="Start the backend server to view file summaries." />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<FileText size={28} />} title="No files indexed" description="Scan and parse customer files to see summaries here." />
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(files.map((f) => f.category)))];
  const filtered = catFilter === "All" ? files : files.filter((f) => f.category === catFilter);
  const selected = selectedId ? files.find((f) => f.id === selectedId) : null;
  const parsedCount = files.filter((f) => f.summary_status === "Done").length;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* File list panel */}
      <div className="overflow-y-auto" style={{ width: 260, minWidth: 260, background: "#fafbfc", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Files</div>
          <div style={{ color: "#6b7280", fontSize: "0.74rem", fontWeight: 600 }}>{parsedCount} of {files.length} parsed</div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)} className="px-2 py-0.5 rounded-full transition-colors"
                style={{ background: catFilter === c ? "#16a34a" : "transparent", color: catFilter === c ? "#fff" : "#9ca3af", fontSize: "0.62rem", border: `1px solid ${catFilter === c ? "#16a34a" : "rgba(0,0,0,0.08)"}` }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        {filtered.map((f) => {
          const isActive = selectedId === f.id;
          const ss = STATUS_STYLE[f.summary_status] || STATUS_STYLE.Pending;
          return (
            <button key={f.id} onClick={() => setSelectedId(isActive ? null : f.id)}
              className="w-full text-left px-4 py-2.5 transition-colors"
              style={{ background: isActive ? "rgba(22,163,74,0.06)" : "transparent", borderBottom: "1px solid rgba(0,0,0,0.04)", borderLeft: isActive ? "3px solid #16a34a" : "3px solid transparent" }}>
              <div className="truncate" style={{ color: "#374151", fontSize: "0.78rem", fontWeight: isActive ? 600 : 400 }}>{f.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.text, fontSize: "0.58rem", fontWeight: 600 }}>{f.summary_status}</span>
                {f.chunk_count > 0 && <span style={{ color: "#9ca3af", fontSize: "0.58rem" }}>{f.chunk_count} chunks</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: "#9ca3af" }}>
              <FileText size={28} color="#e5e7eb" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "0.82rem" }}>Select a file to view its parsed content</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div style={{ color: "#0f172a", fontSize: "0.92rem", fontWeight: 700 }}>{selected.name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full" style={{ background: (STATUS_STYLE[selected.summary_status] || STATUS_STYLE.Pending).bg, color: (STATUS_STYLE[selected.summary_status] || STATUS_STYLE.Pending).text, fontSize: "0.66rem", fontWeight: 600 }}>{selected.summary_status}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.72rem" }}>{selected.category} · {selected.file_type}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.72rem" }}>{selected.customer_relevance}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onOpenDrawer({ file: selected.name, type: "Document", date: selected.updated_at.slice(0, 10), excerpt: selected.first_chunk_excerpt || selected.name, topic: "" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                  <Eye size={11} /> Evidence
                </button>
                <button onClick={() => onOpenAsk(`Evidence — ${selected.name}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.74rem" }}>
                  <MessageSquare size={11} /> Ask AI
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.12)" }}>
                <div style={{ color: "#16a34a", fontSize: "0.92rem", fontWeight: 700 }}>{selected.chunk_count}</div>
                <div style={{ color: "#6b7280", fontSize: "0.66rem" }}>Parsed chunks</div>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.12)" }}>
                <div style={{ color: "#d97706", fontSize: "0.92rem", fontWeight: 700 }}>{selected.alert_count}</div>
                <div style={{ color: "#6b7280", fontSize: "0.66rem" }}>Related alerts</div>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(107,114,128,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ color: "#374151", fontSize: "0.72rem" }}>Indexed: {selected.indexed_at.slice(0, 10)}</div>
                <div style={{ color: "#9ca3af", fontSize: "0.66rem" }}>Updated: {selected.updated_at.slice(0, 10)}</div>
              </div>
            </div>

            {/* Preview */}
            {selected.first_chunk_excerpt ? (
              <div>
                <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Parsed Content Preview</div>
                <div className="rounded-lg px-4 py-3" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", borderLeft: "3px solid #16a34a" }}>
                  <p style={{ color: "#374151", fontSize: "0.78rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {selected.first_chunk_excerpt}
                  </p>
                </div>
              </div>
            ) : selected.summary_status === "Missing" ? (
              <div className="rounded-lg px-4 py-3" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <p style={{ color: "#dc2626", fontSize: "0.78rem" }}>This file is no longer found on disk. It was previously indexed but has been moved or deleted.</p>
              </div>
            ) : (
              <div className="rounded-lg px-4 py-3" style={{ background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.12)" }}>
                <p style={{ color: "#d97706", fontSize: "0.78rem" }}>This file has not been parsed yet. Use Settings &gt; Parse All Files to extract content.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Backend-connected Executive Brief ───────────────────────────────────────

function BriefStatCard({ label, value, sub, color, bg, onClick }: { label: string; value: string | number; sub?: string; color: string; bg: string; onClick?: () => void }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper onClick={onClick} className="rounded-xl px-4 py-3 text-left transition-colors"
      style={{ background: bg, border: `1px solid ${color}18`, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ color, fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#374151", fontSize: "0.76rem", fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ color: "#9ca3af", fontSize: "0.66rem", marginTop: 2 }}>{sub}</div>}
    </Wrapper>
  );
}

function BackendExecBrief({ onNavigate, onOpenAsk }: { onNavigate: (page: Page, ctx?: NavContext) => void; onOpenAsk: (ctx: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topics, setTopics] = useState<TopicSummaryItem[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [reqs, setReqs] = useState<BackendRequirement[]>([]);
  const [actions, setActions] = useState<BackendAction[]>([]);
  const [insightCandidates, setInsightCandidates] = useState<AIUpdateCandidate[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeLogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const [s, t, e, r, a, c, cl] = await Promise.all([
        getDashboardStats(),
        getTopicSummary(),
        getTimelineEvents({ limit: 5 }),
        getRequirements().catch(() => []),
        getActions().catch(() => []),
        listAICandidates().then((res) => res.candidates).catch(() => []),
        listChangeLog({ limit: 30 }).catch(() => []),
      ]);
      setStats(s); setTopics(t); setEvents(e); setReqs(r); setActions(a); setInsightCandidates(c); setChangeLog(cl);
    } catch {
      if (!isRefresh) setError(true);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: "#9ca3af", fontSize: "0.82rem" }}>
          <Loader2 size={14} className="animate-spin" /> Loading executive brief...
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<AlertCircle size={28} />} title="Backend unavailable" description="Start the backend server to view the executive brief." />
      </div>
    );
  }

  const activeTopics = topics.filter((t) => t.total_items > 0).sort((a, b) => b.total_items - a.total_items);
  const missingFiles = stats.files_indexed - stats.files_parsed - stats.files_pending_parse;
  const hasIssues = stats.files_pending_parse > 0 || missingFiles > 0 || stats.open_alerts > 0;

  // Derived data for new sections
  const openReqs = reqs.filter((r) => ["Open", "Changed", "Assumption"].includes(r.status));
  const confirmedReqs = reqs.filter((r) => r.status === "Confirmed");
  const openActions = actions.filter((a) => ["Open", "In Progress", "Blocked"].includes(a.status));
  const highPriorityActions = openActions.filter((a) => a.priority === "High");
  const acceptedInsights = insightCandidates.filter((c) => c.status === "accepted" && !c.converted_to_type);
  const openQuestions = insightCandidates.filter((c) => c.update_type === "open_question" && c.status !== "rejected");
  const risks = insightCandidates.filter((c) => c.update_type === "risk" && c.status !== "rejected");

  const exportBriefMd = () => {
    const lines: string[] = [];
    lines.push("# Customer Knowledge Hub — Executive Brief");
    lines.push("");
    lines.push(`> Based on ${stats.files_parsed} parsed files and ${stats.chunks_indexed} evidence chunks.`);
    if (stats.last_indexed_at) lines.push(`> Last indexed: ${stats.last_indexed_at.slice(0, 16).replace("T", " ")}`);
    lines.push(`> Status: ${stats.status_label}`);
    lines.push("");

    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Files indexed:** ${stats.files_indexed} (${stats.files_parsed} parsed)`);
    lines.push(`- **Evidence chunks:** ${stats.chunks_indexed}`);
    lines.push(`- **Open alerts:** ${stats.open_alerts} of ${stats.total_alerts} total`);
    lines.push(`- **Open follow-ups:** ${stats.open_followups} (${stats.open_actions} actions, ${stats.open_requirements} requirements)`);
    lines.push("");

    if (reqs.length > 0) {
      lines.push("## Key Requirements");
      lines.push("");
      lines.push(`${confirmedReqs.length} confirmed, ${openReqs.length} open.`);
      lines.push("");
      for (const r of reqs) {
        lines.push(`- **[${r.status}]** ${r.text}${r.source_file ? ` _(${r.source_file})_` : ""}`);
      }
      lines.push("");
    }

    if (openActions.length > 0) {
      lines.push("## Open Follow-ups");
      lines.push("");
      for (const a of openActions) {
        lines.push(`- **[${a.priority}]** ${a.text}${a.owner ? ` — ${a.owner}` : ""}${a.source_file ? ` _(${a.source_file})_` : ""}`);
      }
      lines.push("");
    }

    if (openQuestions.length > 0 || risks.length > 0) {
      lines.push("## Open Questions & Risks");
      lines.push("");
      for (const c of [...risks, ...openQuestions]) {
        const label = c.update_type === "risk" ? "Risk" : "Open Question";
        lines.push(`- **[${label}]** ${c.title}`);
        if (c.evidence_quote) lines.push(`  > ${c.evidence_quote.slice(0, 200)}${c.evidence_quote.length > 200 ? "..." : ""}`);
        if (c.source_file) lines.push(`  _Source: ${c.source_file}_`);
        lines.push("");
      }
    }

    if (activeTopics.length > 0) {
      lines.push("## Active Topics");
      lines.push("");
      for (const t of activeTopics) {
        lines.push(`- **${t.topic}** — ${t.total_items} items (${t.files_count} files, ${t.alerts_count} alerts, ${t.open_actions_count + t.open_requirements_count} open)`);
      }
      lines.push("");
    }

    if (changeLog.length > 0) {
      lines.push("## Recent Changes");
      lines.push("");
      for (const ev of changeLog.slice(0, 10)) {
        lines.push(`- ${ev.created_at.slice(0, 16).replace("T", " ")} — **${ev.title}**${ev.source_file ? ` _(${ev.source_file})_` : ""}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("_Exported from Customer Knowledge Hub. All content is deterministic — sourced from indexed files and reviewed records._");
    downloadMarkdown(lines.join("\n"), "executive_brief");
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl px-5 py-4" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: "#0f172a", fontSize: "0.92rem", fontWeight: 700 }}>Executive Brief</div>
            <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginTop: 2 }}>
              Based on {stats.files_parsed} parsed files and {stats.chunks_indexed} evidence chunks.
              {stats.last_indexed_at && <span> Last indexed: {stats.last_indexed_at.slice(0, 16).replace("T", " ")}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: hasIssues ? "rgba(217,119,6,0.08)" : "rgba(22,163,74,0.08)", color: hasIssues ? "#d97706" : "#16a34a", fontSize: "0.72rem", fontWeight: 600, border: `1px solid ${hasIssues ? "rgba(217,119,6,0.22)" : "rgba(22,163,74,0.22)"}` }}>
              {hasIssues ? <AlertCircle size={10} /> : <CheckCircle size={10} />} {stats.status_label}
            </span>
            <button onClick={exportBriefMd}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors"
              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.72rem" }}>
              <Download size={11} /> Export
            </button>
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors"
              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.72rem", opacity: refreshing ? 0.6 : 1 }}>
              <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-3">
        <BriefStatCard label="Files Indexed" value={stats.files_indexed} sub={`${stats.files_parsed} parsed`} color="#16a34a" bg="rgba(22,163,74,0.04)" onClick={() => onNavigate("files")} />
        <BriefStatCard label="Evidence Chunks" value={stats.chunks_indexed} sub="searchable" color="#2563eb" bg="rgba(59,130,246,0.04)" onClick={() => onOpenAsk("")} />
        <BriefStatCard label="Open Alerts" value={stats.open_alerts} sub={`${stats.total_alerts} total`} color={stats.open_alerts > 0 ? "#dc2626" : "#16a34a"} bg={stats.open_alerts > 0 ? "rgba(220,38,38,0.04)" : "rgba(22,163,74,0.04)"} onClick={() => onNavigate("alerts", { alertsFilter: "new" })} />
        <BriefStatCard label="Open Follow-ups" value={stats.open_followups} sub={`${stats.open_actions} actions, ${stats.open_requirements} req`} color={stats.open_followups > 0 ? "#d97706" : "#16a34a"} bg={stats.open_followups > 0 ? "rgba(217,119,6,0.04)" : "rgba(22,163,74,0.04)"} onClick={() => onNavigate("summaries", { summariesTab: "followups" })} />
      </div>

      {/* Key Requirements + Open Follow-ups row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Key Requirements */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2">
              <span style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Key Requirements</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", fontSize: "0.58rem", fontWeight: 600 }}>{reqs.length}</span>
            </div>
            <button onClick={() => onNavigate("summaries", { summariesTab: "requirements" })} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.72rem" }}>
              View all <ChevronDown size={10} style={{ transform: "rotate(-90deg)" }} />
            </button>
          </div>
          {reqs.length === 0 ? (
            <div className="px-5 py-4" style={{ color: "#9ca3af", fontSize: "0.78rem" }}>No requirements yet. Create them from evidence or convert accepted insights.</div>
          ) : (
            <div className="px-5 py-2">
              {/* Status summary */}
              <div className="flex items-center gap-3 py-2 mb-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                {confirmedReqs.length > 0 && <span style={{ color: "#16a34a", fontSize: "0.68rem", fontWeight: 600 }}>{confirmedReqs.length} confirmed</span>}
                {openReqs.length > 0 && <span style={{ color: "#d97706", fontSize: "0.68rem", fontWeight: 600 }}>{openReqs.length} open</span>}
                {reqs.filter((r) => r.status === "Changed").length > 0 && <span style={{ color: "#dc2626", fontSize: "0.68rem", fontWeight: 600 }}>{reqs.filter((r) => r.status === "Changed").length} changed</span>}
              </div>
              {/* Top items (open first, then confirmed) */}
              {[...openReqs, ...confirmedReqs].slice(0, 4).map((r) => {
                const ss = reqStatusStyle[r.status as ReqStatus] || reqStatusStyle.Open;
                return (
                  <div key={r.id} className="flex items-start gap-2 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <span className="px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: ss.bg, color: ss.text, fontSize: "0.58rem", fontWeight: 600 }}>{r.status}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ color: "#374151", fontSize: "0.76rem" }}>{r.text}</div>
                      {r.source_file && <div style={{ color: "#16a34a", fontSize: "0.62rem", marginTop: 1 }}>{r.source_file}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Open Follow-ups */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2">
              <span style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Open Follow-ups</span>
              {openActions.length > 0 && <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.58rem", fontWeight: 600 }}>{openActions.length}</span>}
            </div>
            <button onClick={() => onNavigate("summaries", { summariesTab: "followups" })} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.72rem" }}>
              View all <ChevronDown size={10} style={{ transform: "rotate(-90deg)" }} />
            </button>
          </div>
          {openActions.length === 0 ? (
            <div className="px-5 py-4" style={{ color: "#9ca3af", fontSize: "0.78rem" }}>No open follow-ups. All actions are resolved.</div>
          ) : (
            <div className="px-5 py-2">
              {highPriorityActions.length > 0 && (
                <div className="flex items-center gap-1.5 py-2 mb-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <AlertCircle size={10} color="#dc2626" />
                  <span style={{ color: "#dc2626", fontSize: "0.68rem", fontWeight: 600 }}>{highPriorityActions.length} high priority</span>
                </div>
              )}
              {openActions.slice(0, 4).map((a) => {
                const ps = priorityStyle[(["High","Medium","Low"].includes(a.priority) ? a.priority : "Medium") as Priority];
                return (
                  <div key={a.id} className="flex items-start gap-2 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <span className="px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: ps.bg, color: ps.text, fontSize: "0.58rem", fontWeight: 600 }}>{a.priority}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ color: "#374151", fontSize: "0.76rem" }}>{a.text}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>{a.owner || "Unassigned"}</span>
                        {a.source_file && <span style={{ color: "#16a34a", fontSize: "0.62rem" }}>{a.source_file}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Open Questions & Risks + Accepted Insights row */}
      {(openQuestions.length > 0 || risks.length > 0 || acceptedInsights.length > 0) && (
        <div className="grid gap-4" style={{ gridTemplateColumns: (openQuestions.length > 0 || risks.length > 0) && acceptedInsights.length > 0 ? "1fr 1fr" : "1fr" }}>
          {/* Open Questions & Risks */}
          {(openQuestions.length > 0 || risks.length > 0) && (
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Open Questions & Risks</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.58rem", fontWeight: 600 }}>{openQuestions.length + risks.length}</span>
                </div>
              </div>
              <div className="px-5 py-2">
                {[...risks, ...openQuestions].slice(0, 4).map((c) => (
                  <div key={c.id} className="py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.update_type === "risk" ? "rgba(220,38,38,0.08)" : "rgba(217,119,6,0.08)", color: c.update_type === "risk" ? "#dc2626" : "#d97706", fontSize: "0.58rem", fontWeight: 600 }}>
                        {c.update_type === "risk" ? "Risk" : "Open Question"}
                      </span>
                      {c.topic && <span style={{ color: "#6b7280", fontSize: "0.58rem" }}>{c.topic}</span>}
                    </div>
                    <div style={{ color: "#374151", fontSize: "0.76rem" }}>{c.title}</div>
                    {c.evidence_quote && (
                      <div className="mt-1 pl-2" style={{ borderLeft: "2px solid rgba(107,114,128,0.15)" }}>
                        <p style={{ color: "#6b7280", fontSize: "0.66rem", fontStyle: "italic", lineHeight: 1.5 }}>
                          {c.evidence_quote.length > 120 ? c.evidence_quote.slice(0, 120) + "..." : c.evidence_quote}
                        </p>
                      </div>
                    )}
                    <div style={{ color: "#16a34a", fontSize: "0.62rem", marginTop: 2 }}>{c.source_file}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Insights pending conversion */}
          {acceptedInsights.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(22,163,74,0.12)" }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Accepted Insights</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.58rem", fontWeight: 600 }}>{acceptedInsights.length} pending conversion</span>
                </div>
                <button onClick={() => onNavigate("summaries", { summariesTab: "candidates" })} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.72rem" }}>
                  Review <ChevronDown size={10} style={{ transform: "rotate(-90deg)" }} />
                </button>
              </div>
              <div className="px-5 py-2">
                {acceptedInsights.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-start gap-2 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <span className="px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.58rem", fontWeight: 600 }}>Accepted</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ color: "#374151", fontSize: "0.76rem" }}>{c.title}</div>
                      <div style={{ color: "#16a34a", fontSize: "0.62rem", marginTop: 1 }}>{c.source_file}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Active Topics */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Active Topics</div>
            <button onClick={() => onNavigate("summaries", { summariesTab: "topics" })} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.72rem" }}>
              View all <ChevronDown size={10} style={{ transform: "rotate(-90deg)" }} />
            </button>
          </div>
          {activeTopics.length === 0 ? (
            <div className="px-5 py-4" style={{ color: "#9ca3af", fontSize: "0.78rem" }}>No topic activity yet.</div>
          ) : (
            <div className="px-5 py-3">
              {activeTopics.slice(0, 5).map((t) => (
                <div key={t.topic} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                  <div className="flex items-center gap-2">
                    <Tag size={10} color="#16a34a" />
                    <span style={{ color: "#374151", fontSize: "0.78rem", fontWeight: 500 }}>{t.topic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.files_count > 0 && <span style={{ color: "#16a34a", fontSize: "0.66rem" }}>{t.files_count} files</span>}
                    {t.alerts_count > 0 && <span style={{ color: "#dc2626", fontSize: "0.66rem" }}>{t.alerts_count} alerts</span>}
                    {(t.open_actions_count + t.open_requirements_count) > 0 && (
                      <span style={{ color: "#d97706", fontSize: "0.66rem" }}>{t.open_actions_count + t.open_requirements_count} open</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.58rem", fontWeight: 600 }}>{t.total_items}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Recent Activity</div>
            <button onClick={() => onNavigate("summaries", { summariesTab: "timeline" })} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.72rem" }}>
              View timeline <ChevronDown size={10} style={{ transform: "rotate(-90deg)" }} />
            </button>
          </div>
          {events.length === 0 ? (
            <div className="px-5 py-4" style={{ color: "#9ca3af", fontSize: "0.78rem" }}>No recent activity.</div>
          ) : (
            <div>
              {events.map((ev) => {
                const cfg = EVENT_TYPE_CONFIG[ev.event_type] || { label: ev.event_type, color: "#6b7280", bg: "rgba(0,0,0,0.04)", icon: FileText };
                const Icon = cfg.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-2.5 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <div className="rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg, width: 24, height: 24 }}>
                      <Icon size={11} color={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ color: "#374151", fontSize: "0.76rem", fontWeight: 500 }}>
                        {ev.description.length > 80 ? ev.description.slice(0, 80) + "..." : ev.description}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ color: cfg.color, fontSize: "0.62rem", fontWeight: 600 }}>{cfg.label}</span>
                        <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>{ev.occurred_at.slice(0, 16).replace("T", " ")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Data Quality / Alerts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Alert breakdown */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Alert Breakdown</div>
          </div>
          <div className="px-5 py-3 grid grid-cols-2 gap-3">
            <StatPill label="Open" value={stats.open_alerts} color={stats.open_alerts > 0 ? "#dc2626" : "#16a34a"} bg={stats.open_alerts > 0 ? "rgba(220,38,38,0.06)" : "rgba(22,163,74,0.06)"} />
            <StatPill label="Reviewed" value={stats.reviewed_alerts} color="#2563eb" bg="rgba(59,130,246,0.06)" />
            <StatPill label="Ignored" value={stats.ignored_alerts} color="#9ca3af" bg="rgba(107,114,128,0.06)" />
            <StatPill label="Total" value={stats.total_alerts} color="#374151" bg="rgba(107,114,128,0.06)" />
          </div>
        </div>

        {/* Data quality */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Data Quality</div>
          </div>
          <div className="px-5 py-3">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
              <span style={{ color: "#374151", fontSize: "0.78rem" }}>Files parsed</span>
              <span style={{ color: "#16a34a", fontSize: "0.78rem", fontWeight: 600 }}>{stats.files_parsed} / {stats.files_indexed}</span>
            </div>
            {stats.files_pending_parse > 0 && (
              <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <span style={{ color: "#d97706", fontSize: "0.78rem" }}>Pending parse</span>
                <span style={{ color: "#d97706", fontSize: "0.78rem", fontWeight: 600 }}>{stats.files_pending_parse}</span>
              </div>
            )}
            {missingFiles > 0 && (
              <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>Missing from disk</span>
                <span style={{ color: "#dc2626", fontSize: "0.78rem", fontWeight: 600 }}>{missingFiles}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span style={{ color: "#374151", fontSize: "0.78rem" }}>Search index</span>
              <span style={{ color: stats.chunks_indexed > 0 ? "#16a34a" : "#9ca3af", fontSize: "0.78rem", fontWeight: 600 }}>{stats.chunks_indexed} chunks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      {changeLog.length > 0 && (() => {
        const changeCats: { key: string; label: string; color: string; bg: string; icon: React.ElementType; types: string[] }[] = [
          { key: "extracted", label: "Insights generated", color: "#2563eb", bg: "rgba(59,130,246,0.08)", icon: Plus, types: ["candidate_extracted"] },
          { key: "accepted", label: "Insights accepted", color: "#16a34a", bg: "rgba(22,163,74,0.08)", icon: Check, types: ["candidate_accepted"] },
          { key: "converted", label: "Converted to records", color: "#7c3aed", bg: "rgba(139,92,246,0.08)", icon: CheckCircle, types: ["candidate_converted_to_requirement", "candidate_converted_to_action"] },
          { key: "reqs", label: "Requirements updated", color: "#7c3aed", bg: "rgba(139,92,246,0.08)", icon: ClipboardList, types: ["requirement_created", "requirement_updated"] },
          { key: "actions", label: "Follow-ups updated", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: AlertCircle, types: ["action_created", "action_updated"] },
        ];
        const catCounts = changeCats.map((cat) => ({
          ...cat,
          count: changeLog.filter((e) => cat.types.includes(e.event_type)).length,
        })).filter((c) => c.count > 0);

        return (
          <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Recent Changes</div>
              <button onClick={() => onNavigate("summaries", { summariesTab: "timeline" })} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.72rem" }}>
                Full timeline <ChevronDown size={10} style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>
            {/* Category summary chips */}
            <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              {catCounts.map((cat) => {
                const Icon = cat.icon;
                return (
                  <span key={cat.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.color, fontSize: "0.66rem", fontWeight: 600 }}>
                    <Icon size={9} /> {cat.count} {cat.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
            {/* Recent event list */}
            <div className="px-5 py-2">
              {changeLog.slice(0, 8).map((ev) => {
                const cfg = EVENT_TYPE_CONFIG[ev.event_type] || { label: ev.event_type, color: "#6b7280", bg: "rgba(0,0,0,0.04)", icon: FileText };
                const Icon = cfg.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-2.5 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <div className="rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg, width: 20, height: 20 }}>
                      <Icon size={9} color={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ color: "#374151", fontSize: "0.74rem" }}>{ev.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ color: cfg.color, fontSize: "0.58rem", fontWeight: 600 }}>{cfg.label}</span>
                        {ev.source_file && <span style={{ color: "#16a34a", fontSize: "0.58rem" }}>{ev.source_file.length > 30 ? ev.source_file.slice(0, 30) + "..." : ev.source_file}</span>}
                        {ev.topic && <span style={{ color: "#6b7280", fontSize: "0.58rem" }}>{ev.topic}</span>}
                        <span style={{ color: "#9ca3af", fontSize: "0.58rem" }}>{ev.created_at.slice(0, 16).replace("T", " ")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* CTA */}
      <div className="rounded-xl px-5 py-3 flex items-center justify-between" style={{ background: "rgba(22,163,74,0.03)", border: "1px solid rgba(22,163,74,0.10)" }}>
        <span style={{ color: "#6b7280", fontSize: "0.74rem" }}>Use Ask AI or Insight Candidates for AI-powered insights grounded in parsed evidence.</span>
        <button onClick={() => onOpenAsk("executive brief")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
          style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.74rem" }}>
          <MessageSquare size={11} /> Ask AI
        </button>
      </div>
    </div>
  );
}

// ─── AI Candidate Updates ─────────────────────────────────────────────────────

const UPDATE_TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  requirement:   { bg: "rgba(139,92,246,0.08)", text: "#7c3aed", label: "Requirement" },
  decision:      { bg: "rgba(22,163,74,0.08)",  text: "#16a34a", label: "Decision" },
  open_question: { bg: "rgba(217,119,6,0.08)",  text: "#d97706", label: "Open Question" },
  action_item:   { bg: "rgba(220,38,38,0.08)",  text: "#dc2626", label: "Action Item" },
  scope_change:  { bg: "rgba(59,130,246,0.08)", text: "#2563eb", label: "Scope Change" },
  risk:          { bg: "rgba(220,38,38,0.08)",  text: "#dc2626", label: "Risk" },
  clarification: { bg: "rgba(107,114,128,0.08)", text: "#4b5563", label: "Clarification" },
};

const STATUS_BADGE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  candidate: { bg: "rgba(217,119,6,0.08)", text: "#d97706", label: "Pending" },
  accepted:  { bg: "rgba(22,163,74,0.08)", text: "#16a34a", label: "Accepted" },
  rejected:  { bg: "rgba(107,114,128,0.08)", text: "#9ca3af", label: "Rejected" },
};

// ─── Conversion Modal ─────────────────────────────────────────────────────────

type ConvertMode = "requirement" | "action";

interface ConvertModalProps {
  candidate: AIUpdateCandidate;
  mode: ConvertMode;
  onClose: () => void;
  onConverted: (updated: AIUpdateCandidate) => void;
}

function ConvertModal({ candidate, mode, onClose, onConverted }: ConvertModalProps) {
  const [title, setTitle] = useState(candidate.title);
  const [description, setDescription] = useState(candidate.description || "");
  const [topic, setTopic] = useState(candidate.topic || "");
  const [priority, setPriority] = useState("Medium");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === "requirement") {
        const res = await convertCandidateToRequirement(candidate.id, {
          title: title.trim(), description: description.trim() || undefined, topic: topic.trim() || undefined,
        });
        onConverted(res.candidate);
      } else {
        const res = await convertCandidateToAction(candidate.id, {
          title: title.trim(), description: description.trim() || undefined, topic: topic.trim() || undefined,
          priority, owner: owner.trim() || undefined, due_date: dueDate || undefined,
        });
        onConverted(res.candidate);
      }
    } catch (err: any) {
      setError(err?.message || "Conversion failed.");
    }
    setSaving(false);
  };

  const labelText = mode === "requirement" ? "Create Requirement" : "Create Follow-up";

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1000, background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="rounded-xl shadow-xl" style={{ background: "#ffffff", width: 520, maxHeight: "85vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>{labelText}</div>
          <div style={{ color: "#9ca3af", fontSize: "0.72rem", marginTop: 2 }}>
            Review and edit before converting this candidate.
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Title */}
          <div>
            <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }} />
          </div>
          {/* Description */}
          <div>
            <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-1.5 rounded-lg resize-none" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }} />
          </div>
          {/* Topic */}
          <div>
            <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Schema/API"
              className="w-full px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }} />
          </div>
          {/* Action-specific fields */}
          {mode === "action" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Owner</label>
                  <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. John"
                    className="w-full px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: "#6b7280", fontSize: "0.66rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Due date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }} />
                </div>
              </div>
            </>
          )}
          {/* Read-only source info */}
          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(107,114,128,0.04)", borderLeft: "3px solid rgba(22,163,74,0.3)" }}>
            <div style={{ color: "#6b7280", fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Source Evidence (read-only)</div>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText size={10} color="#16a34a" />
              <span style={{ color: "#16a34a", fontSize: "0.72rem" }}>{candidate.source_file}</span>
            </div>
            <p style={{ color: "#374151", fontSize: "0.72rem", lineHeight: 1.5, fontStyle: "italic" }}>
              {candidate.evidence_quote.length > 250 ? candidate.evidence_quote.slice(0, 250) + "..." : candidate.evidence_quote}
            </p>
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
              <span style={{ color: "#dc2626", fontSize: "0.74rem" }}>{error}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <button onClick={onClose} style={{ color: "#6b7280", fontSize: "0.78rem", padding: "6px 14px" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
            style={{ background: "#16a34a", color: "#fff", fontSize: "0.78rem", fontWeight: 600, opacity: saving || !title.trim() ? 0.5 : 1 }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {labelText}
          </button>
        </div>
      </div>
    </div>
  );
}

function CandidateUpdatesView({ onNavigate }: { onNavigate: (page: Page, ctx?: NavContext) => void }) {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [candidates, setCandidates] = useState<AIUpdateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [lastResult, setLastResult] = useState<{ created: number; skipped: number; error?: string | null } | null>(null);
  const [convertModal, setConvertModal] = useState<{ candidate: AIUpdateCandidate; mode: ConvertMode } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [status, list] = await Promise.all([
        getAIStatus(),
        listAICandidates(),
      ]);
      setAiStatus(status);
      setCandidates(list.candidates);
    } catch {
      setAiStatus({ available: false, message: "Backend unavailable." });
      setCandidates([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExtract = async () => {
    setExtracting(true);
    setLastResult(null);
    setSuccessMsg(null);
    try {
      const result = await extractAICandidates();
      setLastResult({ created: result.count_created, skipped: result.count_skipped, error: result.error });
      await load();
    } catch {
      setLastResult({ created: 0, skipped: 0, error: "Extraction request failed." });
    }
    setExtracting(false);
  };

  const handleReview = async (id: number, status: string, reviewerAction?: string) => {
    try {
      const updated = await reviewAICandidate(id, { status, reviewer_action: reviewerAction });
      setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c));
    } catch { /* silently fail */ }
    setRejectingId(null);
    setRejectReason("");
  };

  const handleConverted = (updated: AIUpdateCandidate) => {
    setCandidates((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    const label = updated.converted_to_type === "requirement" ? "requirement" : "follow-up";
    setSuccessMsg(`Converted to ${label} successfully.`);
    setConvertModal(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: "#9ca3af", fontSize: "0.82rem" }}>
          <Loader2 size={14} className="animate-spin" /> Loading insight candidates...
        </div>
      </div>
    );
  }

  // Compute unique values for filter dropdowns
  const uniqueTypes = Array.from(new Set(candidates.map((c) => c.update_type))).sort();
  const uniqueTopics = Array.from(new Set(candidates.map((c) => c.topic).filter(Boolean) as string[])).sort();
  const uniqueSources = Array.from(new Set(candidates.map((c) => c.source_file))).sort();

  // Apply all filters
  const filtered = candidates.filter((c) => {
    // Status filter
    if (statusFilter === "converted" && !c.converted_to_type) return false;
    if (statusFilter === "accepted" && (c.status !== "accepted" || !!c.converted_to_type)) return false;
    if (statusFilter === "candidate" && c.status !== "candidate") return false;
    if (statusFilter === "rejected" && c.status !== "rejected") return false;
    // Type filter
    if (typeFilter !== "all" && c.update_type !== typeFilter) return false;
    // Topic filter
    if (topicFilter !== "all" && (c.topic || "") !== topicFilter) return false;
    // Source filter
    if (sourceFilter !== "all" && c.source_file !== sourceFilter) return false;
    return true;
  });

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || topicFilter !== "all" || sourceFilter !== "all";

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Conversion modal */}
      {convertModal && (
        <ConvertModal candidate={convertModal.candidate} mode={convertModal.mode}
          onClose={() => setConvertModal(null)} onConverted={handleConverted} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ color: "#0f172a", fontSize: "0.92rem", fontWeight: 700 }}>Insight Candidates</div>
          <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginTop: 2 }}>
            AI-suggested customer updates grounded in parsed evidence. Review, accept, and convert.
          </div>
        </div>
        <div className="flex items-center gap-2">
          {candidates.length > 0 && (
            <button onClick={() => downloadCsv(
              ["ID", "Type", "Title", "Description", "Topic", "Status", "Confidence", "Source File", "Evidence Quote", "Reviewer Action", "Converted To", "Created"],
              candidates.map((c) => [c.id, c.update_type, c.title, c.description, c.topic, c.status, c.confidence != null ? Math.round(c.confidence * 100) + "%" : "", c.source_file, c.evidence_quote, c.reviewer_action, c.converted_to_type, c.created_at]),
              "insight_candidates_export",
            )} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.78rem" }}>
              <Download size={12} /> Export CSV
            </button>
          )}
          {aiStatus?.available && (
            <button onClick={handleExtract} disabled={extracting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
              style={{ background: "#16a34a", color: "#fff", fontSize: "0.78rem", fontWeight: 600, opacity: extracting ? 0.6 : 1 }}>
              {extracting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {extracting ? "Generating..." : "Generate Insights"}
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 rounded-lg px-4 py-2.5 flex items-center justify-between"
          style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.12)" }}>
          <span className="flex items-center gap-1.5" style={{ color: "#16a34a", fontSize: "0.78rem" }}>
            <CheckCircle size={12} /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} style={{ color: "#9ca3af" }}><X size={14} /></button>
        </div>
      )}

      {/* Extraction result banner */}
      {lastResult && (
        <div className="mb-4 rounded-lg px-4 py-2.5 flex items-center justify-between"
          style={{ background: lastResult.error ? "rgba(220,38,38,0.04)" : "rgba(22,163,74,0.04)", border: `1px solid ${lastResult.error ? "rgba(220,38,38,0.12)" : "rgba(22,163,74,0.12)"}` }}>
          <span style={{ color: lastResult.error ? "#dc2626" : "#16a34a", fontSize: "0.78rem" }}>
            {lastResult.error
              ? lastResult.error
              : lastResult.created > 0
                ? `Generated ${lastResult.created} new insight${lastResult.created !== 1 ? "s" : ""} from parsed evidence.${lastResult.skipped > 0 ? ` ${lastResult.skipped} already captured or ungrounded.` : ""}`
                : "No new insights found — all evidence has been captured or no grounded updates detected."}
          </span>
          <button onClick={() => setLastResult(null)} style={{ color: "#9ca3af" }}><X size={14} /></button>
        </div>
      )}

      {/* LLM unavailable state */}
      {aiStatus && !aiStatus.available && candidates.length === 0 && (
        <div className="rounded-xl px-5 py-6 text-center" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <AlertCircle size={28} color="#d97706" style={{ margin: "0 auto 12px" }} />
          <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700, marginBottom: 4 }}>AI extraction unavailable</div>
          <p style={{ color: "#6b7280", fontSize: "0.78rem", maxWidth: 480, margin: "0 auto" }}>
            {aiStatus.message}
          </p>
        </div>
      )}

      {/* Empty state */}
      {aiStatus?.available && candidates.length === 0 && !lastResult && (
        <EmptyState
          icon={<FileText size={28} />}
          title="No insight candidates yet"
          description="Click Generate Insights to extract reviewable customer updates from parsed evidence."
        />
      )}

      {/* Filter bar */}
      {candidates.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Status chips */}
          {[
            { key: "all", label: "All", count: candidates.length },
            { key: "candidate", label: "Pending", count: candidates.filter((c) => c.status === "candidate").length },
            { key: "accepted", label: "Accepted", count: candidates.filter((c) => c.status === "accepted" && !c.converted_to_type).length },
            { key: "converted", label: "Converted", count: candidates.filter((c) => !!c.converted_to_type).length },
            { key: "rejected", label: "Rejected", count: candidates.filter((c) => c.status === "rejected").length },
          ].map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} className="px-3 py-1 rounded-full transition-colors"
              style={{ background: statusFilter === f.key ? "#16a34a" : "transparent", color: statusFilter === f.key ? "#fff" : "#6b7280", border: `1px solid ${statusFilter === f.key ? "#16a34a" : "rgba(0,0,0,0.08)"}`, fontSize: "0.72rem", fontWeight: statusFilter === f.key ? 600 : 400 }}>
              {f.label} ({f.count})
            </button>
          ))}

          {/* Type dropdown */}
          {uniqueTypes.length > 1 && (
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg cursor-pointer"
              style={{ background: typeFilter !== "all" ? "rgba(139,92,246,0.08)" : "#f8fafc", color: typeFilter !== "all" ? "#7c3aed" : "#6b7280", border: `1px solid ${typeFilter !== "all" ? "rgba(139,92,246,0.22)" : "rgba(0,0,0,0.08)"}`, fontSize: "0.72rem", fontWeight: typeFilter !== "all" ? 600 : 400, outline: "none" }}>
              <option value="all">All types</option>
              {uniqueTypes.map((t) => <option key={t} value={t}>{(UPDATE_TYPE_STYLE[t] || { label: t }).label}</option>)}
            </select>
          )}

          {/* Topic dropdown */}
          {uniqueTopics.length > 0 && (
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg cursor-pointer"
              style={{ background: topicFilter !== "all" ? "rgba(22,163,74,0.08)" : "#f8fafc", color: topicFilter !== "all" ? "#16a34a" : "#6b7280", border: `1px solid ${topicFilter !== "all" ? "rgba(22,163,74,0.22)" : "rgba(0,0,0,0.08)"}`, fontSize: "0.72rem", fontWeight: topicFilter !== "all" ? 600 : 400, outline: "none" }}>
              <option value="all">All topics</option>
              {uniqueTopics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {/* Source file dropdown */}
          {uniqueSources.length > 1 && (
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg cursor-pointer"
              style={{ background: sourceFilter !== "all" ? "rgba(59,130,246,0.08)" : "#f8fafc", color: sourceFilter !== "all" ? "#2563eb" : "#6b7280", border: `1px solid ${sourceFilter !== "all" ? "rgba(59,130,246,0.22)" : "rgba(0,0,0,0.08)"}`, fontSize: "0.72rem", fontWeight: sourceFilter !== "all" ? 600 : 400, outline: "none", maxWidth: 200 }}>
              <option value="all">All files</option>
              {uniqueSources.map((s) => <option key={s} value={s}>{s.length > 40 ? s.slice(0, 40) + "..." : s}</option>)}
            </select>
          )}

          {/* Count indicator */}
          <span style={{ color: "#9ca3af", fontSize: "0.66rem", marginLeft: "auto" }}>
            {hasActiveFilters ? `${filtered.length} of ${candidates.length}` : `${candidates.length} total`}
          </span>
        </div>
      )}

      {/* Filtered empty state */}
      {candidates.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<Filter size={28} />}
          title="No candidates match your filters"
          description="Try adjusting the status, type, topic, or source file filter."
        />
      )}

      {/* Candidate cards */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => {
            const typeStyle = UPDATE_TYPE_STYLE[c.update_type] || UPDATE_TYPE_STYLE.clarification;
            const statStyle = STATUS_BADGE_STYLE[c.status] || STATUS_BADGE_STYLE.candidate;
            const isConverted = !!c.converted_to_type;
            const isRejectOpen = rejectingId === c.id;
            const isRecent = c.created_at && (Date.now() - new Date(c.created_at).getTime()) < 24 * 60 * 60 * 1000;
            return (
              <div key={c.id} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: `1px solid ${isConverted ? "rgba(22,163,74,0.15)" : isRecent && c.status === "candidate" ? "rgba(59,130,246,0.2)" : "rgba(0,0,0,0.06)"}` }}>
                <div className="px-5 py-3.5">
                  {/* Top row: badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: typeStyle.bg, color: typeStyle.text, fontSize: "0.62rem", fontWeight: 600 }}>
                      {typeStyle.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: statStyle.bg, color: statStyle.text, fontSize: "0.62rem", fontWeight: 600 }}>
                      {statStyle.label}
                    </span>
                    {isRecent && c.status === "candidate" && (
                      <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.10)", color: "#2563eb", fontSize: "0.58rem", fontWeight: 700 }}>New</span>
                    )}
                    {isConverted && (
                      <span className="px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.62rem", fontWeight: 600 }}>
                        <CheckCircle size={9} /> Converted to {c.converted_to_type === "requirement" ? "Requirement" : "Follow-up"}
                      </span>
                    )}
                    {c.confidence != null && (
                      <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>
                        {Math.round(c.confidence * 100)}% confidence
                      </span>
                    )}
                    {c.topic && (
                      <span className="px-2 py-0.5 rounded-full" style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.62rem" }}>
                        {c.topic}
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <div style={{ color: "#0f172a", fontSize: "0.84rem", fontWeight: 600 }}>{c.title}</div>
                  {c.description && (
                    <p style={{ color: "#374151", fontSize: "0.78rem", lineHeight: 1.55, marginTop: 4 }}>
                      {c.description.length > 250 ? c.description.slice(0, 250) + "..." : c.description}
                    </p>
                  )}

                  {/* Evidence quote */}
                  <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: "rgba(107,114,128,0.04)", borderLeft: "3px solid rgba(22,163,74,0.3)" }}>
                    <div style={{ color: "#6b7280", fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Evidence</div>
                    <p style={{ color: "#374151", fontSize: "0.74rem", lineHeight: 1.6, fontStyle: "italic" }}>
                      {c.evidence_quote.length > 300 ? c.evidence_quote.slice(0, 300) + "..." : c.evidence_quote}
                    </p>
                  </div>

                  {/* Reject reason display */}
                  {c.status === "rejected" && c.reviewer_action && (
                    <div className="mt-2 flex items-start gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(107,114,128,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
                      <span style={{ color: "#9ca3af", fontSize: "0.62rem", fontWeight: 600, flexShrink: 0 }}>Reason:</span>
                      <span style={{ color: "#6b7280", fontSize: "0.68rem" }}>{c.reviewer_action}</span>
                    </div>
                  )}

                  {/* Audit lifecycle line */}
                  <div className="mt-2.5 flex items-center gap-1.5" style={{ color: "#9ca3af", fontSize: "0.64rem" }}>
                    <Clock size={9} />
                    {c.status === "candidate" && "Suggested by AI"}
                    {c.status === "accepted" && !isConverted && "Accepted for review"}
                    {c.status === "rejected" && "Rejected"}
                    {isConverted && (
                      <>Accepted &rarr; Converted to {c.converted_to_type === "requirement" ? "Requirement" : "Follow-up"} &middot; {(c.converted_at || "").slice(0, 10)}</>
                    )}
                    <span>&middot;</span>
                    <FileText size={9} color="#16a34a" />
                    <span style={{ color: "#16a34a" }}>{c.source_file}</span>
                    <span>{c.created_at.slice(0, 10)}</span>
                  </div>

                  {/* Inline reject reason input */}
                  {isRejectOpen && (
                    <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(220,38,38,0.03)", border: "1px solid rgba(220,38,38,0.12)" }}>
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejecting (optional)..."
                        className="flex-1 bg-transparent outline-none"
                        style={{ fontSize: "0.76rem", color: "#374151" }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleReview(c.id, "rejected", rejectReason.trim() || undefined); }}
                      />
                      <button onClick={() => handleReview(c.id, "rejected", rejectReason.trim() || undefined)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg shrink-0"
                        style={{ background: "#dc2626", color: "#fff", fontSize: "0.72rem", fontWeight: 600 }}>
                        <X size={10} /> Reject
                      </button>
                      <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        style={{ color: "#9ca3af", fontSize: "0.72rem" }}>Cancel</button>
                    </div>
                  )}

                  {/* Actions row */}
                  {!isRejectOpen && (
                    <div className="flex items-center justify-end mt-2.5 gap-1.5 flex-wrap">
                      {/* candidate status: Accept / Reject */}
                      {c.status === "candidate" && (
                        <>
                          <button onClick={() => handleReview(c.id, "accepted")}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg"
                            style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                            <Check size={10} /> Accept
                          </button>
                          <button onClick={() => { setRejectingId(c.id); setRejectReason(""); }}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(220,38,38,0.15)" }}>
                            <X size={10} /> Reject
                          </button>
                        </>
                      )}
                      {/* accepted + not converted: Convert buttons + reset */}
                      {c.status === "accepted" && !isConverted && (
                        <>
                          <button onClick={() => setConvertModal({ candidate: c, mode: "requirement" })}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg"
                            style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(139,92,246,0.18)" }}>
                            <ClipboardList size={10} /> Convert to Requirement
                          </button>
                          <button onClick={() => setConvertModal({ candidate: c, mode: "action" })}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg"
                            style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(217,119,6,0.18)" }}>
                            <AlertCircle size={10} /> Convert to Follow-up
                          </button>
                          <button onClick={() => handleReview(c.id, "candidate")}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg"
                            style={{ background: "rgba(217,119,6,0.06)", color: "#d97706", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(217,119,6,0.15)" }}>
                            <RefreshCw size={10} /> Reset
                          </button>
                        </>
                      )}
                      {/* converted: View navigation */}
                      {isConverted && (
                        <button onClick={() => onNavigate("summaries", { summariesTab: c.converted_to_type === "requirement" ? "requirements" : "followups" })}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg"
                          style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                          <Eye size={10} /> {c.converted_to_type === "requirement" ? "View Requirement" : "View Follow-up"}
                        </button>
                      )}
                      {/* rejected: Reset only */}
                      {c.status === "rejected" && (
                        <button onClick={() => handleReview(c.id, "candidate")}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg"
                          style={{ background: "rgba(217,119,6,0.06)", color: "#d97706", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(217,119,6,0.15)" }}>
                          <RefreshCw size={10} /> Reset
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type TopTab = "brief" | "timeline" | "topics" | "requirements" | "files" | "followups" | "candidates";

interface Props {
  initialTab?: TopTab;
  initialTopic?: string;
  onOpenDrawer: (item: EvidenceItem) => void;
  onOpenAsk: (context: string) => void;
  onNavigate: (page: Page, ctx?: NavContext) => void;
  role?: Role;
}

export function Summaries({ initialTab, initialTopic, onOpenDrawer, onOpenAsk, onNavigate, role = "All Views" }: Props) {
  const rc = roleConfig[role];
  const [activeTab, setActiveTab] = useState<TopTab>(initialTab || "brief");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // Fetch lightweight counts for tab badges
  useEffect(() => {
    (async () => {
      try {
        const [s, cands] = await Promise.all([
          getDashboardStats(),
          listAICandidates({ status: "candidate" }).catch(() => ({ candidates: [], total: 0 })),
        ]);
        setTabCounts({
          requirements: (s as any).open_requirements ?? 0,
          followups: (s as any).open_followups ?? 0,
          files: s.files_indexed ?? 0,
          candidates: cands.total ?? 0,
        });
      } catch { /* badges optional */ }
    })();
  }, []);

  const activeFilterCount =
    (filters.sourceTypes.length < allSourceTypes.length ? 1 : 0) +
    (filters.customerOnly ? 1 : 0) +
    (!filters.includeDecks ? 1 : 0) +
    (filters.topics.length > 0 ? 1 : 0) +
    (filters.freshness !== "all" ? 1 : 0);

  const topTabs: { id: TopTab; label: string; count?: number }[] = [
    { id: "brief",        label: "Executive Brief" },
    { id: "timeline",     label: "Timeline" },
    { id: "topics",       label: "Tracked Topics" },
    { id: "requirements", label: "Requirements", count: tabCounts.requirements },
    { id: "followups",    label: "Open Follow-ups", count: tabCounts.followups },
    { id: "files",        label: "File Summaries", count: tabCounts.files },
    { id: "candidates",   label: "Insight Candidates", count: tabCounts.candidates },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      <div className="flex items-center justify-between px-6" style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="flex">
          {topTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-5 py-3 border-b-2 transition-colors flex items-center gap-1.5"
                style={{ borderColor: isActive ? "#16a34a" : "transparent", color: isActive ? "#16a34a" : "#6b7280", fontSize: "0.82rem", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className="rounded-full" style={{ background: isActive ? "rgba(22,163,74,0.15)" : "rgba(107,114,128,0.12)", color: isActive ? "#16a34a" : "#9ca3af", fontSize: "0.58rem", fontWeight: 700, padding: "1px 5px", minWidth: 16, textAlign: "center", display: "inline-block" }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: showFilters ? "rgba(22,163,74,0.08)" : "#f8fafc", border: `1px solid ${showFilters ? "rgba(22,163,74,0.22)" : "rgba(0,0,0,0.10)"}`, color: showFilters ? "#16a34a" : "#374151", fontSize: "0.78rem", fontWeight: showFilters ? 600 : 400 }}>
            <SlidersHorizontal size={12} /> Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full" style={{ background: "#16a34a", color: "#fff", fontSize: "0.62rem", fontWeight: 700, minWidth: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "brief"        && <BackendExecBrief onNavigate={onNavigate} onOpenAsk={onOpenAsk} />}
          {activeTab === "timeline"     && <BackendTimelineView onOpenDrawer={onOpenDrawer} onOpenAsk={onOpenAsk} highlightedTopics={rc.highlightedTopics} />}
          {activeTab === "topics"       && <BackendTrackedTopicsView initialTopic={initialTopic} onOpenAsk={onOpenAsk} highlightedTopics={rc.highlightedTopics} />}
          {activeTab === "requirements" && <RequirementsView onOpenDrawer={onOpenDrawer} onOpenAsk={onOpenAsk} highlightedTopics={rc.highlightedTopics} filters={filters} />}
          {activeTab === "followups"    && <FollowupsView onOpenDrawer={onOpenDrawer} onOpenAsk={onOpenAsk} />}
          {activeTab === "files"        && <BackendFileSummariesView onOpenDrawer={onOpenDrawer} onOpenAsk={onOpenAsk} />}
          {activeTab === "candidates"   && <CandidateUpdatesView onNavigate={onNavigate} />}
        </div>
        {showFilters && <FilterPanel filters={filters} onChange={setFilters} />}
      </div>
    </div>
  );
}
