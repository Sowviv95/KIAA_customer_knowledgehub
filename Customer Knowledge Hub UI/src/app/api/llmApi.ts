/**
 * LLM API — status check and grounded answers. No API key handling in frontend.
 */

import { apiGet, apiPost } from "./client";

export interface LLMStatus {
  provider: string;
  configured: boolean;
  model: string;
  key_source: string;
  message: string;
}

export async function getLLMStatus(): Promise<LLMStatus> {
  return apiGet<LLMStatus>("/llm/status");
}

// --- Grounded answer types ---

export interface GroundedSource {
  file_id: number;
  file_name: string;
  chunk_id: number;
  chunk_index: number;
  snippet: string;
  file_type: string;
  category: string;
  customer_relevance: string;
  token_estimate: number;
}

export interface GroundedUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GroundedAnswerResponse {
  answer: string;
  grounded: boolean;
  called_llm: boolean;
  model: string | null;
  evidence_count: number;
  sources: GroundedSource[];
  usage: GroundedUsage | null;
}

export async function getGroundedAnswer(
  question: string,
  searchQuery?: string,
  limit: number = 5,
  model?: string,
  maxTokens: number = 400,
): Promise<GroundedAnswerResponse> {
  return apiPost<GroundedAnswerResponse>("/llm/grounded-answer", {
    question,
    search_query: searchQuery || null,
    limit,
    model: model || null,
    max_tokens: maxTokens,
  });
}

// --- File summary (LLM-grounded) ---

export interface FileSummaryResponse {
  file_id: number;
  file_name: string;
  summary: string;
  key_points: string[];
  topics: string[];
  model: string | null;
  evidence_count: number;
  called_llm: boolean;
  usage: GroundedUsage | null;
}

export async function getFileSummary(fileId: number): Promise<FileSummaryResponse> {
  return apiPost<FileSummaryResponse>("/llm/file-summary", {
    file_id: fileId,
  });
}
