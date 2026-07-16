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

export async function removeTaskUploadFiles(files: Array<{ bucket: string; path: string }>) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase istemcisi hazır değil.");

  const filesByBucket = new Map<string, string[]>();
  files.forEach(({ bucket, path }) => {
    const paths = filesByBucket.get(bucket) ?? [];
    paths.push(path);
    filesByBucket.set(bucket, paths);
  });

  for (const [bucket, paths] of filesByBucket) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw new Error(error.message);
  }
}

function normalizeStudioData(value: unknown): ContentStudioData {
  const data = isRecord(value) ? value : {};
  const scenes = arrayValue(data.scenes, "scenes");
  const contentBlocks = arrayValue(data.contentBlocks, "contentBlocks");
  const miniGames = arrayValue(data.miniGames, "miniGames");

  assertSupportedRecordValues(scenes, "type", ["welcome", "story", "task", "memory", "locked", "final", "chapter"], "sahne tipi");
  assertSupportedRecordValues(contentBlocks, "block_type", ["text", "quote", "image", "video", "audio", "divider", "prompt", "reward", "game", "photo_task"], "içerik blok tipi");
  assertSupportedRecordValues(miniGames, "game_type", ["memory_match", "tap_sequence", "scratch_reveal", "choice", "reaction_duel", "couple_quiz", "penalty_picker", "progressive_penalty"], "mini oyun tipi");

  return {
    scenes,
    accessCodes: arrayValue(data.accessCodes, "accessCodes"),
    progress: arrayValue(data.progress, "progress"),
    unlockRules: arrayValue(data.unlockRules, "unlockRules"),
    unlockSchedule: arrayValue(data.unlockSchedule, "unlockSchedule"),
    dependencies: arrayValue(data.dependencies, "dependencies"),
    mediaRequirements: arrayValue(data.mediaRequirements, "mediaRequirements"),
    contentBlocks,
    taskResponses: arrayValue(data.taskResponses, "taskResponses"),
    miniGames,
    rewards: arrayValue(data.rewards, "rewards"),
    rewardClaims: arrayValue(data.rewardClaims, "rewardClaims"),
  } as ContentStudioData;
}

function arrayValue(value: unknown, key: string) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  throw new Error(`Content Studio ${key} alanı liste biçiminde değil.`);
}

function assertSupportedRecordValues(
  rows: unknown[],
  key: string,
  allowed: readonly string[],
  label: string,
) {
  rows.forEach((row, index) => {
    const record = isRecord(row) ? row : null;
    const fieldValue = record?.[key];
    if (!record || typeof fieldValue !== "string" || !allowed.includes(fieldValue)) {
      throw new Error(`Content Studio ${index + 1}. satırında desteklenmeyen ${label}: ${String(fieldValue ?? "eksik")}`);
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
