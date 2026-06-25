import { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * KpiCard / Default  — neutral green accent, deltaUp = true
 * KpiCard / Warning  — amber/red accent, deltaUp = false
 */
interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  icon: ReactNode;
  accentColor: string;
  accentBg: string;
  onClick?: () => void;
}

export function KpiCard({ label, value, delta, deltaUp, icon, accentColor, accentBg, onClick }: KpiCardProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl px-4 py-3 flex items-center gap-3 text-left w-full group"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        fontFamily: FF,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(22,163,74,0.30)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div
        className="rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accentBg, width: 32, height: 32 }}
      >
        <span style={{ color: accentColor, display: "flex" }}>{icon}</span>
      </div>

      {/* Values */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span style={{ color: "#0f172a", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1 }}>{value}</span>
          <span style={{ color: deltaUp ? "#16a34a" : "#d97706", fontSize: "0.66rem" }}>{delta}</span>
        </div>
        <div style={{ color: "#6b7280", fontSize: "0.74rem", marginTop: 2 }}>{label}</div>
      </div>

      {/* Arrow */}
      {onClick && (
        <ArrowUpRight size={12} color="#d1d5db" className="shrink-0 group-hover:text-green-500 transition-colors" />
      )}
    </button>
  );
}
