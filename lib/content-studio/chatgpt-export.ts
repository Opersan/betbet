import type { ContentStudioData, StudioScene } from "./types";

const exportTables = [
  "journey_scenes",
  "journey_scene_content_blocks",
  "journey_scene_unlock_rules",
  "journey_scene_unlock_schedule",
  "journey_scene_dependencies",
  "journey_media_requirements",
  "journey_mini_games",
  "journey_rewards",
] as const;

export type ExportScope =
  | "selected_scene"
  | "selected_scene_full"
  | "all_journey"
  | "scene_texts"
  | "locks_only"
  | "content_blocks_only";

export function buildChatGptPrompt(data: ContentStudioData, selectedScene: StudioScene | null, scope: ExportScope) {
  const currentData = selectExportData(data, selectedScene, scope);

  return [
    "Aşağıdaki doğum günü journey içeriklerini düzenle.",
    "",
    "Kurallar:",
    "- JSON dışında açıklama yazma.",
    "- Mevcut id alanlarını değiştirme.",
    "- scene_id ilişkilerini değiştirme.",
    "- access_code_id içeren veri üretme.",
    "- Olmayan tablo veya kolon ekleme.",
    "- Tarihleri ISO-8601 formatında koru.",
    "- Sadece içerik, tarih, sıra, kilit ve belirtilen config alanlarını düzenle.",
    "- JSON sonucunun parse edilebilir olmasını sağla.",
    "",
    "DATABASE_TABLES:",
    JSON.stringify(exportTables, null, 2),
    "",
    "CURRENT_DATA:",
    JSON.stringify(currentData, null, 2),
  ].join("\n");
}

export function selectExportData(data: ContentStudioData, selectedScene: StudioScene | null, scope: ExportScope) {
  const sceneSlug = selectedScene?.slug;

  if (scope === "all_journey") {
    return buildExportObject(data);
  }

  if (scope === "scene_texts") {
    return {
      journey_scenes: data.scenes.map(({ id, slug, title, subtitle, content, date_label, sort_order }) => ({
        id,
        slug,
        title,
        subtitle,
        content,
        date_label,
        sort_order,
      })),
    };
  }

  if (scope === "locks_only") {
    return {
      journey_scene_unlock_rules: data.unlockRules,
      journey_scene_unlock_schedule: data.unlockSchedule,
      journey_scene_dependencies: data.dependencies,
    };
  }

  if (scope === "content_blocks_only") {
    return { journey_scene_content_blocks: data.contentBlocks };
  }

  if (!sceneSlug) {
    return buildExportObject(data);
  }

  if (scope === "selected_scene") {
    return { journey_scenes: data.scenes.filter((scene) => scene.slug === sceneSlug) };
  }

  return buildExportObject(data, sceneSlug);
}

function buildExportObject(data: ContentStudioData, sceneSlug?: string) {
  const filterBySlug = <T extends { scene_slug?: string; target_scene_slug?: string }>(items: T[]) =>
    sceneSlug ? items.filter((item) => item.scene_slug === sceneSlug || item.target_scene_slug === sceneSlug) : items;

  return {
    journey_scenes: sceneSlug ? data.scenes.filter((scene) => scene.slug === sceneSlug) : data.scenes,
    journey_scene_content_blocks: filterBySlug(data.contentBlocks),
    journey_scene_unlock_rules: filterBySlug(data.unlockRules),
    journey_scene_unlock_schedule: filterBySlug(data.unlockSchedule),
    journey_scene_dependencies: sceneSlug
      ? data.dependencies.filter((item) => item.target_scene_slug === sceneSlug || item.trigger_scene_slug === sceneSlug)
      : data.dependencies,
    journey_media_requirements: filterBySlug(data.mediaRequirements),
    journey_mini_games: filterBySlug(data.miniGames),
    journey_rewards: filterBySlug(data.rewards),
  };
}
