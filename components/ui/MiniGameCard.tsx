"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { JourneyMiniGame, JourneyScene } from "@/lib/journey/types";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

export function MiniGameCard({
  scene,
  isSubmitting,
  onComplete,
}: {
  scene: JourneyScene;
  isSubmitting: boolean;
  onComplete: (params: {
    gameKey?: string;
    score?: number | null;
    rewardKey?: string | null;
    payload?: Record<string, unknown>;
  }) => void;
}) {
  const reduceMotion = useReducedMotion();
  const game = scene.miniGame;
  const labels = useMemo(() => getLabels(game), [game]);
  const sequence = useMemo(() => getSequence(game, labels), [game, labels]);
  const [step, setStep] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isCompleted = scene.progressIsCompleted || scene.taskResponse?.type === "mini_game";
  const done = isCompleted || step >= sequence.length;

  function handleTap(value: string) {
    if (done || isSubmitting || submitted) return;

    if (value !== sequence[step]) {
      setStep(0);
      setMistake(true);
      return;
    }

    setMistake(false);
    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep >= sequence.length) {
      setSubmitted(true);
      onComplete({
        gameKey: game?.gameKey,
        score: getSuccessScore(game, sequence.length),
        rewardKey: game?.rewardKey,
        payload: {
          gameType: game?.type,
          sequence,
          finishedAt: new Date().toISOString(),
        },
      });
    }
  }

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {done ? <Check size={21} strokeWidth={1.8} /> : <Sparkles size={21} strokeWidth={1.6} />}
        </div>
        <div className="rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-3 py-1 text-xs font-medium text-[#f4dcc0]/88">
          {done ? "Oyun tamamlandı" : `${Math.min(step, sequence.length)} / ${sequence.length}`}
        </div>
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game?.title ?? scene.title}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {game?.instructions ?? "Küçük oyunu tamamla, sahnenin ödülü açılsın."}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {labels.map((item) => {
          const isActive = sequence[Math.max(step - 1, 0)] === item.value && step > 0;
          return (
            <button
              key={item.value}
              className={cn(
                "flex aspect-square min-h-20 flex-col items-center justify-center rounded-[8px] border border-white/12 bg-white/[0.07] text-sm font-semibold text-[#fffaf2]/82 transition active:translate-y-px",
                isActive && "border-[#f4dcc0]/38 bg-[#f4dcc0]/14 text-[#f4dcc0]",
                done && "opacity-70",
              )}
              type="button"
              disabled={done || isSubmitting}
              onClick={() => handleTap(item.value)}
            >
              <motion.span
                animate={isActive && !reduceMotion ? { scale: [1, 1.08, 1] } : undefined}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mb-2 h-3 w-3 rounded-full bg-[#f4dcc0]/70 shadow-[0_0_20px_rgba(244,220,192,0.32)]"
              />
              {item.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 min-h-6 text-center text-sm leading-6 text-[#f4dcc0]/72">
        {mistake ? "Sıra kaydı. Baştan, sakin sakin." : done ? "Küçük kilit açıldı." : "Işıkları doğru sırayla yak."}
      </p>

      <div className="mt-5">
        <PrimaryActionButton
          disabled={!done || isSubmitting || submitted || isCompleted}
          onClick={() =>
            onComplete({
              gameKey: game?.gameKey,
              score: getSuccessScore(game, sequence.length),
              rewardKey: game?.rewardKey,
              payload: { replayedAt: new Date().toISOString(), sequence },
            })
          }
        >
          {isSubmitting ? "Kaydediliyor" : isCompleted ? "Ödül Açıldı" : done ? "Ödülü Aç" : "Sırayı Tamamla"}
          <Sparkles size={18} strokeWidth={1.7} />
        </PrimaryActionButton>
      </div>
    </PremiumCard>
  );
}

function getLabels(game: JourneyMiniGame | null | undefined) {
  const labels = Array.isArray(game?.config.labels) ? game.config.labels : ["Gül", "Işık", "Gece"];
  const sequence = Array.isArray(game?.config.sequence) ? game.config.sequence : ["rose", "champagne", "deep"];

  return sequence.slice(0, 3).map((value, index) => ({
    value: typeof value === "string" ? value : `step-${index}`,
    label: typeof labels[index] === "string" ? labels[index] : `Işık ${index + 1}`,
  }));
}

function getSequence(game: JourneyMiniGame | null | undefined, fallbackLabels: Array<{ value: string }>) {
  const sequence = Array.isArray(game?.config.sequence) ? game.config.sequence : fallbackLabels.map((item) => item.value);
  return sequence.map((value) => (typeof value === "string" ? value : "")).filter(Boolean);
}

function getSuccessScore(game: JourneyMiniGame | null | undefined, fallback: number) {
  return typeof game?.config.successScore === "number" ? game.config.successScore : fallback;
}
