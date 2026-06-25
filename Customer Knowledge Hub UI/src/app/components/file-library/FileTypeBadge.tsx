import { FileText, FileSpreadsheet, Presentation, Database, File, Mail } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export type FileType = "DOCX" | "TXT" | "XLSX" | "PPTX" | "JSON" | "PDF" | "EML" | "YAML" | "MSG";

const typeConfig: Record<FileType, { bg: string; text: string; icon: React.ElementType }> = {
  DOCX: { bg: "rgba(59,130,246,0.08)",  text: "#2563eb", icon: FileText },
  TXT:  { bg: "rgba(107,114,128,0.08)", text: "#4b5563", icon: FileText },
  XLSX: { bg: "rgba(22,163,74,0.08)",   text: "#16a34a", icon: FileSpreadsheet },
  PPTX: { bg: "rgba(217,119,6,0.08)",   text: "#d97706", icon: Presentation },
  JSON: { bg: "rgba(139,92,246,0.08)",  text: "#7c3aed", icon: Database },
  YAML: { bg: "rgba(139,92,246,0.08)",  text: "#7c3aed", icon: Database },
  PDF:  { bg: "rgba(220,38,38,0.08)",   text: "#dc2626", icon: File },
  EML:  { bg: "rgba(14,165,233,0.08)",  text: "#0284c7", icon: Mail },
  MSG:  { bg: "rgba(14,165,233,0.08)",  text: "#0284c7", icon: Mail },
};

export { typeConfig as fileTypeConfig };

interface FileTypeBadgeProps {
  type: FileType;
  /** icon-cell: 28×28 square for table rows; label: text pill */
  variant?: "icon-cell" | "label";
}

export function FileTypeBadge({ type, variant = "label" }: FileTypeBadgeProps) {
  const { bg, text, icon: Icon } = typeConfig[type] ?? typeConfig["TXT"];

  if (variant === "icon-cell") {
    return (
      <div className="rounded flex items-center justify-center shrink-0" style={{ background: bg, width: 28, height: 28 }}>
        <Icon size={13} color={text} />
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5"
      style={{ background: bg, color: text, fontSize: "0.74rem", fontWeight: 600, fontFamily: FF }}
    >
      {type}
    </span>
  );
}
