/**
 * Topics Configuration API — CRUD for tracked topics.
 */

import { apiGet, apiPost, apiPatch } from "./client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface TrackedTopic {
  id: number;
  name: string;
  understanding: string | null;
  enabled: boolean;
  sort_order: number;
  keywords: string | null;
  created_at: string;
  updated_at: string;
}

export async function getTrackedTopics(enabledOnly = false): Promise<TrackedTopic[]> {
  const qs = enabledOnly ? "?enabled_only=true" : "";
  return apiGet<TrackedTopic[]>(`/topics${qs}`);
}

export async function createTrackedTopic(body: {
  name: string;
  understanding?: string;
  enabled?: boolean;
  sort_order?: number;
  keywords?: string;
}): Promise<TrackedTopic> {
  return apiPost<TrackedTopic>("/topics", body);
}

export async function updateTrackedTopic(id: number, body: {
  name?: string;
  understanding?: string;
  enabled?: boolean;
  sort_order?: number;
  keywords?: string;
}): Promise<TrackedTopic> {
  return apiPatch<TrackedTopic>(`/topics/${id}`, body);
}

export async function deleteTrackedTopic(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/topics/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Delete failed");
  }
}
