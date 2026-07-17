export type SceneRevealStage =
  | "progress"
  | "title"
  | "subtitle"
  | "content"
  | "media"
  | "action"
  | "navigation";

export type SceneRevealTiming = {
  delay: number;
  duration: number;
  y: number;
};

export const SCENE_MEDIA_MAX_WAIT_MS = 1500;
export const SCENE_NAVIGATION_GUARD_MS = 320;
export const SCENE_PAGE_TRANSITION_DURATION_SECONDS = 0.56;
export const SCENE_REDUCED_MOTION_DURATION_SECONDS = 0.14;

export const READING_TYPEWRITER_TIMING = {
  startDelay: 1.02,
  minDuration: 2.4,
  maxDuration: 7.2,
  wordsPerSecond: 4.2,
  minCharacterDelay: 0.024,
  maxCharacterDelay: 0.055,
  punctuationPause: 0.11,
  characterDuration: 0.16,
} as const;

export const SCENE_REVEAL_TIMING = {
  progress: { delay: 0.05, duration: 0.48, y: 4 },
  title: { delay: 0.28, duration: 0.58, y: -8 },
  subtitle: { delay: 0.58, duration: 0.56, y: -4 },
  content: { delay: 0.82, duration: 0.62, y: 0 },
  media: { delay: 1.15, duration: 0.6, y: 0 },
  action: { delay: 1.55, duration: 0.5, y: 0 },
  navigation: { delay: 1.82, duration: 0.45, y: 0 },
} satisfies Record<SceneRevealStage, SceneRevealTiming>;

export const SCENE_REDUCED_MOTION_DELAY = {
  progress: 0,
  title: 0,
  subtitle: 0.01,
  content: 0.02,
  media: 0.02,
  action: 0.03,
  navigation: 0.04,
} satisfies Record<SceneRevealStage, number>;
