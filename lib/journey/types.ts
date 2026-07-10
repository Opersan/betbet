export type SceneType = "welcome" | "story" | "task" | "memory" | "locked" | "final";

export type BackgroundVariant = "night" | "rose" | "champagne" | "deep";

export type JourneyContentBlock = {
  id: string;
  type: "text" | "quote" | "image" | "video" | "audio" | "divider" | "prompt" | "reward" | "game" | "photo_task";
  title?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  mediaPath?: string | null;
  altText?: string | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
};

export type JourneyTaskResponse = {
  id: string;
  responseKey: string;
  type: "photo" | "mini_game" | "text" | "reward" | "generic";
  status: "draft" | "submitted" | "completed";
  storageBucket?: string | null;
  storagePath?: string | null;
  mediaUrl?: string | null;
  score?: number | null;
  rewardKey?: string | null;
  payload: Record<string, unknown>;
  completedAt?: string | null;
  updatedAt?: string | null;
};

export type JourneyReward = {
  id: string;
  rewardKey: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
  isUnlocked: boolean;
  unlockedAt?: string | null;
};

export type JourneyMiniGame = {
  id: string;
  gameKey: string;
  type: "memory_match" | "tap_sequence" | "scratch_reveal" | "choice" | "reaction_duel" | "couple_quiz" | "penalty_picker";
  title: string;
  instructions?: string | null;
  config: Record<string, unknown>;
  rewardKey?: string | null;
  sortOrder: number;
};

export type JourneyScene = {
  id: string;
  slug: string;
  type: SceneType;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  dateLabel?: string | null;
  sortOrder: number;
  backgroundVariant?: BackgroundVariant | null;
  isLocked: boolean;
  unlockCondition?: string | null;
  primaryActionLabel?: string | null;
  isActive: boolean;
  progressIsCompleted: boolean;
  progressIsUnlocked: boolean;
  completedAt?: string | null;
  contentBlocks: JourneyContentBlock[];
  taskResponse?: JourneyTaskResponse | null;
  rewards: JourneyReward[];
  miniGame?: JourneyMiniGame | null;
};

export type JourneyAccessCode = {
  id: string;
  code?: string;
  label?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
};

export type JourneyProgress = {
  id: string;
  accessCodeId: string;
  sceneId: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  completedAt?: string | null;
};

export type JourneySceneRow = {
  id: string;
  slug: string;
  scene_type?: SceneType;
  type?: SceneType;
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
  progress_is_completed: boolean;
  progress_is_unlocked: boolean;
  completed_at: string | null;
  content_blocks?: unknown;
  task_response?: unknown;
  rewards?: unknown;
  mini_game?: unknown;
};

export type JourneyProgressRow = {
  id: string;
  access_code_id: string;
  scene_id: string;
  is_completed: boolean;
  is_unlocked: boolean;
  completed_at: string | null;
};
