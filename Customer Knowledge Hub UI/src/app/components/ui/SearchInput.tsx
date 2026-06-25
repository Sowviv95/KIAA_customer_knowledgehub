import { Search } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minWidth?: number;
}

export function SearchInput({ value, onChange, placeholder = "Search…", minWidth = 240 }: SearchInputProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", minWidth }}
    >
      <Search size={13} color="#9ca3af" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1"
        style={{ color: "#0f172a", fontSize: "0.82rem", fontFamily: FF }}
      />
    </div>
  );
}
