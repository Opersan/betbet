"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSceneRevealMotion } from "@/components/scene/AnimatedPageTransition";

export function SideArrowNavigation({
  onPrevious,
  onNext,
}: {
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const navigationReveal = useSceneRevealMotion("navigation", { opacityOnly: true });

  return (
    <>
      {onPrevious ? (
        <motion.button
          {...navigationReveal}
          className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#fffaf2]/70 backdrop-blur sm:flex"
          type="button"
          onClick={onPrevious}
          aria-label="Önceki sahne"
        >
          <ChevronLeft size={20} strokeWidth={1.6} />
        </motion.button>
      ) : null}
      {onNext ? (
        <motion.button
          {...navigationReveal}
          className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#fffaf2]/70 backdrop-blur sm:flex"
          type="button"
          onClick={onNext}
          aria-label="Sonraki sahne"
        >
          <ChevronRight size={20} strokeWidth={1.6} />
        </motion.button>
      ) : null}
    </>
  );
}
