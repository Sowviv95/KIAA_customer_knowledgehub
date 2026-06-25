import { ReactNode } from "react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-8"
      style={{ fontFamily: FF, textAlign: "center" }}
    >
      {icon && (
        <div className="mb-4" style={{ color: "#e5e7eb" }}>
          {icon}
        </div>
      )}
      <div style={{ color: "#1e293b", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {description && (
        <div style={{ color: "#9ca3af", fontSize: "0.78rem", lineHeight: 1.6, maxWidth: 320 }}>{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
