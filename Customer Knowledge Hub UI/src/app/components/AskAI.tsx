import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, Sparkles, BookOpen, Lightbulb, Search, Eye, WifiOff, FileText, Database as DbIcon, Zap, AlertTriangle } from "lucide-react";
import { Role, AskAIMessage, EvidenceItem } from "../types";
import { roleConfig } from "../roleConfig";
import { ContextPill } from "./ui/ContextPill";
import { SuggestedQuestionChip } from "./ask-ai/SuggestedQuestionChip";
import { SourceSnippetCard } from "./ask-ai/SourceSnippetCard";
import { EvidenceResultCard } from "./ask-ai/EvidenceResultCard";
import { InlineLoader } from "./ui/LoadingState";
import { contextSuggestedQuestions } from "../data";
import { searchChunks, scopedSearch, type SearchResultItem } from "../api/searchApi";
import { checkHealth } from "../api/client";
import { getLLMStatus, getGroundedAnswer, type GroundedSource, type GroundedUsage } from "../api/llmApi";

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

type TopicScope =
  | "All Topics" | "Scope" | "Source List" | "Schema/API" | "SLA"
  | "Monitoring Cadence" | "Alerts" | "Reports" | "Support Model"
  | "Commercials" | "Open Questions";

const topicScopes: TopicScope[] = [
  "All Topics", "Scope", "Source List", "Schema/API", "SLA",
  "Monitoring Cadence", "Alerts", "Reports", "Support Model",
  "Commercials", "Open Questions",
];

/** Deterministic keyword expansion per tracked topic — appended to FTS5 queries. */
const topicKeywords: Record<TopicScope, string[]> = {
  "All Topics": [],
  "Scope": ["scope", "phase", "coverage", "entity", "ingestion", "Phase 1", "Phase 2"],
  "Source List": ["source list", "data source", "website", "URL", "monitoring", "coverage"],
  "Schema/API": ["schema", "API", "swagger", "endpoint", "payload", "field", "validation", "countryCode"],
  "SLA": ["SLA", "latency", "uptime", "response time", "p99", "cadence", "timeliness"],
  "Monitoring Cadence": ["monitoring", "cadence", "refresh", "frequency", "batch", "delta", "daily"],
  "Alerts": ["alert", "notification", "webhook", "email", "threshold", "trigger"],
  "Reports": ["report", "daily report", "weekly report", "coverage report", "change log"],
  "Support Model": ["support", "incident", "issue", "resolution", "outage", "P1", "P2", "weekend"],
  "Commercials": ["commercial", "pricing", "proposal", "tier", "discount", "API call", "volume"],
  "Open Questions": ["question", "clarification", "open", "pending", "unresolved", "TBC"],
};

/** Get topic keyword list for scoped search, excluding terms already in user query. */
function getTopicExpansionTerms(topic: TopicScope, query: string): string[] {
  if (topic === "All Topics") return [];
  const q = query.toLowerCase();
  return topicKeywords[topic].filter((t) => !q.includes(t.toLowerCase()));
}

/** Build a single search_query string for grounded answer backend: user query + OR-joined topic terms. */
function buildGroundedSearchQuery(query: string, topic: TopicScope, contextTerms?: string): string {
  let sq = query;
  if (contextTerms) sq = `${sq} ${contextTerms}`;
  const expansion = getTopicExpansionTerms(topic, sq);
  if (expansion.length > 0) {
    // Append topic terms as OR group for broader matching
    sq = `${sq} ${expansion.slice(0, 4).join(" OR ")}`;
  }
  return sq;
}

type AnswerMode = "checking" | "retrieval" | "offline";
type UserMode = "retrieval" | "grounded";

/** A chat message that may include search results for retrieval-mode answers. */
interface ChatMessage extends AskAIMessage {
  searchResults?: SearchResultItem[];
  groundedSources?: GroundedSource[];
  mode?: AnswerMode | "grounded";
  groundedMeta?: { model: string | null; evidenceCount: number; calledLlm: boolean; usage: GroundedUsage | null };
}

interface Props {
  context?: string;
  role?: Role;
  onOpenDrawer?: (item: EvidenceItem) => void;
}

