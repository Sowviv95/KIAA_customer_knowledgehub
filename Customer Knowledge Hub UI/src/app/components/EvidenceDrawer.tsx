import { useState, useEffect } from "react";
import { X, FileText, MessageSquare, Mail, Presentation, Database, List, ExternalLink, CheckCircle, Tag, Info, Loader2, ChevronDown, ChevronUp, Zap, Hash, Plus, Check, AlertCircle, ClipboardList } from "lucide-react";
import { EvidenceItem, SourceType } from "../types";
import { getFileChunks, parseFile, type ChunkRecord } from "../api/filesApi";
import { createAction } from "../api/actionsApi";
import { createRequirement } from "../api/requirementsApi";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const sourceStyle: Record<SourceType, { bg: string; text: string; icon: React.ElementType }> = {
  Meeting:       { bg: "rgba(59,130,246,0.08)",  text: "#2563eb", icon: MessageSquare },
  Email:         { bg: "rgba(14,165,233,0.08)",  text: "#0284c7", icon: Mail },
  Document:      { bg: "rgba(22,163,74,0.08)",   text: "#16a34a", icon: FileText },
  Deck:          { bg: "rgba(217,119,6,0.08)",   text: "#d97706", icon: Presentation },
  Schema:        { bg: "rgba(139,92,246,0.08)",  text: "#7c3aed", icon: Database },
  "Source List": { bg: "rgba(107,114,128,0.08)", text: "#4b5563", icon: List },
};

interface Props {
  item: EvidenceItem | null;
  onClose: () => void;
  onOpenAsk: (context: string) => void;
}

