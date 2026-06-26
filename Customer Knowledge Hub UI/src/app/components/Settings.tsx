import { useState, useEffect, useCallback } from "react";
import { Folder, Cpu, Database, Coins, Zap, Bell, RefreshCw, ChevronRight, Check, Plus, Trash2, Info, Circle, WifiOff, Loader2, FileText, ClipboardCheck, Tag, X } from "lucide-react";
import type { AlertRule } from "../types";
import { initialAlertRules, modelProviders, embeddingProviders } from "../data";
import { checkHealth } from "../api/client";
import { getSettings, updateSettings } from "../api/settingsApi";
import { scanFiles, parseAllFiles, scanAndParse, type ScanSummary, type BulkParseSummary, type ScanAndParseSummary } from "../api/filesApi";
import { getLLMStatus, type LLMStatus } from "../api/llmApi";
import { apiGet } from "../api/client";
import { getTrackedTopics, createTrackedTopic, updateTrackedTopic, type TrackedTopic } from "../api/topicsConfigApi";

interface DemoReadiness {
  backend_healthy: boolean;
  llm_configured: boolean;
  scan_folder_configured: boolean;
  scan_folder_path: string;
  files_indexed: number;
  files_parsed: number;
  files_missing: number;
  chunks_parsed: number;
  candidates_total: number;
  candidates_accepted: number;
  candidates_converted: number;
  open_followups: number;
  requirements_total: number;
  change_log_events: number;
}

const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

type BackendStatus = "checking" | "connected" | "offline";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="rounded-full transition-colors flex items-center"
      style={{
        width: 40,
        height: 22,
        background: checked ? "#16a34a" : "#e5e7eb",
        padding: "2px",
        flexShrink: 0,
      }}
    >
      <span
        className="rounded-full transition-transform"
        style={{
          width: 18,
          height: 18,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          display: "block",
        }}
      />
    </button>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl mb-5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="rounded flex items-center justify-center" style={{ background: "rgba(22,163,74,0.08)", width: 28, height: 28 }}>
          <Icon size={14} color="#16a34a" />
        </div>
        <span style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>{title}</span>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <label style={{ color: "#1e293b", fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: hint ? 2 : 6 }}>{label}</label>
      {hint && <p style={{ color: "#9ca3af", fontSize: "0.74rem", marginBottom: 8 }}>{hint}</p>}
      {children}
    </div>
  );
}

function BackendStatusPill({ status, version }: { status: BackendStatus; version?: string }) {
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "#f0f4f8", color: "#6b7280", fontSize: "0.74rem", border: "1px solid rgba(0,0,0,0.08)" }}>
        <Loader2 size={10} style={{ animation: "kh-spin 1s linear infinite" }} /> Checking backend...
      </span>
    );
  }
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(22,163,74,0.22)" }}>
        <Circle size={6} fill="#16a34a" color="#16a34a" /> Backend connected{version ? ` (v${version})` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", fontSize: "0.74rem", fontWeight: 600, border: "1px solid rgba(220,38,38,0.18)" }}>
      <WifiOff size={10} /> Backend offline
    </span>
  );
}

