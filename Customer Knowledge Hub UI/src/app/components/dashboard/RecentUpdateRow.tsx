import { Clock } from "lucide-react";
import { SourceBadge } from "../ui/SourceBadge";
import { SourceType } from "../../types";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface RecentUpdateRowProps {
  file: string;
  sourceType: SourceType;
  action: string;
  topic: string;
  time: string;
  onClick?: () => void;
  isLast?: boolean;
}

export function RecentUpdateRow({ file, sourceType, action, topic, time, onClick, isLast }: RecentUpdateRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-green-50"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.04)",
        fontFamily: FF,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            style={{
              color: "#1e293b",
              fontSize: "0.78rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 200,
            }}
          >
            {file}
          </span>
          <SourceBadge type={sourceType} />
        </div>
        <div style={{ color: "#9ca3af", fontSize: "0.70rem" }}>
          {action} · Topic: {topic}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" style={{ color: "#9ca3af", fontSize: "0.66rem" }}>
        <Clock size={10} /> {time}
      </div>
    </button>
  );
}
