import { FileText, Eye, Tag } from "lucide-react";
import type { SearchResultItem } from "../../api/searchApi";
import type { EvidenceItem } from "../../types";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/** Safely render snippet text, stripping <mark> tags and using bold for highlights. */
function renderSnippet(snippet: string): string {
  return snippet
    .replace(/<mark>/g, '<strong style="color:#5b21b6;background:rgba(139,92,246,0.12);padding:0 2px;border-radius:2px">')
    .replace(/<\/mark>/g, "</strong>");
}

function mapResultToEvidence(result: SearchResultItem): EvidenceItem {
  const sourceType = (
    result.category === "Schema" ? "Schema"
    : result.category === "Source List" ? "Source List"
    : result.category === "Email" ? "Email"
    : result.category === "Deck" ? "Deck"
    : "Document"
  ) as any;
  return {
    file: result.file_name,
    type: sourceType,
    date: result.updated_at?.slice(0, 10) || "",
    excerpt: result.snippet.replace(/<\/?mark>/g, ""),
    backendFileId: result.file_id,
  };
}

interface Props {
  result: SearchResultItem;
  onOpenDrawer?: (item: EvidenceItem) => void;
  compact?: boolean;
}

export function EvidenceResultCard({ result, onOpenDrawer, compact = false }: Props) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", fontFamily: FF }}
    >
      {/* File header */}
      <div className="flex items-center gap-2 px-3.5 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <FileText size={12} color="#16a34a" />
        <span style={{ color: "#16a34a", fontSize: "0.74rem", fontWeight: 600, flex: 1 }}>{result.file_name}</span>
        <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(107,114,128,0.08)", color: "#6b7280", fontSize: "0.58rem" }}>
          {result.file_type} · chunk {result.chunk_index}
        </span>
      </div>

      {/* Snippet */}
      <div className="px-3.5 py-2.5" style={{ borderLeft: "3px solid #7c3aed" }}>
        <p
          style={{ color: "#374151", fontSize: compact ? "0.74rem" : "0.78rem", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: renderSnippet(result.snippet) }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-3.5 py-2" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
        <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>~{result.token_estimate} tokens</span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: "rgba(107,114,128,0.06)", color: "#6b7280", fontSize: "0.62rem" }}>
          <Tag size={8} /> {result.category}
        </span>
        <div style={{ flex: 1 }} />
        {onOpenDrawer && (
          <button
            onClick={() => onOpenDrawer(mapResultToEvidence(result))}
            className="flex items-center gap-1"
            style={{ color: "#16a34a", fontSize: "0.68rem", fontWeight: 600 }}
          >
            <Eye size={10} /> Evidence
          </button>
        )}
      </div>
    </div>
  );
}
