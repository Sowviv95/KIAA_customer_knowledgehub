const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * AlertStatusBadge / New      — green
 * AlertStatusBadge / Reviewed — blue
 * AlertStatusBadge / Ignored  — muted
 * AlertStatusBadge / Action   — amber
 */
export type AlertStatus = "New" | "Reviewed" | "Ignored" | "Action";

const statusConfig: Record<AlertStatus, { bg: string; text: string }> = {
  New:      { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  Reviewed: { bg: "rgba(59,130,246,0.08)", text: "#2563eb" },
  Ignored:  { bg: "rgba(0,0,0,0.04)",      text: "#9ca3af" },
  Action:   { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
};

interface AlertStatusBadgeProps {
  status: AlertStatus;
}

export function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  const { bg, text } = statusConfig[status];
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{ background: bg, color: text, fontSize: "0.74rem", fontWeight: 500, padding: "2px 10px", fontFamily: FF }}
    >
      {status}
    </span>
  );
}
