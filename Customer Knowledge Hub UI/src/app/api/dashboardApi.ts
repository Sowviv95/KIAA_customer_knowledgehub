/**
 * Dashboard API — stats from backend files, alerts, and chunks tables.
 */

import { apiGet } from "./client";

export interface LatestFileItem {
  id: number;
  name: string;
  file_type: string;
  category: string;
  summary_status: string;
  indexed_at: string;
}

export interface LatestAlertItem {
  id: number;
  severity: string;
  type: string;
  description: string;
  source_file: string | null;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  files_indexed: number;
  files_parsed: number;
  files_pending_parse: number;
  total_alerts: number;
  open_alerts: number;
  reviewed_alerts: number;
  ignored_alerts: number;
  chunks_indexed: number;
  open_actions: number;
  open_requirements: number;
  open_followups: number;
  last_indexed_at: string | null;
  status_label: string;
  latest_files: LatestFileItem[];
  latest_alerts: LatestAlertItem[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>("/dashboard/stats");
}
