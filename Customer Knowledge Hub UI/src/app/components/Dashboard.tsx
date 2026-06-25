import { useState, useEffect, useCallback } from "react";
import { Files, FilePlus, Bell, CheckSquare, ChevronRight, Tag, AlertTriangle, Info, ArrowRight, Zap, Database as DbIcon, WifiOff, FileText } from "lucide-react";
import { Page, NavContext, Role, EvidenceItem, SourceType } from "../types";
import { KpiCard } from "./dashboard/KpiCard";
import { TrackedTopicChip } from "./dashboard/TrackedTopicChip";
import { MessageSquare } from "lucide-react";
import { roleConfig } from "../roleConfig";
import { trackedTopicLabels } from "../data";
import { checkHealth } from "../api/client";
import { getDashboardStats, type DashboardStats } from "../api/dashboardApi";
import { getTopicSummary, type TopicSummaryItem } from "../api/topicsApi";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const kpiIcons: Record<string, React.ReactNode> = {
  "Files Indexed":       <Files size={15} />,
  "New Customer Inputs": <FilePlus size={15} />,
  "Open Alerts":         <Bell size={15} />,
  "Open Follow-ups":     <CheckSquare size={15} />,
};

const focusItemIcons: Record<string, React.ElementType> = {
  action: ArrowRight,
  risk:   AlertTriangle,
  change: Zap,
  info:   Info,
};

const focusItemColors: Record<string, string> = {
  action: "#2563eb",
  risk:   "#dc2626",
  change: "#d97706",
  info:   "#6b7280",
};

interface Props {
  onNavigate: (page: Page, ctx?: NavContext) => void;
  onOpenAsk: (context: string) => void;
  onOpenDrawer: (item: EvidenceItem) => void;
  role: Role;
}

