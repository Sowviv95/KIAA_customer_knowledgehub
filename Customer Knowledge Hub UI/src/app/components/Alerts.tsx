import React, { useState, useEffect } from "react";
import { Clock, Filter, ChevronRight, ChevronDown, ChevronUp, X, Eye, MessageSquare, Bell, User, Tag, AlertTriangle, WifiOff, Database as DbIcon, Plus, Check, Loader2 } from "lucide-react";
import { EvidenceItem, Role, AlertItem, AlertType, AlertStatus, Severity } from "../types";
import { EmptyState } from "./ui/EmptyState";
import { alertRoleRelevance, roleConfig } from "../roleConfig";
import { SeverityBadge } from "./alerts/SeverityBadge";
import { AlertStatusBadge } from "./alerts/AlertStatusBadge";
import { AlertTypeBadge, AlertTypeChip, alertTypeConfig } from "./alerts/AlertTypeBadge";
import { ButtonGhost } from "./ui/Button";
import { getAlerts, updateAlertStatus as apiUpdateAlertStatus, mapBackendAlertToAlertItem } from "../api/alertsApi";
import { createAction } from "../api/actionsApi";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const severityOrder: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 };

interface Props {
  initialFilter?: "new";
  onOpenDrawer: (item: EvidenceItem) => void;
  onOpenAsk: (context: string) => void;
  role?: Role;
}

type DataSource = "backend" | "offline" | "loading";

