import { useState, useRef, useEffect } from "react";
import { Cpu, ChevronDown, User, Check } from "lucide-react";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";
import { Role } from "../types";
import { roles, roleConfig } from "../roleConfig";

type Page = "dashboard" | "files" | "summaries" | "ask" | "alerts" | "settings";

interface TopNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  alertCount?: number;
  role: Role;
  onRoleChange: (role: Role) => void;
  showDevNotes?: boolean;
  onToggleDevNotes?: () => void;
  showStates?: boolean;
  onToggleStates?: () => void;
  showTokens?: boolean;
  onToggleTokens?: () => void;
}

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "files" as Page,     label: "File Library", icon: FolderOpen },
  { id: "summaries" as Page, label: "Summaries", icon: FileText },
  { id: "ask" as Page,       label: "Ask AI", icon: MessageSquare },
  { id: "alerts" as Page,    label: "Alerts", icon: Bell },
  { id: "settings" as Page,  label: "Settings", icon: Settings },
];

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/** "View as: [Role] ▼" dropdown */
function RoleViewDropdown({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const cfg = roleConfig[role];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        style={{
          background: open ? "#f0f4f8" : "#f8fafc",
          border: `1px solid ${open ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.08)"}`,
          fontFamily: FF,
        }}
      >
        <div
          className="rounded flex items-center justify-center shrink-0"
          style={{ background: cfg.accentBg, width: 22, height: 22 }}
        >
          <User size={12} color={cfg.accentColor} />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.60rem", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1 }}>
            View as
          </div>
          <div style={{ color: "#1e293b", fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.3, marginTop: 1 }}>
            {role}
          </div>
        </div>
        <ChevronDown
          size={13}
          color="#9ca3af"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-1 rounded-xl overflow-hidden"
          style={{
            top: "100%",
            zIndex: 100,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            minWidth: 220,
          }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ color: "#9ca3af", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Select Role
            </div>
          </div>
          {roles.map((r) => {
            const rc = roleConfig[r];
            const isSelected = r === role;
            return (
              <button
                key={r}
                onClick={() => { onChange(r); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: isSelected ? rc.accentBg : "transparent" }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isSelected ? rc.accentBg : "transparent"; }}
              >
                <div
                  className="rounded flex items-center justify-center shrink-0"
                  style={{ background: rc.accentBg, width: 22, height: 22 }}
                >
                  <User size={11} color={rc.accentColor} />
                </div>
                <span style={{ color: isSelected ? rc.accentColor : "#374151", fontSize: "0.82rem", fontWeight: isSelected ? 600 : 400, flex: 1 }}>
                  {r}
                </span>
                {isSelected && <Check size={13} color={rc.accentColor} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopNav({
  activePage, onNavigate, alertCount = 0,
  role, onRoleChange,
}: TopNavProps) {
  return (
    <header style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.08)", fontFamily: FF, flexShrink: 0 }}>
      <div className="flex items-center px-6 py-2 gap-4">
        {/* Left — brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="rounded-lg flex items-center justify-center" style={{ background: "rgba(22,163,74,0.09)", width: 30, height: 30 }}>
            <Cpu size={14} color="#16a34a" />
          </div>
          <div>
            <div style={{ color: "#0f172a", fontSize: "0.78rem", fontWeight: 700, lineHeight: 1.2 }}>Customer Knowledge Hub</div>
            <div style={{ color: "#9ca3af", fontSize: "0.62rem", lineHeight: 1.2 }}>AI Solutioning · Local Mode</div>
          </div>
        </div>

        {/* Center — nav tabs */}
        <nav
          className="flex items-center flex-1 justify-center gap-0.5 rounded-full px-1 py-1"
          style={{ background: "#F0FDF4", border: "1px solid #DCFCE7" }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: isActive ? "#16a34a" : "transparent",
                  color: isActive ? "#ffffff" : "#6b7280",
                  fontSize: "0.76rem",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(22,163,74,0.08)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={13} />
                {item.label}
                {item.id === "alerts" && alertCount > 0 && (
                  <span className="rounded-full flex items-center justify-center" style={{ background: isActive ? "#ffffff" : "#16a34a", color: isActive ? "#16a34a" : "#fff", fontSize: "0.58rem", fontWeight: 700, minWidth: 15, height: 15, padding: "0 3px" }}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right — dropdowns */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Project selector */}
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div>
              <div style={{ color: "#9ca3af", fontSize: "0.58rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Project</div>
              <div style={{ color: "#1e293b", fontSize: "0.74rem", fontWeight: 600 }}>LSEG Risk Intelligence</div>
            </div>
            <ChevronDown size={12} color="#9ca3af" />
          </div>

          {/* Role selector */}
          <RoleViewDropdown role={role} onChange={onRoleChange} />
        </div>
      </div>
    </header>
  );
}
