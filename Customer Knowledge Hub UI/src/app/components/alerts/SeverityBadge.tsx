const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * SeverityBadge / High   — red
 * SeverityBadge / Medium — amber
 * SeverityBadge / Low    — green
 */
export type Severity = "High" | "Medium" | "Low";

const severityConfig: Record<Severity, { bg: string; text: string; dot: string }> = {
  High:   { bg: "rgba(220,38,38,0.08)",  text: "#dc2626", dot: "#dc2626" },
  Medium: { bg: "rgba(217,119,6,0.08)",  text: "#d97706", dot: "#d97706" },
  Low:    { bg: "rgba(22,163,74,0.08)",  text: "#16a34a", dot: "#16a34a" },
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { bg, text, dot } = severityConfig[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{ background: bg, color: text, fontSize: "0.74rem", fontWeight: 600, padding: "3px 10px", fontFamily: FF }}
    >
      <span className="rounded-full" style={{ width: 5, height: 5, background: dot, display: "inline-block" }} />
      {severity}
    </span>
  );
}
