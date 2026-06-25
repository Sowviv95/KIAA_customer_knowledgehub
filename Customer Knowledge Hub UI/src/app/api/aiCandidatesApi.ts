/**
 * AI Candidates API — extraction status, candidate CRUD, and review.
 * No API key handling in frontend.
 */

import { apiGet, apiPost, apiPatch } from "./client";

export interface AIStatus {
  available: boolean;
  message: string;
}

export interface AIUpdateCandidate {
  id: number;
  update_type: string;
  title: string;
  description: string | null;
  topic: string | null;
  source_file: string;
  source_chunk_id: number | null;
  evidence_quote: string;
  confidence: number | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_action: string | null;
  converted_to_type: string | null;
  converted_to_id: number | null;
  converted_at: string | null;
}

export interface AIExtractionResponse {
  count_created: number;
  count_skipped: number;
  candidates: AIUpdateCandidate[];
  error: string | null;
}

export interface AIUpdateCandidateListResponse {
  candidates: AIUpdateCandidate[];
  total: number;
}

export async function getAIStatus(): Promise<AIStatus> {
  return apiGet<AIStatus>("/ai/status");
}

export async function extractAICandidates(params?: {
  topic?: string;
  file_id?: number | null;
  limit_chunks?: number;
}): Promise<AIExtractionResponse> {
  return apiPost<AIExtractionResponse>("/ai/candidates/extract", {
    topic: params?.topic || null,
    file_id: params?.file_id ?? null,
    limit_chunks: params?.limit_chunks ?? 25,
  });
}

export async function listAICandidates(filters?: {
  status?: string;
  update_type?: string;
  topic?: string;
  source_file?: string;
}): Promise<AIUpdateCandidateListResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.update_type) params.set("update_type", filters.update_type);
  if (filters?.topic) params.set("topic", filters.topic);
  if (filters?.source_file) params.set("source_file", filters.source_file);
  const qs = params.toString();
  return apiGet<AIUpdateCandidateListResponse>(`/ai/candidates${qs ? `?${qs}` : ""}`);
}

export async function reviewAICandidate(
  id: number,
  body: { status: string; reviewer_action?: string },
): Promise<AIUpdateCandidate> {
  return apiPatch<AIUpdateCandidate>(`/ai/candidates/${id}/review`, body);
}

export interface ConversionResponse {
  candidate: AIUpdateCandidate;
  converted_to_type: string;
  converted_to_id: number;
}

export async function convertCandidateToRequirement(
  id: number,
  payload?: { title?: string; description?: string; topic?: string },
): Promise<ConversionResponse> {
  return apiPost<ConversionResponse>(`/ai/candidates/${id}/convert-to-requirement`, payload || {});
}

export async function convertCandidateToAction(
  id: number,
  payload?: { title?: string; description?: string; topic?: string; priority?: string; owner?: string; due_date?: string },
): Promise<ConversionResponse> {
  return apiPost<ConversionResponse>(`/ai/candidates/${id}/convert-to-action`, payload || {});
}
