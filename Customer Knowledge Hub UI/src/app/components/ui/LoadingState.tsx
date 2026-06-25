const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface LoadingStateProps {
  label?: string;
  rows?: number;
}

/** Skeleton loader — shows shimmer rows matching table/card layouts */
export function LoadingState({ label = "Loading…", rows = 5 }: LoadingStateProps) {
  return (
    <div className="p-5" style={{ fontFamily: FF }}>
      <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginBottom: 16 }}>{label}</div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 mb-3">
          <div className="rounded" style={{ width: 28, height: 28, background: "#e5e7eb" }} />
          <div className="flex-1 rounded" style={{ height: 14, background: "#e5e7eb", opacity: 1 - i * 0.12 }} />
          <div className="rounded" style={{ width: 80, height: 14, background: "#e5e7eb", opacity: 0.5 }} />
        </div>
      ))}
    </div>
  );
}

/** Three-dot bounce loader for inline use (e.g. AI streaming) */
export function InlineLoader() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((n) => (
        <span
          key={n}
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "#16a34a",
            display: "inline-block",
            animation: `kh-bounce 1s ${n * 0.15}s infinite`,
            opacity: 0.6,
          }}
        />
      ))}
      <style>{`
        @keyframes kh-bounce {
          0%, 80%, 100% { transform: scale(0.6); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
