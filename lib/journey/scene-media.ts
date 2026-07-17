import type { JourneyScene } from "@/lib/journey/types";
import { readImagePlacement } from "@/lib/media/image-placement";

export type SceneImagePreparationResult = "loaded" | "error" | "skipped";

const imagePreparationCache = new Map<string, Promise<SceneImagePreparationResult>>();

export function prepareSceneImage(url: string | null | undefined): Promise<SceneImagePreparationResult> {
  const normalizedUrl = normalizeImageUrl(url);

  if (!normalizedUrl || typeof window === "undefined") {
    return Promise.resolve("skipped");
  }

  const cachedPreparation = imagePreparationCache.get(normalizedUrl);
  if (cachedPreparation) {
    return cachedPreparation;
  }

  const preparation = new Promise<SceneImagePreparationResult>((resolve) => {
    const image = new window.Image();
    let settled = false;

    const finish = (result: SceneImagePreparationResult) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      resolve(result);
    };

    image.decoding = "async";
    image.onload = () => finish("loaded");
    image.onerror = () => finish("error");
    image.src = normalizedUrl;

    if (image.complete) {
      finish(image.naturalWidth > 0 ? "loaded" : "error");
    }
  });

  imagePreparationCache.set(normalizedUrl, preparation);
  return preparation;
}

export function getSceneCriticalImageUrl(scene: JourneyScene | null | undefined) {
  if (!scene || scene.isLocked) {
    return null;
  }

  const imageBlockUrl = scene.contentBlocks.find((block) => block.type === "image" && block.mediaUrl)?.mediaUrl;
  const unlockedRewardUrl = scene.rewards.find((reward) => reward.isUnlocked && reward.imageUrl)?.imageUrl;
  const taskPhotoUrl = scene.taskResponse?.type === "photo" ? scene.taskResponse.mediaUrl : null;

  return normalizeImageUrl(scene.imageUrl ?? taskPhotoUrl ?? imageBlockUrl ?? unlockedRewardUrl);
}

export function getNextSceneImageUrl(scenes: JourneyScene[], currentSceneIndex: number) {
  if (currentSceneIndex < 0 || currentSceneIndex >= scenes.length - 1) {
    return null;
  }

  return getSceneCriticalImageUrl(scenes[currentSceneIndex + 1]);
}

function normalizeImageUrl(value: string | null | undefined) {
  const { src } = readImagePlacement(value);
  const normalized = src.trim();
  return normalized.length > 0 ? normalized : null;
}
