"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

export function TaskCard({
  title,
  isCompleted,
  onComplete,
}: {
  title: string;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <PremiumCard
      className={cn(
        "w-full p-6 transition duration-500",
        isCompleted && "border-[#f4dcc0]/24 shadow-[0_22px_90px_rgba(217,167,160,0.16),inset_0_1px_0_rgba(255,255,255,0.14)]",
      )}
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
        <motion.span
          key={isCompleted ? "completed" : "waiting"}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.82, rotate: isCompleted ? -8 : 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex"
        >
          {isCompleted ? <Check size={21} strokeWidth={1.8} /> : <HeartHandshake size={21} strokeWidth={1.6} />}
        </motion.span>
      </div>
      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{title}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {isCompleted
          ? "Bu an kaybolmadı. Şimdi hikayenin bir sonraki ışığına geçebiliriz."
          : "Acele etme. Bu sahne küçük ama hikayenin içinde senin yerin olsun diye var."}
      </p>
      <div className="mt-7">
        <PrimaryActionButton
          onClick={onComplete}
          disabled={isCompleted}
          className={isCompleted ? "bg-[#f4dcc0]/88 shadow-[0_18px_45px_rgba(244,220,192,0.16)]" : undefined}
        >
          {isCompleted ? "Bu anı sakladık" : "Tamamladım"}
          <Check size={18} strokeWidth={1.8} />
        </PrimaryActionButton>
      </div>
    </PremiumCard>
  );
}
