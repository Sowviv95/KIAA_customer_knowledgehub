const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export type SummaryStatus = "Done" | "Pending" | "In Progress" | "Skipped" | "Missing";

const statusConfig: Record<SummaryStatus, { bg: string; text: string }> = {
  Done:          { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  Pending:       { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
  "In Progress": { bg: "rgba(59,130,246,0.08)", text: "#2563eb" },
  Skipped:       { bg: "rgba(0,0,0,0.04)",      text: "#9ca3af" },
  Missing:       { bg: "rgba(220,38,38,0.08)",  text: "#dc2626" },
};

interface SummaryStatusBadgeProps {
  status: SummaryStatus;
}

export function SummaryStatusBadge({ status }: SummaryStatusBadgeProps) {
  const { bg, text } = statusConfig[status] ?? statusConfig["Skipped"];
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{ background: bg, color: text, fontSize: "0.74rem", padding: "2px 10px", fontFamily: FF }}
    >
      {status}
    </span>
  );
}