export function Alerts({ initialFilter, onOpenDrawer, onOpenAsk, role = "All Views" }: Props) {
  const rc = roleConfig[role];
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("loading");
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "All">(initialFilter === "new" ? "New" : "All");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "All">("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [creatingFollowup, setCreatingFollowup] = useState<number | null>(null); // alert id being created
  const [followupCreated, setFollowupCreated] = useState<Set<number>>(new Set()); // alert ids with created follow-ups

  const handleCreateFollowup = async (alert: AlertItem) => {
    if (creatingFollowup === alert.id || followupCreated.has(alert.id)) return;
    setCreatingFollowup(alert.id);
    try {
      await createAction({
        text: `[${alert.type}] ${alert.description}`,
        source_file: alert.sourceFile || undefined,
        excerpt: alert.excerpt || alert.description,
        priority: alert.severity === "High" ? "High" : alert.severity === "Low" ? "Low" : "Medium",
      });
      setFollowupCreated((prev) => new Set(prev).add(alert.id));
    } catch { /* keep button available on failure */ }
    setCreatingFollowup(null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendAlerts = await getAlerts();
        if (cancelled) return;
        if (backendAlerts.length > 0) {
          setAlerts(backendAlerts.map(mapBackendAlertToAlertItem));
          setDataSource("backend");
        } else {
          setAlerts([]);
          setDataSource("backend");
        }
      } catch {
        if (cancelled) return;
        setAlerts([]);
        setDataSource("offline");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateStatus = (id: number, status: AlertStatus) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (dataSource === "backend") {
      apiUpdateAlertStatus(id, status).catch(() => {
        // Revert on failure — silently keep the local change visible
      });
    }
  };

  const filtered = alerts.filter((a) => {
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    const matchSev = filterSeverity === "All" || a.severity === filterSeverity;
    return matchStatus && matchSev;
  });

  // Sort: role-relevant alerts first (when role is not "All Views"), then by severity
  const isRoleRelevant = (alert: AlertItem): boolean => {
    if (role === "All Views") return false;
    const relevance = alertRoleRelevance[alert.type] ?? [];
    return relevance.some((r) => r.short === rc.short);
  };

  const sorted = [...filtered].sort((a, b) => {
    if (role !== "All Views") {
      const aRel = isRoleRelevant(a) ? 0 : 1;
      const bRel = isRoleRelevant(b) ? 0 : 1;
      if (aRel !== bRel) return aRel - bRel;
    }
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const newCount = alerts.filter((a) => a.status === "New").length;
  const roleRelevantCount = role !== "All Views" ? sorted.filter((a) => isRoleRelevant(a)).length : 0;

  // Compute type summary dynamically from current alerts
  const typeCounts = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});
  const dynamicTypeSummary = Object.entries(typeCounts).map(([type, count]) => ({ type: type as AlertType, count }));

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      {/* Sub-header */}
      <div
        className="px-7 py-2.5 flex items-center justify-between"
        style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>Automated signals from customer files, meetings and emails</p>
          {newCount > 0 && (
            <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", fontSize: "0.74rem", fontWeight: 700, border: "1px solid rgba(220,38,38,0.2)" }}>
              {newCount} new
            </span>
          )}
          {/* Data source indicator */}
          {dataSource === "offline" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", fontSize: "0.66rem", fontWeight: 600, border: "1px solid rgba(220,38,38,0.18)" }}>
              <WifiOff size={9} /> Backend unavailable
            </span>
          )}
          {dataSource === "backend" && alerts.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.66rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
              <DbIcon size={9} /> From backend
            </span>
          )}
          {/* Role context pill */}
          {role !== "All Views" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: rc.accentBg, color: rc.accentColor, fontSize: "0.74rem", fontWeight: 600, border: `1px solid ${rc.accentColor}30` }}>
              <User size={11} /> {roleRelevantCount} relevant for {rc.short}
            </span>
          )}
        </div>
        <button
          className="px-4 py-1.5 rounded-lg"
          style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.78rem" }}
        >
          Configure Rules
        </button>
      </div>

      {/* Alert type summary strip */}
      <div
        className="px-7 py-3 flex gap-2 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#ffffff" }}
      >
        {dynamicTypeSummary.map((card) => (
          <AlertTypeChip key={card.type} type={card.type} count={card.count} />
        ))}
      </div>

      {/* Filters */}
      <div
        className="px-7 py-3 flex items-center gap-3"
        style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-1.5" style={{ color: "#6b7280", fontSize: "0.74rem" }}>
          <Filter size={12} /> Filter:
        </div>
        <div className="flex gap-1.5">
          {(["All", "New", "Reviewed", "Ignored", "Action"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1 rounded-full transition-colors"
              style={{
                background: filterStatus === s ? "#16a34a" : "transparent",
                color: filterStatus === s ? "#ffffff" : "#6b7280",
                border: `1px solid ${filterStatus === s ? "#16a34a" : "rgba(0,0,0,0.08)"}`,
                fontSize: "0.74rem",
                fontWeight: filterStatus === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-4">
          {(["All", "High", "Medium", "Low"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className="px-3 py-1 rounded-full transition-colors"
              style={{
                background: filterSeverity === s ? "#0f172a" : "transparent",
                color: filterSeverity === s ? "#ffffff" : "#6b7280",
                border: `1px solid ${filterSeverity === s ? "#0f172a" : "rgba(0,0,0,0.08)"}`,
                fontSize: "0.74rem",
                fontWeight: filterSeverity === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginLeft: "auto" }}>{sorted.length} alerts</div>
      </div>

      {/* Table — empty state */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <EmptyState
            icon={<Bell size={28} />}
            title={alerts.length === 0 ? "No alerts yet" : "No alerts match your filters"}
            description={
              alerts.length === 0 && dataSource === "backend"
                ? "No alerts generated yet. Configure a folder in Settings and run Scan Folder."
                : alerts.length === 0
                ? "Alerts will appear here when new customer files, schema changes or SLA mentions are detected."
                : "Try clearing the status or severity filter."
            }
          />
        )}
        {sorted.length > 0 && (
        <table className="w-full border-collapse">
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {["", "Severity", "Alert Type", "Description", "Source File", "Tracked Topic", "Relevant for", "Status", "Created", "Actions"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3"
                  style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", ...(h === "" ? { width: 28, padding: "0 0 0 12px" } : {}) }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((alert) => {
              const isExpanded = expandedId === alert.id;
              const roleRel = isRoleRelevant(alert);
              return (
              <React.Fragment key={alert.id}>
                <tr
                  className="transition-colors hover:bg-green-50 cursor-pointer"
                  style={{ borderBottom: isExpanded ? "none" : "1px solid rgba(0,0,0,0.04)", background: roleRel ? "rgba(22,163,74,0.02)" : "#ffffff" }}
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  {/* Expand toggle */}
                  <td style={{ padding: "0 0 0 12px", width: 28 }}>
                    {isExpanded ? <ChevronUp size={12} color="#16a34a" /> : <ChevronDown size={12} color="#9ca3af" />}
                  </td>
                  {/* SeverityBadge */}
                  <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                  {/* AlertTypeBadge */}
                  <td className="px-4 py-3" style={{ minWidth: 190 }}><AlertTypeBadge type={alert.type} /></td>
                  <td className="px-4 py-3" style={{ maxWidth: 300 }}>
                    <span style={{ color: "#374151", fontSize: "0.78rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {alert.description}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ChevronRight size={11} color="#9ca3af" />
                      <span style={{ color: "#16a34a", fontSize: "0.76rem" }}>{alert.sourceFile}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full" style={{ background: "#f0f4f8", color: "#374151", fontSize: "0.72rem" }}>{alert.topic}</span>
                  </td>
                  {/* Relevant for */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(alertRoleRelevance[alert.type] ?? []).map((r) => (
                        <span key={r.short} className="px-2 py-0.5 rounded-full" style={{ background: `${r.color}12`, color: r.color, fontSize: "0.66rem", fontWeight: 600, border: `1px solid ${r.color}25`, whiteSpace: "nowrap" }}>
                          {r.short}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* AlertStatusBadge */}
                  <td className="px-4 py-3"><AlertStatusBadge status={alert.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" style={{ color: "#9ca3af", fontSize: "0.66rem", whiteSpace: "nowrap" }}>
                      <Clock size={10} /> {alert.created}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <ButtonGhost size="sm" onClick={() => onOpenDrawer({ file: alert.sourceFile, type: alert.sourceType, date: alert.created.split(" ")[0], excerpt: alert.excerpt, topic: alert.topic })}>
                        <Eye size={10} /> Evidence
                      </ButtonGhost>
                      <ButtonGhost size="sm" onClick={() => onOpenAsk(`Alert — ${alert.type}`)}>
                        <MessageSquare size={10} /> Ask AI
                      </ButtonGhost>
                      {alert.status !== "Reviewed" && (
                        <button onClick={() => updateStatus(alert.id, "Reviewed")} className="px-2.5 py-1 rounded" style={{ background: "#f0f4f8", color: "#6b7280", fontSize: "0.72rem", border: "1px solid rgba(0,0,0,0.08)" }}>
                          Reviewed
                        </button>
                      )}
                      {alert.status !== "Ignored" && (
                        <button onClick={() => updateStatus(alert.id, "Ignored")} className="px-1.5 py-1 rounded" style={{ background: "rgba(0,0,0,0.04)", color: "#9ca3af" }}>
                          <X size={11} />
                        </button>
                      )}
                      {followupCreated.has(alert.id) ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.66rem", fontWeight: 600 }}>
                          <Check size={9} /> Follow-up created
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateFollowup(alert)}
                          disabled={creatingFollowup === alert.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded"
                          style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(217,119,6,0.22)", opacity: creatingFollowup === alert.id ? 0.6 : 1 }}
                        >
                          {creatingFollowup === alert.id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Follow-up
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Expanded detail row */}
                {isExpanded && (
                  <tr style={{ background: "#fafbfc", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <td colSpan={10} className="px-6 py-4">
                      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        {/* Left: evidence excerpt */}
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                            Evidence Excerpt
                          </div>
                          <div className="rounded-lg px-4 py-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderLeft: "3px solid #16a34a" }}>
                            <p style={{ color: "#374151", fontSize: "0.78rem", lineHeight: 1.7, fontStyle: "italic" }}>
                              &ldquo;{alert.excerpt}&rdquo;
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Tag size={11} color="#16a34a" />
                            <span className="px-2.5 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                              {alert.topic}
                            </span>
                            <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>{alert.sourceType} · {alert.created}</span>
                          </div>
                        </div>
                        {/* Right: details + actions */}
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                            Alert Details
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <span style={{ color: "#6b7280", fontSize: "0.74rem", minWidth: 90 }}>Type:</span>
                              <AlertTypeBadge type={alert.type} />
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ color: "#6b7280", fontSize: "0.74rem", minWidth: 90 }}>Severity:</span>
                              <SeverityBadge severity={alert.severity} />
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ color: "#6b7280", fontSize: "0.74rem", minWidth: 90 }}>Relevant for:</span>
                              <div className="flex gap-1">
                                {(alertRoleRelevance[alert.type] ?? []).map((r) => (
                                  <span key={r.short} className="px-2 py-0.5 rounded-full" style={{ background: `${r.color}12`, color: r.color, fontSize: "0.66rem", fontWeight: 600, border: `1px solid ${r.color}25` }}>
                                    {r.short}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ color: "#6b7280", fontSize: "0.74rem", minWidth: 90 }}>Status:</span>
                              <AlertStatusBadge status={alert.status} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() => onOpenDrawer({ file: alert.sourceFile, type: alert.sourceType, date: alert.created.split(" ")[0], excerpt: alert.excerpt, topic: alert.topic })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                              style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}
                            >
                              <Eye size={11} /> View Evidence
                            </button>
                            <button
                              onClick={() => onOpenAsk(`Alert — ${alert.type}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.74rem" }}
                            >
                              <MessageSquare size={11} /> Ask AI
                            </button>
                            {alert.status === "New" && (
                              <button
                                onClick={() => updateStatus(alert.id, "Reviewed")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.74rem" }}
                              >
                                Mark Reviewed
                              </button>
                            )}
                          </div>
                          {followupCreated.has(alert.id) ? (
                            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)" }}>
                              <Check size={12} color="#16a34a" />
                              <span style={{ color: "#16a34a", fontSize: "0.74rem", fontWeight: 500 }}>
                                Follow-up action created — visible in Summaries &gt; Open Follow-ups.
                              </span>
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={12} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
                                <span style={{ color: "#92400e", fontSize: "0.72rem" }}>
                                  Review the source evidence and create a follow-up action if needed.
                                </span>
                              </div>
                              <button
                                onClick={() => handleCreateFollowup(alert)}
                                disabled={creatingFollowup === alert.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 ml-3"
                                style={{ background: "#d97706", color: "#fff", fontSize: "0.74rem", fontWeight: 600, opacity: creatingFollowup === alert.id ? 0.6 : 1 }}
                              >
                                {creatingFollowup === alert.id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Create Follow-up
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
