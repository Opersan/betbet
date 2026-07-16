"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { getChapterLabel } from "@/lib/journey/chapters";
import { cn } from "@/lib/utils";

type ChapterRevealSceneProps = {
  chapterNumber: number;
  title: string;
  subtitle?: string | null;
  onComplete: () => void;
  direction: "forward" | "backward";
  allowSkip: boolean;
  previewMode: boolean;
  embeddedViewport?: boolean;
};

type RevealPhase = "revealing" | "content-exit" | "curtain-exit";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

export function ChapterRevealScene({
  chapterNumber,
  title,
  subtitle,
  onComplete,
  direction,
  allowSkip,
  previewMode,
  embeddedViewport = false,
}: ChapterRevealSceneProps) {
  const reduceMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<RevealPhase>("revealing");
  const [canSkip, setCanSkip] = useState(previewMode && allowSkip);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const completeOnce = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    onCompleteRef.current();
  }, [clearTimers]);

  useEffect(() => {
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timersRef.current.push(timer);
    };

    if (allowSkip && !previewMode) {
      schedule(() => setCanSkip(true), 900);
    }

    if (reduceMotion) {
      schedule(() => setPhase("content-exit"), 650);
      schedule(() => setPhase("curtain-exit"), 800);
      schedule(completeOnce, 1050);
    } else {
      schedule(() => setPhase("content-exit"), 2900);
      schedule(() => setPhase("curtain-exit"), 3600);
      schedule(completeOnce, 4200);
    }

    return clearTimers;
  }, [allowSkip, clearTimers, completeOnce, previewMode, reduceMotion]);

  const finishEarly = useCallback(() => {
    if (!allowSkip || !canSkip || completedRef.current || isSkipping) return;

    clearTimers();
    setIsSkipping(true);
    setPhase("content-exit");

    const curtainTimer = window.setTimeout(() => setPhase("curtain-exit"), reduceMotion ? 40 : 90);
    const completeTimer = window.setTimeout(completeOnce, reduceMotion ? 240 : 380);
    timersRef.current.push(curtainTimer, completeTimer);
  }, [allowSkip, canSkip, clearTimers, completeOnce, isSkipping, reduceMotion]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      finishEarly();
    },
    [finishEarly],
  );

  const titleLengthClass =
    title.trim().length > 64
      ? "text-[clamp(1.75rem,7.8vw,4.6rem)]"
      : title.trim().length > 36
        ? "text-[clamp(2rem,9vw,5.5rem)]"
        : "text-[clamp(2.4rem,11vw,6.6rem)]";
  const contentIsVisible = phase === "revealing";
  const curtainIsReleasing = phase === "curtain-exit";
  const entranceY = direction === "backward" ? -16 : 16;

  return (
    <div
      className={cn(
        "relative isolate flex w-full cursor-default items-center justify-center overflow-hidden bg-[#020203] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-center outline-none",
        embeddedViewport ? "h-full min-h-full" : "min-h-[100dvh]",
      )}
      onPointerUp={finishEarly}
      onKeyDown={handleKeyDown}
      role={allowSkip ? "button" : undefined}
      tabIndex={allowSkip ? 0 : -1}
      aria-label={`${getChapterLabel(chapterNumber)}. ${title}. ${canSkip ? "Devam etmek için dokunun." : "Jenerik oynatılıyor."}`}
      data-preview-mode={previewMode ? "true" : "false"}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[#08080a]"
        initial={{ opacity: 1 }}
        animate={{ opacity: curtainIsReleasing ? 0 : 1 }}
        transition={{
          duration: curtainIsReleasing ? (isSkipping ? 0.28 : reduceMotion ? 0.25 : 0.6) : 0,
          ease: cinematicEase,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.032] mix-blend-screen"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 18% 23%, rgba(255,255,255,0.52) 0 0.45px, transparent 0.7px 3px), repeating-linear-gradient(97deg, transparent 0 4px, rgba(255,255,255,0.08) 5px 6px)",
          backgroundSize: "5px 5px, 11px 11px",
        }}
      />

      <AnimatePresence mode="wait">
        {contentIsVisible ? (
          <motion.div
            key="chapter-copy"
            className="relative z-10 flex w-full max-w-[64rem] flex-col items-center"
            initial={false}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0.18 : isSkipping ? 0.24 : 0.7, ease: cinematicEase }}
          >
            <motion.p
              className="text-[0.7rem] font-medium uppercase tracking-[0.38em] text-[#e7cfad]/82 sm:text-xs"
              initial={{ opacity: 0, filter: reduceMotion ? "blur(0px)" : "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{
                delay: reduceMotion ? 0.08 : 0.5,
                duration: reduceMotion ? 0.22 : 0.7,
                ease: cinematicEase,
              }}
            >
              {getChapterLabel(chapterNumber)}
            </motion.p>

            <motion.div
              className="mt-5 h-px w-20 origin-center bg-[#d5b98d]/62 sm:w-24"
              initial={{ opacity: 0, scaleX: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                delay: reduceMotion ? 0.12 : 0.9,
                duration: reduceMotion ? 0.2 : 0.6,
                ease: cinematicEase,
              }}
              aria-hidden="true"
            />

            <motion.h1
              className={`mt-7 max-w-[min(92vw,62rem)] break-words font-semibold uppercase leading-[0.98] tracking-[-0.035em] text-[#f6f0e7] [overflow-wrap:anywhere] ${titleLengthClass}`}
              initial={{
                opacity: 0,
                y: reduceMotion ? 0 : entranceY,
                scale: reduceMotion ? 1 : 0.975,
                filter: reduceMotion ? "blur(0px)" : "blur(12px)",
              }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{
                delay: reduceMotion ? 0.14 : 1.1,
                duration: reduceMotion ? 0.3 : 1.2,
                ease: cinematicEase,
              }}
            >
              {title}
            </motion.h1>

            {subtitle?.trim() ? (
              <motion.p
                className="mt-6 max-w-[34rem] text-[clamp(0.84rem,3.6vw,1.05rem)] leading-7 tracking-[0.035em] text-[#efe5d6]/58"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduceMotion ? 0.2 : 1.8,
                  duration: reduceMotion ? 0.3 : 1,
                  ease: cinematicEase,
                }}
              >
                {subtitle}
              </motion.p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {allowSkip && canSkip && contentIsVisible && !reduceMotion ? (
          <motion.p
            className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-[0.58rem] uppercase tracking-[0.24em] text-[#efe5d6]/28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: cinematicEase }}
            aria-hidden="true"
          >
            dokunarak geç
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
