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

  const firstOpenIncompleteTaskIndex = scenes.findIndex(
    (scene) => isSceneOpen(scene) && scene.type === "task" && !scene.progressIsCompleted,
  );
  if (firstOpenIncompleteTaskIndex >= 0) {
    return firstOpenIncompleteTaskIndex;
  }

  const lastOpenIndex = findLastIndex(scenes, isSceneOpen);
  if (lastOpenIndex >= 0) {
    return lastOpenIndex;
  }

  const firstOpenIndex = scenes.findIndex(isSceneOpen);
  return firstOpenIndex >= 0 ? firstOpenIndex : 0;
}

export function isSceneOpen(scene: JourneyScene) {
  return !scene.isLocked;
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) {
      return index;
    }
  }

  return -1;
}
