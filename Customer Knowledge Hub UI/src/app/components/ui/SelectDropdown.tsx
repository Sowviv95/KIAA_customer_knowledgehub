import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  leadIcon?: ReactNode;
}

export function SelectDropdown({ value, onChange, options, leadIcon }: SelectDropdownProps) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-3 py-2"
      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)" }}
    >
      {leadIcon}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none cursor-pointer"
        style={{ color: "#374151", fontSize: "0.82rem", fontFamily: FF }}
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={12} color="#9ca3af" />
    </div>
  );
}
