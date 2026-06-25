const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface TrackedTopicChipProps {
  label: string;
  onClick?: () => void;
  /** selected: renders as an active green filter pill */
  selected?: boolean;
  disabled?: boolean;
  /** Optional count badge */
  count?: number;
}

export function TrackedTopicChip({ label, onClick, selected = false, disabled = false, count }: TrackedTopicChipProps) {
  if (selected) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-3 py-1.5 rounded-full"
        style={{
          background: "rgba(22,163,74,0.12)",
          border: "1px solid rgba(22,163,74,0.40)",
          color: "#16a34a",
          fontSize: "0.78rem",
          fontWeight: 600,
          fontFamily: FF,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {label}
        {count != null && count > 0 && (
          <span style={{ marginLeft: 4, background: "rgba(22,163,74,0.20)", color: "#16a34a", fontSize: "0.58rem", fontWeight: 700, borderRadius: 9999, padding: "1px 5px", display: "inline-block" }}>{count}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-full transition-all"
      style={{
        background: "#f8fafc",
        border: "1px solid rgba(0,0,0,0.08)",
        color: disabled ? "#9ca3af" : "#374151",
        fontSize: "0.78rem",
        fontFamily: FF,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLElement).style.background = "rgba(22,163,74,0.08)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(22,163,74,0.30)";
        (e.currentTarget as HTMLElement).style.color = "#16a34a";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLElement).style.background = "#f8fafc";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.color = "#374151";
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span style={{ marginLeft: 4, background: "rgba(22,163,74,0.12)", color: "#16a34a", fontSize: "0.58rem", fontWeight: 700, borderRadius: 9999, padding: "1px 5px", display: "inline-block" }}>{count}</span>
      )}
    </button>
  );
}
