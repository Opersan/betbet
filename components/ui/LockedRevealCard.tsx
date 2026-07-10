"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LockKeyhole, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { RevealAnimation } from "./RevealAnimation";

export function LockedRevealCard({
  title,
  content,
  isRevealed,
  onReveal,
  unlockCondition,
  lockedLabel = "Henüz Zamanı Değil",
}: {
  title: string;
  content?: string | null;
  isRevealed: boolean;
  onReveal?: () => void;
  unlockCondition?: string | null;
  lockedLabel?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <PremiumCard
      className={cn(
        "w-full p-6 transition duration-500",
        isRevealed && "border-[#f4dcc0]/24 shadow-[0_22px_90px_rgba(217,167,160,0.18),inset_0_1px_0_rgba(255,255,255,0.16)]",
      )}
    >
      {!isRevealed ? (
        <div className="min-h-[18rem]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <LockKeyhole size={21} strokeWidth={1.6} />
          </div>
          <div className="relative select-none overflow-hidden rounded-[8px] border border-white/8 bg-white/[0.035] p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_10%,rgba(244,220,192,0.16),transparent_34%)]" />
            <div className="relative opacity-90">
              <p className="text-3xl font-semibold leading-tight text-[#fffaf2]">Henüz zamanı değil.</p>
              <p className="mt-5 text-base leading-7 text-[#fffaf2]/70">
                Bu sayfa zamanı geldiğinde ya da küçük görevi tamamlayınca açılacak.
              </p>
            </div>
          </div>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-sm leading-6 text-[#f4dcc0]/72"
          >
            {unlockCondition ?? "Açılacağı ana kadar bu bölüm kapalı kalacak."}
          </motion.p>
          <div className="mt-7">
            <PrimaryActionButton disabled onClick={onReveal}>
              {lockedLabel}
              <LockKeyhole size={18} strokeWidth={1.7} />
            </PrimaryActionButton>
          </div>
        </div>
      ) : (
        <RevealAnimation>
          <div className="min-h-[18rem]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
              <Sparkles size={21} strokeWidth={1.6} />
            </div>
            <p className="text-3xl font-semibold leading-tight text-[#fffaf2]">{title}</p>
            {content ? <p className="mt-5 text-lg leading-8 text-[#fffaf2]/80">{content}</p> : null}
          </div>
        </RevealAnimation>
      )}
    </PremiumCard>
  );
}
