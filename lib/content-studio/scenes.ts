import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ContentStudioData, StudioAction, StudioTable } from "./types";

export const CONTENT_STUDIO_ACCESS_CODE = "20TEMMUZ";
export const CONTENT_STUDIO_TIMEZONE = "Europe/Istanbul";
export const JOURNEY_CONTENT_BUCKET = "journey-content";
export const JOURNEY_TASK_UPLOADS_BUCKET = "journey-task-uploads";

export async function loadContentStudioData(code = CONTENT_STUDIO_ACCESS_CODE): Promise<ContentStudioData> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase istemcisi hazır değil.");

  const { data, error } = await supabase.rpc("get_content_studio_data", { p_code: code });
  if (error) throw new Error(error.message);

  return normalizeStudioData(data);
}

export async function mutateContentStudio(
  table: StudioTable,
  action: StudioAction,
  payload: Record<string, unknown>,
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase istemcisi hazır değil.");

  const { data, error } = await supabase.rpc("content_studio_mutation", {
    p_table: table,
    p_action: action,
    p_payload: payload,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function uploadJourneyContentFile(sceneSlug: string, file: File) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase istemcisi hazır değil.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `scenes/${sceneSlug}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(JOURNEY_CONTENT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(JOURNEY_CONTENT_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function getTaskUploadSignedUrl(bucket: string, path: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase istemcisi hazır değil.");

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);

  return data.signedUrl;
}

function normalizeStudioData(value: unknown): ContentStudioData {
  const data = isRecord(value) ? value : {};

  return {
    scenes: arrayValue(data.scenes),
    accessCodes: arrayValue(data.accessCodes),
    progress: arrayValue(data.progress),
    unlockRules: arrayValue(data.unlockRules),
    unlockSchedule: arrayValue(data.unlockSchedule),
    dependencies: arrayValue(data.dependencies),
    mediaRequirements: arrayValue(data.mediaRequirements),
    contentBlocks: arrayValue(data.contentBlocks),
    taskResponses: arrayValue(data.taskResponses),
    miniGames: arrayValue(data.miniGames),
    rewards: arrayValue(data.rewards),
    rewardClaims: arrayValue(data.rewardClaims),
  } as ContentStudioData;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
