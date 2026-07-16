"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  createProgressivePenaltyPlan,
  getProgressivePenaltyFingerprint,
  parseProgressivePenaltyResult,
  validateProgressivePenaltyConfig,
  type ProgressivePenaltyConfig,
  type ProgressivePenaltyResult,
  type ProgressivePenaltyRoundResult,
} from "@/lib/journey/progressive-penalty";
import type { JourneyMiniGame, JourneyScene } from "@/lib/journey/types";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

type CompleteMiniGameParams = {
  gameKey?: string;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
};

type GameState = {
  version: 1;
  fingerprint: string;
  plan: Array<0 | 1>;
  currentRound: number;
  phase: "closed" | "revealed" | "completed";
  results: ProgressivePenaltyRoundResult[];
};

export function ProgressivePenaltyGame({
  scene,
  game,
  isSubmitting,
  persistenceScope,
  onComplete,
}: {
  scene: JourneyScene;
  game: JourneyMiniGame;
  isSubmitting: boolean;
  persistenceScope?: string;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const reduceMotion = useReducedMotion();
  const submittedRef = useRef(false);
  const validation = useMemo(() => validateProgressivePenaltyConfig(game.config), [game.config]);
  const config = validation.config;
  const fingerprint = useMemo(() => config ? getProgressivePenaltyFingerprint(config) : "invalid", [config]);
  const storageKey = `betbet:progressive-penalty:${persistenceScope ?? "journey"}:${scene.slug}:${game.gameKey}:${fingerprint}`;
  const backendResult = useMemo(
    () => parseProgressivePenaltyResult(scene.taskResponse?.payload),
    [scene.taskResponse?.payload],
  );
  const hasCompletedBackendState = Boolean(scene.taskResponse?.type === "mini_game" || scene.progressIsCompleted);
  const [state, setState] = useState<GameState | null>(null);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    submittedRef.current = Boolean(backendResult || hasCompletedBackendState);
    setPersistenceError(null);
    if (!config || hasCompletedBackendState) {
      setState(null);
      setHydratedKey(storageKey);
      if (hasCompletedBackendState) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // Backend sonucu otoritatiftir; yerel kaydın temizlenememesi tamamlanmış görünümü engellemez.
        }
      }
      return;
    }

    const stored = readStoredState(storageKey, fingerprint, config);
    if (stored.error) setPersistenceError(stored.error);
    setState(stored.state ?? (stored.error ? null : createInitialState(fingerprint, config.rounds.length)));
    setHydratedKey(storageKey);
  }, [backendResult, config, fingerprint, hasCompletedBackendState, storageKey]);

  useEffect(() => {
    if (!config || backendResult || !state || hydratedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      setPersistenceError("Oyun planı bu cihazda güvenli biçimde saklanamadı. Oyun başlatılmadı.");
    }
  }, [backendResult, config, hydratedKey, state, storageKey]);

  if (!config) {
    return <InvalidConfigCard errors={validation.errors} />;
  }

  if (backendResult) {
    return <CompletedSummary config={config} result={backendResult} />;
  }

  if (scene.taskResponse?.type === "mini_game") {
    return <InvalidConfigCard errors={["Tamamlanmış Progressive Penalty sonucu eksik veya geçersiz."]} />;
  }

  if (scene.progressIsCompleted) {
    return <CompletedFallbackSummary config={config} />;
  }

  if (persistenceError) {
    return <InvalidConfigCard errors={[persistenceError]} />;
  }

  if (!state || hydratedKey !== storageKey) {
    return (
      <PremiumCard className="w-full p-6" aria-live="polite">
        <div className="h-2 w-28 animate-pulse rounded-full bg-[#f4dcc0]/30" />
        <p className="mt-4 text-sm text-[#fffaf2]/60">Oyun hazırlanıyor…</p>
      </PremiumCard>
    );
  }

  if (state.phase === "completed") {
    return <CompletedSummary config={config} result={buildResult(config, state.results)} />;
  }

  const round = config.rounds[state.currentRound];
  const loserIndex = state.plan[state.currentRound];
  const roundResult: ProgressivePenaltyRoundResult = {
    ...round,
    loser: config.players[loserIndex],
    winner: config.players[loserIndex === 0 ? 1 : 0],
  };

  function revealCards() {
    if (!state || state.phase !== "closed") return;
    setState((current) => current ? { ...current, phase: "revealed" } : current);
  }

  function confirmPenalty() {
    if (!state || state.phase !== "revealed" || isSubmitting || submittedRef.current) return;
    const results = [...state.results, roundResult];
    const isLastRound = state.currentRound === config.rounds.length - 1;

    if (!isLastRound) {
      setState({ ...state, results, currentRound: state.currentRound + 1, phase: "closed" });
      return;
    }

    submittedRef.current = true;
    setState({ ...state, results, phase: "completed" });
    onComplete({
      gameKey: game.gameKey,
      score: results.length,
      rewardKey: game.rewardKey,
      payload: buildResult(config, results),
    });
  }

  return (
    <PremiumCard className="w-full bg-[radial-gradient(circle_at_top,rgba(217,167,160,0.13),transparent_43%),rgba(13,9,18,0.92)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#fffaf2]/48">{game.title}</p>
          <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#f4dcc0]/62">
            Tur {state.currentRound + 1} / {config.rounds.length}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#fffaf2]">{round.title}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#fffaf2]/42">{round.kind}</p>
          {game.instructions ? <p className="mt-3 max-w-xl text-sm leading-5 text-[#fffaf2]/58">{game.instructions}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/8 text-[#f4dcc0]">
          <Sparkles size={18} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4" aria-live="polite">
        {config.players.map((player, playerIndex) => {
          const isRevealed = state.phase !== "closed";
          const isPenalty = loserIndex === playerIndex;
          if (reduceMotion) {
            return (
              <motion.div
                key={player}
                role="group"
                aria-label={`${player}: ${isRevealed ? (isPenalty ? "Ceza" : "Güvendesin") : "kapalı kart"}`}
                initial={false}
                animate={{ opacity: isRevealed ? 1 : 0.86 }}
                transition={{ duration: 0.18 }}
                className="relative min-h-52 sm:min-h-64"
              >
                <CardFace ariaHidden className={cn("absolute inset-0", isRevealed && (isPenalty ? "border-[#d9a7a0]/36 bg-[#6e3035]/24" : "border-emerald-200/20 bg-emerald-950/20"))}>
                  {isRevealed ? (
                    <>
                      {isPenalty ? <TriangleAlert size={28} className="text-[#f0b7c6]" aria-hidden="true" /> : <ShieldCheck size={28} className="text-emerald-200" aria-hidden="true" />}
                      <strong className="mt-4 break-words text-center text-lg font-semibold text-[#fffaf2] sm:text-xl">{player}</strong>
                      <span className={cn("mt-2 text-center text-sm font-medium", isPenalty ? "text-[#f0b7c6]" : "text-emerald-200")}>
                        {isPenalty ? "Ceza" : "Güvendesin"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[0.62rem] uppercase tracking-[0.24em] text-[#f4dcc0]/52">Oyuncu</span>
                      <strong className="mt-3 break-words text-center text-lg font-semibold text-[#fffaf2] sm:text-xl">{player}</strong>
                      <span className="mt-7 h-12 w-12 rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/8 p-3 text-center text-[#f4dcc0]">?</span>
                    </>
                  )}
                </CardFace>
              </motion.div>
            );
          }
          return (
            <motion.div
              key={player}
              role="group"
              aria-label={`${player}: ${isRevealed ? (isPenalty ? "Ceza" : "Güvendesin") : "kapalı kart"}`}
              initial={false}
              animate={reduceMotion ? { opacity: isRevealed ? 1 : 0.86 } : { rotateY: isRevealed ? 180 : 0 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-52 [transform-style:preserve-3d] sm:min-h-64"
            >
              <CardFace ariaHidden className="absolute inset-0 [backface-visibility:hidden]">
                <span className="text-[0.62rem] uppercase tracking-[0.24em] text-[#f4dcc0]/52">Oyuncu</span>
                <strong className="mt-3 break-words text-center text-lg font-semibold text-[#fffaf2] sm:text-xl">{player}</strong>
                <span className="mt-7 h-12 w-12 rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/8 p-3 text-center text-[#f4dcc0]">?</span>
              </CardFace>
              <CardFace
                ariaHidden
                className={cn(
                  "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]",
                  isPenalty ? "border-[#d9a7a0]/36 bg-[#6e3035]/24" : "border-emerald-200/20 bg-emerald-950/20",
                )}
              >
                {isPenalty ? <TriangleAlert size={28} className="text-[#f0b7c6]" aria-hidden="true" /> : <ShieldCheck size={28} className="text-emerald-200" aria-hidden="true" />}
                <strong className="mt-4 break-words text-center text-lg font-semibold text-[#fffaf2] sm:text-xl">{player}</strong>
                <span className={cn("mt-2 text-center text-sm font-medium", isPenalty ? "text-[#f0b7c6]" : "text-emerald-200")}>
                  {isPenalty ? "Ceza" : "Güvendesin"}
                </span>
              </CardFace>
            </motion.div>
          );
        })}
      </div>

      {state.phase !== "closed" ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-[8px] border border-[#f0b7c6]/18 bg-[#f0b7c6]/8 p-4"
          role="status"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f0b7c6]/72">{roundResult.loser} · Ceza</p>
          <p className="mt-2 text-base font-medium leading-6 text-[#fffaf2]">{round.penalty}</p>
        </motion.div>
      ) : null}

      <div className="mt-5">
        {state.phase === "closed" ? (
          <PrimaryActionButton onClick={revealCards}>{config.revealLabel}</PrimaryActionButton>
        ) : (
          <PrimaryActionButton disabled={isSubmitting} onClick={confirmPenalty}>
            <Check size={17} aria-hidden="true" />
            {state.currentRound === config.rounds.length - 1 ? config.completeLabel : config.confirmLabel}
          </PrimaryActionButton>
        )}
      </div>
    </PremiumCard>
  );
}

function CardFace({ className, children, ariaHidden = false }: { className?: string; children: ReactNode; ariaHidden?: boolean }) {
  return (
    <div aria-hidden={ariaHidden} className={cn("flex flex-col items-center justify-center rounded-[8px] border border-white/12 bg-[#17121e] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.25)]", className)}>
      {children}
    </div>
  );
}

function InvalidConfigCard({ errors }: { errors: string[] }) {
  return (
    <PremiumCard className="w-full border-amber-300/25 p-5" role="alert">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300/10 text-amber-200">
        <TriangleAlert size={20} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[#fffaf2]">Progressive Penalty config geçersiz</h2>
      <ul className="mt-3 space-y-1.5 text-sm leading-5 text-amber-100/75">
        {errors.map((error) => <li key={error}>• {error}</li>)}
      </ul>
    </PremiumCard>
  );
}

function CompletedSummary({ config, result }: { config: ProgressivePenaltyConfig; result: ProgressivePenaltyResult }) {
  return (
    <PremiumCard className="w-full bg-[radial-gradient(circle_at_top,rgba(217,167,160,0.15),transparent_48%),rgba(13,9,18,0.92)] p-6" aria-live="polite">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200/20 bg-emerald-200/10 text-emerald-200">
        <Check size={22} aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4dcc0]/62">Oyun tamamlandı</p>
      <h2 className="mt-2 text-2xl font-semibold text-[#fffaf2]">{result.completedRounds} / {config.rounds.length} tur tamamlandı</h2>
      <p className="mt-3 text-sm leading-6 text-[#fffaf2]/68">{config.finalText}</p>
      <div className="mt-5 rounded-[8px] border border-white/10 bg-white/[0.05] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-[#fffaf2]/42">Son tur</p>
        <p className="mt-2 font-medium text-[#fffaf2]">{result.lastRound.title}</p>
        <p className="mt-1 text-sm leading-6 text-[#f0b7c6]">{result.lastRound.loser}: {result.lastRound.penalty}</p>
      </div>
    </PremiumCard>
  );
}

function CompletedFallbackSummary({ config }: { config: ProgressivePenaltyConfig }) {
  return (
    <PremiumCard className="w-full bg-[radial-gradient(circle_at_top,rgba(217,167,160,0.15),transparent_48%),rgba(13,9,18,0.92)] p-6" aria-live="polite">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200/20 bg-emerald-200/10 text-emerald-200">
        <Check size={22} aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4dcc0]/62">Oyun tamamlandı</p>
      <h2 className="mt-2 text-2xl font-semibold text-[#fffaf2]">{config.rounds.length} / {config.rounds.length} tur tamamlandı</h2>
      <p className="mt-3 text-sm leading-6 text-[#fffaf2]/68">{config.finalText}</p>
      <p className="mt-4 text-xs leading-5 text-[#fffaf2]/42">Tur sonucu ayrıntısı bu görünümde bulunmuyor.</p>
    </PremiumCard>
  );
}

function createInitialState(fingerprint: string, roundCount: number): GameState {
  return {
    version: 1,
    fingerprint,
    plan: createProgressivePenaltyPlan(roundCount),
    currentRound: 0,
    phase: "closed",
    results: [],
  };
}

function readStoredState(key: string, fingerprint: string, config: ProgressivePenaltyConfig): { state: GameState | null; error: string | null } {
  try {
    const roundCount = config.rounds.length;
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) return { state: null, error: null };
    const value = JSON.parse(rawValue) as Partial<GameState> | null;
    if (!value || value.version !== 1 || value.fingerprint !== fingerprint) return { state: null, error: "Kaydedilmiş oyun planı geçersiz; mevcut dağılım değiştirilmeyecek." };
    if (!Array.isArray(value.plan) || value.plan.length !== roundCount || value.plan.some((item) => item !== 0 && item !== 1) || !isStrictPlan(value.plan as Array<0 | 1>)) return { state: null, error: "Kaydedilmiş ceza dengesi geçersiz; mevcut dağılım değiştirilmeyecek." };
    if (!Number.isInteger(value.currentRound) || (value.currentRound ?? -1) < 0 || (value.currentRound ?? roundCount) >= roundCount) return { state: null, error: "Kaydedilmiş tur konumu geçersiz." };
    const currentRound = value.currentRound as number;
    if (value.phase !== "closed" && value.phase !== "revealed" && value.phase !== "completed") return { state: null, error: "Kaydedilmiş oyun aşaması geçersiz." };
    if (!Array.isArray(value.results) || value.results.length > roundCount) return { state: null, error: "Kaydedilmiş tur sonuçları geçersiz." };
    const expectedResultCount = value.phase === "completed"
      ? roundCount
      : currentRound;
    if (value.results.length !== expectedResultCount) return { state: null, error: "Kaydedilmiş tur sonuçlarının sırası geçersiz." };
    for (let index = 0; index < value.results.length; index += 1) {
      const result = value.results[index];
      const configuredRound = config.rounds[index];
      const loserIndex = value.plan[index] as 0 | 1;
      if (
        !result ||
        result.id !== configuredRound.id ||
        result.title !== configuredRound.title ||
        result.kind !== configuredRound.kind ||
        result.penalty !== configuredRound.penalty ||
        result.loser !== config.players[loserIndex] ||
        result.winner !== config.players[loserIndex === 0 ? 1 : 0]
      ) return { state: null, error: "Kaydedilmiş tur sonucu config veya ceza planıyla eşleşmiyor." };
    }
    if (value.phase === "completed" && value.results.length !== roundCount) return { state: null, error: "Tamamlanmış oyun sonucu eksik." };
    return { state: value as GameState, error: null };
  } catch {
    return { state: null, error: "Kaydedilmiş oyun planı okunamadı; mevcut dağılım değiştirilmeyecek." };
  }
}

function isStrictPlan(plan: Array<0 | 1>): boolean {
  const firstLosses = plan.filter((playerIndex) => playerIndex === 0).length;
  const secondLosses = plan.length - firstLosses;
  return plan.length % 2 === 0 ? firstLosses === secondLosses : Math.abs(firstLosses - secondLosses) === 1;
}

function buildResult(config: ProgressivePenaltyConfig, rounds: ProgressivePenaltyRoundResult[]): ProgressivePenaltyResult {
  const lastRound = rounds[rounds.length - 1];
  if (!lastRound) throw new Error("Progressive Penalty sonucu en az bir tamamlanmış tur içermeli.");
  const lossCounts: Record<string, number> = { [config.players[0]]: 0, [config.players[1]]: 0 };
  rounds.forEach((round) => {
    lossCounts[round.loser] = (lossCounts[round.loser] ?? 0) + 1;
  });
  return {
    gameType: "progressive_penalty",
    mode: "same_phone_progressive_penalty",
    version: 1,
    status: "completed",
    players: config.players,
    completedRounds: rounds.length,
    rounds,
    lossCounts,
    lastRound,
    winner: lastRound.winner,
    loser: lastRound.loser,
    penalty: lastRound.penalty,
    completedAt: new Date().toISOString(),
  };
}
