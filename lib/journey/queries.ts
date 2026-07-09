import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { JourneyAccessCode, JourneyScene, JourneySceneRow, SceneType } from "./types";

export const DEFAULT_JOURNEY_ACCESS_CODE = "20TEMMUZ";

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
  };
}

function normalizeSceneType(type: SceneType | undefined): SceneType {
  return type ?? "story";
}
