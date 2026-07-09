"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { JourneyReward } from "@/lib/journey/types";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { RevealAnimation } from "./RevealAnimation";

export function RewardRevealStack({
  rewards,
  isBusy,
  onUnlock,
}: {
  rewards: JourneyReward[];
  isBusy: boolean;
  onUnlock: (rewardKey: string) => void;
}) {
  if (rewards.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 w-full space-y-3">
      {rewards.map((reward) => (
        <RewardCard key={reward.id || reward.rewardKey} reward={reward} isBusy={isBusy} onUnlock={onUnlock} />
      ))}
    </div>
  );
}

function RewardCard({
  reward,
  isBusy,
  onUnlock,
}: {
  reward: JourneyReward;
  isBusy: boolean;
  onUnlock: (rewardKey: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  if (!reward.isUnlocked) {
    return (
      <PremiumCard className="w-full p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <LockKeyhole size={19} strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-tight text-[#fffaf2]">{reward.title}</p>
            {reward.subtitle ? <p className="mt-2 text-sm leading-6 text-[#fffaf2]/62">{reward.subtitle}</p> : null}
          </div>
        </div>
        <div className="mt-5">
          <PrimaryActionButton disabled={isBusy} onClick={() => onUnlock(reward.rewardKey)}>
            {isBusy ? "Açılıyor" : "Ödülü Aç"}
            <Sparkles size={18} strokeWidth={1.7} />
          </PrimaryActionButton>
        </div>
      </PremiumCard>
    );
  }

  return (
    <RevealAnimation>
      <PremiumCard className="w-full p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <Sparkles size={19} strokeWidth={1.6} />
          </div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-3 py-1 text-xs font-medium text-[#f4dcc0]/88"
          >
            Açıldı
          </motion.div>
        </div>
        {reward.imageUrl ? (
          <div className="mb-5 overflow-hidden rounded-[8px] border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="aspect-[4/5] w-full object-cover" src={reward.imageUrl} alt={reward.title} />
          </div>
        ) : null}
        {reward.videoUrl ? (
          <div className="mb-5 overflow-hidden rounded-[8px] border border-white/10 bg-black/24">
            <video className="aspect-[4/5] w-full object-cover" src={reward.videoUrl} controls playsInline preload="metadata" />
          </div>
        ) : null}
        <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{reward.title}</p>
        {reward.subtitle ? <p className="mt-3 text-sm font-medium text-[#f4dcc0]/82">{reward.subtitle}</p> : null}
        {reward.body ? <p className="mt-4 text-base leading-7 text-[#fffaf2]/72">{reward.body}</p> : null}
      </PremiumCard>
    </RevealAnimation>
  );
}
