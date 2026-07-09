"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Gift, Heart, Sparkles } from "lucide-react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { MemoryCard } from "@/components/ui/MemoryCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { LockedRevealCard } from "@/components/ui/LockedRevealCard";
import { FinalSurpriseCard } from "@/components/ui/FinalSurpriseCard";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { getActiveJourneyScenes, getJourneyProgress, markSceneCompleted, unlockScene } from "@/lib/journey/queries";
import { canAccessScene, getInitialSceneIndex, isSceneCompleted } from "@/lib/journey/progress";
import { mockScenes } from "@/lib/journey/mockScenes";
import type { JourneyProgress, JourneyScene } from "@/lib/journey/types";

type StoredAccess = {
  id: string;
  label?: string | null;
  expiresAt?: string | null;
};

const ACCESS_STORAGE_KEY = "journey_access";

export default function JourneyPage() {
  const router = useRouter();
  const [access, setAccess] = useState<StoredAccess | null>(null);
  const [scenes, setScenes] = useState<JourneyScene[]>(mockScenes);
  const [progress, setProgress] = useState<JourneyProgress[]>([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(true);
  const [revealedScenes, setRevealedScenes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const rawAccess = localStorage.getItem(ACCESS_STORAGE_KEY);

    if (!rawAccess) {
      router.replace("/unlock");
      return;
    }

    try {
      const parsed = JSON.parse(rawAccess) as StoredAccess;
      if (!parsed.id) {
        router.replace("/unlock");
        return;
      }
      setAccess(parsed);
    } catch {
      localStorage.removeItem(ACCESS_STORAGE_KEY);
      router.replace("/unlock");
    }
  }, [router]);

  useEffect(() => {
    if (!access?.id) return;

    let isMounted = true;

    async function loadJourney() {
      setIsLoading(true);
      const [remoteScenes, remoteProgress] = await Promise.all([
        getActiveJourneyScenes(),
        getJourneyProgress(access.id),
      ]);

      if (!isMounted) return;

      const nextScenes = remoteScenes.length > 0 ? remoteScenes : mockScenes;
      setScenes(nextScenes);
      setProgress(remoteProgress);
      setSceneIndex(getInitialSceneIndex({ scenes: nextScenes, progress: remoteProgress }));
      setIsLoading(false);
    }

    loadJourney();

    return () => {
      isMounted = false;
    };
  }, [access?.id]);

  const currentScene = scenes[sceneIndex] ?? mockScenes[0];

  const previousScenes = useMemo(() => scenes.slice(0, sceneIndex), [sceneIndex, scenes]);
  const canAccessCurrentScene = canAccessScene({ scene: currentScene, progress, previousScenes });
  const isCurrentCompleted = isSceneCompleted({ sceneId: currentScene.id, progress });
  const isRevealed = revealedScenes[currentScene.id] || canAccessCurrentScene;

  function goNext() {
    setDirection("forward");
    setSceneIndex((index) => Math.min(index + 1, scenes.length - 1));
  }

  function goPrevious() {
    setDirection("backward");
    setSceneIndex((index) => Math.max(index - 1, 0));
  }

  async function completeCurrentScene() {
    if (!access?.id) return;

    const optimisticProgress: JourneyProgress = {
      id: `${access.id}-${currentScene.id}`,
      accessCodeId: access.id,
      sceneId: currentScene.id,
      isCompleted: true,
      isUnlocked: true,
      completedAt: new Date().toISOString(),
    };

    setProgress((items) => {
      const exists = items.some((item) => item.sceneId === currentScene.id);
      return exists
        ? items.map((item) =>
            item.sceneId === currentScene.id
              ? { ...item, isCompleted: true, isUnlocked: true, completedAt: item.completedAt ?? optimisticProgress.completedAt }
              : item,
          )
        : [...items, optimisticProgress];
    });

    await markSceneCompleted({ accessCodeId: access.id, sceneId: currentScene.id });
  }

  async function revealCurrentScene() {
    if (!access?.id) return;
    setRevealedScenes((items) => ({ ...items, [currentScene.id]: true }));
    await unlockScene({ accessCodeId: access.id, sceneId: currentScene.id });
  }

  if (isLoading) {
    return (
      <MobileSceneLayout
        title="Yolculuk hazırlanıyor"
        subtitle="Birkaç küçük ışık yerine oturuyor."
        backgroundVariant="deep"
      >
        <PremiumCard className="flex min-h-[18rem] w-full items-center justify-center p-6">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-[#d9a7a0]" />
          </div>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  return (
    <MobileSceneLayout
      title={currentScene.title}
      subtitle={currentScene.subtitle ?? undefined}
      previousAction={sceneIndex > 0 ? goPrevious : undefined}
      nextAction={sceneIndex < scenes.length - 1 ? goNext : undefined}
      progress={{ current: sceneIndex + 1, total: scenes.length }}
      showSideArrows
      isLocked={currentScene.isLocked && !isRevealed}
      animationDirection={direction}
      backgroundVariant={currentScene.backgroundVariant ?? "night"}
      primaryAction={getPrimaryAction({
        scene: currentScene,
        isCompleted: isCurrentCompleted,
        isRevealed,
        canGoNext: sceneIndex < scenes.length - 1,
        onComplete: completeCurrentScene,
        onReveal: revealCurrentScene,
        onNext: goNext,
      })}
    >
      <SceneContent
        scene={currentScene}
        isCompleted={isCurrentCompleted}
        isRevealed={isRevealed}
        onComplete={completeCurrentScene}
        onReveal={revealCurrentScene}
      />
    </MobileSceneLayout>
  );
}

function getPrimaryAction(params: {
  scene: JourneyScene;
  isCompleted: boolean;
  isRevealed: boolean;
  canGoNext: boolean;
  onComplete: () => void;
  onReveal: () => void;
  onNext: () => void;
}) {
  const { scene, isCompleted, isRevealed, canGoNext, onComplete, onReveal, onNext } = params;

  if (scene.type === "task" && !isCompleted) {
    return { label: "Tamamladım", onClick: onComplete };
  }

  if (scene.type === "locked" && !isRevealed) {
    return { label: scene.primaryActionLabel ?? "Sürprizi Aç", onClick: onReveal };
  }

  if (canGoNext) {
    return { label: scene.primaryActionLabel ?? "Devam Et", onClick: onNext };
  }

  return undefined;
}

function SceneContent({
  scene,
  isCompleted,
  isRevealed,
  onComplete,
  onReveal,
}: {
  scene: JourneyScene;
  isCompleted: boolean;
  isRevealed: boolean;
  onComplete: () => void;
  onReveal: () => void;
}) {
  if (scene.type === "task") {
    return (
      <TaskCard
        title={scene.content ?? scene.title}
        isCompleted={isCompleted}
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
        isRevealed={isRevealed}
        onReveal={onReveal}
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
      {isCompleted ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 px-3 py-2 text-sm text-[#f4dcc0]">
          <Check size={16} strokeWidth={1.8} />
          Tamamlandı
        </div>
      ) : null}
    </PremiumCard>
  );
}
