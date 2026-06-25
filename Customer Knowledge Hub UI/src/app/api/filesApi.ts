/**
 * Files API — scan, list, and map backend file records to frontend types.
 */

import { apiGet } from "./client";
import type { CustomerFile, FileType, FileCategory, CustomerRelevance, SummaryStatus } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Backend response types ──────────────────────────────────────────────────

export interface BackendFileRecord {
  id: number;
  name: string;
  file_path: string;
  file_type: string;
  category: string;
  file_hash: string | null;
  file_size: number | null;
  customer_relevance: string;
  summary_status: string;
  indexed_at: string;
  updated_at: string;
}

export interface ScanSummary {
  scanned: number;
  new: number;
  changed: number;
  unchanged: number;
  missing: number;
  reclassified: number;
  unsupported_skipped: number;
  errors: string[];
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function scanFiles(): Promise<ScanSummary> {
  const res = await fetch(`${BASE_URL}/files/scan`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Scan failed: ${res.statusText}`);
  }
  return res.json();
}

export async function getFiles(): Promise<BackendFileRecord[]> {
  return apiGet<BackendFileRecord[]>("/files");
}

export interface ParseFileSummary {
  file_id: number;
  file_name: string;
  status: string;
  chunks_created: number;
  characters_extracted: number;
  warnings: string[];
}

export async function parseFile(fileId: number): Promise<ParseFileSummary> {
  const res = await fetch(`${BASE_URL}/files/${fileId}/parse`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Parse failed: ${res.statusText}`);
  }
  return res.json();
}

export interface BulkParseSummary {
  processed: number;
  parsed: number;
  skipped: number;
  failed: number;
  chunks_created: number;
  errors: string[];
}

export async function parseAllFiles(): Promise<BulkParseSummary> {
  const res = await fetch(`${BASE_URL}/files/parse`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Bulk parse failed: ${res.statusText}`);
  }
  return res.json();
}

export interface ScanAndParseSummary {
  scan: ScanSummary;
  parse: BulkParseSummary;
}

export async function scanAndParse(): Promise<ScanAndParseSummary> {
  const scanRes = await fetch(`${BASE_URL}/files/scan`, { method: "POST" });
  if (!scanRes.ok) {
    const body = await scanRes.json().catch(() => ({ detail: scanRes.statusText }));
    throw new Error(body.detail || `Scan failed: ${scanRes.statusText}`);
  }
  const scan: ScanSummary = await scanRes.json();

  const parseRes = await fetch(`${BASE_URL}/files/parse`, { method: "POST" });
  if (!parseRes.ok) {
    const body = await parseRes.json().catch(() => ({ detail: parseRes.statusText }));
    throw new Error(body.detail || `Parse failed: ${parseRes.statusText}`);
  }
  const parse: BulkParseSummary = await parseRes.json();

  return { scan, parse };
}

export interface ChunkRecord {
  id: number;
  file_id: number;
  chunk_index: number;
  content: string;
  token_count: number | null;
  created_at: string;
}

export async function getFileChunks(fileId: number): Promise<ChunkRecord[]> {
  return apiGet<ChunkRecord[]>(`/files/${fileId}/chunks`);
}

export async function getFirstChunkExcerpt(fileId: number): Promise<string | null> {
  try {
    const chunks = await getFileChunks(fileId);
    if (chunks.length > 0) {
      const text = chunks[0].content;
      return text.length > 300 ? text.slice(0, 300) + "..." : text;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Mapping to frontend types ───────────────────────────────────────────────

const FILE_TYPE_MAP: Record<string, FileType> = {
  DOCX: "DOCX", XLSX: "XLSX", YAML: "YAML", PPTX: "PPTX",
  MSG: "MSG", PDF: "PDF", JSON: "JSON", EML: "EML", TXT: "DOCX",
};

const CATEGORY_MAP: Record<string, FileCategory> = {
  "Document": "RFP",
  "Meeting Notes": "Meeting Notes",
  "Schema": "Schema",
  "Source List": "Source List",
  "Deck": "Deck",
  "Email": "Email",
  "Onboarding": "Onboarding",
};

const RELEVANCE_MAP: Record<string, CustomerRelevance> = {
  "Customer Provided": "Customer Provided",
  "Meeting Note": "Meeting Note",
  "Email Export": "Email Export",
  "Schema": "Schema",
  "Source List": "Source List",
  "Internal Deck": "Internal Deck",
  "Reference": "Reference",
};

const STATUS_MAP: Record<string, SummaryStatus> = {
  "Done": "Done", "Pending": "Pending", "Skipped": "Skipped",
  "In Progress": "Pending", "Missing": "Missing",
};

function extractTags(record: BackendFileRecord): string[] {
  const tags: string[] = [];
  const lower = record.name.toLowerCase();
  if (lower.includes("rfp")) tags.push("RFP");
  if (lower.includes("schema") || lower.includes("swagger")) tags.push("Schema");
  if (lower.includes("sla")) tags.push("SLA");
  if (lower.includes("source") || lower.includes("data_sources")) tags.push("Sources");
  if (lower.includes("meeting") || lower.includes("call") || lower.includes("notes")) tags.push("Meeting");
  if (lower.includes("commercial") || lower.includes("pricing")) tags.push("Commercials");
  if (record.file_type === "YAML" || record.file_type === "JSON") tags.push(record.file_type);
  if (tags.length === 0) tags.push(record.category);
  return tags.slice(0, 3);
}

function guessTopic(record: BackendFileRecord): string {
  const lower = record.name.toLowerCase();
  if (lower.includes("schema") || lower.includes("swagger") || lower.includes("api")) return "Schema/API";
  if (lower.includes("source") || lower.includes("data_sources") || lower.includes("coverage")) return "Source List";
  if (lower.includes("sla") || lower.includes("latency")) return "SLA";
  if (lower.includes("commercial") || lower.includes("pricing")) return "Commercials";
  if (lower.includes("rfp") || lower.includes("scope") || lower.includes("phase")) return "Scope";
  if (lower.includes("monitoring") || lower.includes("cadence")) return "Monitoring Cadence";
  return "Scope";
}

export function mapBackendFileToCustomerFile(record: BackendFileRecord): CustomerFile & { backendId?: number } {
  const isParsed = record.summary_status === "Done";
  return {
    name: record.name,
    type: FILE_TYPE_MAP[record.file_type] || "DOCX",
    category: CATEGORY_MAP[record.category] || "RFP",
    updated: record.updated_at.slice(0, 10),
    summaryStatus: STATUS_MAP[record.summary_status] || "Pending",
    tags: extractTags(record),
    customerRelevance: RELEVANCE_MAP[record.customer_relevance] || "Reference",
    excerpt: isParsed
      ? `Parsed content available. Click Evidence to view extracted text.`
      : `Indexed from ${record.file_path}. Content parsing not yet available.`,
    topic: guessTopic(record),
    backendId: record.id,
  };
}
