import type { ContentStudioData, StudioTable } from "./types";
import { validateProgressivePenaltyConfig } from "@/lib/journey/progressive-penalty";

export type ImportChange = {
  table: StudioTable;
  action: "insert" | "update" | "delete";
  label: string;
  payload: Record<string, unknown>;
};

const allowedTables: StudioTable[] = [
  "journey_scenes",
  "journey_scene_content_blocks",
  "journey_scene_unlock_rules",
  "journey_scene_unlock_schedule",
  "journey_scene_dependencies",
  "journey_media_requirements",
  "journey_mini_games",
  "journey_rewards",
];

const tableKeys: Record<StudioTable, keyof ContentStudioData | null> = {
  journey_scenes: "scenes",
  journey_scene_content_blocks: "contentBlocks",
  journey_scene_unlock_rules: "unlockRules",
  journey_scene_unlock_schedule: "unlockSchedule",
  journey_scene_dependencies: "dependencies",
  journey_media_requirements: "mediaRequirements",
  journey_mini_games: "miniGames",
  journey_rewards: "rewards",
  journey_progress: null,
  journey_task_responses: null,
  journey_reward_claims: null,
};

export function parseChatGptJson(input: string) {
  const cleaned = input.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export function buildImportChanges(current: ContentStudioData, incoming: Record<string, unknown>) {
  const warnings: string[] = [];
  const changes: ImportChange[] = [];

  for (const [table, value] of Object.entries(incoming)) {
    if (!allowedTables.includes(table as StudioTable)) {
      warnings.push(`${table} desteklenmeyen tablo, atlandı.`);
      continue;
    }

    if (!Array.isArray(value)) {
      warnings.push(`${table} array değil, atlandı.`);
      continue;
    }

    const key = tableKeys[table as StudioTable];
    const existingRows = key ? (current[key] as Array<Record<string, unknown>>) : [];
    const existingIds = new Set(existingRows.map((row) => row.id).filter(Boolean));

    for (const row of value) {
      if (!isRecord(row)) {
        warnings.push(`${table} içinde object olmayan satır atlandı.`);
        continue;
      }

      const id = typeof row.id === "string" ? row.id : null;
      const action = id && existingIds.has(id) ? "update" : "insert";
      const existingRow = id ? existingRows.find((item) => item.id === id) : undefined;
      const validationError = getRowValidationError(table as StudioTable, { ...existingRow, ...row }, action, current, incoming);
      if (validationError) {
        warnings.push(`${table}: ${validationError} Satır atlandı.`);
        continue;
      }
      if (id && action === "insert") {
        warnings.push(`${table}: Bilinmeyen id ${id}; yeni kayıt olarak uygulanacak.`);
      }

      changes.push({
        table: table as StudioTable,
        action,
        label: getRowLabel(table, row),
        payload: row,
      });
    }
  }

  return { warnings, changes };
}

function getRowValidationError(
  table: StudioTable,
  row: Record<string, unknown>,
  action: "insert" | "update",
  current: ContentStudioData,
  incoming: Record<string, unknown>,
) {
  if (table === "journey_scenes") {
    return validateEnum(row.type ?? row.scene_type, ["welcome", "story", "task", "memory", "locked", "final", "chapter"], "desteklenmeyen sahne tipi", action === "update");
  }
  if (table === "journey_scene_content_blocks") {
    return validateEnum(row.block_type, ["text", "quote", "image", "video", "audio", "divider", "prompt", "reward", "game", "photo_task"], "desteklenmeyen içerik blok tipi", action === "update");
  }
  if (table === "journey_mini_games") {
    const enumError = validateEnum(row.game_type, ["memory_match", "tap_sequence", "scratch_reveal", "choice", "reaction_duel", "couple_quiz", "penalty_picker", "progressive_penalty"], "desteklenmeyen mini oyun tipi", action === "update");
    if (enumError) return enumError;
    if (row.game_type === "progressive_penalty") {
      const validation = validateProgressivePenaltyConfig(row.config);
      if (validation.errors.length > 0) return `progressive_penalty config geçersiz: ${validation.errors.join(" ")}`;
      const scene = current.scenes.find((item) => item.slug === row.scene_slug);
      const incomingScene = Array.isArray(incoming.journey_scenes)
        ? incoming.journey_scenes.find((item) => isRecord(item) && item.slug === row.scene_slug)
        : undefined;
      const sceneType = isRecord(incomingScene) ? incomingScene.type ?? incomingScene.scene_type : scene?.type;
      if (sceneType !== "task") return "progressive_penalty yalnızca var olan veya aynı import içindeki task sahnesine bağlanabilir.";
    }
    return null;
  }
  if (table === "journey_scene_unlock_rules") {
    return validateEnum(row.unlock_mode, ["manual", "time", "all_completed", "time_and_all_completed"], "desteklenmeyen unlock modu", action === "update");
  }
  if (table === "journey_media_requirements") {
    return validateEnum(row.media_type, ["image", "video", "background", "none"], "desteklenmeyen medya tipi", action === "update");
  }
  if (
    table === "journey_scene_dependencies" &&
    typeof row.trigger_scene_slug === "string" &&
    row.trigger_scene_slug === row.target_scene_slug
  ) {
    return "sahne kendisine dependency olamaz.";
  }
  return null;
}

function validateEnum(value: unknown, allowed: readonly string[], label: string, optional: boolean) {
  if (optional && (value === undefined || value === null)) return null;
  if (typeof value === "string" && allowed.includes(value)) return null;
  return `${label}: ${String(value ?? "eksik")}.`;
}

function getRowLabel(table: string, row: Record<string, unknown>) {
  return String(row.title ?? row.slug ?? row.scene_slug ?? row.target_scene_slug ?? row.reward_key ?? row.id ?? table);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
