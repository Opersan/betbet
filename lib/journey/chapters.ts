import type { SceneType } from "@/lib/journey/types";

export type ChapterNumberScene = {
  id: string;
  type: SceneType;
  sortOrder: number;
  isActive: boolean;
};

export function getChapterNumber(
  scenes: readonly ChapterNumberScene[],
  currentChapterId: string,
): number {
  const chapterIndex = scenes
    .filter((scene) => scene.type === "chapter" && scene.isActive)
    .toSorted((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    .findIndex((scene) => scene.id === currentChapterId);

  return chapterIndex >= 0 ? chapterIndex + 1 : 1;
}

export function getChapterLabel(number: number): string {
  const normalizedNumber = Number.isFinite(number) && number > 0 ? Math.floor(number) : 1;
  return `${normalizedNumber}. BÖLÜM`;
}

export function getNextSceneAfter<T extends { id: string }>(
  scenes: readonly T[],
  currentSceneId: string,
): T | null {
  const currentIndex = scenes.findIndex((scene) => scene.id === currentSceneId);
  return currentIndex >= 0 ? scenes[currentIndex + 1] ?? null : null;
}

export function getProgressScenes<T extends { type: SceneType }>(scenes: readonly T[]): T[] {
  return scenes.filter((scene) => scene.type !== "chapter");
}