export function Settings() {
  // Backend-connected settings
  const [folderPath, setFolderPath] = useState("");
  const [modelProvider, setModelProvider] = useState(modelProviders[0]);
  const [embeddingProvider, setEmbeddingProvider] = useState(embeddingProviders[0]);
  const [tokenBudget, setTokenBudget] = useState(80000);
  const [mockMode, setMockMode] = useState(true);

  // Local-only settings (not yet in backend)
  const [autoSummary, setAutoSummary] = useState(true);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(initialAlertRules);

  // UI state
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [backendVersion, setBackendVersion] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [indexing, setIndexing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanSummary | null>(null);
  const [scanError, setScanError] = useState<string>();
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<BulkParseSummary | null>(null);
  const [parseError, setParseError] = useState<string>();
  const [scanAndParseRunning, setScanAndParseRunning] = useState(false);
  const [scanAndParseResult, setScanAndParseResult] = useState<ScanAndParseSummary | null>(null);
  const [scanAndParseError, setScanAndParseError] = useState<string>();
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [demoReadiness, setDemoReadiness] = useState<DemoReadiness | null>(null);

  // Topic configuration
  const [topics, setTopics] = useState<TrackedTopic[]>([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const health = await checkHealth();
      setBackendStatus("connected");
      setBackendVersion(health.version);

      const settings = await getSettings();
      setFolderPath(settings.local_folder_path);
      setModelProvider(settings.llm_provider);
      setEmbeddingProvider(settings.embedding_provider);
      setTokenBudget(settings.token_budget_per_request);
      setMockMode(settings.mock_mode);

      // Load LLM status
      try {
        const status = await getLLMStatus();
        setLlmStatus(status);
      } catch { /* LLM status is optional */ }

      // Load demo readiness
      try {
        const dr = await apiGet<DemoReadiness>("/demo/readiness");
        setDemoReadiness(dr);
      } catch { /* demo readiness is optional */ }

      // Load tracked topics
      try {
        const t = await getTrackedTopics();
        setTopics(t);
      } catch { /* topics optional */ }
    } catch {
      setBackendStatus("offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (backendStatus !== "connected") return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const updated = await updateSettings({
        local_folder_path: folderPath,
        llm_provider: modelProvider,
        embedding_provider: embeddingProvider,
        token_budget_per_request: tokenBudget,
        mock_mode: mockMode,
      });
      setFolderPath(updated.local_folder_path);
      setModelProvider(updated.llm_provider);
      setEmbeddingProvider(updated.embedding_provider);
      setTokenBudget(updated.token_budget_per_request);
      setMockMode(updated.mock_mode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = (id: number, enabled: boolean) =>
    setAlertRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));

  const removeRule = (id: number) =>
    setAlertRules((prev) => prev.filter((r) => r.id !== id));

  const handleReindex = async () => {
    if (backendStatus !== "connected" || !folderPath) return;
    setIndexing(true);
    setScanResult(null);
    setScanError(undefined);
    try {
      const result = await scanFiles();
      setScanResult(result);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIndexing(false);
    }
  };

  const handleParseAll = async () => {
    if (backendStatus !== "connected") return;
    setParsing(true);
    setParseResult(null);
    setParseError(undefined);
    try {
      const result = await parseAllFiles();
      setParseResult(result);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const handleScanAndParse = async () => {
    if (backendStatus !== "connected" || !folderPath) return;
    setScanAndParseRunning(true);
    setScanAndParseResult(null);
    setScanAndParseError(undefined);
    setScanResult(null);
    setParseResult(null);
    try {
      const result = await scanAndParse();
      setScanAndParseResult(result);
    } catch (err) {
      setScanAndParseError(err instanceof Error ? err.message : "Scan & Parse failed");
    } finally {
      setScanAndParseRunning(false);
    }
  };

  const anyBusy = indexing || parsing || scanAndParseRunning;

  const inputStyle = {
    background: "#f8fafc",
    border: "1px solid rgba(0,0,0,0.10)",
    color: "#0f172a",
    fontSize: "0.82rem",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
    width: "100%",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f0f4f8", fontFamily: FF }}>
      {/* Sub-header */}
      <div
        className="px-7 py-2.5 flex items-center justify-between"
        style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>Configure your local AI workbench</p>
          <BackendStatusPill status={backendStatus} version={backendVersion} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScanAndParse}
            disabled={anyBusy || backendStatus !== "connected" || !folderPath}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: backendStatus === "connected" && folderPath ? "#16a34a" : "#9ca3af",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: 600,
              opacity: backendStatus === "connected" && folderPath && !anyBusy ? 1 : 0.6,
              cursor: backendStatus === "connected" && folderPath && !anyBusy ? "pointer" : "not-allowed",
            }}
            title={!folderPath ? "Set a folder path first" : "Scan folder then parse all new files"}
          >
            <Zap size={13} style={{ animation: scanAndParseRunning ? "kh-spin 0.8s linear infinite" : "none" }} />
            {scanAndParseRunning ? "Scanning & Parsing..." : "Scan & Parse"}
          </button>
          <button
            onClick={handleReindex}
            disabled={anyBusy || backendStatus !== "connected" || !folderPath}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors"
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              color: backendStatus === "connected" && folderPath ? "#374151" : "#9ca3af",
              fontSize: "0.78rem",
              background: "#ffffff",
              opacity: backendStatus === "connected" && folderPath && !anyBusy ? 1 : 0.6,
              cursor: backendStatus === "connected" && folderPath && !anyBusy ? "pointer" : "not-allowed",
            }}
            title={!folderPath ? "Set a folder path first" : backendStatus !== "connected" ? "Backend must be running" : "Scan configured folder for files"}
          >
            <RefreshCw size={13} style={{ animation: indexing ? "kh-spin 0.8s linear infinite" : "none" }} />
            {indexing ? "Scanning..." : "Scan Folder"}
          </button>
          <button
            onClick={handleParseAll}
            disabled={anyBusy || backendStatus !== "connected"}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors"
            style={{
              border: "1px solid rgba(139,92,246,0.22)",
              color: backendStatus === "connected" ? "#7c3aed" : "#9ca3af",
              fontSize: "0.78rem",
              background: "rgba(139,92,246,0.06)",
              opacity: backendStatus === "connected" && !anyBusy ? 1 : 0.6,
              cursor: backendStatus === "connected" && !anyBusy ? "pointer" : "not-allowed",
            }}
            title="Parse all unparsed files into searchable chunks"
          >
            <FileText size={13} style={{ animation: parsing ? "kh-spin 0.8s linear infinite" : "none" }} />
            {parsing ? "Parsing..." : "Parse All Files"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || backendStatus !== "connected"}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: backendStatus === "connected" ? "#16a34a" : "#9ca3af",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: 600,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "kh-spin 0.8s linear infinite" }} /> : saved ? <Check size={14} /> : null}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-7 py-6" style={{ maxWidth: 780 }}>
        {/* Backend offline banner */}
        {backendStatus === "offline" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <WifiOff size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#991b1b", fontSize: "0.78rem", fontWeight: 600 }}>Backend not available</div>
              <div style={{ color: "#dc2626", fontSize: "0.74rem", marginTop: 2 }}>
                Start the backend server on port 8000 to save settings and manage files.
              </div>
            </div>
          </div>
        )}

        {/* Backend connected info */}
        {backendStatus === "connected" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.12)" }}>
            <Info size={14} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#166534", fontSize: "0.78rem", fontWeight: 600 }}>Settings connected to backend</div>
              <div style={{ color: "#16a34a", fontSize: "0.74rem", marginTop: 2 }}>
                Settings are saved to the backend. Provider selections are saved as configuration. File scanning and LLM calls use the configured settings.
              </div>
            </div>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <Info size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ color: "#dc2626", fontSize: "0.74rem" }}>{saveError}</div>
          </div>
        )}

        {/* Scan result */}
        {scanResult && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.12)" }}>
            <Check size={14} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#166534", fontSize: "0.78rem", fontWeight: 600 }}>Scan complete</div>
              <div style={{ color: "#16a34a", fontSize: "0.74rem", marginTop: 2 }}>
                {scanResult.scanned} files scanned: {scanResult.new} new, {scanResult.changed} changed, {scanResult.unchanged} unchanged.
                {scanResult.missing > 0 && ` ${scanResult.missing} missing marked.`}
                {scanResult.reclassified > 0 && ` ${scanResult.reclassified} reclassified.`}
                {scanResult.unsupported_skipped > 0 && ` ${scanResult.unsupported_skipped} unsupported skipped.`}
                {scanResult.errors.length > 0 && ` ${scanResult.errors.length} errors.`}
              </div>
            </div>
          </div>
        )}

        {/* Scan error */}
        {scanError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <Info size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ color: "#dc2626", fontSize: "0.74rem" }}>{scanError}</div>
          </div>
        )}

        {/* Parse result */}
        {parseResult && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <FileText size={14} color="#7c3aed" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#5b21b6", fontSize: "0.78rem", fontWeight: 600 }}>Parse complete</div>
              <div style={{ color: "#7c3aed", fontSize: "0.74rem", marginTop: 2 }}>
                {parseResult.processed} files processed: {parseResult.parsed} parsed ({parseResult.chunks_created} chunks created), {parseResult.skipped} skipped.
                {parseResult.failed > 0 && ` ${parseResult.failed} failed.`}
                {parseResult.errors.length > 0 && ` Errors: ${parseResult.errors.join("; ")}`}
              </div>
            </div>
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <Info size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ color: "#dc2626", fontSize: "0.74rem" }}>{parseError}</div>
          </div>
        )}

        {/* Scan & Parse result */}
        {scanAndParseResult && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.12)" }}>
            <Zap size={14} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#166534", fontSize: "0.78rem", fontWeight: 600 }}>Scan & Parse complete</div>
              <div style={{ color: "#16a34a", fontSize: "0.74rem", marginTop: 2 }}>
                Scan: {scanAndParseResult.scan.scanned} files ({scanAndParseResult.scan.new} new, {scanAndParseResult.scan.changed} changed).
                {" "}Parse: {scanAndParseResult.parse.parsed} parsed ({scanAndParseResult.parse.chunks_created} chunks).
                {scanAndParseResult.parse.skipped > 0 && ` ${scanAndParseResult.parse.skipped} skipped.`}
                {scanAndParseResult.parse.failed > 0 && ` ${scanAndParseResult.parse.failed} failed.`}
              </div>
            </div>
          </div>
        )}

        {/* Scan & Parse error */}
        {scanAndParseError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <Info size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ color: "#dc2626", fontSize: "0.74rem" }}>{scanAndParseError}</div>
          </div>
        )}

        {/* Folder */}
        <Section title="Local Folder Path" icon={Folder}>
          <Field label="Watched Folder" hint="The local directory that Knowledge Hub will monitor for new and updated files.">
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center gap-2 rounded-lg px-3"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)" }}
              >
                <Folder size={13} color="#9ca3af" />
                <input
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="Enter local folder path..."
                  className="flex-1 bg-transparent outline-none py-2.5"
                  style={{ color: "#0f172a", fontSize: "0.82rem" }}
                />
              </div>
              <button
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.03)", color: "#9ca3af", fontSize: "0.78rem", fontWeight: 600, border: "1px solid rgba(0,0,0,0.08)", whiteSpace: "nowrap", cursor: "default" }}
                title="Enter path manually — folder picker coming soon"
                disabled
              >
                Browse <ChevronRight size={12} />
              </button>
            </div>
          </Field>
          {scanResult ? (
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.18)" }}>
              <Check size={13} color="#16a34a" />
              <span style={{ color: "#16a34a", fontSize: "0.78rem", fontWeight: 500 }}>
                {scanResult.scanned} files indexed from this folder
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg" style={{ background: "rgba(107,114,128,0.05)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Info size={13} color="#9ca3af" />
              <span style={{ color: "#6b7280", fontSize: "0.74rem" }}>
                {folderPath ? "Click \"Scan Folder\" to index files from this path." : "Enter a local folder path, save settings, then scan."}
              </span>
            </div>
          )}
        </Section>

        {/* Model */}
        <Section title="Model Provider" icon={Cpu}>
          <Field label="Language Model" hint="Saved as configuration. LLM calls require OPENAI_API_KEY set as a backend environment variable.">
            <select value={modelProvider} onChange={(e) => setModelProvider(e.target.value)} style={inputStyle}>
              {modelProviders.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          {/* LLM status from backend */}
          {llmStatus && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg" style={{ background: llmStatus.configured ? "rgba(22,163,74,0.06)" : "rgba(217,119,6,0.06)", border: `1px solid ${llmStatus.configured ? "rgba(22,163,74,0.15)" : "rgba(217,119,6,0.15)"}` }}>
              <Circle size={6} fill={llmStatus.configured ? "#16a34a" : "#d97706"} color={llmStatus.configured ? "#16a34a" : "#d97706"} />
              <div>
                <span style={{ color: llmStatus.configured ? "#16a34a" : "#d97706", fontSize: "0.78rem", fontWeight: 500 }}>
                  {llmStatus.configured ? `LLM ready — ${llmStatus.model}` : "LLM not configured"}
                </span>
                <span style={{ color: "#9ca3af", fontSize: "0.66rem", display: "block", marginTop: 1 }}>
                  {llmStatus.configured ? "API key loaded from environment variable" : "Set OPENAI_API_KEY as an environment variable on the backend server"}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: "rgba(107,114,128,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <Info size={12} color="#9ca3af" style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ color: "#6b7280", fontSize: "0.70rem" }}>
              API keys are read from backend environment variables and are never stored in the app, database, or frontend code.
            </span>
          </div>
        </Section>

        {/* Embeddings */}
        <Section title="Embedding Provider" icon={Database}>
          <Field label="Embedding Model" hint="Used for semantic search and similarity matching. Saved as configuration — no embedding calls in current build.">
            <select value={embeddingProvider} onChange={(e) => setEmbeddingProvider(e.target.value)} style={inputStyle}>
              {embeddingProviders.map((e) => <option key={e}>{e}</option>)}
            </select>
          </Field>
        </Section>

        {/* Token Budget */}
        <Section title="Token Budget" icon={Coins}>
          <Field label="Max tokens per request" hint="Limits context sent to the model per summarisation or chat request.">
            <div className="flex items-center gap-4 mb-1">
              <input
                type="range"
                min={8000}
                max={128000}
                step={4000}
                value={tokenBudget}
                onChange={(e) => setTokenBudget(Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: "#16a34a" }}
              />
              <div
                className="rounded-lg px-3 py-1.5 text-center"
                style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: "0.82rem", fontWeight: 700, border: "1px solid rgba(22,163,74,0.22)", minWidth: 64 }}
              >
                {(tokenBudget / 1000).toFixed(0)}k
              </div>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>8k (fast)</span>
              <span style={{ color: "#9ca3af", fontSize: "0.66rem" }}>128k (thorough)</span>
            </div>
          </Field>
        </Section>

        {/* Auto-summary */}
        <Section title="Auto-Summary" icon={Zap}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: "#1e293b", fontSize: "0.82rem", fontWeight: 600 }}>Automatically summarise new files</div>
              <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginTop: 3 }}>When a new file is detected, trigger summarisation immediately.</div>
            </div>
            <Toggle checked={autoSummary} onChange={setAutoSummary} />
          </div>
        </Section>

        {/* Tracked Topics */}
        <Section title="Tracked Topics" icon={Tag}>
          <div className="mb-1" style={{ color: "#9ca3af", fontSize: "0.66rem", marginBottom: 8 }}>Topics used for filtering, scoping, and classification across the app.</div>
          {topics.length === 0 && backendStatus === "connected" && (
            <div style={{ color: "#9ca3af", fontSize: "0.78rem", padding: "8px 0" }}>Loading topics...</div>
          )}
          <div className="mb-4">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Toggle checked={topic.enabled} onChange={async (v) => {
                  try {
                    const updated = await updateTrackedTopic(topic.id, { enabled: v });
                    setTopics((prev) => prev.map((t) => t.id === topic.id ? updated : t));
                  } catch { /* keep UI state */ }
                }} />
                <div className="flex-1">
                  <div style={{ color: topic.enabled ? "#1e293b" : "#9ca3af", fontSize: "0.82rem", fontWeight: 500 }}>{topic.name}</div>
                  {topic.keywords && (
                    <div style={{ color: "#9ca3af", fontSize: "0.66rem", marginTop: 1 }}>
                      {JSON.parse(topic.keywords).slice(0, 4).join(", ")}{JSON.parse(topic.keywords).length > 4 ? "..." : ""}
                    </div>
                  )}
                </div>
                <span style={{ color: "#9ca3af", fontSize: "0.62rem" }}>#{topic.sort_order}</span>
              </div>
            ))}
          </div>
          {/* Add topic */}
          {addingTopic ? (
            <div className="flex items-center gap-2">
              <input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="New topic name..."
                className="flex-1 px-3 py-1.5 rounded-lg"
                style={{ border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.8rem", outline: "none" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTopicName.trim()) {
                    (async () => {
                      try {
                        const created = await createTrackedTopic({ name: newTopicName.trim(), sort_order: topics.length + 1 });
                        setTopics((prev) => [...prev, created]);
                        setNewTopicName(""); setAddingTopic(false);
                      } catch { /* keep form open */ }
                    })();
                  }
                }}
              />
              <button onClick={async () => {
                if (!newTopicName.trim()) return;
                try {
                  const created = await createTrackedTopic({ name: newTopicName.trim(), sort_order: topics.length + 1 });
                  setTopics((prev) => [...prev, created]);
                  setNewTopicName(""); setAddingTopic(false);
                } catch { /* keep form open */ }
              }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                style={{ background: "#16a34a", color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}>
                <Check size={12} /> Add
              </button>
              <button onClick={() => { setAddingTopic(false); setNewTopicName(""); }}
                style={{ color: "#9ca3af", fontSize: "0.74rem" }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingTopic(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ border: "1px solid rgba(0,0,0,0.08)", color: "#6b7280", fontSize: "0.78rem" }}>
              <Plus size={13} /> Add Topic
            </button>
          )}
        </Section>

        {/* Alert Rules */}
        <Section title="Alert Rules" icon={Bell}>
          <div className="mb-1" style={{ color: "#9ca3af", fontSize: "0.66rem", marginBottom: 8 }}>Configure which signals trigger alerts when files are scanned.</div>
          <div className="mb-4">
            {alertRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Toggle checked={rule.enabled} onChange={(v) => toggleRule(rule.id, v)} />
                <div className="flex-1">
                  <div style={{ color: "#1e293b", fontSize: "0.82rem", fontWeight: 500 }}>{rule.type}</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.74rem", marginTop: 2 }}>{rule.description}</div>
                </div>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: "#d1d5db" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ border: "1px solid rgba(0,0,0,0.08)", color: "#6b7280", fontSize: "0.78rem" }}
          >
            <Plus size={13} /> Add Custom Rule
          </button>
        </Section>

        {/* Demo Readiness */}
        <Section title="Demo Readiness" icon={ClipboardCheck}>
          {!demoReadiness ? (
            <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
              {backendStatus === "offline" ? "Backend offline — readiness data unavailable." : "Loading readiness data..."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {[
                { label: "Backend", value: demoReadiness.backend_healthy ? "Connected" : "Offline", ok: demoReadiness.backend_healthy },
                { label: "LLM key", value: demoReadiness.llm_configured ? "Configured" : "Not set", ok: demoReadiness.llm_configured },
                { label: "Scan folder", value: demoReadiness.scan_folder_configured ? "Configured" : "Not set", ok: demoReadiness.scan_folder_configured },
                { label: "Files indexed", value: String(demoReadiness.files_indexed), ok: demoReadiness.files_indexed > 0 },
                { label: "Files parsed", value: `${demoReadiness.files_parsed} / ${demoReadiness.files_indexed}`, ok: demoReadiness.files_parsed > 0 },
                { label: "Missing files", value: String(demoReadiness.files_missing), ok: demoReadiness.files_missing === 0 },
                { label: "Parsed chunks", value: String(demoReadiness.chunks_parsed), ok: demoReadiness.chunks_parsed > 0 },
                { label: "AI candidates", value: String(demoReadiness.candidates_total), ok: true },
                { label: "Accepted", value: String(demoReadiness.candidates_accepted), ok: true },
                { label: "Converted", value: String(demoReadiness.candidates_converted), ok: true },
                { label: "Open follow-ups", value: String(demoReadiness.open_followups), ok: true },
                { label: "Requirements", value: String(demoReadiness.requirements_total), ok: true },
                { label: "Timeline events", value: String(demoReadiness.change_log_events), ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                  <span style={{ color: "#374151", fontSize: "0.78rem" }}>{item.label}</span>
                  <span style={{ color: item.ok ? "#16a34a" : "#d97706", fontSize: "0.78rem", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4" style={{ color: "#9ca3af", fontSize: "0.66rem" }}>
            To reset demo state, run: <code style={{ background: "rgba(0,0,0,0.04)", padding: "1px 4px", borderRadius: 3 }}>python -m scripts.reset_demo_state</code> from the backend directory.
          </div>
        </Section>
      </div>

      <style>{`
        @keyframes kh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
