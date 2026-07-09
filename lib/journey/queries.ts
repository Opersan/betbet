import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { JourneyAccessCode, JourneyProgress, JourneyProgressRow, JourneyScene, JourneySceneRow } from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getActiveJourneyScenes(): Promise<JourneyScene[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("journey_scenes")
    .select(
      "id, slug, type, title, subtitle, content, image_url, video_url, date_label, sort_order, background_variant, is_locked, unlock_condition, primary_action_label",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as JourneySceneRow[]).map(mapSceneRow);
}

export async function validateAccessCode(code: string): Promise<JourneyAccessCode | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("validate_journey_access_code", { p_code: code });
  if (error || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0] as { id: string; label: string | null; is_active: boolean; expires_at: string | null };

  return {
    id: row.id,
    label: row.label,
    isActive: row.is_active,
    expiresAt: row.expires_at,
  };
}

export async function getJourneyProgress(accessCodeId: string): Promise<JourneyProgress[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isUuid(accessCodeId)) return [];

  const { data, error } = await supabase.rpc("get_journey_progress", { p_access_code_id: accessCodeId });
  if (error || !data) {
    return [];
  }

  return (data as JourneyProgressRow[]).map(mapProgressRow);
}

export async function markSceneCompleted(params: {
  accessCodeId: string;
  sceneId: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isUuid(params.accessCodeId) || !isUuid(params.sceneId)) return;

  await supabase.rpc("mark_journey_scene_completed", {
    p_access_code_id: params.accessCodeId,
    p_scene_id: params.sceneId,
  });
}

export async function unlockScene(params: {
  accessCodeId: string;
  sceneId: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isUuid(params.accessCodeId) || !isUuid(params.sceneId)) return;

  await supabase.rpc("unlock_journey_scene", {
    p_access_code_id: params.accessCodeId,
    p_scene_id: params.sceneId,
  });
}

function mapSceneRow(row: JourneySceneRow): JourneyScene {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
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
  };
}

function mapProgressRow(row: JourneyProgressRow): JourneyProgress {
  return {
    id: row.id,
    accessCodeId: row.access_code_id,
    sceneId: row.scene_id,
    isCompleted: row.is_completed,
    isUnlocked: row.is_unlocked,
    completedAt: row.completed_at,
  };
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}
