/**
 * Change Log API — customer knowledge event timeline.
 */

import { apiGet } from "./client";

export interface ChangeLogEvent {
  id: number;
  event_type: string;
  title: string;
  description: string | null;
  topic: string | null;
  source_file: string | null;
  source_excerpt: string | null;
  related_type: string | null;
  related_id: number | null;
  created_at: string;
}

export async function listChangeLog(filters?: {
  event_type?: string;
  topic?: string;
  related_type?: string;
  limit?: number;
}): Promise<ChangeLogEvent[]> {
  const params = new URLSearchParams();
  if (filters?.event_type) params.set("event_type", filters.event_type);
  if (filters?.topic) params.set("topic", filters.topic);
  if (filters?.related_type) params.set("related_type", filters.related_type);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiGet<ChangeLogEvent[]>(`/change-log${qs ? `?${qs}` : ""}`);
}