export function EvidenceDrawer({ item, onClose, onOpenAsk }: Props) {
  const [reviewed, setReviewed] = useState(false);
  const [showFileMsg, setShowFileMsg] = useState(false);

  // Backend chunk state
  const [chunks, setChunks] = useState<ChunkRecord[]>([]);
  const [chunkLoading, setChunkLoading] = useState(false);
  const [chunkError, setChunkError] = useState<string>();
  const [showChunks, setShowChunks] = useState(false);

  // Parse action state
  const [parsing, setParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState<string>();
  const [parseError, setParseError] = useState<string>();

  // Create follow-up / requirement from evidence
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [showCreateReq, setShowCreateReq] = useState(false);
  const [createText, setCreateText] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string>();

  const isBackend = item?.backendFileId != null;
  const fileId = item?.backendFileId;

  // Fetch chunks when drawer opens for a backend file
  useEffect(() => {
    if (!item || !isBackend || !fileId) {
      setChunks([]);
      setChunkLoading(false);
      setChunkError(undefined);
      setShowChunks(false);
      setParseSuccess(undefined);
      setParseError(undefined);
      setShowCreateAction(false);
      setShowCreateReq(false);
      setCreateText("");
      setCreateSuccess(undefined);
      return;
    }

    setChunkLoading(true);
    setChunkError(undefined);
    setChunks([]);
    setShowChunks(false);
    setReviewed(false);
    setParseSuccess(undefined);
    setParseError(undefined);
    setShowCreateAction(false);
    setShowCreateReq(false);
    setCreateText("");
    setCreateSuccess(undefined);

    let cancelled = false;
    (async () => {
      try {
        const result = await getFileChunks(fileId);
        if (!cancelled) {
          setChunks(result);
        }
      } catch {
        if (!cancelled) {
          setChunkError("Unable to load parsed content.");
        }
      } finally {
        if (!cancelled) setChunkLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [item?.file, fileId]);

  if (!item) return null;

  const s = sourceStyle[item.type];
  const Icon = s.icon;

  const handleOpenFile = () => {
    setShowFileMsg(true);
    setTimeout(() => setShowFileMsg(false), 3000);
  };

  const handleParse = async () => {
    if (!fileId) return;
    setParsing(true);
    setParseError(undefined);
    setParseSuccess(undefined);
    try {
      const result = await parseFile(fileId);
      setParseSuccess(`Parsed: ${result.chunks_created} chunks, ${result.characters_extracted.toLocaleString()} chars`);
      // Reload chunks
      const newChunks = await getFileChunks(fileId);
      setChunks(newChunks);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  // Determine the best excerpt to show
  const parsedExcerpt = chunks.length > 0
    ? (chunks[0].content.length > 400 ? chunks[0].content.slice(0, 400) + "..." : chunks[0].content)
    : null;

  const displayExcerpt = parsedExcerpt || item.excerpt;
  const hasParsedContent = chunks.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.12)" }} onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{ width: 380, background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.08)", fontFamily: FF, boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: 700 }}>Source Evidence</div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "#9ca3af" }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* File + type card */}
          <div className="rounded-xl p-4 mb-4" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-start gap-3">
              <div className="rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, width: 34, height: 34 }}>
                <Icon size={15} color={s.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: "#1e293b", fontSize: "0.82rem", fontWeight: 600, wordBreak: "break-word" }}>{item.file}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text, fontSize: "0.66rem", fontWeight: 600 }}>
                    <Icon size={9} /> {item.type}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>{item.date}</span>
                  {isBackend && hasParsedContent && (
                    <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.58rem", fontWeight: 600 }}>Parsed</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt — parsed or mock */}
          <div className="mb-4">
            <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
              {hasParsedContent ? "Parsed Content Preview" : "Relevant Excerpt"}
            </div>

            {chunkLoading && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                <Loader2 size={12} color="#9ca3af" style={{ animation: "kh-spin 1s linear infinite" }} />
                <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>Loading parsed evidence...</span>
              </div>
            )}

            {!chunkLoading && (
              <div className="rounded-lg px-4 py-3" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", borderLeft: `3px solid ${hasParsedContent ? "#16a34a" : "#9ca3af"}` }}>
                <p style={{ color: "#374151", fontSize: "0.8rem", lineHeight: 1.75, fontStyle: hasParsedContent ? "normal" : "italic", whiteSpace: "pre-wrap" }}>
                  {hasParsedContent ? displayExcerpt : `\u201c${displayExcerpt}\u201d`}
                </p>
              </div>
            )}

            {chunkError && !chunkLoading && (
              <div className="flex items-center gap-2 mt-2" style={{ color: "#9ca3af", fontSize: "0.72rem" }}>
                <Info size={11} /> {chunkError}
              </div>
            )}
          </div>

          {/* Parse action for unparsed backend files */}
          {isBackend && !hasParsedContent && !chunkLoading && (
            <div className="mb-4">
              <button
                onClick={handleParse}
                disabled={parsing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg w-full justify-center transition-colors"
                style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", fontSize: "0.78rem", fontWeight: 600, border: "1px solid rgba(139,92,246,0.22)", opacity: parsing ? 0.7 : 1 }}
              >
                {parsing ? <Loader2 size={12} style={{ animation: "kh-spin 1s linear infinite" }} /> : <Zap size={12} />}
                {parsing ? "Parsing..." : "Parse this file"}
              </button>
            </div>
          )}

          {/* Parse feedback */}
          {parseSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)" }}>
              <CheckCircle size={12} color="#16a34a" />
              <span style={{ color: "#16a34a", fontSize: "0.74rem" }}>{parseSuccess}</span>
            </div>
          )}
          {parseError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
              <Info size={12} color="#dc2626" />
              <span style={{ color: "#dc2626", fontSize: "0.74rem" }}>{parseError}</span>
            </div>
          )}

          {/* View parsed chunks (first 3) */}
          {hasParsedContent && chunks.length > 1 && (
            <div className="mb-4">
              <button
                onClick={() => setShowChunks(!showChunks)}
                className="flex items-center gap-1.5 w-full text-left"
                style={{ color: "#6b7280", fontSize: "0.72rem", fontWeight: 600 }}
              >
                {showChunks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showChunks ? "Hide" : "View"} parsed chunks ({chunks.length} total)
              </button>
              {showChunks && (
                <div className="mt-2 flex flex-col gap-2">
                  {chunks.slice(0, 3).map((chunk) => (
                    <div key={chunk.id} className="rounded-lg px-3 py-2.5" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.04)" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: "rgba(107,114,128,0.08)", color: "#6b7280", fontSize: "0.58rem", fontWeight: 600 }}>
                          <Hash size={8} /> Chunk {chunk.chunk_index}
                        </span>
                        <span style={{ color: "#9ca3af", fontSize: "0.58rem" }}>~{chunk.token_count} tokens</span>
                      </div>
                      <p style={{ color: "#374151", fontSize: "0.74rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {chunk.content.length > 250 ? chunk.content.slice(0, 250) + "..." : chunk.content}
                      </p>
                    </div>
                  ))}
                  {chunks.length > 3 && (
                    <p style={{ color: "#9ca3af", fontSize: "0.66rem", textAlign: "center" }}>
                      +{chunks.length - 3} more chunks
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Related topic */}
          {item.topic && (
            <div className="mb-5">
              <div style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                Related Tracked Topic
              </div>
              <div className="flex items-center gap-2">
                <Tag size={12} color="#16a34a" />
                <span className="px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.78rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
                  {item.topic}
                </span>
              </div>
            </div>
          )}

          {/* Reviewed state */}
          {reviewed && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)" }}>
              <CheckCircle size={13} color="#16a34a" />
              <span style={{ color: "#16a34a", fontSize: "0.76rem", fontWeight: 500 }}>Marked as reviewed</span>
            </div>
          )}

          {/* Open File mock message */}
          {showFileMsg && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-3" style={{ background: "rgba(107,114,128,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <Info size={13} color="#6b7280" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ color: "#6b7280", fontSize: "0.74rem" }}>File opening will be available once a local folder is configured in Settings.</span>
            </div>
          )}
        </div>

        {/* Create from evidence */}
        <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {createSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)" }}>
              <CheckCircle size={12} color="#16a34a" />
              <span style={{ color: "#16a34a", fontSize: "0.74rem" }}>{createSuccess}</span>
            </div>
          )}

          {!showCreateAction && !showCreateReq && (
            <div className="flex gap-2 mb-2">
              <button onClick={() => { setShowCreateAction(true); setShowCreateReq(false); setCreateText(""); setCreateSuccess(undefined); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg"
                style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(217,119,6,0.22)" }}>
                <AlertCircle size={12} /> Create Follow-up
              </button>
              <button onClick={() => { setShowCreateReq(true); setShowCreateAction(false); setCreateText(""); setCreateSuccess(undefined); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg"
                style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(139,92,246,0.22)" }}>
                <ClipboardList size={12} /> Create Requirement
              </button>
            </div>
          )}

          {showCreateAction && (
            <div className="mb-2 rounded-lg p-3" style={{ background: "#fafbfc", border: "1px solid rgba(217,119,6,0.18)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={12} color="#d97706" />
                <span style={{ color: "#d97706", fontSize: "0.72rem", fontWeight: 700 }}>New Follow-up</span>
                {item.file && <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>from {item.file}</span>}
              </div>
              <textarea value={createText} onChange={(e) => setCreateText(e.target.value)}
                placeholder="Describe the follow-up action..."
                rows={2} className="w-full px-3 py-1.5 rounded-lg mb-2 resize-none"
                style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.78rem", outline: "none" }} />
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  if (!createText.trim()) return;
                  setCreateSaving(true);
                  try {
                    await createAction({
                      text: createText.trim(),
                      source_file: item.file || undefined,
                      excerpt: item.excerpt || undefined,
                    });
                    setCreateText(""); setShowCreateAction(false);
                    setCreateSuccess("Follow-up created");
                    setTimeout(() => setCreateSuccess(undefined), 4000);
                  } catch { /* keep form open */ }
                  setCreateSaving(false);
                }} disabled={createSaving || !createText.trim()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{ background: "#d97706", color: "#fff", fontSize: "0.74rem", fontWeight: 600, opacity: createSaving || !createText.trim() ? 0.5 : 1 }}>
                  {createSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                </button>
                <button onClick={() => setShowCreateAction(false)} style={{ color: "#9ca3af", fontSize: "0.72rem" }}>Cancel</button>
              </div>
            </div>
          )}

          {showCreateReq && (
            <div className="mb-2 rounded-lg p-3" style={{ background: "#fafbfc", border: "1px solid rgba(139,92,246,0.18)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <ClipboardList size={12} color="#7c3aed" />
                <span style={{ color: "#7c3aed", fontSize: "0.72rem", fontWeight: 700 }}>New Requirement</span>
                {item.file && <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>from {item.file}</span>}
              </div>
              <textarea value={createText} onChange={(e) => setCreateText(e.target.value)}
                placeholder="Describe the requirement..."
                rows={2} className="w-full px-3 py-1.5 rounded-lg mb-2 resize-none"
                style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.78rem", outline: "none" }} />
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  if (!createText.trim()) return;
                  setCreateSaving(true);
                  try {
                    await createRequirement({
                      text: createText.trim(),
                      source_file: item.file || undefined,
                      excerpt: item.excerpt || undefined,
                      topic: item.topic || undefined,
                    });
                    setCreateText(""); setShowCreateReq(false);
                    setCreateSuccess("Requirement created");
                    setTimeout(() => setCreateSuccess(undefined), 4000);
                  } catch { /* keep form open */ }
                  setCreateSaving(false);
                }} disabled={createSaving || !createText.trim()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{ background: "#7c3aed", color: "#fff", fontSize: "0.74rem", fontWeight: 600, opacity: createSaving || !createText.trim() ? 0.5 : 1 }}>
                  {createSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                </button>
                <button onClick={() => setShowCreateReq(false)} style={{ color: "#9ca3af", fontSize: "0.72rem" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg"
              style={{ background: "#16a34a", color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
              onClick={() => onOpenAsk(`Evidence — ${item.file}`)}
            >
              <MessageSquare size={14} /> Ask AI about this
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleOpenFile}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#374151", fontSize: "0.78rem" }}
              >
                <ExternalLink size={13} /> Open File
              </button>
              <button
                onClick={() => setReviewed(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors"
                style={{
                  background: reviewed ? "rgba(22,163,74,0.08)" : "#f8fafc",
                  border: `1px solid ${reviewed ? "rgba(22,163,74,0.22)" : "rgba(0,0,0,0.10)"}`,
                  color: reviewed ? "#16a34a" : "#374151",
                  fontSize: "0.78rem",
                  fontWeight: reviewed ? 600 : 400,
                }}
              >
                <CheckCircle size={13} /> {reviewed ? "Reviewed" : "Mark Reviewed"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes kh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