export function Dashboard({ onNavigate, onOpenAsk, onOpenDrawer, role }: Props) {
  const rc = roleConfig[role];
  const showFocusCard = role !== "All Views" && rc.focusItems.length > 0;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null); // null = checking
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});

  const fetchDashboard = useCallback(async () => {
    try {
      await checkHealth();
      setBackendOnline(true);
      const s = await getDashboardStats();
      setStats(s);
      try {
        const topics = await getTopicSummary();
        const counts: Record<string, number> = {};
        for (const t of topics) counts[t.topic] = t.total_items;
        setTopicCounts(counts);
      } catch { /* topics optional */ }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Build KPI values from backend stats, or show placeholder when offline
  const liveKpis = stats ? [
    { label: "Files Indexed",   value: String(stats.files_indexed),  delta: stats.files_parsed > 0 ? `${stats.files_parsed} parsed` : "0 parsed", deltaUp: true,  accentColor: "#16a34a", accentBg: "rgba(22,163,74,0.08)",    nav: { page: "files" as const,     ctx: {} } },
    { label: "Open Alerts",      value: String(stats.open_alerts),    delta: `${stats.total_alerts} total`,    deltaUp: false, accentColor: stats.open_alerts > 0 ? "#dc2626" : "#16a34a", accentBg: stats.open_alerts > 0 ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)", nav: { page: "alerts" as const, ctx: {} } },
    { label: "Open Follow-ups",  value: String(stats.open_followups), delta: `${stats.open_actions} actions, ${stats.open_requirements} req`, deltaUp: false, accentColor: "#d97706", accentBg: "rgba(217,119,6,0.08)", nav: { page: "summaries" as const, ctx: { summariesTab: "followups" as const } } },
  ] : [
    { label: "Files Indexed",   value: "—", delta: "backend offline", deltaUp: false, accentColor: "#9ca3af", accentBg: "rgba(107,114,128,0.06)", nav: { page: "files" as const, ctx: {} } },
    { label: "Open Alerts",      value: "—", delta: "backend offline", deltaUp: false, accentColor: "#9ca3af", accentBg: "rgba(107,114,128,0.06)", nav: { page: "alerts" as const, ctx: {} } },
    { label: "Open Follow-ups",  value: "—", delta: "backend offline", deltaUp: false, accentColor: "#9ca3af", accentBg: "rgba(107,114,128,0.06)", nav: { page: "summaries" as const, ctx: {} } },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* KPI strip */}
        {/* Backend offline banner */}
        {backendOnline === false && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
            <WifiOff size={12} color="#d97706" />
            <span style={{ color: "#d97706", fontSize: "0.74rem" }}>Backend offline — start FastAPI for live stats. Run: cd backend && uvicorn app.main:app --reload --port 8000</span>
          </div>
        )}

        {/* Empty state */}
        {backendOnline === true && stats && stats.files_indexed === 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}>
            <Info size={12} color="#16a34a" />
            <span style={{ color: "#16a34a", fontSize: "0.74rem" }}>
              No files indexed yet.{" "}
              <button onClick={() => onNavigate("settings")} style={{ textDecoration: "underline", fontWeight: 600 }}>Configure a folder in Settings</button> and run Scan Folder.
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {liveKpis.map((card) => {
            const isEmphasised = rc.emphasisKpi === card.label;
            return (
              <div key={card.label} style={{ position: "relative" }}>
                {isEmphasised && (
                  <div
                    className="absolute -top-1 -right-1 rounded-full z-10 flex items-center justify-center"
                    style={{ width: 14, height: 14, background: rc.accentColor }}
                    title={`Focus for ${role}`}
                  />
                )}
                <KpiCard
                  label={card.label}
                  value={card.value}
                  delta={card.delta}
                  deltaUp={card.deltaUp}
                  icon={kpiIcons[card.label] || <DbIcon size={15} />}
                  accentColor={isEmphasised ? rc.accentColor : card.accentColor}
                  accentBg={isEmphasised ? rc.accentBg : card.accentBg}
                  onClick={() => onNavigate(card.nav.page, card.nav.ctx)}
                />
              </div>
            );
          })}
        </div>

        {/* Role Focus card */}
        {showFocusCard && (
          <div
            className="rounded-xl mb-4 overflow-hidden"
            style={{ background: "#ffffff", border: `1px solid ${rc.accentColor}25` }}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ background: rc.accentBg, borderBottom: `1px solid ${rc.accentColor}20` }}>
              <div className="flex items-center gap-2">
                <span style={{ color: rc.accentColor, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Focus for {role}
                </span>
                <span style={{ color: rc.accentColor, fontSize: "0.78rem" }}>·</span>
                <span style={{ color: rc.accentColor, fontSize: "0.78rem" }}>{rc.headline}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate("summaries", { summariesTab: "brief" })}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg"
                  style={{ background: rc.accentBg, color: rc.accentColor, fontSize: "0.72rem", fontWeight: 600, border: `1px solid ${rc.accentColor}30` }}
                >
                  Executive Brief <ChevronRight size={11} />
                </button>
                <button
                  onClick={() => onOpenAsk(`Role context: ${role}`)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg"
                  style={{ background: "#0f172a", color: "#fff", fontSize: "0.72rem", fontWeight: 600 }}
                >
                  Ask AI <MessageSquare size={11} />
                </button>
              </div>
            </div>
            <div className="flex gap-0 divide-x" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
              {rc.focusItems.map((item, i) => {
                const Icon = focusItemIcons[item.type];
                const iconColor = item.type === "action" ? rc.accentColor : focusItemColors[item.type];
                return (
                  <div key={i} className="flex-1 flex items-start gap-2.5 px-4 py-3.5" style={{ borderRight: i < rc.focusItems.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                    <Icon size={13} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: "#374151", fontSize: "0.76rem", lineHeight: 1.55 }}>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main row */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Recent Customer Updates — from backend */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 600 }}>Recent Indexed Files</span>
              <button onClick={() => onNavigate("files")} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.74rem" }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            {stats && stats.latest_files.length > 0 ? stats.latest_files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-green-50 transition-colors cursor-pointer" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                onClick={() => onNavigate("files")}>
                <FileText size={12} color="#16a34a" />
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: "#374151", fontSize: "0.78rem", fontWeight: 500 }}>{f.name}</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.66rem" }}>{f.category} · {f.file_type} · {f.summary_status}</div>
                </div>
                <span style={{ color: "#9ca3af", fontSize: "0.62rem", whiteSpace: "nowrap" }}>{f.indexed_at.slice(0, 10)}</span>
              </div>
            )) : (
              <div className="px-5 py-6 text-center">
                <p style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
                  {backendOnline === false ? "Backend offline" : "No files indexed yet"}
                </p>
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 600 }}>Recent Alerts</span>
              <button onClick={() => onNavigate("alerts")} className="flex items-center gap-1" style={{ color: "#dc2626", fontSize: "0.74rem" }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            {stats && stats.latest_alerts.length > 0 ? stats.latest_alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-green-50 transition-colors cursor-pointer" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                onClick={() => onNavigate("alerts")}>
                <Bell size={12} color={a.severity === "High" ? "#dc2626" : a.severity === "Medium" ? "#d97706" : "#16a34a"} />
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: "#374151", fontSize: "0.78rem", fontWeight: 500 }}>{a.description}</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.66rem" }}>{a.type} · {a.severity} · {a.status}</div>
                </div>
                <span style={{ color: "#9ca3af", fontSize: "0.62rem", whiteSpace: "nowrap" }}>{a.created_at.slice(0, 10)}</span>
              </div>
            )) : (
              <div className="px-5 py-6 text-center">
                <p style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
                  {backendOnline === false ? "Backend offline" : "No alerts yet"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tracked Topics */}
        <div className="rounded-xl overflow-hidden mt-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 600 }}>Tracked Topics</span>
              <div className="flex items-center gap-1" style={{ color: "#9ca3af", fontSize: "0.74rem" }}>
                <Tag size={11} />
                {Object.keys(topicCounts).length > 0
                  ? `${Object.values(topicCounts).filter((c) => c > 0).length} active topics`
                  : role !== "All Views" ? `${rc.highlightedTopics.length} highlighted for ${rc.short}` : "Click to explore"
                }
              </div>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-2">
              {trackedTopicLabels.map((topic) => {
                const isHighlighted = rc.highlightedTopics.includes(topic);
                return (
                  <TrackedTopicChip
                    key={topic}
                    label={topic}
                    selected={isHighlighted && role !== "All Views"}
                    count={topicCounts[topic]}
                    onClick={() => onNavigate("summaries", { summariesTab: "topics", summariesTopic: topic })}
                  />
                );
              })}
            </div>
        </div>

      </div>
    </div>
  );
}
