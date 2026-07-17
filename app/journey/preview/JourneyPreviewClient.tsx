"use client";

import { Eye, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { ChapterRevealScene } from "@/components/scene/ChapterRevealScene";
import { JourneySceneRenderer, type CompleteMiniGameParams } from "@/components/scene/JourneySceneRenderer";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { startEmotionalSoundtrack } from "@/lib/audio/emotionalSoundtrack";
import { getChapterNumber, getNextSceneAfter, getPreviousContentSceneIndex, getProgressScenes } from "@/lib/journey/chapters";
import { canNavigateForward } from "@/lib/journey/progress";
import { getJourneyPreviewScenes } from "@/lib/journey/queries";
import { findSceneCodeTask } from "@/lib/journey/scene-code-task";
import type { JourneyReward, JourneyScene, JourneyTaskResponse } from "@/lib/journey/types";

export function JourneyPreviewClient({
  code,
  rpcPreviewToken,
}: {
  code: string;
  rpcPreviewToken: string;
}) {
  const reduceMotion = useReducedMotion();
  const [scenes, setScenes] = useState<JourneyScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompletedSlug, setLastCompletedSlug] = useState<string | null>(null);
  const [chapterReplayKey, setChapterReplayKey] = useState(0);
  const [previewRunKey, setPreviewRunKey] = useState(0);
  const previewObjectUrlsRef = useRef<string[]>([]);

  const currentScene = scenes[currentSceneIndex] ?? null;

  const refreshPreview = useCallback(
    async (preferredSlug?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const nextScenes = await getJourneyPreviewScenes({ code, previewToken: rpcPreviewToken });
        const normalizedScenes = nextScenes.map(resetForPreview);
        setScenes(normalizedScenes);
        setPreviewRunKey((key) => key + 1);

        const nextIndex = preferredSlug
          ? Math.max(0, normalizedScenes.findIndex((scene) => scene.slug === preferredSlug))
          : findFirstPlayableIndex(normalizedScenes);
        setCurrentSceneIndex(nextIndex >= 0 ? nextIndex : 0);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        setIsLoading(false);
      }
    },
    [code, rpcPreviewToken],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPreview() {
      try {
        const nextScenes = await getJourneyPreviewScenes({ code, previewToken: rpcPreviewToken });
        if (!isMounted) return;

        const normalizedScenes = nextScenes.map(resetForPreview);
        setScenes(normalizedScenes);
        setCurrentSceneIndex(findFirstPlayableIndex(normalizedScenes));
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

    loadInitialPreview();

    return () => {
      isMounted = false;
    };
  }, [code, rpcPreviewToken]);

  useEffect(() => {
    const previewObjectUrls = previewObjectUrlsRef.current;

    return () => {
      previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const summary = useMemo(() => {
    const gameCount = scenes.filter((scene) => scene.miniGame).length;
    return scenes.length > 0
      ? `${scenes.length} sahne, ${gameCount} mini game - tüm kilitler preview için açık`
      : "Tüm kilitli sahneler preview için hazırlanıyor.";
  }, [scenes]);

  const canNavigateNext = Boolean(
    currentScene && currentSceneIndex < scenes.length - 1 && canNavigateForward(currentScene),
  );
  const previousSceneIndex = getPreviousContentSceneIndex(scenes, currentSceneIndex);
  const canNavigatePrevious = previousSceneIndex >= 0;
  const progressScenes = getProgressScenes(scenes);
  const progressIndex = currentScene
    ? progressScenes.findIndex((scene) => scene.id === currentScene.id)
    : -1;
  const progressStates = progressScenes.map((scene) => (scene.progressIsCompleted ? "completed" : "unlocked"));

  const goNext = useCallback(() => {
    if (!currentScene || !canNavigateForward(currentScene)) {
      return;
    }

    startEmotionalSoundtrack();
    setDirection("forward");
    setCurrentSceneIndex((index) => Math.min(index + 1, Math.max(scenes.length - 1, 0)));
  }, [currentScene, scenes.length]);

  const goPrevious = useCallback(() => {
    setDirection("backward");
    setCurrentSceneIndex((index) => {
      const previousIndex = getPreviousContentSceneIndex(scenes, index);
      return previousIndex >= 0 ? previousIndex : index;
    });
  }, [scenes]);

  const goToScene = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(nextIndex, Math.max(scenes.length - 1, 0)));
      setDirection(boundedIndex >= currentSceneIndex ? "forward" : "backward");
      setCurrentSceneIndex(boundedIndex);
      setLastCompletedSlug(null);
      setChapterReplayKey((key) => key + 1);
    },
    [currentSceneIndex, scenes.length],
  );

  const updateScene = useCallback((sceneSlug: string, updater: (scene: JourneyScene) => JourneyScene) => {
    setScenes((currentScenes) => currentScenes.map((scene) => (scene.slug === sceneSlug ? updater(scene) : scene)));
  }, []);

  const completeSceneLocally = useCallback(
    (sceneSlug: string) => {
      const completedIndex = scenes.findIndex((scene) => scene.slug === sceneSlug);
      const completedScene = completedIndex >= 0 ? scenes[completedIndex] : null;
      const shouldAutoAdvance = Boolean(
        completedScene?.type === "task" && findSceneCodeTask(completedScene.contentBlocks),
      );

      setIsBusy(true);
      updateScene(sceneSlug, (scene) => ({
        ...scene,
        progressIsCompleted: true,
        completedAt: new Date().toISOString(),
      }));
      setLastCompletedSlug(sceneSlug);
      window.setTimeout(() => {
        setIsBusy(false);

        if (shouldAutoAdvance && completedIndex < scenes.length - 1) {
          setDirection("forward");
          setCurrentSceneIndex(completedIndex + 1);
          setLastCompletedSlug(null);
        }
      }, shouldAutoAdvance ? 520 : 220);
    },
    [scenes, updateScene],
  );

  const submitPhotoLocally = useCallback(
    (sceneSlug: string, file: File, rewardKey?: string | null) => {
      const mediaUrl = URL.createObjectURL(file);
      previewObjectUrlsRef.current.push(mediaUrl);
      updateScene(sceneSlug, (scene) => ({
        ...scene,
        progressIsCompleted: true,
        completedAt: new Date().toISOString(),
        taskResponse: buildPreviewTaskResponse("photo", rewardKey, {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          previewOnly: true,
        }, mediaUrl),
        rewards: unlockRewardList(scene.rewards, rewardKey),
      }));
      setLastCompletedSlug(sceneSlug);
    },
    [updateScene],
  );

  const completeMiniGameLocally = useCallback(
    ({ sceneSlug, gameKey = "primary", score, rewardKey, payload = {} }: CompleteMiniGameParams & { sceneSlug: string }) => {
      updateScene(sceneSlug, (scene) => ({
        ...scene,
        progressIsCompleted: true,
        completedAt: new Date().toISOString(),
        taskResponse: buildPreviewTaskResponse(
          "mini_game",
          rewardKey,
          {
            ...payload,
            gameKey,
            score,
            previewOnly: true,
          },
          null,
          score,
        ),
        rewards: unlockRewardList(scene.rewards, rewardKey),
      }));
      setLastCompletedSlug(sceneSlug);
    },
    [updateScene],
  );

  const unlockRewardLocally = useCallback(
    (sceneSlug: string, rewardKey: string) => {
      updateScene(sceneSlug, (scene) => ({
        ...scene,
        rewards: unlockRewardList(scene.rewards, rewardKey),
      }));
    },
    [updateScene],
  );

  if (isLoading) {
    return (
      <MobileSceneLayout title="Journey Preview" subtitle={summary} backgroundVariant="deep">
        <PremiumCard className="flex min-h-[18rem] w-full items-center justify-center p-6">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full w-1/2 rounded-full bg-[#d9a7a0]"
              animate={reduceMotion ? undefined : { x: ["-20%", "120%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  if (error) {
    return (
      <MobileSceneLayout title="Preview açılamadı" subtitle="Kilitli içerik preview endpoint'i hazır değil." backgroundVariant="deep">
        <PremiumCard className="w-full p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <RotateCcw size={21} strokeWidth={1.6} />
          </div>
          <p className="text-lg leading-8 text-[#fffaf2]/78">{error}</p>
          <div className="mt-7">
            <PrimaryActionButton onClick={() => refreshPreview()} disabled={isLoading}>
              Tekrar Dene
              <RotateCcw size={18} strokeWidth={1.7} />
            </PrimaryActionButton>
          </div>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  if (!currentScene) {
    return (
      <MobileSceneLayout title="Preview boş" subtitle="Aktif sahne bulunamadı." backgroundVariant="deep">
        <PremiumCard className="w-full p-6">
          <p className="text-lg leading-8 text-[#fffaf2]/78">Supabase preview RPC sahne döndürmedi.</p>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  if (currentScene.type === "chapter") {
    return (
      <div className="relative min-h-[100dvh] bg-[#020203]">
        <ChapterRevealScene
          key={`${currentScene.id}-${currentSceneIndex}-${chapterReplayKey}`}
          chapterNumber={getChapterNumber(scenes, currentScene.id)}
          title={currentScene.title}
          subtitle={currentScene.subtitle}
          direction={direction}
          allowSkip
          previewMode
          onComplete={() => {
            if (direction === "backward") {
              if (previousSceneIndex >= 0) {
                goPrevious();
              } else if (getNextSceneAfter(scenes, currentScene.id)) {
                goNext();
              }
              return;
            }

            if (getNextSceneAfter(scenes, currentScene.id)) goNext();
          }}
        />
        <button
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#efe5d6]/60 backdrop-blur"
          type="button"
          onPointerUp={(event) => event.stopPropagation()}
          onClick={() => setChapterReplayKey((key) => key + 1)}
        >
          Yeniden oynat
        </button>
      </div>
    );
  }

  return (
    <MobileSceneLayout
      title={currentScene.title}
      subtitle={currentScene.subtitle ?? undefined}
      previousAction={canNavigatePrevious ? goPrevious : undefined}
      nextAction={canNavigateNext ? goNext : undefined}
      progress={
        progressIndex >= 0
          ? { current: progressIndex + 1, total: progressScenes.length, states: progressStates }
          : undefined
      }
      showSideArrows
      animationDirection={direction}
      backgroundVariant={currentScene.backgroundVariant ?? "deep"}
      primaryAction={getPrimaryAction({
        scene: currentScene,
        canGoNext: canNavigateNext,
        onNext: goNext,
      })}
    >
      <div className="relative w-full">
        <PremiumCard className="mb-3 w-full p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
              <Eye size={18} strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#fffaf2]">Preview modu</p>
              <p className="mt-1 text-xs leading-5 text-[#fffaf2]/56">
                Bu ekranda tüm sahneler açık ve görev sonuçları yalnızca yerel önizleme için işlenir.
              </p>
            </div>
          </div>
          <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-[#fffaf2]/68 transition hover:bg-white/[0.08] disabled:opacity-50" type="button" disabled={isLoading} onClick={() => refreshPreview(currentScene.slug)}>
            <RotateCcw size={14} aria-hidden="true" /> Preview&apos;i sıfırla
          </button>
          <label className="mt-4 block">
            <span className="mb-2 block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#f4dcc0]/58">
              Sahneye hızlı geç
            </span>
            <select
              className="min-h-11 w-full rounded-[8px] border border-white/10 bg-[#080a16] px-3 text-sm text-[#fffaf2]/82 outline-none"
              value={currentSceneIndex}
              onChange={(event) => goToScene(Number(event.target.value))}
            >
              {scenes.map((scene, index) => (
                <option key={scene.id} value={index}>
                  {index + 1}. {scene.title}
                </option>
              ))}
            </select>
          </label>
        </PremiumCard>

        {lastCompletedSlug && lastCompletedSlug === currentScene.slug ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.68, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-4 py-2 text-center text-xs font-medium text-[#f4dcc0]/86"
          >
            Preview görevi tamamlandı.
          </motion.div>
        ) : null}

        <JourneySceneRenderer
          scene={currentScene}
          isSubmitting={isBusy}
          persistenceScope={`journey-preview:${code}:${previewRunKey}`}
          onComplete={() => completeSceneLocally(currentScene.slug)}
          onSubmitPhoto={(file, rewardKey) => submitPhotoLocally(currentScene.slug, file, rewardKey)}
          onCompleteMiniGame={(params) => completeMiniGameLocally({ sceneSlug: currentScene.slug, ...params })}
          onUnlockReward={(rewardKey) => unlockRewardLocally(currentScene.slug, rewardKey)}
        />
      </div>
    </MobileSceneLayout>
  );
}

function getPrimaryAction({
  scene,
  canGoNext,
  onNext,
}: {
  scene: JourneyScene;
  canGoNext: boolean;
  onNext: () => void;
}) {
  if (scene.type === "task" && !scene.progressIsCompleted) {
    return undefined;
  }

  if (canGoNext) {
    return { label: scene.primaryActionLabel ?? "Devam Et", onClick: onNext };
  }

  return undefined;
}

function resetForPreview(scene: JourneyScene): JourneyScene {
  return {
    ...scene,
    isLocked: false,
    progressIsUnlocked: true,
    progressIsCompleted: false,
    completedAt: null,
    taskResponse: null,
    rewards: scene.rewards.map((reward) => ({
      ...reward,
      isUnlocked: false,
      unlockedAt: null,
    })),
  };
}

function unlockRewardList(rewards: JourneyReward[], rewardKey?: string | null) {
  if (!rewardKey) {
    return rewards;
  }

  return rewards.map((reward) =>
    reward.rewardKey === rewardKey
      ? {
          ...reward,
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        }
      : reward,
  );
}

function buildPreviewTaskResponse(
  type: JourneyTaskResponse["type"],
  rewardKey: string | null | undefined,
  payload: Record<string, unknown>,
  mediaUrl: string | null,
  score?: number | null,
): JourneyTaskResponse {
  const completedAt = new Date().toISOString();

  return {
    id: `preview-${crypto.randomUUID()}`,
    responseKey: "primary",
    type,
    status: "completed",
    mediaUrl,
    score: score ?? null,
    rewardKey,
    payload,
    completedAt,
    updatedAt: completedAt,
  };
}

function findFirstPlayableIndex(scenes: JourneyScene[]) {
  return scenes.length > 0 ? 0 : -1;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Preview su an acilamadi. Birazdan yeniden deneyelim.";
}
