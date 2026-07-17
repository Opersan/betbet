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
export const SCENE_PAGE_TRANSITION_DURATION_SECONDS = 0.42;
export const SCENE_REDUCED_MOTION_DURATION_SECONDS = 0.14;

export const SCENE_REVEAL_TIMING = {
  progress: { delay: 0, duration: 0.34, y: 4 },
  title: { delay: 0.12, duration: 0.4, y: -8 },
  subtitle: { delay: 0.24, duration: 0.4, y: -4 },
  content: { delay: 0.4, duration: 0.44, y: 0 },
  media: { delay: 0.64, duration: 0.42, y: 0 },
  action: { delay: 0.82, duration: 0.38, y: 0 },
  navigation: { delay: 1, duration: 0.34, y: 0 },
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
