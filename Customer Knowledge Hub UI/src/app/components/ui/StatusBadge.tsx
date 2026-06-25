/**
 * StatusBadge — generic pill badge with named variants.
 * Covers: StatusBadge/New, StatusBadge/Reviewed, StatusBadge/Ignored, StatusBadge/Action
 * and any other custom status.
 */

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

type StatusVariant = "New" | "Reviewed" | "Ignored" | "Action" | "Done" | "Pending" | "In Progress" | "Skipped";

const variantStyles: Record<StatusVariant, { bg: string; text: string }> = {
  New:         { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  Reviewed:    { bg: "rgba(59,130,246,0.08)", text: "#2563eb" },
  Ignored:     { bg: "rgba(0,0,0,0.04)",      text: "#9ca3af" },
  Action:      { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
  Done:        { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  Pending:     { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
  "In Progress": { bg: "rgba(59,130,246,0.08)", text: "#2563eb" },
  Skipped:     { bg: "rgba(0,0,0,0.04)",      text: "#9ca3af" },
};

interface StatusBadgeProps {
  status: StatusVariant | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = variantStyles[status as StatusVariant] ?? { bg: "rgba(0,0,0,0.04)", text: "#9ca3af" };
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{
        background: style.bg,
        color: style.text,
        fontSize: "0.74rem",
        fontWeight: 500,
        padding: "2px 10px",
        whiteSpace: "nowrap",
        fontFamily: FF,
      }}
    >
      {status}
    </span>
  );
}
