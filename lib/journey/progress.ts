import type { JourneyScene } from "./types";

export function resolveInitialSceneIndex(scenes: JourneyScene[], lastSceneSlug?: string | null) {
  if (scenes.length === 0) {
    return 0;
  }

  if (lastSceneSlug) {
    const storedIndex = scenes.findIndex((scene) => scene.slug === lastSceneSlug && isSceneOpen(scene));
    if (storedIndex >= 0) {
      return storedIndex;
    }
  }

  const firstOpenIndex = scenes.findIndex(isSceneOpen);
  return firstOpenIndex >= 0 ? firstOpenIndex : 0;
}

export function isSceneOpen(scene: JourneyScene) {
  return !scene.isLocked;
}

export function canNavigateForward(scene: JourneyScene) {
  if (scene.isLocked) {
    return false;
  }

  return scene.type !== "task" || scene.progressIsCompleted;
}
