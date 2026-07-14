export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export type SceneType = "welcome" | "story" | "task" | "memory" | "locked" | "final" | "chapter";
export type BackgroundVariant = "night" | "rose" | "champagne" | "deep";
export type UnlockMode = "time" | "all_completed" | "time_and_all_completed" | "manual";

export type StudioScene = {
  id: string;
  slug: string;
  type: SceneType;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  date_label: string | null;
  sort_order: number;
  background_variant: BackgroundVariant | null;
  is_locked: boolean;
  unlock_condition: string | null;
  primary_action_label: string | null;
  is_active: boolean;
  created_at: string;
};

export type StudioAccessCode = {
  id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type StudioProgress = {
  id: string;
  access_code_id: string;
  scene_id: string;
  is_completed: boolean;
  is_unlocked: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudioUnlockRule = {
  target_scene_slug: string;
  unlock_mode: UnlockMode;
  unlock_at: string | null;
  required_scene_slugs: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type StudioUnlockSchedule = {
  scene_slug: string;
  unlock_at: string;
  label: string | null;
  created_at: string;
};

export type StudioDependency = {
  trigger_scene_slug: string;
  target_scene_slug: string;
  created_at: string;
};

export type StudioContentBlock = {
  id: string;
  scene_slug: string;
  block_type: "text" | "quote" | "image" | "video" | "audio" | "divider" | "prompt" | "reward" | "game" | "photo_task";
  title: string | null;
  body: string | null;
  media_url: string | null;
  media_path: string | null;
  alt_text: string | null;
  metadata: JsonRecord;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioMediaRequirement = {
  id: string;
  scene_slug: string;
  media_slot: string;
  media_type: "image" | "video" | "background" | "none";
  storage_path_hint: string | null;
  guidance: string;
  priority: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioTaskResponse = {
  id: string;
  access_code_id: string;
  scene_id: string;
  response_key: string;
  response_type: "photo" | "mini_game" | "text" | "reward" | "generic";
  status: "draft" | "submitted" | "completed";
  storage_bucket: string | null;
  storage_path: string | null;
  media_url: string | null;
  score: number | null;
  reward_key: string | null;
  payload: JsonRecord;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudioMiniGame = {
  id: string;
  scene_slug: string;
  game_key: string;
  game_type: "memory_match" | "tap_sequence" | "scratch_reveal" | "choice" | "reaction_duel" | "couple_quiz" | "penalty_picker";
  title: string;
  instructions: string | null;
  config: JsonRecord;
  reward_key: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioReward = {
  id: string;
  scene_slug: string;
  reward_key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  metadata: JsonRecord;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioRewardClaim = {
  id: string;
  access_code_id: string;
  scene_id: string;
  reward_id: string;
  task_response_id: string | null;
  is_unlocked: boolean;
  unlocked_at: string;
  created_at: string;
};

export type ContentStudioData = {
  scenes: StudioScene[];
  accessCodes: StudioAccessCode[];
  progress: StudioProgress[];
  unlockRules: StudioUnlockRule[];
  unlockSchedule: StudioUnlockSchedule[];
  dependencies: StudioDependency[];
  mediaRequirements: StudioMediaRequirement[];
  contentBlocks: StudioContentBlock[];
  taskResponses: StudioTaskResponse[];
  miniGames: StudioMiniGame[];
  rewards: StudioReward[];
  rewardClaims: StudioRewardClaim[];
};

export type StudioTable =
  | "journey_scenes"
  | "journey_scene_content_blocks"
  | "journey_scene_unlock_rules"
  | "journey_scene_unlock_schedule"
  | "journey_scene_dependencies"
  | "journey_media_requirements"
  | "journey_mini_games"
  | "journey_rewards"
  | "journey_progress"
  | "journey_task_responses"
  | "journey_reward_claims";

export type StudioAction =
  | "insert"
  | "update"
  | "delete"
  | "upsert"
  | "bulk_update"
  | "delete_for_scene"
  | "reset_for_access_code";
