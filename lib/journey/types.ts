export type SceneType = "welcome" | "story" | "task" | "memory" | "locked" | "final";

export type BackgroundVariant = "night" | "rose" | "champagne" | "deep";

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
};

export type JourneyProgressRow = {
  id: string;
  access_code_id: string;
  scene_id: string;
  is_completed: boolean;
  is_unlocked: boolean;
  completed_at: string | null;
};
