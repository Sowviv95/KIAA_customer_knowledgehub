const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface SuggestedQuestionChipProps {
  question: string;
  onClick: () => void;
}

export function SuggestedQuestionChip({ question, onClick }: SuggestedQuestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full transition-colors"
      style={{
        fontSize: "0.74rem",
        color: "#374151",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        fontFamily: FF,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(22,163,74,0.30)";
        (e.currentTarget as HTMLElement).style.color = "#16a34a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.color = "#374151";
      }}
    >
      {question}
    </button>
  );
}
