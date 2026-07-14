"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  claimJourneyReward,
  completeJourneyScene,
  DEFAULT_JOURNEY_ACCESS_CODE,
  getJourneyScenes,
  initializeJourneyProgress,
  saveJourneyTaskResponse,
  uploadJourneyTaskPhoto,
} from "@/lib/journey/queries";
import { canNavigateForward, resolveInitialSceneIndex } from "@/lib/journey/progress";
import type { JourneyScene } from "@/lib/journey/types";

export const JOURNEY_ACCESS_CODE_KEY = "romanticJourney.accessCode";
export const JOURNEY_LAST_SCENE_KEY = "romanticJourney.lastSceneSlug";
export const JOURNEY_LAST_LOADED_AT_KEY = "romanticJourney.lastLoadedAt";

type RefreshOptions = {
  nextSceneSlug?: string;
  preserveCurrentScene?: boolean;
};

export function useJourneyScenes() {
  const [accessCode, setAccessCode] = useState(() => readStorage(JOURNEY_ACCESS_CODE_KEY) || DEFAULT_JOURNEY_ACCESS_CODE);
  const [scenes, setScenes] = useState<JourneyScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompletedSlug, setLastCompletedSlug] = useState<string | null>(null);
  const completionMutationKeysRef = useRef(new Set<string>());
  const photoMutationKeysRef = useRef(new Set<string>());

  const currentScene = scenes[currentSceneIndex] ?? null;

  const refreshScenes = useCallback(
    async ({ nextSceneSlug, preserveCurrentScene = true }: RefreshOptions = {}) => {
      setIsRefreshing(true);
      setError(null);

      try {
        const nextScenes = await getJourneyScenes(accessCode);
        setScenes(nextScenes);

        const storedSlug = readStorage(JOURNEY_LAST_SCENE_KEY);
        const currentSlug = preserveCurrentScene ? currentScene?.slug : null;
        const preferredSlug = nextSceneSlug ?? currentSlug ?? storedSlug;
        const nextIndex = resolveInitialSceneIndex(nextScenes, preferredSlug);
        setCurrentSceneIndex(nextIndex);
        writeStorage(JOURNEY_LAST_LOADED_AT_KEY, new Date().toISOString());

        return nextScenes;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
        return [];
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [accessCode, currentScene],
  );

  useEffect(() => {
    writeStorage(JOURNEY_ACCESS_CODE_KEY, accessCode);
  }, [accessCode]);

  useEffect(() => {
    let isMounted = true;

    async function loadJourney() {
      setIsLoading(true);
      setError(null);

      try {
        await initializeJourneyProgress(accessCode);
        const nextScenes = await getJourneyScenes(accessCode);

        if (!isMounted) return;

        setScenes(nextScenes);
        setCurrentSceneIndex(resolveInitialSceneIndex(nextScenes, readStorage(JOURNEY_LAST_SCENE_KEY)));
        writeStorage(JOURNEY_LAST_LOADED_AT_KEY, new Date().toISOString());
      } catch (caughtError) {
        if (isMounted) {
          setError(getErrorMessage(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadJourney();

    return () => {
      isMounted = false;
    };
  }, [accessCode]);

  useEffect(() => {
    if (currentScene) {
      writeStorage(JOURNEY_LAST_SCENE_KEY, currentScene.slug);
    }
  }, [currentScene]);

  const goNext = useCallback(() => {
    if (!currentScene || !canNavigateForward(currentScene)) {
      return;
    }

    setDirection("forward");
    setCurrentSceneIndex((index) => Math.min(index + 1, Math.max(scenes.length - 1, 0)));
  }, [currentScene, scenes.length]);

  const goPrevious = useCallback(() => {
    setDirection("backward");
    setCurrentSceneIndex((index) => Math.max(index - 1, 0));
  }, []);

  const goToScene = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(nextIndex, Math.max(scenes.length - 1, 0)));
      if (
        boundedIndex > currentSceneIndex &&
        scenes.slice(currentSceneIndex, boundedIndex).some((scene) => !canNavigateForward(scene))
      ) {
        return;
      }

      setDirection(nextIndex >= currentSceneIndex ? "forward" : "backward");
      setCurrentSceneIndex(boundedIndex);
    },
    [currentSceneIndex, scenes],
  );

  const completeScene = useCallback(
    async (sceneSlug: string) => {
      const mutationKey = `${accessCode}:complete:${sceneSlug}`;
      if (!beginMutation(completionMutationKeysRef, mutationKey, setIsCompleting)) {
        return;
      }

      setError(null);

      try {
        await completeJourneyScene({ code: accessCode, sceneSlug });
        const nextScenes = await getJourneyScenes(accessCode);
        const completedIndex = nextScenes.findIndex((scene) => scene.slug === sceneSlug);
        const nextIndex = completedIndex >= 0 && completedIndex < nextScenes.length - 1 ? completedIndex + 1 : -1;
        const nextSceneSlug = nextIndex >= 0 ? nextScenes[nextIndex]?.slug : sceneSlug;

        setScenes(nextScenes);
        setLastCompletedSlug(sceneSlug);

        if (nextIndex >= 0) {
          setDirection("forward");
          setCurrentSceneIndex(nextIndex);
        } else {
          setCurrentSceneIndex(resolveInitialSceneIndex(nextScenes, sceneSlug));
        }

        writeStorage(JOURNEY_LAST_LOADED_AT_KEY, new Date().toISOString());
        if (nextSceneSlug) {
          writeStorage(JOURNEY_LAST_SCENE_KEY, nextSceneSlug);
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        endMutation(completionMutationKeysRef, mutationKey, setIsCompleting);
      }
    },
    [accessCode],
  );

  const submitPhotoTask = useCallback(
    async (sceneSlug: string, file: File, rewardKey?: string | null) => {
      const mutationKey = `${accessCode}:photo:${sceneSlug}`;
      if (!beginMutation(photoMutationKeysRef, mutationKey, setIsUploading)) {
        return;
      }

      setError(null);

      try {
        await uploadJourneyTaskPhoto({ code: accessCode, sceneSlug, file, rewardKey });
        const nextScenes = await refreshScenes({ nextSceneSlug: sceneSlug, preserveCurrentScene: false });
        setScenes(nextScenes);
        setLastCompletedSlug(sceneSlug);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        endMutation(photoMutationKeysRef, mutationKey, setIsUploading);
      }
    },
    [accessCode, refreshScenes],
  );

  const completeMiniGame = useCallback(
    async ({
      sceneSlug,
      gameKey = "primary",
      score,
      rewardKey,
      payload = {},
    }: {
      sceneSlug: string;
      gameKey?: string;
      score?: number | null;
      rewardKey?: string | null;
      payload?: Record<string, unknown>;
    }) => {
      const mutationKey = `${accessCode}:mini-game:${sceneSlug}:${gameKey}`;
      if (!beginMutation(completionMutationKeysRef, mutationKey, setIsCompleting)) {
        return;
      }

      setError(null);

      try {
        await saveJourneyTaskResponse({
          code: accessCode,
          sceneSlug,
          responseType: "mini_game",
          responseKey: gameKey,
          score,
          rewardKey,
          payload,
          completeScene: true,
        });
        await refreshScenes({ nextSceneSlug: sceneSlug, preserveCurrentScene: false });
        setLastCompletedSlug(sceneSlug);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        endMutation(completionMutationKeysRef, mutationKey, setIsCompleting);
      }
    },
    [accessCode, refreshScenes],
  );

  const unlockReward = useCallback(
    async (sceneSlug: string, rewardKey: string) => {
      const mutationKey = `${accessCode}:reward:${sceneSlug}:${rewardKey}`;
      if (!beginMutation(completionMutationKeysRef, mutationKey, setIsCompleting)) {
        return;
      }

      setError(null);

      try {
        await claimJourneyReward({ code: accessCode, sceneSlug, rewardKey });
        await refreshScenes({ nextSceneSlug: sceneSlug, preserveCurrentScene: false });
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        endMutation(completionMutationKeysRef, mutationKey, setIsCompleting);
      }
    },
    [accessCode, refreshScenes],
  );

  const value = useMemo(
    () => ({
      accessCode,
      scenes,
      currentScene,
      currentSceneIndex,
      direction,
      isLoading,
      isRefreshing,
      isCompleting,
      isUploading,
      error,
      lastCompletedSlug,
      refreshScenes,
      completeScene,
      submitPhotoTask,
      completeMiniGame,
      unlockReward,
      goNext,
      goPrevious,
      goToScene,
      setAccessCode,
    }),
    [
      accessCode,
      scenes,
      currentScene,
      currentSceneIndex,
      direction,
      isLoading,
      isRefreshing,
      isCompleting,
      isUploading,
      error,
      lastCompletedSlug,
      refreshScenes,
      completeScene,
      submitPhotoTask,
      completeMiniGame,
      unlockReward,
      goNext,
      goPrevious,
      goToScene,
    ],
  );

  return value;
}

function beginMutation(
  ref: { current: Set<string> },
  key: string,
  setBusy: (busy: boolean) => void,
) {
  if (ref.current.has(key)) {
    return false;
  }

  ref.current.add(key);
  setBusy(true);
  return true;
}

function endMutation(
  ref: { current: Set<string> },
  key: string,
  setBusy: (busy: boolean) => void,
) {
  ref.current.delete(key);
  setBusy(ref.current.size > 0);
}

function readStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Yolculuk su an acilamadi. Birazdan yeniden deneyelim.";
}
