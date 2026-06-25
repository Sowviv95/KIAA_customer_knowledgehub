import { Eye, MessageSquare, GitCompare } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * FileActionButton — three variants matching File Library action column.
 * - summary  : green ghost → opens Summaries
 * - evidence : neutral flat → opens EvidenceDrawer
 * - ask      : neutral flat → opens Ask AI with file context
 */
type FileAction = "summary" | "evidence" | "ask";

const actionConfig: Record<FileAction, { label: string; icon: React.ElementType; bg: string; color: string; border: string }> = {
  summary:  { label: "Summary",  icon: Eye,          bg: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.22)" },
  evidence: { label: "Evidence", icon: GitCompare,   bg: "#f0f4f8",              color: "#374151", border: "1px solid rgba(0,0,0,0.08)" },
  ask:      { label: "Ask AI",   icon: MessageSquare, bg: "#f0f4f8",             color: "#374151", border: "1px solid rgba(0,0,0,0.08)" },
};

interface FileActionButtonProps {
  action: FileAction;
  onClick?: () => void;
}

export function FileActionButton({ action, onClick }: FileActionButtonProps) {
  const { label, icon: Icon, bg, color, border } = actionConfig[action];
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded px-2.5 py-1"
      style={{ background: bg, color, border, fontSize: "0.72rem", fontFamily: FF, cursor: "pointer" }}
    >
      <Icon size={10} /> {label}
    </button>
  );
}
