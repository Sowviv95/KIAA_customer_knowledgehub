import { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** inline: small banner inside a card. page: centered full-area. */
  variant?: "inline" | "page";
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Try again or check your connection.",
  onRetry,
  variant = "page",
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div
        className="flex items-center gap-3 rounded-lg px-4 py-3"
        style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", fontFamily: FF }}
      >
        <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
        <div className="flex-1">
          <div style={{ color: "#dc2626", fontSize: "0.78rem", fontWeight: 600 }}>{title}</div>
          {description && <div style={{ color: "#6b7280", fontSize: "0.74rem", marginTop: 1 }}>{description}</div>}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1"
            style={{ color: "#dc2626", fontSize: "0.74rem", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-8"
      style={{ fontFamily: FF, textAlign: "center" }}
    >
      <div
        className="rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(220,38,38,0.07)", width: 44, height: 44 }}
      >
        <AlertTriangle size={20} color="#dc2626" />
      </div>
      <div style={{ color: "#1e293b", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#9ca3af", fontSize: "0.78rem", lineHeight: 1.6, maxWidth: 320 }}>{description}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.78rem" }}
        >
          <RefreshCw size={13} /> Try again
        </button>
      )}
    </div>
  );
}
