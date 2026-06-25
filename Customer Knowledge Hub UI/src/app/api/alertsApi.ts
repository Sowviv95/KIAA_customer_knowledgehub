/**
 * Alerts API — list, update status, and map backend alerts to frontend types.
 */

import { apiGet, apiPut } from "./client";
import type { AlertItem, AlertType, AlertStatus, Severity, SourceType } from "../types";

// ─── Backend response types ──────────────────────────────────────────────────

export interface BackendAlertRecord {
  id: number;
  severity: string;
  type: string;
  description: string;
  source_file: string | null;
  source_type: string | null;
  topic: string | null;
  status: string;
  excerpt: string | null;
  created_at: string;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<BackendAlertRecord[]> {
  return apiGet<BackendAlertRecord[]>("/alerts");
}

export async function updateAlertStatus(
  alertId: number,
  status: AlertStatus,
): Promise<BackendAlertRecord> {
  return apiPut<BackendAlertRecord>(`/alerts/${alertId}`, { status });
}

// ─── Mapping to frontend types ───────────────────────────────────────────────

const VALID_ALERT_TYPES: Set<string> = new Set([
  "New Customer File Added",
  "Customer Document Changed",
  "New Meeting Note Added",
  "Schema/API Update Detected",
  "Source List Changed",
  "SLA Mention Detected",
  "New Open Question",
  "New Action Item",
]);

const VALID_SEVERITIES: Set<string> = new Set(["High", "Medium", "Low"]);
const VALID_STATUSES: Set<string> = new Set(["New", "Reviewed", "Ignored", "Action"]);

const SOURCE_TYPE_MAP: Record<string, SourceType> = {
  "Document": "Document",
  "Meeting": "Meeting",
  "Email": "Email",
  "Schema": "Schema",
  "Source List": "Source List",
  "Deck": "Deck",
};

export function mapBackendAlertToAlertItem(record: BackendAlertRecord): AlertItem {
  return {
    id: record.id,
    severity: (VALID_SEVERITIES.has(record.severity) ? record.severity : "Medium") as Severity,
    type: (VALID_ALERT_TYPES.has(record.type) ? record.type : "New Customer File Added") as AlertType,
    description: record.description,
    sourceFile: record.source_file || "",
    sourceType: (SOURCE_TYPE_MAP[record.source_type || ""] || "Document") as SourceType,
    topic: record.topic || "",
    status: (VALID_STATUSES.has(record.status) ? record.status : "New") as AlertStatus,
    created: record.created_at.replace("T", " ").slice(0, 16),
    excerpt: record.excerpt || record.description,
  };
}
