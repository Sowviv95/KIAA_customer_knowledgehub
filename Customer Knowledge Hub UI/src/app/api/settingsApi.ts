/**
 * Settings API — connects to GET /settings and PUT /settings.
 */

import { apiGet, apiPut } from "./client";

export interface BackendSettings {
  local_folder_path: string;
  token_budget_per_request: number;
  llm_provider: string;
  embedding_provider: string;
  mock_mode: boolean;
}

export type BackendSettingsUpdate = Partial<BackendSettings>;

export async function getSettings(): Promise<BackendSettings> {
  return apiGet<BackendSettings>("/settings");
}

export async function updateSettings(data: BackendSettingsUpdate): Promise<BackendSettings> {
  return apiPut<BackendSettings>("/settings", data);
}
