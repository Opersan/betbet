import type { JourneyProgress, JourneyScene } from "./types";

export function canAccessScene({
  scene,
  progress,
  previousScenes,
}: {
  scene: JourneyScene;
  progress: JourneyProgress[];
  previousScenes: JourneyScene[];
}) {
  if (previousScenes.length === 0) {
    return true;
  }

  if (!scene.isLocked) {
    return true;
  }

  const sceneProgress = progress.find((item) => item.sceneId === scene.id);
  if (sceneProgress?.isUnlocked || sceneProgress?.isCompleted) {
    return true;
  }

  if (!scene.unlockCondition) {
    return false;
  }

  const requiredScene = previousScenes.find((item) => item.slug === scene.unlockCondition);
  if (!requiredScene) {
    return false;
  }

  return progress.some((item) => item.sceneId === requiredScene.id && item.isCompleted);
}

export function getInitialSceneIndex({
  scenes,
  progress,
}: {
  scenes: JourneyScene[];
  progress: JourneyProgress[];
}) {
  const firstIncompleteIndex = scenes.findIndex((scene, index) => {
    const previousScenes = scenes.slice(0, index);
    return canAccessScene({ scene, progress, previousScenes }) && !isSceneCompleted({ sceneId: scene.id, progress });
  });

  return firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
}

export function isSceneCompleted({
  sceneId,
  progress,
}: {
  sceneId: string;
  progress: JourneyProgress[];
}) {
  return progress.some((item) => item.sceneId === sceneId && item.isCompleted);
}
