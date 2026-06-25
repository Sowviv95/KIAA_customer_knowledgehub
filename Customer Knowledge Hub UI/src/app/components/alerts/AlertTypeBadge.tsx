import { AlertTriangle, FilePlus, FileEdit, MessageSquare, Database, CheckSquare, List, HelpCircle } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export type AlertType =
  | "New Customer File Added"
  | "Customer Document Changed"
  | "New Meeting Note Added"
  | "Schema/API Update Detected"
  | "Source List Changed"
  | "SLA Mention Detected"
  | "New Open Question"
  | "New Action Item";

const typeConfig: Record<AlertType, { icon: React.ElementType; color: string }> = {
  "New Customer File Added":    { icon: FilePlus,      color: "#3b82f6" },
  "Customer Document Changed":  { icon: FileEdit,      color: "#7c3aed" },
  "New Meeting Note Added":     { icon: MessageSquare, color: "#0284c7" },
  "Schema/API Update Detected": { icon: Database,      color: "#7c3aed" },
  "Source List Changed":        { icon: List,          color: "#16a34a" },
  "SLA Mention Detected":       { icon: AlertTriangle, color: "#dc2626" },
  "New Open Question":          { icon: HelpCircle,    color: "#d97706" },
  "New Action Item":            { icon: CheckSquare,   color: "#d97706" },
};

interface AlertTypeBadgeProps {
  type: AlertType;
  variant?: "full" | "icon-only";
}

export function AlertTypeBadge({ type, variant = "full" }: AlertTypeBadgeProps) {
  const { icon: Icon, color } = typeConfig[type];
  if (variant === "icon-only") return <Icon size={14} color={color} />;
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: "#1e293b", fontSize: "0.76rem", fontFamily: FF }}>
      <Icon size={13} color={color} style={{ flexShrink: 0 }} />
      {type}
    </span>
  );
}

export function AlertTypeChip({ type, count }: { type: AlertType; count: number }) {
  const { icon: Icon, color } = typeConfig[type];
  return (
    <span className="inline-flex items-center gap-2 rounded-lg px-3 py-2 shrink-0" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", fontFamily: FF, cursor: "pointer" }}>
      <Icon size={13} color={color} />
      <span style={{ color: "#374151", fontSize: "0.74rem", whiteSpace: "nowrap" }}>{type}</span>
      <span className="rounded-full px-1.5" style={{ background: `${color}18`, color, fontSize: "0.66rem", fontWeight: 700 }}>{count}</span>
    </span>
  );
}

export { typeConfig as alertTypeConfig };
