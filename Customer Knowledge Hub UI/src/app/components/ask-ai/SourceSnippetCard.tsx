import { FileText } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface SourceSnippetCardProps {
  file: string;
  snippet: string;
  confidence: number;
  page?: number;
}

export function SourceSnippetCard({ file, snippet, confidence, page }: SourceSnippetCardProps) {
  const barColor = confidence > 90 ? "#16a34a" : "#3b82f6";

  return (
    <div
      className="mb-4 rounded-lg p-3"
      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", fontFamily: FF }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <FileText size={11} color="#16a34a" />
          <span style={{ color: "#16a34a", fontSize: "0.74rem", fontWeight: 600 }}>{file}</span>
        </div>
        {page !== undefined && (
          <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>p.{page}</span>
        )}
      </div>

      {/* Excerpt */}
      <p style={{ color: "#374151", fontSize: "0.74rem", lineHeight: 1.6, fontStyle: "italic" }}>
        "{snippet}"
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: "#e5e7eb" }}>
          <div className="rounded-full" style={{ height: 3, width: `${confidence}%`, background: barColor }} />
        </div>
        <span style={{ color: "#6b7280", fontSize: "0.66rem", whiteSpace: "nowrap" }}>{confidence}% match</span>
      </div>
    </div>
  );
}
