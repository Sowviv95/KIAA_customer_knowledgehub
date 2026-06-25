import { ReactNode } from "react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface BaseButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: { fontSize: "0.74rem", padding: "6px 12px" },
  md: { fontSize: "0.82rem", padding: "8px 16px" },
};

/** Filled green — primary CTA */
export function ButtonPrimary({ children, onClick, disabled, size = "md", className = "" }: BaseButtonProps) {
  const s = sizeStyles[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-colors ${className}`}
      style={{
        background: disabled ? "#e5e7eb" : "#16a34a",
        color: disabled ? "#9ca3af" : "#ffffff",
        fontWeight: 600,
        fontFamily: FF,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        ...s,
      }}
    >
      {children}
    </button>
  );
}

/** Bordered neutral — secondary action */
export function ButtonSecondary({ children, onClick, disabled, size = "md", className = "" }: BaseButtonProps) {
  const s = sizeStyles[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-colors ${className}`}
      style={{
        background: "#ffffff",
        color: "#374151",
        fontWeight: 500,
        fontFamily: FF,
        border: "1px solid rgba(0,0,0,0.10)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...s,
      }}
    >
      {children}
    </button>
  );
}

/** Green tinted — ghost action on a green item */
export function ButtonGhost({ children, onClick, disabled, size = "sm", className = "" }: BaseButtonProps) {
  const s = sizeStyles[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded transition-colors ${className}`}
      style={{
        background: "rgba(22,163,74,0.08)",
        color: "#16a34a",
        fontWeight: 500,
        fontFamily: FF,
        border: "1px solid rgba(22,163,74,0.22)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...s,
      }}
    >
      {children}
    </button>
  );
}

/** Primary with spinning loader — in-progress action */
export function ButtonLoading({ children, size = "md", className = "" }: Pick<BaseButtonProps, "size" | "className"> & { children?: React.ReactNode }) {
  const s = sizeStyles[size ?? "md"];
  return (
    <button
      disabled
      className={`inline-flex items-center gap-2 rounded-lg ${className}`}
      style={{ background: "#16a34a", color: "#ffffff", fontWeight: 600, fontFamily: FF, border: "none", cursor: "not-allowed", opacity: 0.8, ...s }}
    >
      <span className="rounded-full" style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "kh-spin 0.7s linear infinite" }} />
      {children ?? "Loading…"}
      <style>{`@keyframes kh-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

/** Flat muted — tertiary / destructive-safe action */
export function ButtonFlat({ children, onClick, disabled, size = "sm", className = "" }: BaseButtonProps) {
  const s = sizeStyles[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded transition-colors ${className}`}
      style={{
        background: "#f0f4f8",
        color: "#374151",
        fontWeight: 400,
        fontFamily: FF,
        border: "1px solid rgba(0,0,0,0.08)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...s,
      }}
    >
      {children}
    </button>
  );
}
