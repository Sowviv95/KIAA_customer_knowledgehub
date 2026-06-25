import { Tag, X } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface ContextPillProps {
  label: string;
  onDismiss?: () => void;
}

/**
 * ContextPill — shown at the top of Ask AI when opened from another page.
 * Examples: "Context: Schema/API", "Context: Alert — SLA Mention Detected"
 */
export function ContextPill({ label, onDismiss }: ContextPillProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        background: "rgba(22,163,74,0.10)",
        color: "#16a34a",
        border: "1px solid rgba(22,163,74,0.25)",
        fontSize: "0.74rem",
        fontWeight: 600,
        padding: "3px 10px",
        fontFamily: FF,
      }}
    >
      <Tag size={11} />
      {label}
      {onDismiss && (
        <button onClick={onDismiss} style={{ color: "#16a34a", lineHeight: 1, marginLeft: 2 }}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}
