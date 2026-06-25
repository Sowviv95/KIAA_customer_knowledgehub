/**
 * Timeline API — chronological events derived from backend data.
 */

import { apiGet } from "./client";

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  source_file: string | null;
  topic: string | null;
  status: string | null;
  severity_or_priority: string | null;
  occurred_at: string;
  related_entity_type: string;
  related_entity_id: number;
}

export async function getTimelineEvents(params?: {
  limit?: number;
  topic?: string;
  event_type?: string;
}): Promise<TimelineEvent[]> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.topic) qs.set("topic", params.topic);
  if (params?.event_type) qs.set("event_type", params.event_type);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<TimelineEvent[]>(`/timeline/events${suffix}`);
}
