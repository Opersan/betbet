"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import type { JourneyScene } from "@/lib/journey/types";
import { PremiumCard } from "./PremiumCard";

export function FinalSurpriseCard({ scene }: { scene: JourneyScene }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <PremiumCard className="w-full p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <Heart size={21} strokeWidth={1.6} />
          </div>
          <Sparkles className="text-[#d9a7a0]" size={22} strokeWidth={1.5} />
        </div>
        <p className="text-[2.35rem] font-semibold leading-[1.02] text-[#fffaf2]">{scene.title}</p>
        {scene.content ? <p className="mt-6 text-lg leading-8 text-[#fffaf2]/78">{scene.content}</p> : null}
        <div className="mt-8 rounded-[8px] border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 p-4 text-sm leading-6 text-[#f4dcc0]">
          Bu ekran final değil. Bu anın devamı gerçek hayatta.
        </div>
      </PremiumCard>
    </motion.div>
  );
}
