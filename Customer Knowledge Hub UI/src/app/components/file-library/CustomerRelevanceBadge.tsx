const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export type CustomerRelevance =
  | "Customer Provided"
  | "Meeting Note"
  | "Email Export"
  | "Internal Deck"
  | "Schema"
  | "Source List"
  | "Reference";

const relevanceConfig: Record<CustomerRelevance, { bg: string; text: string }> = {
  "Customer Provided": { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
  "Meeting Note":      { bg: "rgba(59,130,246,0.08)", text: "#2563eb" },
  "Email Export":      { bg: "rgba(14,165,233,0.08)", text: "#0284c7" },
  "Internal Deck":     { bg: "rgba(217,119,6,0.08)",  text: "#d97706" },
  "Schema":            { bg: "rgba(139,92,246,0.08)", text: "#7c3aed" },
  "Source List":       { bg: "rgba(107,114,128,0.08)", text: "#4b5563" },
  "Reference":         { bg: "rgba(0,0,0,0.04)",      text: "#9ca3af" },
};

interface CustomerRelevanceBadgeProps {
  relevance: CustomerRelevance;
}

export function CustomerRelevanceBadge({ relevance }: CustomerRelevanceBadgeProps) {
  const { bg, text } = relevanceConfig[relevance] ?? { bg: "rgba(0,0,0,0.04)", text: "#9ca3af" };
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{ background: bg, color: text, fontSize: "0.74rem", fontWeight: 500, padding: "2px 10px", fontFamily: FF }}
    >
      {relevance}
    </span>
  );
}
