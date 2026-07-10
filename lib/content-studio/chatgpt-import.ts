import type { ContentStudioData, StudioTable } from "./types";

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

function getRowLabel(table: string, row: Record<string, unknown>) {
  return String(row.title ?? row.slug ?? row.scene_slug ?? row.target_scene_slug ?? row.reward_key ?? row.id ?? table);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
