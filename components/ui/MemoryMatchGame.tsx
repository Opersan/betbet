"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { JourneyMiniGame } from "@/lib/journey/types";
import { readMemoryMatchConfig, type MemoryMatchPair } from "@/lib/journey/standard-mini-game-config";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";

type CompleteMiniGameParams = {
  gameKey?: string;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
};

type MemoryCardItem = MemoryMatchPair & {
  cardId: string;
};

export function MemoryMatchGame({
  game,
  isCompleted,
  isSubmitting,
  onComplete,
}: {
  game: JourneyMiniGame;
  isCompleted: boolean;
  isSubmitting: boolean;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const reduceMotion = useReducedMotion();
  const config = useMemo(() => readMemoryMatchConfig(game.config), [game.config]);
  const [round, setRound] = useState(0);
  const deck = useMemo(() => createDeck(config.pairs, `${game.id}:${round}`), [config.pairs, game.id, round]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>(() => isCompleted ? config.pairs.map((pair) => pair.id) : []);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [submitted, setSubmitted] = useState(isCompleted);
  const mismatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = isCompleted || matchedIds.length === config.pairs.length;

  useEffect(() => {
    return () => {
      if (mismatchTimer.current) clearTimeout(mismatchTimer.current);
    };
  }, []);

  function flipCard(index: number) {
    const card = deck[index];
    if (!card || done || submitted || isSubmitting || isLocked || matchedIds.includes(card.id) || openIndexes.includes(index)) return;

    if (openIndexes.length === 0) {
      setOpenIndexes([index]);
      return;
    }

    const firstIndex = openIndexes[0];
    const firstCard = deck[firstIndex];
    if (!firstCard) {
      setOpenIndexes([index]);
      return;
    }

    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (firstCard.id === card.id) {
      const nextMatchedIds = [...matchedIds, card.id];
      setMatchedIds(nextMatchedIds);
      setOpenIndexes([]);

      if (nextMatchedIds.length === config.pairs.length) {
        setSubmitted(true);
        onComplete({
          gameKey: game.gameKey,
          score: config.pairs.length,
          rewardKey: game.rewardKey,
          payload: {
            gameType: "memory_match",
            mode: "same_phone_memory_match",
            matchedPairs: nextMatchedIds,
            pairCount: config.pairs.length,
            moves: nextMoves,
            completedAt: new Date().toISOString(),
          },
        });
      }
      return;
    }

    setOpenIndexes([firstIndex, index]);
    setIsLocked(true);
    mismatchTimer.current = setTimeout(() => {
      setOpenIndexes([]);
      setIsLocked(false);
      mismatchTimer.current = null;
    }, reduceMotion ? 350 : 720);
  }

  function resetBoard() {
    if (done || isSubmitting) return;
    if (mismatchTimer.current) clearTimeout(mismatchTimer.current);
    mismatchTimer.current = null;
    setOpenIndexes([]);
    setMatchedIds([]);
    setMoves(0);
    setIsLocked(false);
    setSubmitted(false);
    setRound((current) => current + 1);
  }

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {done ? <Check size={21} strokeWidth={1.8} /> : <Sparkles size={21} strokeWidth={1.6} />}
        </div>
        <div className="text-right text-xs leading-5 text-[#fffaf2]/62" aria-live="polite">
          <p>{isCompleted ? config.pairs.length : matchedIds.length} / {config.pairs.length} eşleşme</p>
          <p>{moves} hamle</p>
        </div>
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game.title || "Anıları Eşleştir"}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {game.instructions || "Kartları ikişer ikişer aç ve aynı anıları bul."}
      </p>

      <div className={cn("mt-6 grid gap-2", config.pairs.length === 6 ? "grid-cols-3" : "grid-cols-4")}>
        {deck.map((card, index) => {
          const isMatched = matchedIds.includes(card.id);
          const isFaceUp = isMatched || openIndexes.includes(index) || isCompleted;
          return (
            <motion.button
              key={card.cardId}
              animate={isFaceUp && !reduceMotion ? { scale: [1, 0.96, 1] } : undefined}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative flex min-h-24 items-center justify-center rounded-[8px] border p-2 text-center text-xs font-semibold leading-4 transition-colors active:scale-[0.98]",
                isFaceUp
                  ? "border-[#f4dcc0]/34 bg-[#f4dcc0]/14 text-[#fffaf2]"
                  : "border-white/12 bg-white/[0.07] text-[#f4dcc0] hover:bg-white/[0.1]",
                isMatched && "border-[#f4dcc0]/48 bg-[#f4dcc0]/20",
              )}
              type="button"
              aria-label={isFaceUp ? `${card.label}. ${isMatched ? config.matchedLabel : "Açık"}` : config.backLabel}
              aria-pressed={isFaceUp}
              disabled={done || submitted || isSubmitting || isLocked || isMatched || openIndexes.includes(index)}
              onClick={() => flipCard(index)}
            >
              {isFaceUp ? (
                <span>
                  {card.label}
                  {isMatched ? <Check className="mx-auto mt-2" size={15} strokeWidth={1.9} aria-hidden="true" /> : null}
                </span>
              ) : (
                <Sparkles size={19} strokeWidth={1.5} aria-hidden="true" />
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-4 min-h-6 text-center text-sm leading-6 text-[#f4dcc0]/76" aria-live="polite">
        {done ? config.completionText : isLocked ? "Bu ikisi eşleşmedi. Kartlar kapanıyor." : "Aynı iki kartı bul."}
      </p>

      {!done ? (
        <button
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/84 transition hover:bg-white/[0.1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
          type="button"
          disabled={isSubmitting}
          onClick={resetBoard}
        >
          <RotateCcw size={17} strokeWidth={1.7} />
          Kartları Karıştır
        </button>
      ) : null}
    </PremiumCard>
  );
}

function createDeck(pairs: MemoryMatchPair[], seed: string): MemoryCardItem[] {
  const cards = pairs.flatMap((pair) => [
    { ...pair, cardId: `${pair.id}-a` },
    { ...pair, cardId: `${pair.id}-b` },
  ]);
  const random = createSeededRandom(seed);

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [cards[index], cards[target]] = [cards[target], cards[index]];
  }
  return cards;
}

function createSeededRandom(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