export function AskAI({ context, role = "All Views", onOpenDrawer }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hello! I'm your Knowledge Hub assistant. Ask me about your indexed customer files — I'll search the parsed evidence and return relevant excerpts.\n\nTry a question from the suggestions below, or type your own." },
  ]);
  const [input, setInput] = useState("");
  const [topicScope, setTopicScope] = useState<TopicScope>("All Topics");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<string | undefined>(context);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("checking");
  const [userMode, setUserMode] = useState<UserMode>("retrieval");
  const [llmConfigured, setLlmConfigured] = useState(false);
  const rc = roleConfig[role];
  const suggestedQuestions = rc.suggestedQuestions;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check backend availability + LLM status on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await checkHealth();
        if (!cancelled) setAnswerMode("retrieval");
        // Also check LLM status
        try {
          const status = await getLLMStatus();
          if (!cancelled) setLlmConfigured(status.configured);
        } catch { /* LLM status check failed — leave as false */ }
      } catch {
        if (!cancelled) setAnswerMode("offline");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-set topic scope from context pill if it matches a tracked topic
  useEffect(() => {
    if (!context) return;
    const cleaned = context.replace(/^(Context:|Evidence\s*—|Alert\s*—|Requirement\s*—)\s*/i, "").trim();
    const match = topicScopes.find((t) => t !== "All Topics" && cleaned.toLowerCase().includes(t.toLowerCase()));
    if (match) setTopicScope(match);
  }, [context]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const query = text.trim();
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);

    if (answerMode === "retrieval") {
      // Build base query with context terms
      let baseQ = query;
      let extraContext = "";
      if (activeContext) {
        const contextTerms = activeContext.replace(/^(Context:|Evidence\s*—|Alert\s*—|Requirement\s*—|Role context:)\s*/i, "").trim();
        if (contextTerms && !query.toLowerCase().includes(contextTerms.toLowerCase())) {
          baseQ = `${query} ${contextTerms}`;
          extraContext = contextTerms;
        }
      }
      const topicTerms = getTopicExpansionTerms(topicScope, baseQ);
      const isScoped = topicScope !== "All Topics" && topicTerms.length > 0;

      if (userMode === "grounded" && llmConfigured) {
        // Grounded Answer mode: search + LLM via backend
        // Send OR-expanded query so backend FTS5 has broader recall
        const searchQ = buildGroundedSearchQuery(query, topicScope, extraContext || undefined);
        try {
          const res = await getGroundedAnswer(query, searchQ, 5);
          if (!res.called_llm && res.evidence_count === 0) {
            // No evidence found — show safe message, not an LLM answer
            const scopeTip = topicScope !== "All Topics" ? `\n• Switch scope to All Topics for broader results` : "";
            setMessages((prev) => [...prev, {
              role: "assistant",
              text: `${res.answer}${scopeTip}`,
              mode: "grounded",
              groundedMeta: { model: res.model, evidenceCount: 0, calledLlm: false, usage: null },
            }]);
          } else {
            // Grounded answer with sources
            setMessages((prev) => [...prev, {
              role: "assistant",
              text: res.answer,
              groundedSources: res.sources,
              mode: "grounded",
              groundedMeta: { model: res.model, evidenceCount: res.evidence_count, calledLlm: res.called_llm, usage: res.usage },
            }]);
          }
        } catch (err) {
          // LLM call failed — try to show retrieved evidence as fallback
          const errMsg = err instanceof Error ? err.message : "Grounded answer failed";
          try {
            const fallbackResults = isScoped
              ? await scopedSearch(baseQ, topicTerms, 5)
              : (await searchChunks(baseQ, 5)).results;
            const fallback = { results: fallbackResults };
            if (fallback.results.length > 0) {
              setMessages((prev) => [...prev, {
                role: "assistant",
                text: `Grounded answer failed: ${errMsg}\n\nShowing retrieved evidence instead. You can switch to Evidence Retrieval mode or retry after checking LLM configuration.`,
                searchResults: fallback.results,
                mode: "grounded",
                groundedMeta: { model: null, evidenceCount: fallback.results.length, calledLlm: false, usage: null },
              }]);
            } else {
              setMessages((prev) => [...prev, {
                role: "assistant",
                text: `Grounded answer failed: ${errMsg}\n\nNo evidence found either. Try different keywords or check backend/LLM configuration.`,
                mode: "grounded",
                groundedMeta: { model: null, evidenceCount: 0, calledLlm: false, usage: null },
              }]);
            }
          } catch {
            setMessages((prev) => [...prev, {
              role: "assistant",
              text: `Grounded answer failed: ${errMsg}\n\nBackend may be offline. Switching to Evidence Retrieval mode.`,
              mode: "grounded",
              groundedMeta: { model: null, evidenceCount: 0, calledLlm: false, usage: null },
            }]);
          }
          setUserMode("retrieval");
        }
      } else {
        // Evidence Retrieval mode (default): FTS5 search, with two-stage scoped search if topic set
        try {
          const results = isScoped
            ? await scopedSearch(baseQ, topicTerms, 5)
            : (await searchChunks(baseQ, 5)).results;
          const scopeNote = topicScope !== "All Topics" ? ` [Scope: ${topicScope}]` : "";
          const scopeHint = isScoped ? " Scope applied using topic keyword expansion." : "";
          if (results.length > 0) {
            setMessages((prev) => [...prev, {
              role: "assistant",
              text: `I found ${results.length} relevant evidence snippet${results.length > 1 ? "s" : ""} in indexed files for "${query}".${scopeNote}${scopeHint} No LLM was called — these are deterministic search results from parsed content.`,
              searchResults: results,
              mode: "retrieval",
            }]);
          } else {
            const scopeTip = topicScope !== "All Topics" ? `\n• Switch scope to All Topics for broader results` : "";
            setMessages((prev) => [...prev, {
              role: "assistant",
              text: `I could not find "${query}" in the indexed files.${scopeNote}\n\nSuggestions:\n• Try different keywords or broader terms${scopeTip}\n• Check whether relevant files have been scanned and parsed in Settings\n• Use the Search Evidence panel on the right for direct FTS5 search`,
              mode: "retrieval",
            }]);
          }
        } catch {
          setAnswerMode("offline");
          setMessages((prev) => [...prev, {
            role: "assistant",
            text: "The backend is currently unavailable. Start the backend server to search indexed files and get evidence-based answers.",
            mode: "offline",
          }]);
        }
      }
    } else {
      await new Promise((r) => setTimeout(r, 400));
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: "The backend is not connected. Start the backend server to search your indexed files and get evidence-based answers.",
        mode: "offline",
      }]);
    }

    setLoading(false);
  };

  const lastSources = [...messages].reverse().find((m) => m.sources)?.sources;

  // Sidebar evidence search state (preserved from Sprint 9A)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>();
  const [searchDone, setSearchDone] = useState(false);

  const [sidebarUseScope, setSidebarUseScope] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setSearchError(undefined);
    setSearchResults([]);
    setSearchDone(false);
    try {
      const sq = searchQuery.trim();
      const sidebarTopicTerms = sidebarUseScope ? getTopicExpansionTerms(topicScope, sq) : [];
      const useScopedSearch = sidebarUseScope && topicScope !== "All Topics" && sidebarTopicTerms.length > 0;
      const sidebarResults = useScopedSearch
        ? await scopedSearch(sq, sidebarTopicTerms, 20)
        : (await searchChunks(sq)).results;
      setSearchResults(sidebarResults);
      setSearchDone(true);
    } catch (err) {
      setSearchError(err instanceof Error && err.message.includes("fetch")
        ? "Backend offline — start FastAPI to search."
        : err instanceof Error ? err.message : "Search failed");
      setSearchDone(true);
    } finally {
      setSearching(false);
    }
  };

  const openSearchEvidence = (result: SearchResultItem) => {
    if (!onOpenDrawer) return;
    onOpenDrawer({
      file: result.file_name,
      type: (result.category === "Schema" ? "Schema" : result.category === "Source List" ? "Source List" : result.category === "Email" ? "Email" : result.category === "Deck" ? "Deck" : "Document") as any,
      date: result.updated_at?.slice(0, 10) || "",
      excerpt: result.snippet.replace(/<\/?mark>/g, ""),
      backendFileId: result.file_id,
    });
  };

  // Mode indicator — reflects both backend state and user-selected mode
  const effectiveMode = answerMode === "retrieval" && userMode === "grounded" && llmConfigured ? "grounded" : answerMode;
  const modeLabel = effectiveMode === "grounded" ? "Grounded Answer (LLM)" : effectiveMode === "retrieval" ? "Evidence Retrieval" : effectiveMode === "offline" ? "Offline" : "Checking...";
  const modeColor = effectiveMode === "grounded" ? "#ea580c" : effectiveMode === "retrieval" ? "#7c3aed" : "#9ca3af";

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-header */}
        <div className="px-6 py-2.5 flex items-center justify-between" style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>Ask across customer evidence</p>
            {activeContext && <ContextPill label={activeContext} onDismiss={() => setActiveContext(undefined)} />}
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            {answerMode === "retrieval" && (
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#f8fafc" }}>
                <button onClick={() => setUserMode("retrieval")}
                  className="px-2.5 py-1 flex items-center gap-1 transition-colors"
                  style={{ background: userMode === "retrieval" ? "#7c3aed" : "transparent", color: userMode === "retrieval" ? "#fff" : "#6b7280", fontSize: "0.68rem", fontWeight: 600 }}
                  title="FTS5 search over parsed files — no LLM">
                  <Search size={9} /> Evidence Retrieval
                </button>
                <button onClick={() => llmConfigured && setUserMode("grounded")}
                  className="px-2.5 py-1 flex items-center gap-1 transition-colors"
                  style={{
                    background: userMode === "grounded" && llmConfigured ? "#ea580c" : "transparent",
                    color: userMode === "grounded" && llmConfigured ? "#fff" : llmConfigured ? "#6b7280" : "#d1d5db",
                    fontSize: "0.68rem", fontWeight: 600,
                    cursor: llmConfigured ? "pointer" : "not-allowed",
                  }}
                  title={llmConfigured ? "Search + LLM grounded answer" : "LLM not configured. Set OPENAI_API_KEY in backend environment."}>
                  <Zap size={9} /> Grounded Answer
                  {!llmConfigured && <AlertTriangle size={8} style={{ marginLeft: 2 }} />}
                </button>
              </div>
            )}
            {answerMode !== "retrieval" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${modeColor}12`, color: modeColor, fontSize: "0.68rem", fontWeight: 600, border: `1px solid ${modeColor}30` }}>
                <Sparkles size={10} /> {modeLabel}
              </span>
            )}
            {/* Topic scope dropdown */}
            <div className="relative">
              <button
                onClick={() => setScopeOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors"
                style={{ border: "1px solid rgba(0,0,0,0.08)", background: topicScope !== "All Topics" ? "#16a34a" : "#f8fafc", color: topicScope !== "All Topics" ? "#fff" : "#6b7280", fontSize: "0.68rem", fontWeight: 600 }}>
                <Search size={9} /> {topicScope} <ChevronDown size={10} />
              </button>
              {scopeOpen && (
                <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-50" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", minWidth: 180 }}>
                  {topicScopes.map((t) => (
                    <button key={t} onClick={() => { setTopicScope(t); setScopeOpen(false); }}
                      className="block w-full text-left px-3 py-1.5 transition-colors"
                      style={{ background: topicScope === t ? "#16a34a" : "transparent", color: topicScope === t ? "#fff" : "#374151", fontSize: "0.72rem", fontWeight: topicScope === t ? 600 : 400 }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Backend offline warning */}
          {answerMode === "offline" && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
              <WifiOff size={12} color="#d97706" />
              <span style={{ color: "#d97706", fontSize: "0.74rem" }}>Backend offline — start FastAPI for evidence retrieval.</span>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex mb-5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="rounded-full flex items-center justify-center mr-3 shrink-0 self-start mt-1"
                  style={{ background: msg.mode === "grounded" ? "#ea580c" : msg.mode === "retrieval" ? "#7c3aed" : "#16a34a", width: 30, height: 30 }}>
                  {msg.mode === "grounded" ? <Zap size={13} color="#fff" /> : msg.mode === "retrieval" ? <Search size={13} color="#fff" /> : <Sparkles size={13} color="#fff" />}
                </div>
              )}
              <div style={{ maxWidth: "72%" }}>
                <div className="rounded-2xl px-4 py-3"
                  style={{
                    background: msg.role === "user" ? "#0f172a" : "#ffffff",
                    color: msg.role === "user" ? "#ffffff" : "#1e293b",
                    fontSize: "0.82rem", lineHeight: 1.75,
                    border: msg.role === "user" ? "none" : "1px solid rgba(0,0,0,0.06)",
                    whiteSpace: "pre-wrap",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/•/g, `<span style="color:#16a34a">•</span>`),
                  }}
                />
                {/* Search results embedded in chat (retrieval mode) */}
                {msg.searchResults && msg.searchResults.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {msg.searchResults.map((result) => (
                      <EvidenceResultCard key={result.chunk_id} result={result} onOpenDrawer={onOpenDrawer} />
                    ))}
                  </div>
                )}
                {/* Grounded answer source cards */}
                {msg.groundedSources && msg.groundedSources.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {msg.groundedSources.map((src) => (
                      <EvidenceResultCard
                        key={src.chunk_id}
                        result={{
                          chunk_id: src.chunk_id,
                          file_id: src.file_id,
                          file_name: src.file_name,
                          chunk_index: src.chunk_index,
                          snippet: src.snippet,
                          file_type: src.file_type || "",
                          category: src.category || "",
                          customer_relevance: src.customer_relevance || "",
                          token_estimate: src.token_estimate || 0,
                          updated_at: "",
                        }}
                        onOpenDrawer={onOpenDrawer}
                        compact
                      />
                    ))}
                  </div>
                )}
                {/* Mode label + confidence + usage for assistant messages */}
                {msg.role === "assistant" && msg.mode && (
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {/* Confidence label */}
                    {msg.mode === "grounded" && msg.groundedMeta?.calledLlm && (
                      <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full" style={{ background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: "0.62rem", fontWeight: 600, border: "1px solid rgba(234,88,12,0.15)" }}>
                        Grounded — evidence found
                      </span>
                    )}
                    {msg.mode === "grounded" && !msg.groundedMeta?.calledLlm && msg.groundedMeta?.evidenceCount === 0 && (
                      <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full" style={{ background: "rgba(107,114,128,0.08)", color: "#6b7280", fontSize: "0.62rem", fontWeight: 600, border: "1px solid rgba(107,114,128,0.15)" }}>
                        Not found in indexed files
                      </span>
                    )}
                    {msg.mode === "grounded" && !msg.groundedMeta?.calledLlm && (msg.groundedMeta?.evidenceCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", fontSize: "0.62rem", fontWeight: 600, border: "1px solid rgba(217,119,6,0.15)" }}>
                        Retrieval fallback
                      </span>
                    )}
                    {/* Usage details */}
                    <div style={{ color: "#9ca3af", fontSize: "0.58rem" }}>
                      {msg.mode === "grounded" && msg.groundedMeta?.calledLlm
                        ? <>
                            {msg.groundedMeta.model || "unknown"} · {msg.groundedMeta.evidenceCount} source{msg.groundedMeta.evidenceCount !== 1 ? "s" : ""}
                            {msg.groundedMeta.usage && <> · ~{msg.groundedMeta.usage.total_tokens} tokens</>}
                          </>
                        : msg.mode === "grounded"
                          ? "No LLM called"
                          : msg.mode === "retrieval" ? "Evidence retrieval — no LLM" : "Backend offline"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full flex items-center justify-center" style={{ background: effectiveMode === "grounded" ? "#ea580c" : answerMode === "retrieval" ? "#7c3aed" : "#16a34a", width: 30, height: 30 }}>
                {effectiveMode === "grounded" ? <Zap size={13} color="#fff" /> : answerMode === "retrieval" ? <Search size={13} color="#fff" /> : <Sparkles size={13} color="#fff" />}
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
                <InlineLoader />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Lightbulb size={12} color="#9ca3af" />
            {activeContext
              ? contextSuggestedQuestions.map((q) => (
                  <SuggestedQuestionChip key={q} question={q} onClick={() => send(q)} />
                ))
              : suggestedQuestions.map((q) => (
                  <SuggestedQuestionChip key={q} question={q} onClick={() => send(q)} />
                ))
            }
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4" style={{ background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder={effectiveMode === "grounded" ? `Ask a question (LLM + ${topicScope})...` : answerMode === "retrieval" ? `Search evidence${topicScope !== "All Topics" ? ` [${topicScope}]` : ""}...` : "Ask a question…"}
              className="flex-1 bg-transparent outline-none"
              style={{ color: "#0f172a", fontSize: "0.82rem" }}
            />
            <div className="flex items-center gap-2" style={{ borderLeft: "1px solid rgba(0,0,0,0.08)", paddingLeft: 12 }}>
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{
                  background: input.trim() && !loading ? (effectiveMode === "grounded" ? "#ea580c" : answerMode === "retrieval" ? "#7c3aed" : "#16a34a") : "#e5e7eb",
                  color: input.trim() && !loading ? "#fff" : "#9ca3af",
                  width: 32, height: 32,
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          {effectiveMode === "grounded" && (
            <div className="mt-1.5 px-1" style={{ color: "#9ca3af", fontSize: "0.62rem" }}>
              Uses top indexed snippets only. Switch to Evidence Retrieval to avoid LLM/token usage.
            </div>
          )}
        </div>
      </div>

      {/* Right panel — sources + search */}
      <div className="overflow-y-auto" style={{ width: 280, background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>Cited Sources</div>
          <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginTop: 2 }}>
            {answerMode === "retrieval" ? "From parsed file evidence" : "Confidence-ranked snippets"}
          </div>
        </div>

        {lastSources ? (
          <div className="p-4">
            {lastSources.map((src, i) => (
              <SourceSnippetCard key={i} file={src.file} snippet={src.snippet} confidence={src.confidence} page={src.page} />
            ))}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center" style={{ color: "#9ca3af", textAlign: "center", paddingTop: 40 }}>
            <BookOpen size={28} color="#e5e7eb" />
            <div style={{ fontSize: "0.78rem", marginTop: 12, color: "#9ca3af" }}>
              Source citations appear here after you ask a question
            </div>
          </div>
        )}

        {/* Evidence Search Panel */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-1.5" style={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: 700 }}>
              <Search size={13} color="#7c3aed" /> Search Evidence
            </div>
            <div style={{ color: "#9ca3af", fontSize: "0.66rem", marginTop: 2 }}>Direct FTS5 keyword search</div>
          </div>
          <div className="px-4 py-3">
            {topicScope !== "All Topics" && (
              <label className="flex items-center gap-1.5 mb-2 cursor-pointer" style={{ fontSize: "0.64rem", color: "#6b7280" }}>
                <input type="checkbox" checked={sidebarUseScope} onChange={(e) => setSidebarUseScope(e.target.checked)} style={{ accentColor: "#16a34a", width: 12, height: 12 }} />
                Apply scope: {topicScope}
              </label>
            )}
            <div className="flex gap-2 mb-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search parsed content..."
                className="flex-1 bg-transparent outline-none rounded-lg px-3 py-2"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#0f172a", fontSize: "0.78rem" }}
              />
              <button onClick={handleSearch} disabled={!searchQuery.trim() || searching}
                className="rounded-lg px-2.5 py-2 flex items-center justify-center"
                style={{ background: searchQuery.trim() && !searching ? "#7c3aed" : "#e5e7eb", color: searchQuery.trim() && !searching ? "#fff" : "#9ca3af" }}>
                <Search size={13} />
              </button>
            </div>

            {searching && <div className="flex items-center gap-2 mb-2" style={{ color: "#9ca3af", fontSize: "0.74rem" }}><DbIcon size={12} style={{ animation: "kh-spin 1s linear infinite" }} /> Searching...</div>}
            {searchError && <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}><WifiOff size={11} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} /><span style={{ color: "#d97706", fontSize: "0.72rem" }}>{searchError}</span></div>}
            {searchDone && !searchError && searchResults.length === 0 && <div style={{ color: "#9ca3af", fontSize: "0.74rem", textAlign: "center", padding: "8px 0" }}>No results</div>}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2">
                <div style={{ color: "#6b7280", fontSize: "0.66rem" }}>{searchResults.length} results</div>
                {searchResults.map((result) => (
                  <div key={result.chunk_id} className="rounded-lg px-3 py-2.5" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText size={10} color="#16a34a" />
                      <span style={{ color: "#16a34a", fontSize: "0.68rem", fontWeight: 500 }}>{result.file_name}</span>
                    </div>
                    <p style={{ color: "#374151", fontSize: "0.72rem", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: result.snippet.replace(/<mark>/g, '<mark style="background:rgba(139,92,246,0.2);color:#5b21b6;padding:0 1px;border-radius:2px">') }} />
                    <div className="flex items-center gap-2 mt-1.5">
                      {onOpenDrawer && <button onClick={() => openSearchEvidence(result)} className="flex items-center gap-1" style={{ color: "#16a34a", fontSize: "0.64rem", fontWeight: 600 }}><Eye size={9} /> Evidence</button>}
                      <button onClick={() => send(`${result.file_name}: ${searchQuery}`)} className="flex items-center gap-1" style={{ color: "#7c3aed", fontSize: "0.64rem", fontWeight: 600 }}><Search size={9} /> Ask</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes kh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
