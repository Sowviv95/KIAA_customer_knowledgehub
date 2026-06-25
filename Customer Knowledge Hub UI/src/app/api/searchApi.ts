/**
 * Search API — full-text search over parsed chunks.
 */

import { apiGet } from "./client";

export interface SearchResultItem {
  chunk_id: number;
  file_id: number;
  file_name: string;
  chunk_index: number;
  snippet: string;
  file_type: string;
  category: string;
  customer_relevance: string;
  token_estimate: number;
  updated_at: string;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResultItem[];
}

export async function searchChunks(query: string, limit: number = 20): Promise<SearchResponse> {
  return apiGet<SearchResponse>(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * Two-stage scoped search: run user query first, then topic keywords,
 * merge and deduplicate by chunk_id. Primary results come first.
 *
 * Returns at most `limit` results with primary matches prioritised.
 */
export async function scopedSearch(
  userQuery: string,
  topicTerms: string[],
  limit: number = 10,
): Promise<SearchResultItem[]> {
  // Stage 1: search user query
  const primary = await searchChunks(userQuery, limit).catch(() => ({ results: [] as SearchResultItem[] }));
  const seen = new Set(primary.results.map((r) => r.chunk_id));
  const merged = [...primary.results];

  // Stage 2: search each topic keyword group (up to 2 batches of OR-joined terms)
  // Split keywords into small batches to avoid overly long queries
  const batches: string[][] = [];
  for (let i = 0; i < topicTerms.length; i += 3) {
    batches.push(topicTerms.slice(i, i + 3));
  }

  for (const batch of batches.slice(0, 2)) {
    if (merged.length >= limit) break;
    // Use FTS5 OR syntax for each batch
    const orQuery = batch.join(" OR ");
    try {
      const topicRes = await searchChunks(orQuery, limit);
      for (const r of topicRes.results) {
        if (!seen.has(r.chunk_id) && merged.length < limit) {
          seen.add(r.chunk_id);
          merged.push(r);
        }
      }
    } catch {
      // FTS5 syntax error or backend offline — skip this batch
    }
  }

  return merged.slice(0, limit);
}
