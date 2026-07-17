"use client";

import { Check, Gift, Heart, Sparkles } from "lucide-react";
import { FinalSurpriseCard } from "@/components/ui/FinalSurpriseCard";
import { JourneyContentBlocks } from "@/components/ui/JourneyContentBlocks";
import { LockedRevealCard } from "@/components/ui/LockedRevealCard";
import { MemoryCard } from "@/components/ui/MemoryCard";
import { MiniGameCard } from "@/components/ui/MiniGameCard";
import { PhotoTaskCard } from "@/components/ui/PhotoTaskCard";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { RewardRevealStack } from "@/components/ui/RewardRevealStack";
import { SceneCodeTaskCard } from "@/components/ui/SceneCodeTaskCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { findSceneCodeTask } from "@/lib/journey/scene-code-task";
import type { JourneyScene } from "@/lib/journey/types";

export type CompleteMiniGameParams = {
  gameKey?: string;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
};

export function JourneySceneRenderer({
  scene,
  isSubmitting,
  persistenceScope,
  onComplete,
  onSubmitPhoto,
  onCompleteMiniGame,
  onUnlockReward,
}: {
  scene: JourneyScene;
  isSubmitting: boolean;
  persistenceScope?: string;
  onComplete: () => void | Promise<void>;
  onSubmitPhoto: (file: File, rewardKey?: string | null) => void | Promise<void>;
  onCompleteMiniGame: (params: CompleteMiniGameParams) => void | Promise<void>;
  onUnlockReward: (rewardKey: string) => void | Promise<void>;
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

  if (scene.type === "chapter") {
    return null;
  }

  if (scene.type === "task") {
    if (scene.miniGame) {
      return (
        <SceneStack>
          <MiniGameCard scene={scene} isSubmitting={isSubmitting} persistenceScope={persistenceScope} onComplete={onCompleteMiniGame} />
          <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
        </SceneStack>
      );
    }

    if (scene.contentBlocks.some((block) => block.type === "photo_task") || scene.taskResponse?.type === "photo") {
      return (
        <SceneStack>
          <PhotoTaskCard scene={scene} isSubmitting={isSubmitting} onSubmit={onSubmitPhoto} />
          <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
        </SceneStack>
      );
    }

    const codeTask = findSceneCodeTask(scene.contentBlocks);

    if (codeTask) {
      return (
        <SceneStack>
          <SceneCodeTaskCard
            task={codeTask}
            fallbackTitle={scene.content ?? scene.title}
            isCompleted={scene.progressIsCompleted}
            isSubmitting={isSubmitting}
            onComplete={onComplete}
          />
          <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
        </SceneStack>
      );
    }

    return (
      <SceneStack>
        <TaskCard
          title={scene.content ?? scene.title}
          isCompleted={scene.progressIsCompleted}
          isSubmitting={isSubmitting}
          onComplete={onComplete}
        />
        <RewardRevealStack rewards={scene.rewards} isBusy={isSubmitting} onUnlock={onUnlockReward} />
      </SceneStack>
    );
  }

  if (scene.type === "memory") {
    return (
      <SceneStack>
        <MemoryCard
          imageUrl={scene.imageUrl}
          dateLabel={scene.dateLabel}
          title={scene.title}
          content={scene.content}
        />
        <SceneVideo scene={scene} />
        <JourneyContentBlocks blocks={scene.contentBlocks} />
      </SceneStack>
    );
  }

  if (scene.type === "locked") {
    return (
      <SceneStack>
        <LockedRevealCard title={scene.title} content={scene.content} isRevealed />
        <SceneVideo scene={scene} />
        <JourneyContentBlocks blocks={scene.contentBlocks} />
      </SceneStack>
    );
  }

  if (scene.type === "final") {
    return (
      <SceneStack>
        <FinalSurpriseCard scene={scene} />
        <SceneVideo scene={scene} />
        <JourneyContentBlocks blocks={scene.contentBlocks} />
      </SceneStack>
    );
  }

  const icon = scene.type === "welcome" ? "sparkles" : scene.slug.includes("anniversary") ? "heart" : "gift";

  return (
    <SceneStack>
      <PremiumCard className="w-full p-6">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {icon === "heart" ? <Heart size={21} strokeWidth={1.6} /> : icon === "gift" ? <Gift size={21} strokeWidth={1.6} /> : <Sparkles size={21} strokeWidth={1.6} />}
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
      <SceneVideo scene={scene} />
      <JourneyContentBlocks blocks={scene.contentBlocks} />
    </SceneStack>
  );
}

function SceneVideo({ scene }: { scene: JourneyScene }) {
  if (!scene.videoUrl) {
    return null;
  }

  return (
    <PremiumCard className="w-full overflow-hidden p-2">
      <video
        className="aspect-video w-full rounded-[6px] bg-black object-cover"
        controls
        playsInline
        preload="metadata"
        src={scene.videoUrl}
      />
    </PremiumCard>
  );
}

function SceneStack({ children }: { children: React.ReactNode }) {
  return <div className="w-full space-y-3">{children}</div>;
}
