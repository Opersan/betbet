"use client";

import { Check, Eye, Gift, Heart, RotateCcw, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { JourneyContentBlocks } from "@/components/ui/JourneyContentBlocks";
import { MemoryCard } from "@/components/ui/MemoryCard";
import { MiniGameCard } from "@/components/ui/MiniGameCard";
import { PhotoTaskCard } from "@/components/ui/PhotoTaskCard";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { RewardRevealStack } from "@/components/ui/RewardRevealStack";
import { TaskCard } from "@/components/ui/TaskCard";
import { startEmotionalSoundtrack } from "@/lib/audio/emotionalSoundtrack";
import { getJourneyPreviewScenes } from "@/lib/journey/queries";
import type { JourneyReward, JourneyScene, JourneyTaskResponse } from "@/lib/journey/types";

type CompleteMiniGameParams = {
  gameKey?: string;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
};

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

  const currentScene = scenes[currentSceneIndex] ?? null;

  const refreshPreview = useCallback(
    async (preferredSlug?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const nextScenes = await getJourneyPreviewScenes({ code, previewToken: rpcPreviewToken });
        const normalizedScenes = nextScenes.map(resetForPreview);
        setScenes(normalizedScenes);

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

  const summary = useMemo(() => {
    const gameCount = scenes.filter((scene) => scene.miniGame).length;
    return scenes.length > 0
      ? `${scenes.length} sahne, ${gameCount} mini game - tüm kilitler preview için açık`
      : "Tüm kilitli sahneler preview için hazırlanıyor.";
  }, [scenes]);

  const canNavigateNext = currentSceneIndex < scenes.length - 1;
  const canNavigatePrevious = currentSceneIndex > 0;
  const progressStates = scenes.map((scene) => (scene.progressIsCompleted ? "completed" : "unlocked"));

  const goNext = useCallback(() => {
    startEmotionalSoundtrack();
    setDirection("forward");
    setCurrentSceneIndex((index) => Math.min(index + 1, Math.max(scenes.length - 1, 0)));
  }, [scenes.length]);

  const goPrevious = useCallback(() => {
    setDirection("backward");
    setCurrentSceneIndex((index) => Math.max(index - 1, 0));
  }, []);

  const updateScene = useCallback((sceneSlug: string, updater: (scene: JourneyScene) => JourneyScene) => {
    setScenes((currentScenes) => currentScenes.map((scene) => (scene.slug === sceneSlug ? updater(scene) : scene)));
  }, []);

  const completeSceneLocally = useCallback(
    (sceneSlug: string) => {
      setIsBusy(true);
      updateScene(sceneSlug, (scene) => ({
        ...scene,
        progressIsCompleted: true,
        completedAt: new Date().toISOString(),
      }));
      setLastCompletedSlug(sceneSlug);
      window.setTimeout(() => setIsBusy(false), 220);
    },
    [updateScene],
  );

  const submitPhotoLocally = useCallback(
    (sceneSlug: string, file: File, rewardKey?: string | null) => {
      const mediaUrl = URL.createObjectURL(file);
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
      <MobileSceneLayout title="Preview açılamadı" subtitle="Kilitli içerik test endpoint'i hazır değil." backgroundVariant="deep">
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

  return (
    <MobileSceneLayout
      title={currentScene.title}
      subtitle={currentScene.subtitle ?? summary}
      previousAction={canNavigatePrevious ? goPrevious : undefined}
      nextAction={canNavigateNext ? goNext : undefined}
      progress={{ current: currentSceneIndex + 1, total: scenes.length, states: progressStates }}
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
                Bu ekranda tüm sahneler açık ve görev sonuçları sadece local test için işlenir.
              </p>
            </div>
          </div>
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

        <PreviewSceneContent
          scene={currentScene}
          isSubmitting={isBusy}
          onComplete={() => completeSceneLocally(currentScene.slug)}
          onSubmitPhoto={(file, rewardKey) => submitPhotoLocally(currentScene.slug, file, rewardKey)}
          onCompleteMiniGame={(params) => completeMiniGameLocally({ sceneSlug: currentScene.slug, ...params })}
          onUnlockReward={(rewardKey) => unlockRewardLocally(currentScene.slug, rewardKey)}
        />
      </div>
    </MobileSceneLayout>
  );
}

function PreviewSceneContent({
  scene,
  isSubmitting,
  onComplete,
  onSubmitPhoto,
  onCompleteMiniGame,
  onUnlockReward,
}: {
  scene: JourneyScene;
  isSubmitting: boolean;
  onComplete: () => void;
  onSubmitPhoto: (file: File, rewardKey?: string | null) => void;
  onCompleteMiniGame: (params: CompleteMiniGameParams) => void;
  onUnlockReward: (rewardKey: string) => void;
}) {
  if (scene.type === "task") {
    if (scene.miniGame) {
      return (
        <TaskExperience>
          <MiniGameCard scene={scene} isSubmitting={isSubmitting} onComplete={onCompleteMiniGame} />
          <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
        </TaskExperience>
      );
    }

    if (scene.contentBlocks.some((block) => block.type === "photo_task") || scene.taskResponse?.type === "photo") {
      return (
        <TaskExperience>
          <PhotoTaskCard scene={scene} isSubmitting={isSubmitting} onSubmit={onSubmitPhoto} />
          <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
        </TaskExperience>
      );
    }

    return (
      <TaskExperience>
        <TaskCard
          title={scene.content ?? scene.title}
          isCompleted={scene.progressIsCompleted}
          isSubmitting={isSubmitting}
          onComplete={onComplete}
        />
        <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
      </TaskExperience>
    );
  }

  if (scene.type === "memory") {
    return (
      <div className="w-full space-y-3">
        <MemoryCard imageUrl={scene.imageUrl} dateLabel={scene.dateLabel} title={scene.title} content={scene.content} />
        <JourneyContentBlocks blocks={scene.contentBlocks} />
      </div>
    );
  }

  const icon = scene.type === "welcome" ? Sparkles : scene.slug.includes("anniversary") ? Heart : Gift;

  return (
    <div className="w-full space-y-3">
      <PremiumCard className="w-full p-6">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {icon === Heart ? <Heart size={21} strokeWidth={1.6} /> : icon === Gift ? <Gift size={21} strokeWidth={1.6} /> : <Sparkles size={21} strokeWidth={1.6} />}
        </div>
        {scene.dateLabel ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/78">{scene.dateLabel}</p>
        ) : null}
        <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{scene.content}</p>
        {scene.progressIsCompleted ? (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 px-3 py-2 text-sm text-[#f4dcc0]">
            <Check size={16} strokeWidth={1.8} />
            Tamamlandı
          </div>
        ) : null}
      </PremiumCard>
      <JourneyContentBlocks blocks={scene.contentBlocks} />
    </div>
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
  const firstMiniGameIndex = scenes.findIndex((scene) => scene.miniGame);
  if (firstMiniGameIndex >= 0) {
    return firstMiniGameIndex;
  }

  const firstTaskIndex = scenes.findIndex((scene) => scene.type === "task");
  return firstTaskIndex >= 0 ? firstTaskIndex : 0;
}

function TaskExperience({ children }: { children: ReactNode }) {
  return <div className="w-full space-y-3">{children}</div>;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Preview su an acilamadi. Birazdan yeniden deneyelim.";
}
