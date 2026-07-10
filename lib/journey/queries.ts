import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  JourneyAccessCode,
  JourneyContentBlock,
  JourneyMiniGame,
  JourneyReward,
  JourneyScene,
  JourneySceneRow,
  JourneyTaskResponse,
  SceneType,
} from "./types";

export const DEFAULT_JOURNEY_ACCESS_CODE = "20TEMMUZ";
export const JOURNEY_TASK_UPLOADS_BUCKET = "journey-task-uploads";

export async function initializeJourneyProgress(code = DEFAULT_JOURNEY_ACCESS_CODE): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { error } = await supabase.rpc("initialize_journey_progress", { p_code: code });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getJourneyScenes(code = DEFAULT_JOURNEY_ACCESS_CODE): Promise<JourneyScene[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { data, error } = await supabase.rpc("get_journey_scenes", { p_code: code });

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return (data as JourneySceneRow[]).map(mapSceneRow).sort((first, second) => first.sortOrder - second.sortOrder);
}

export async function getJourneyPreviewScenes({
  code = DEFAULT_JOURNEY_ACCESS_CODE,
  previewToken,
}: {
  code?: string;
  previewToken: string;
}): Promise<JourneyScene[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { data, error } = await supabase.rpc("get_journey_preview_scenes", {
    p_code: code,
    p_preview_token: previewToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return (data as JourneySceneRow[]).map(mapSceneRow).sort((first, second) => first.sortOrder - second.sortOrder);
}

export async function completeJourneyScene({
  code = DEFAULT_JOURNEY_ACCESS_CODE,
  sceneSlug,
}: {
  code?: string;
  sceneSlug: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { error } = await supabase.rpc("complete_journey_scene", {
    p_code: code,
    p_scene_slug: sceneSlug,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveJourneyTaskResponse({
  code = DEFAULT_JOURNEY_ACCESS_CODE,
  sceneSlug,
  responseType,
  responseKey = "primary",
  storageBucket,
  storagePath,
  mediaUrl,
  score,
  rewardKey,
  payload = {},
  completeScene = true,
}: {
  code?: string;
  sceneSlug: string;
  responseType: JourneyTaskResponse["type"];
  responseKey?: string;
  storageBucket?: string | null;
  storagePath?: string | null;
  mediaUrl?: string | null;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
  completeScene?: boolean;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { data, error } = await supabase.rpc("save_journey_task_response", {
    p_code: code,
    p_scene_slug: sceneSlug,
    p_response_type: responseType,
    p_response_key: responseKey,
    p_storage_bucket: storageBucket ?? null,
    p_storage_path: storagePath ?? null,
    p_media_url: mediaUrl ?? null,
    p_score: score ?? null,
    p_reward_key: rewardKey ?? null,
    p_payload: payload,
    p_complete_scene: completeScene,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadJourneyTaskPhoto({
  code = DEFAULT_JOURNEY_ACCESS_CODE,
  sceneSlug,
  file,
  responseKey = "primary",
  rewardKey,
}: {
  code?: string;
  sceneSlug: string;
  file: File;
  responseKey?: string;
  rewardKey?: string | null;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const extension = getFileExtension(file);
  const path = `${sanitizePathSegment(code)}/${sanitizePathSegment(sceneSlug)}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(JOURNEY_TASK_UPLOADS_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  await saveJourneyTaskResponse({
    code,
    sceneSlug,
    responseType: "photo",
    responseKey,
    storageBucket: JOURNEY_TASK_UPLOADS_BUCKET,
    storagePath: path,
    rewardKey,
    payload: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
    completeScene: true,
  });

  return { bucket: JOURNEY_TASK_UPLOADS_BUCKET, path };
}

export async function getJourneyTaskUploadSignedUrl(bucket: string, path: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function claimJourneyReward({
  code = DEFAULT_JOURNEY_ACCESS_CODE,
  sceneSlug,
  rewardKey,
}: {
  code?: string;
  sceneSlug: string;
  rewardKey: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase istemcisi hazir degil.");
  }

  const { data, error } = await supabase.rpc("claim_journey_reward", {
    p_code: code,
    p_scene_slug: sceneSlug,
    p_reward_key: rewardKey,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function validateAccessCode(code: string): Promise<JourneyAccessCode | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("validate_journey_access_code", { p_code: code });
  if (error || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0] as { id?: string; label: string | null; is_active: boolean; expires_at: string | null };

  return {
    id: row.id ?? code,
    code,
    label: row.label,
    isActive: row.is_active,
    expiresAt: row.expires_at,
  };
}

function mapSceneRow(row: JourneySceneRow): JourneyScene {
  return {
    id: row.id,
    slug: row.slug,
    type: normalizeSceneType(row.scene_type ?? row.type),
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    dateLabel: row.date_label,
    sortOrder: row.sort_order,
    backgroundVariant: row.background_variant,
    isLocked: row.is_locked,
    unlockCondition: row.unlock_condition,
    primaryActionLabel: row.primary_action_label,
    isActive: row.is_active,
    progressIsCompleted: row.progress_is_completed,
    progressIsUnlocked: row.progress_is_unlocked,
    completedAt: row.completed_at,
    contentBlocks: mapContentBlocks(row.content_blocks),
    taskResponse: mapTaskResponse(row.task_response),
    rewards: mapRewards(row.rewards),
    miniGame: mapMiniGame(row.mini_game),
  };
}

function normalizeSceneType(type: SceneType | undefined): SceneType {
  return type ?? "story";
}

function mapContentBlocks(value: unknown): JourneyContentBlock[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const record = toRecord(item);
    return {
      id: String(record.id ?? crypto.randomUUID()),
      type: normalizeContentBlockType(record.type),
      title: toNullableString(record.title),
      body: toNullableString(record.body),
      mediaUrl: toNullableString(record.mediaUrl),
      mediaPath: toNullableString(record.mediaPath),
      altText: toNullableString(record.altText),
      metadata: toRecord(record.metadata),
      sortOrder: toNumber(record.sortOrder, 100),
    };
  });
}

function mapTaskResponse(value: unknown): JourneyTaskResponse | null {
  if (!value) return null;

  const record = toRecord(value);
  return {
    id: String(record.id ?? ""),
    responseKey: String(record.responseKey ?? "primary"),
    type: normalizeTaskResponseType(record.type),
    status: normalizeTaskStatus(record.status),
    storageBucket: toNullableString(record.storageBucket),
    storagePath: toNullableString(record.storagePath),
    mediaUrl: toNullableString(record.mediaUrl),
    score: record.score === null || record.score === undefined ? null : toNumber(record.score, 0),
    rewardKey: toNullableString(record.rewardKey),
    payload: toRecord(record.payload),
    completedAt: toNullableString(record.completedAt),
    updatedAt: toNullableString(record.updatedAt),
  };
}

function mapRewards(value: unknown): JourneyReward[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const record = toRecord(item);
    return {
      id: String(record.id ?? ""),
      rewardKey: String(record.rewardKey ?? "primary"),
      title: String(record.title ?? "Ödül"),
      subtitle: toNullableString(record.subtitle),
      body: toNullableString(record.body),
      imageUrl: toNullableString(record.imageUrl),
      videoUrl: toNullableString(record.videoUrl),
      metadata: toRecord(record.metadata),
      sortOrder: toNumber(record.sortOrder, 100),
      isUnlocked: Boolean(record.isUnlocked),
      unlockedAt: toNullableString(record.unlockedAt),
    };
  });
}

function mapMiniGame(value: unknown): JourneyMiniGame | null {
  if (!value) return null;

  const record = toRecord(value);
  return {
    id: String(record.id ?? ""),
    gameKey: String(record.gameKey ?? "primary"),
    type: normalizeMiniGameType(record.type),
    title: String(record.title ?? "Küçük Oyun"),
    instructions: toNullableString(record.instructions),
    config: toRecord(record.config),
    rewardKey: toNullableString(record.rewardKey),
    sortOrder: toNumber(record.sortOrder, 100),
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeContentBlockType(value: unknown): JourneyContentBlock["type"] {
  const allowed: JourneyContentBlock["type"][] = ["text", "quote", "image", "video", "audio", "divider", "prompt", "reward", "game", "photo_task"];
  return allowed.includes(value as JourneyContentBlock["type"]) ? (value as JourneyContentBlock["type"]) : "text";
}

function normalizeTaskResponseType(value: unknown): JourneyTaskResponse["type"] {
  const allowed: JourneyTaskResponse["type"][] = ["photo", "mini_game", "text", "reward", "generic"];
  return allowed.includes(value as JourneyTaskResponse["type"]) ? (value as JourneyTaskResponse["type"]) : "generic";
}

function normalizeTaskStatus(value: unknown): JourneyTaskResponse["status"] {
  const allowed: JourneyTaskResponse["status"][] = ["draft", "submitted", "completed"];
  return allowed.includes(value as JourneyTaskResponse["status"]) ? (value as JourneyTaskResponse["status"]) : "submitted";
}

function normalizeMiniGameType(value: unknown): JourneyMiniGame["type"] {
  const allowed: JourneyMiniGame["type"][] = ["memory_match", "tap_sequence", "scratch_reveal", "choice", "reaction_duel", "couple_quiz", "penalty_picker"];
  return allowed.includes(value as JourneyMiniGame["type"]) ? (value as JourneyMiniGame["type"]) : "tap_sequence";
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function sanitizePathSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "journey";
}
