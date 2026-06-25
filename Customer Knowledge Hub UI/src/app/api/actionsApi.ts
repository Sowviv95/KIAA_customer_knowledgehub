/**
 * Actions API — list, create, and update actions/follow-ups.
 */

import { apiGet, apiPost, apiPatch } from "./client";

export interface BackendAction {
  id: number;
  text: string;
  owner: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  source_file: string | null;
  excerpt: string | null;
  created_at: string;
}

export interface ActionCreatePayload {
  text: string;
  owner?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  source_file?: string;
  excerpt?: string;
}

export interface ActionUpdatePayload {
  text?: string;
  owner?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  source_file?: string;
  excerpt?: string;
}

export async function getActions(): Promise<BackendAction[]> {
  return apiGet<BackendAction[]>("/actions");
}

export async function createAction(body: ActionCreatePayload): Promise<BackendAction> {
  return apiPost<BackendAction>("/actions", body);
}

export async function updateAction(id: number, body: ActionUpdatePayload): Promise<BackendAction> {
  return apiPatch<BackendAction>(`/actions/${id}`, body);
}
