/**
 * Topics API — tracked topic summaries derived from backend data.
 */

import { apiGet } from "./client";

export interface TopicSummaryItem {
  topic: string;
  files_count: number;
  alerts_count: number;
  open_actions_count: number;
  open_requirements_count: number;
  total_items: number;
  last_activity_at: string | null;
}

export async function getTopicSummary(): Promise<TopicSummaryItem[]> {
  return apiGet<TopicSummaryItem[]>("/topics/summary");
}
