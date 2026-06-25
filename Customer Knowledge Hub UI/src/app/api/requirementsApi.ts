/**
 * Requirements API — list, create, and update requirements.
 */

import { apiGet, apiPost, apiPatch } from "./client";

export interface BackendRequirement {
  id: number;
  text: string;
  status: string;
  topic: string | null;
  source_type: string | null;
  source_file: string | null;
  excerpt: string | null;
  updated_at: string;
}

export interface RequirementCreatePayload {
  text: string;
  status?: string;
  topic?: string;
  source_type?: string;
  source_file?: string;
  excerpt?: string;
}

export interface RequirementUpdatePayload {
  text?: string;
  status?: string;
  topic?: string;
  source_type?: string;
  source_file?: string;
  excerpt?: string;
}

export async function getRequirements(): Promise<BackendRequirement[]> {
  return apiGet<BackendRequirement[]>("/requirements");
}

export async function createRequirement(body: RequirementCreatePayload): Promise<BackendRequirement> {
  return apiPost<BackendRequirement>("/requirements", body);
}

export async function updateRequirement(id: number, body: RequirementUpdatePayload): Promise<BackendRequirement> {
  return apiPatch<BackendRequirement>(`/requirements/${id}`, body);
}
