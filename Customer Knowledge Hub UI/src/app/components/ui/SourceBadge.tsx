import { MessageSquare, Mail, FileText, Presentation, Database, List } from "lucide-react";
import { SourceType } from "../../types";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export const sourceConfig: Record<SourceType, { bg: string; text: string; icon: React.ElementType }> = {
  Meeting:       { bg: "rgba(59,130,246,0.08)",  text: "#2563eb", icon: MessageSquare },
  Email:         { bg: "rgba(14,165,233,0.08)",  text: "#0284c7", icon: Mail },
  Document:      { bg: "rgba(22,163,74,0.08)",   text: "#16a34a", icon: FileText },
  Deck:          { bg: "rgba(217,119,6,0.08)",   text: "#d97706", icon: Presentation },
  Schema:        { bg: "rgba(139,92,246,0.08)",  text: "#7c3aed", icon: Database },
  "Source List": { bg: "rgba(107,114,128,0.08)", text: "#4b5563", icon: List },
};

interface SourceBadgeProps {
  type: SourceType;
  size?: "sm" | "md";
}

export function SourceBadge({ type, size = "sm" }: SourceBadgeProps) {
  const s = sourceConfig[type];
  const Icon = s.icon;
  const iconSize = size === "md" ? 12 : 9;
  const fontSize = size === "md" ? "0.74rem" : "0.66rem";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{
        background: s.bg,
        color: s.text,
        fontSize,
        fontWeight: 600,
        padding: size === "md" ? "3px 8px" : "2px 6px",
        whiteSpace: "nowrap",
        fontFamily: FF,
      }}
    >
      <Icon size={iconSize} />
      {type}
    </span>
  );
}
