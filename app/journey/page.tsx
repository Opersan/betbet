"use client";

import { RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { ChapterRevealScene } from "@/components/scene/ChapterRevealScene";
import { JourneySceneRenderer } from "@/components/scene/JourneySceneRenderer";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { useJourneyScenes } from "@/hooks/useJourneyScenes";
import { startEmotionalSoundtrack } from "@/lib/audio/emotionalSoundtrack";
import { getChapterNumber, getNextSceneAfter, getPreviousContentSceneIndex, getProgressScenes } from "@/lib/journey/chapters";
import { canNavigateForward } from "@/lib/journey/progress";
import { getNextSceneImageUrl, getSceneCriticalImageUrl, prepareSceneImage } from "@/lib/journey/scene-media";
import type { JourneyScene } from "@/lib/journey/types";

export default function JourneyPage() {
  const reduceMotion = useReducedMotion();
  const {
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
    refreshScenes,
    completeScene,
    submitPhotoTask,
    completeMiniGame,
    unlockReward,
    goNext,
    goPrevious,
  } = useJourneyScenes();
  const criticalMediaUrl = getSceneCriticalImageUrl(currentScene);
  const nextMediaUrl = getNextSceneImageUrl(scenes, currentSceneIndex);

  useEffect(() => {
    if (currentScene?.type === "chapter") {
      void prepareSceneImage(nextMediaUrl);
    }
  }, [currentScene?.type, nextMediaUrl]);

  if (isLoading) {
    return (
      <MobileSceneLayout
        title="Yolculuk hazırlanıyor"
        subtitle="Birkaç küçük ışık yerine oturuyor."
        backgroundVariant="deep"
      >
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
      <MobileSceneLayout
        title="Kapı aralık kaldı"
        subtitle="Yolculuk bilgisi şu an tam yerine oturmadı."
        backgroundVariant="deep"
      >
        <PremiumCard className="w-full p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <RotateCcw size={21} strokeWidth={1.6} />
          </div>
          <p className="text-lg leading-8 text-[#fffaf2]/78">{error}</p>
          <div className="mt-7">
            <PrimaryActionButton onClick={() => refreshScenes({ preserveCurrentScene: false })} disabled={isRefreshing}>
              {isRefreshing ? "Deneniyor" : "Tekrar Dene"}
              <RotateCcw size={18} strokeWidth={1.7} />
            </PrimaryActionButton>
          </div>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  if (!currentScene) {
    return (
      <MobileSceneLayout
        title="Henüz sahne yok"
        subtitle="Bu yolculuğun sayfaları birazdan burada görünecek."
        backgroundVariant="rose"
      >
        <PremiumCard className="w-full p-6">
          <p className="text-lg leading-8 text-[#fffaf2]/78">
            Şu an gösterilecek aktif bir sahne bulunamadı.
          </p>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  const canNavigateNext = currentSceneIndex < scenes.length - 1 && canNavigateForward(currentScene);
  const previousSceneIndex = getPreviousContentSceneIndex(scenes, currentSceneIndex);

  if (currentScene.type === "chapter" && !currentScene.isLocked) {
    return (
      <ChapterRevealScene
        key={`${currentScene.id}-${currentSceneIndex}`}
        chapterNumber={getChapterNumber(scenes, currentScene.id)}
        title={currentScene.title}
        subtitle={currentScene.subtitle}
        direction={direction}
        allowSkip
        previewMode={false}
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
    );
  }

  const canNavigatePrevious = previousSceneIndex >= 0;
  const progressScenes = getProgressScenes(scenes);
  const progressIndex = progressScenes.findIndex((scene) => scene.id === currentScene.id);
  const progressStates = progressScenes.map((scene) => {
    if (scene.progressIsCompleted) return "completed";
    if (scene.isLocked) return "locked";
    return "unlocked";
  });
  const handleNext = () => {
    startEmotionalSoundtrack();
    goNext();
  };

  return (
    <MobileSceneLayout
      title={currentScene.title}
      subtitle={currentScene.subtitle ?? undefined}
      previousAction={canNavigatePrevious ? goPrevious : undefined}
      nextAction={canNavigateNext ? handleNext : undefined}
      progress={
        progressIndex >= 0
          ? { current: progressIndex + 1, total: progressScenes.length, states: progressStates }
          : undefined
      }
      showSideArrows
      isLocked={currentScene.isLocked}
      animationDirection={direction}
      backgroundVariant={currentScene.backgroundVariant ?? "night"}
      showSoundControl
      sceneKey={currentScene.id}
      criticalMediaUrl={criticalMediaUrl}
      nextMediaUrl={nextMediaUrl}
      primaryAction={getPrimaryAction({
        scene: currentScene,
        canGoNext: canNavigateNext,
        onNext: handleNext,
      })}
    >
      <div className="relative w-full">
        <JourneySceneRenderer
          scene={currentScene}
          isSubmitting={isCompleting || isUploading}
          persistenceScope={`journey:${accessCode}`}
          onComplete={() => completeScene(currentScene.slug)}
          onSubmitPhoto={(file, rewardKey) => submitPhotoTask(currentScene.slug, file, rewardKey)}
          onCompleteMiniGame={(params) => completeMiniGame({ sceneSlug: currentScene.slug, ...params })}
          onUnlockReward={(rewardKey) => unlockReward(currentScene.slug, rewardKey)}
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
  if (scene.isLocked) {
    return { label: "Henüz Zamanı Değil", disabled: true };
  }

  if (scene.type === "chapter") {
    return undefined;
  }

  if (scene.type === "task" && !scene.progressIsCompleted) {
    return undefined;
  }

  if (canGoNext) {
    return { label: scene.primaryActionLabel ?? "Devam Et", onClick: onNext };
  }

  return undefined;
}
