"use client";

import { Check, Gift, Heart, RotateCcw, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { MemoryCard } from "@/components/ui/MemoryCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { LockedRevealCard } from "@/components/ui/LockedRevealCard";
import { FinalSurpriseCard } from "@/components/ui/FinalSurpriseCard";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { useJourneyScenes } from "@/hooks/useJourneyScenes";
import type { JourneyScene } from "@/lib/journey/types";

export default function JourneyPage() {
  const reduceMotion = useReducedMotion();
  const {
    scenes,
    currentScene,
    currentSceneIndex,
    direction,
    isLoading,
    isRefreshing,
    isCompleting,
    error,
    lastCompletedSlug,
    refreshScenes,
    completeScene,
    goNext,
    goPrevious,
  } = useJourneyScenes();

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

  const canNavigateNext = currentSceneIndex < scenes.length - 1;
  const canNavigatePrevious = currentSceneIndex > 0;
  const progressStates = scenes.map((scene) => {
    if (scene.progressIsCompleted) return "completed";
    if (scene.isLocked) return "locked";
    return "unlocked";
  });

  return (
    <MobileSceneLayout
      title={currentScene.title}
      subtitle={currentScene.subtitle ?? undefined}
      previousAction={canNavigatePrevious ? goPrevious : undefined}
      nextAction={canNavigateNext ? goNext : undefined}
      progress={{ current: currentSceneIndex + 1, total: scenes.length, states: progressStates }}
      showSideArrows
      isLocked={currentScene.isLocked}
      animationDirection={direction}
      backgroundVariant={currentScene.backgroundVariant ?? "night"}
      primaryAction={getPrimaryAction({
        scene: currentScene,
        canGoNext: canNavigateNext,
        onNext: goNext,
      })}
    >
      <div className="relative w-full">
        {lastCompletedSlug && !currentScene.isLocked ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-4 py-2 text-center text-xs font-medium text-[#f4dcc0]/86"
          >
            Bir sayfa daha usulca açıldı.
          </motion.div>
        ) : null}
        <SceneContent
          scene={currentScene}
          isSubmitting={isCompleting}
          onComplete={() => completeScene(currentScene.slug)}
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

  if (scene.type === "task" && !scene.progressIsCompleted) {
    return undefined;
  }

  if (canGoNext) {
    return { label: scene.primaryActionLabel ?? "Devam Et", onClick: onNext };
  }

  return undefined;
}

function SceneContent({
  scene,
  isSubmitting,
  onComplete,
}: {
  scene: JourneyScene;
  isSubmitting: boolean;
  onComplete: () => void;
}) {
  if (scene.isLocked) {
    return (
      <LockedRevealCard
        title={scene.title}
        isRevealed={false}
        unlockCondition={scene.unlockCondition}
        lockedLabel="Henüz Zamanı Değil"
      />
    );
  }

  if (scene.type === "task") {
    return (
      <TaskCard
        title={scene.content ?? scene.title}
        isCompleted={scene.progressIsCompleted}
        isSubmitting={isSubmitting}
        onComplete={onComplete}
      />
    );
  }

  if (scene.type === "memory") {
    return (
      <MemoryCard
        imageUrl={scene.imageUrl}
        dateLabel={scene.dateLabel}
        title={scene.title}
        content={scene.content}
      />
    );
  }

  if (scene.type === "locked") {
    return (
      <LockedRevealCard
        title={scene.title}
        content={scene.content}
        isRevealed
      />
    );
  }

  if (scene.type === "final") {
    return <FinalSurpriseCard scene={scene} />;
  }

  const icon = scene.type === "welcome" ? Sparkles : scene.slug.includes("anniversary") ? Heart : Gift;

  return (
    <PremiumCard className="w-full p-6">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
        {icon === Heart ? <Heart size={21} strokeWidth={1.6} /> : icon === Gift ? <Gift size={21} strokeWidth={1.6} /> : <Sparkles size={21} strokeWidth={1.6} />}
      </div>
      {scene.dateLabel ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/78">
          {scene.dateLabel}
        </p>
      ) : null}
      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{scene.content}</p>
      {scene.progressIsCompleted ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 px-3 py-2 text-sm text-[#f4dcc0]">
          <Check size={16} strokeWidth={1.8} />
          Tamamlandı
        </div>
      ) : null}
    </PremiumCard>
  );
}
