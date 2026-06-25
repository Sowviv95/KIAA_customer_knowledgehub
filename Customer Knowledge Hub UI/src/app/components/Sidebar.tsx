import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  Cpu,
  ChevronDown,
} from "lucide-react";

type Page = "dashboard" | "files" | "summaries" | "ask" | "alerts" | "settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  alertCount?: number;
}

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "files" as Page, label: "File Library", icon: FolderOpen },
  { id: "summaries" as Page, label: "Summaries", icon: FileText },
  { id: "ask" as Page, label: "Ask AI", icon: MessageSquare },
  { id: "alerts" as Page, label: "Alerts", icon: Bell },
  { id: "settings" as Page, label: "Settings", icon: Settings },
];

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export function Sidebar({ activePage, onNavigate, alertCount = 3 }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: "#ffffff",
        width: 220,
        minWidth: 220,
        borderRight: "1px solid rgba(0,0,0,0.08)",
        fontFamily: FF,
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="rounded-lg flex items-center justify-center"
            style={{ background: "rgba(22,163,74,0.09)", width: 34, height: 34 }}
          >
            <Cpu size={16} color="#16a34a" />
          </div>
          <div>
            <div style={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.2 }}>Knowledge Hub</div>
            <div style={{ color: "#6b7280", fontSize: "0.66rem", lineHeight: 1.3, marginTop: 1 }}>AI Solutioning</div>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div
        className="mx-3 mt-4 mb-2 rounded-lg px-3 py-2.5 cursor-pointer flex items-center justify-between"
        style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div>
          <div style={{ color: "#9ca3af", fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Project</div>
          <div style={{ color: "#1e293b", fontSize: "0.78rem", fontWeight: 600, marginTop: 2 }}>LSEG Risk Intelligence</div>
        </div>
        <ChevronDown size={13} color="#9ca3af" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all text-left relative"
              style={{
                background: isActive ? "rgba(22,163,74,0.09)" : "transparent",
                color: isActive ? "#16a34a" : "#6b7280",
                borderLeft: isActive ? "2px solid rgba(22,163,74,0.22)" : "2px solid transparent",
              }}
            >
              <Icon size={15} />
              <span style={{ fontSize: "0.82rem", fontWeight: isActive ? 600 : 400, color: isActive ? "#16a34a" : "#1e293b" }}>
                {item.label}
              </span>
              {item.id === "alerts" && alertCount > 0 && (
                <span
                  className="ml-auto rounded-full flex items-center justify-center"
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>AI Solutioning Team</div>
        <div style={{ color: "#9ca3af", fontSize: "0.66rem", marginTop: 2 }}>v0.9.2 · Local Mode</div>
      </div>
    </aside>
  );
}
