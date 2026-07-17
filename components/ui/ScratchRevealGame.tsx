"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Eye, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { JourneyMiniGame } from "@/lib/journey/types";
import { readScratchRevealConfig } from "@/lib/journey/standard-mini-game-config";
import { PositionedImage } from "./PositionedImage";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

type CompleteMiniGameParams = {
  gameKey?: string;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
};

type Point = {
  x: number;
  y: number;
};

export function ScratchRevealGame({
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
  const config = useMemo(() => readScratchRevealConfig(game.config), [game.config]);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointer = useRef<number | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const scratchSegments = useRef(0);
  const progressRef = useRef(isCompleted ? 100 : 0);
  const completedRef = useRef(isCompleted);
  const [progress, setProgress] = useState(isCompleted ? 100 : 0);
  const [revealed, setRevealed] = useState(isCompleted);
  const [submitted, setSubmitted] = useState(isCompleted);

  const isRevealed = isCompleted || revealed;
  const displayProgress = isCompleted ? 100 : progress;

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || isRevealed) return;

    function drawCover() {
      if (!stage || !canvas) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.globalCompositeOperation = "source-over";
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#4b354a");
      gradient.addColorStop(0.52, "#2c2132");
      gradient.addColorStop(1, "#18131e");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "rgba(244, 220, 192, 0.14)";
      context.lineWidth = Math.max(1, pixelRatio);
      for (let offset = -canvas.height; offset < canvas.width; offset += 34 * pixelRatio) {
        context.beginPath();
        context.moveTo(offset, 0);
        context.lineTo(offset + canvas.height, canvas.height);
        context.stroke();
      }

      activePointer.current = null;
      lastPoint.current = null;
      scratchSegments.current = 0;
      progressRef.current = 0;
      setProgress(0);
    }

    drawCover();
    const observer = new ResizeObserver(drawCover);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [isRevealed]);

  function finishReveal(method: "scratch" | "button", measuredProgress: number) {
    if (completedRef.current || submitted || isCompleted) return;
    completedRef.current = true;
    activePointer.current = null;
    lastPoint.current = null;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    progressRef.current = 100;
    setProgress(100);
    setRevealed(true);
    setSubmitted(true);
    onComplete({
      gameKey: game.gameKey,
      score: 1,
      rewardKey: game.rewardKey,
      payload: {
        gameType: "scratch_reveal",
        mode: "same_phone_scratch_reveal",
        revealMethod: method,
        revealPercent: Math.round(measuredProgress),
        revealTitle: config.revealTitle,
        completedAt: new Date().toISOString(),
      },
    });
  }

  function measureReveal(force = false) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context || completedRef.current) return;
    if (!force && scratchSegments.current % 8 !== 0) return;

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const sampleStep = Math.max(4, Math.round(Math.min(canvas.width, canvas.height) / 55));
    let transparent = 0;
    let sampled = 0;
    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        sampled += 1;
        if (pixels[(y * canvas.width + x) * 4 + 3] < 64) transparent += 1;
      }
    }

    const nextProgress = sampled > 0 ? (transparent / sampled) * 100 : 0;
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    if (nextProgress >= config.successThreshold) finishReveal("scratch", nextProgress);
  }

  function getCanvasPoint(event: ReactPointerEvent<HTMLCanvasElement>): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function eraseDot(point: Point) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const radius = Math.max(22, Math.min(canvas.width, canvas.height) * 0.07);
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function startScratch(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (isRevealed || submitted || isSubmitting || activePointer.current !== null) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = event.pointerId;
    lastPoint.current = point;
    eraseDot(point);
    scratchSegments.current += 1;
    measureReveal();
  }

  function continueScratch(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId || isRevealed || submitted || isSubmitting) return;
    const point = getCanvasPoint(event);
    const previousPoint = lastPoint.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!point || !previousPoint || !canvas || !context) return;

    context.save();
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Math.max(42, Math.min(canvas.width, canvas.height) * 0.14);
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
    lastPoint.current = point;
    scratchSegments.current += 1;
    measureReveal();
  }

  function stopScratch(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    lastPoint.current = null;
    measureReveal(true);
  }

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {isRevealed ? <Check size={21} strokeWidth={1.8} /> : <Sparkles size={21} strokeWidth={1.6} />}
        </div>
        <div className="text-right text-xs leading-5 text-[#fffaf2]/62" aria-live="polite">
          {isRevealed ? "Sürpriz açıldı" : `Kazınan alan: %${Math.round(displayProgress)}`}
        </div>
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game.title || "Kazı ve Sürprizi Aç"}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {game.instructions || "Parmağınla alanı kazı ve altındaki sürprizi ortaya çıkar."}
      </p>

      <motion.div
        ref={stageRef}
        animate={isRevealed && !reduceMotion ? { opacity: [0.82, 1], scale: [0.985, 1] } : undefined}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-6 overflow-hidden rounded-[8px] border border-[#f4dcc0]/22 bg-[#120e17]"
        aria-label={`Kazıma alanı. Açılma oranı yüzde ${Math.round(displayProgress)}.`}
      >
        <div className="min-h-56 bg-[linear-gradient(145deg,rgba(244,220,192,0.14),rgba(217,167,160,0.05))]">
          {config.imageUrl ? (
            <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10">
              <PositionedImage value={config.imageUrl} alt={config.imageAlt} className="object-cover" draggable={false} />
            </div>
          ) : null}
          <div className="p-5">
            <p className="text-xl font-semibold leading-tight text-[#fffaf2]">{config.revealTitle}</p>
            <p className="mt-3 text-sm leading-6 text-[#fffaf2]/72">{config.revealText}</p>
          </div>
        </div>

        {!isRevealed ? (
          <>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
              aria-label={config.coverLabel}
              onPointerDown={startScratch}
              onPointerMove={continueScratch}
              onPointerUp={stopScratch}
              onPointerCancel={stopScratch}
              onLostPointerCapture={stopScratch}
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold leading-6 text-[#fffaf2]"
              style={{ opacity: Math.max(0, 1 - progress / 14) }}
              aria-hidden="true"
            >
              <span className="max-w-48 rounded-[8px] border border-white/16 bg-[#17111d]/88 px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.24)]">
                {config.coverLabel}
              </span>
            </div>
          </>
        ) : null}
      </motion.div>

      <p className="mt-4 min-h-6 text-center text-sm leading-6 text-[#f4dcc0]/76" aria-live="polite">
        {isRevealed ? config.completionText : `Alanı en az %${config.successThreshold} oranında kazı.`}
      </p>

      {!isRevealed ? (
        <div className="mt-3">
          <PrimaryActionButton disabled={submitted || isSubmitting} onClick={() => finishReveal("button", 100)}>
            {isSubmitting ? "Kaydediliyor" : config.revealButtonLabel}
            <Eye size={18} strokeWidth={1.7} />
          </PrimaryActionButton>
        </div>
      ) : null}
    </PremiumCard>
  );
}
