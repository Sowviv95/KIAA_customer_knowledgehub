import { useState, useEffect, useRef } from "react";
import { Filter, FolderOpen, WifiOff, Database as DbIcon, Zap, Eye, MessageSquare, MoreVertical, GitCompare } from "lucide-react";
import { Page, NavContext, EvidenceItem, CustomerFile } from "../types";
import { FileTypeBadge } from "./file-library/FileTypeBadge";
import { SummaryStatusBadge } from "./file-library/SummaryStatusBadge";
import { EmptyState } from "./ui/EmptyState";
import { SearchInput } from "./ui/SearchInput";
import { fileCategories, fileTypes } from "../data";
import { getFiles, mapBackendFileToCustomerFile, parseFile } from "../api/filesApi";

type FileWithBackendId = CustomerFile & { backendId?: number };

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const TABLE_HEADERS = ["File", "Status", "Classification", "Last Updated", "Actions"];

type DataSource = "backend" | "offline" | "loading";

interface Props {
  initialFilter?: "new" | "customer";
  onNavigate: (page: Page, ctx?: NavContext) => void;
  onOpenDrawer: (item: EvidenceItem) => void;
  onOpenAsk: (context: string) => void;
}

/* ── Kebab menu ──────────────────────────────────────────────────────────── */
function KebabMenu({ items }: { items: { label: string; icon: React.ElementType; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center justify-center rounded"
        style={{ width: 24, height: 24, background: open ? "rgba(0,0,0,0.06)" : "transparent", color: "#6b7280" }}
        title="More actions"
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <div
          className="rounded-lg shadow-lg py-1"
          style={{ position: "absolute", right: 0, top: 28, zIndex: 20, background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)", minWidth: 150 }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
                style={{ fontSize: "0.74rem", color: "#374151", fontFamily: FF }}
              >
                <Icon size={11} /> {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── FileLibrary ─────────────────────────────────────────────────────────── */
export function FileLibrary({ initialFilter, onNavigate, onOpenDrawer, onOpenAsk }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [allFiles, setAllFiles] = useState<FileWithBackendId[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("loading");
  const [parsingId, setParsingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendFiles = await getFiles();
        if (cancelled) return;
        if (backendFiles.length > 0) {
          setAllFiles(backendFiles.map(mapBackendFileToCustomerFile));
          setDataSource("backend");
        } else {
          setAllFiles([]);
          setDataSource("backend");
        }
      } catch {
        if (cancelled) return;
        setAllFiles([]);
        setDataSource("offline");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = allFiles.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === "All Categories" || f.category === selectedCategory;
    const matchType = selectedType === "All Types" || f.type === selectedType;
    const matchInitial = !initialFilter || (initialFilter === "customer" && ["Customer Provided", "Meeting Note", "Email Export"].includes(f.customerRelevance));
    return matchSearch && matchCat && matchType && matchInitial;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      {/* PageHeader */}
      <div className="px-7 py-2.5 flex items-center justify-between" style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>
            {allFiles.length} customer files {dataSource === "backend" ? "indexed" : "loaded"} · LSEG Risk Intelligence
          </p>
          {dataSource === "offline" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", fontSize: "0.66rem", fontWeight: 600, border: "1px solid rgba(220,38,38,0.18)" }}>
              <WifiOff size={9} /> Backend unavailable
            </span>
          )}
          {dataSource === "backend" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.66rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
              <DbIcon size={9} /> From backend
            </span>
          )}
        </div>
        <button className="px-4 py-1.5 rounded-lg" style={{ background: "#16a34a", color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}>
          + Add Folder
        </button>
      </div>

      {/* FilterBar */}
      <div className="px-7 py-3 flex items-center gap-3" style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search files or tags..." minWidth={240} />

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)" }}>
          <Filter size={12} color="#9ca3af" />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-transparent outline-none cursor-pointer" style={{ color: "#374151", fontSize: "0.82rem" }}>
            {fileCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)" }}>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-transparent outline-none cursor-pointer" style={{ color: "#374151", fontSize: "0.82rem" }}>
            {fileTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginLeft: "auto" }}>{filtered.length} files</div>
      </div>

      {/* FileTable — empty state when no matches */}
      <div className="flex-1 overflow-y-auto">
        {dataSource === "offline" && (
          <EmptyState
            icon={<WifiOff size={32} />}
            title="Backend unavailable"
            description="Start the FastAPI backend to view indexed files. Run: cd backend && uvicorn app.main:app --reload --port 8000"
          />
        )}
        {allFiles.length === 0 && dataSource === "backend" && (
          <EmptyState
            icon={<FolderOpen size={32} />}
            title="No files indexed yet"
            description="Configure a local folder in Settings and click Scan Folder to index customer files."
          />
        )}
        {allFiles.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={<FolderOpen size={32} />}
            title="No files match your filters"
            description="Try adjusting your search or filter criteria."
          />
        )}
        {filtered.length > 0 && (
        <table className="w-full border-collapse">
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3"
                  style={{
                    color: "#6b7280", fontSize: "0.62rem", fontWeight: 600,
                    letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
                    ...(h === "Actions" ? { width: 100, textAlign: "center" as const } : {}),
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((file, i) => {
              const evItem: EvidenceItem = {
                file: file.name,
                type: (file.category === "Meeting Notes" ? "Meeting" : file.category === "Email" ? "Email" : file.category === "Schema" ? "Schema" : file.category === "Deck" ? "Deck" : file.category === "Source List" ? "Source List" : "Document") as any,
                date: file.updated,
                excerpt: file.excerpt,
                topic: file.topic,
                backendFileId: file.backendId,
              };
              const isMissing = (file.summaryStatus as string) === "Missing";
              const isDone = file.summaryStatus === "Done";
              const canParse = dataSource === "backend" && file.backendId && !isDone && !isMissing;
              const isParsing = parsingId === file.backendId;

              const handleParseFile = async () => {
                if (!file.backendId) return;
                setParsingId(file.backendId);
                try {
                  await parseFile(file.backendId);
                  setAllFiles((prev) => prev.map((f) => f.backendId === file.backendId ? { ...f, summaryStatus: "Done", excerpt: "Parsed content available. Click Evidence to view extracted text." } : f));
                } catch { /* error handled silently */ }
                setParsingId(null);
              };

              /* Classification badges: topic + category */
              const classificationBadges: string[] = [];
              if (file.topic) classificationBadges.push(file.topic);
              if (file.category && file.category !== file.topic) classificationBadges.push(file.category);

              /* Build secondary actions for kebab */
              const secondaryActions: { label: string; icon: React.ElementType; onClick: () => void }[] = [
                { label: "Evidence", icon: GitCompare, onClick: () => onOpenDrawer(evItem) },
                { label: "Summary", icon: Eye, onClick: () => onNavigate("summaries", { summariesTab: "files" }) },
                { label: "Ask AI", icon: MessageSquare, onClick: () => onOpenAsk(`Evidence — ${file.name}`) },
              ];
              if (canParse && !isParsing) {
                secondaryActions.push({ label: "Parse", icon: Zap, onClick: handleParseFile });
              }

              return (
                <tr key={i} className="hover:bg-green-50 transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: "#ffffff" }}>
                  {/* File */}
                  <td className="px-4 py-3" style={{ maxWidth: 360 }}>
                    <div className="flex items-center gap-2.5">
                      <FileTypeBadge type={file.type} variant="icon-cell" />
                      <div className="min-w-0">
                        <div className="truncate" style={{ color: "#1e293b", fontSize: "0.82rem", fontWeight: 500 }}>{file.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <FileTypeBadge type={file.type} variant="label" />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <SummaryStatusBadge status={file.summaryStatus} />
                  </td>
                  {/* Classification */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {classificationBadges.length > 0 ? classificationBadges.map((badge) => (
                        <span key={badge} className="px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.66rem", fontWeight: 500, border: "1px solid rgba(22,163,74,0.22)" }}>
                          {badge}
                        </span>
                      )) : (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.04)", color: "#9ca3af", fontSize: "0.66rem" }}>
                          Unclassified
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Last Updated */}
                  <td className="px-4 py-3">
                    <span style={{ color: "#9ca3af", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{file.updated || "—"}</span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Primary action based on status */}
                      {isDone && (
                        <button
                          onClick={() => onOpenDrawer(evItem)}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1"
                          style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.22)", fontSize: "0.72rem", fontWeight: 600 }}
                        >
                          <Eye size={10} /> Evidence
                        </button>
                      )}
                      {canParse && (
                        <button
                          onClick={handleParseFile}
                          disabled={isParsing}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1"
                          style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(139,92,246,0.18)", opacity: isParsing ? 0.6 : 1 }}
                        >
                          <Zap size={10} /> {isParsing ? "..." : "Parse"}
                        </button>
                      )}
                      {isMissing && (
                        <button
                          onClick={() => onOpenDrawer(evItem)}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1"
                          style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(220,38,38,0.18)" }}
                        >
                          <Eye size={10} /> Details
                        </button>
                      )}
                      {/* Kebab for secondary actions */}
                      <KebabMenu items={secondaryActions} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
