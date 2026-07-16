"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, HeartHandshake, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { JourneyMiniGame, JourneyScene } from "@/lib/journey/types";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { ProgressivePenaltyGame } from "./ProgressivePenaltyGame";

type CompleteMiniGameParams = {
  gameKey?: string;
  score?: number | null;
  rewardKey?: string | null;
  payload?: Record<string, unknown>;
};

type Player = {
  id: string;
  label: string;
};

type GameResult = {
  winner: string;
  loser: string;
  penalty: string;
  reason?: string;
  score?: number;
};

export function MiniGameCard({
  scene,
  isSubmitting,
  persistenceScope,
  onComplete,
}: {
  scene: JourneyScene;
  isSubmitting: boolean;
  persistenceScope?: string;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const game = scene.miniGame ?? null;
  const savedResult = getSavedResult(scene);

  if (game?.type === "progressive_penalty") {
    return (
      <ProgressivePenaltyGame
        scene={scene}
        game={game}
        isSubmitting={isSubmitting}
        persistenceScope={persistenceScope}
        onComplete={onComplete}
      />
    );
  }

  if (game?.type === "reaction_duel") {
    return (
      <ReactionDuelGame
        game={game}
        savedResult={savedResult}
        isCompleted={scene.progressIsCompleted || scene.taskResponse?.type === "mini_game"}
        isSubmitting={isSubmitting}
        onComplete={onComplete}
      />
    );
  }

  if (game?.type === "couple_quiz" || (game?.type === "choice" && game.config.mode === "couple_quiz")) {
    return (
      <CoupleQuizGame
        game={game}
        savedResult={savedResult}
        isCompleted={scene.progressIsCompleted || scene.taskResponse?.type === "mini_game"}
        isSubmitting={isSubmitting}
        onComplete={onComplete}
      />
    );
  }

  if (game?.type === "penalty_picker" || (game?.type === "choice" && game.config.mode === "penalty_picker")) {
    return (
      <PenaltyPickerGame
        game={game}
        savedResult={savedResult}
        isCompleted={scene.progressIsCompleted || scene.taskResponse?.type === "mini_game"}
        isSubmitting={isSubmitting}
        onComplete={onComplete}
      />
    );
  }

  if (game?.type === "tap_sequence") {
    return (
      <TapSequenceGame
        game={game}
        isCompleted={scene.progressIsCompleted || scene.taskResponse?.type === "mini_game"}
        isSubmitting={isSubmitting}
        onComplete={onComplete}
      />
    );
  }

  return (
    <PremiumCard className="w-full p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f0b7c6]/20 bg-[#f0b7c6]/10 text-[#f0b7c6]">
        <RotateCcw size={20} strokeWidth={1.6} />
      </div>
      <p className="mt-5 text-2xl font-semibold leading-tight text-[#fffaf2]">
        Mini oyun görünümü hazır değil
      </p>
      <p className="mt-3 text-sm leading-6 text-[#fffaf2]/62">
        {game ? `${game.type} türü bu sürümde etkileşimli olarak desteklenmiyor.` : "Bu sahneye geçerli bir mini oyun bağlanmamış."}
      </p>
    </PremiumCard>
  );
}

function ReactionDuelGame({
  game,
  savedResult,
  isCompleted,
  isSubmitting,
  onComplete,
}: {
  game: JourneyMiniGame | null;
  savedResult: GameResult | null;
  isCompleted: boolean;
  isSubmitting: boolean;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const reduceMotion = useReducedMotion();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);
  const roundSettledRef = useRef(false);
  const players = useMemo(() => getPlayers(game), [game]);
  const penalties = useMemo(() => getPenalties(game), [game]);
  const [state, setState] = useState<"idle" | "waiting" | "live" | "result">("idle");
  const [result, setResult] = useState<GameResult | null>(savedResult);
  const [submitted, setSubmitted] = useState(isCompleted);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function startRound() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setResult(null);
    setSubmitted(false);
    roundSettledRef.current = false;
    setState("waiting");

    const minDelay = getNumberConfig(game, "waitMinMs", 1200);
    const maxDelay = getNumberConfig(game, "waitMaxMs", 3200);
    const delay = Math.floor(minDelay + Math.random() * Math.max(maxDelay - minDelay, 500));

    timeoutRef.current = setTimeout(() => {
      startedAtRef.current = performance.now();
      setState("live");
    }, delay);
  }

  function handlePlayerTap(player: Player, timestamp: number) {
    if (state === "result" || submitted || isCompleted || roundSettledRef.current) return;

    if (state === "waiting") {
      roundSettledRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const winner = players.find((item) => item.id !== player.id) ?? players[0];
      finishRound(winner, player, "Işık yanmadan dokundu.");
      return;
    }

    if (state === "live") {
      roundSettledRef.current = true;
      const loser = players.find((item) => item.id !== player.id) ?? players[1] ?? players[0];
      const reactionMs = Math.round(timestamp - startedAtRef.current);
      finishRound(player, loser, `${reactionMs} ms`);
    }
  }

  function finishRound(winner: Player, loser: Player, reason?: string) {
    const nextResult = {
      winner: winner.label,
      loser: loser.label,
      penalty: pickPenalty(penalties),
      reason,
      score: reason?.endsWith("ms") ? Number.parseInt(reason, 10) : undefined,
    };
    setResult(nextResult);
    setState("result");
  }

  function saveResult() {
    if (!result || submitted || isCompleted) return;
    setSubmitted(true);
    onComplete({
      gameKey: game?.gameKey,
      score: result.score ?? 1,
      rewardKey: game?.rewardKey,
      payload: {
        gameType: game?.type,
        mode: "same_phone_reaction_duel",
        ...result,
        completedAt: new Date().toISOString(),
      },
    });
  }

  const displayResult = result ?? savedResult;
  const canSave = Boolean(displayResult && !submitted && !isCompleted);

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {displayResult ? <Trophy size={21} strokeWidth={1.7} /> : <HeartHandshake size={21} strokeWidth={1.6} />}
        </div>
        <div className="rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-3 py-1 text-xs font-medium text-[#f4dcc0]/88">
          {displayResult ? "Düello bitti" : state === "live" ? "Şimdi" : state === "waiting" ? "Bekle" : "2 kişi"}
        </div>
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game?.title ?? "Refleks Düellosu"}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {state === "waiting"
          ? getStringConfig(game, "readyText", "Işık yanmadan dokunmak yok.")
          : state === "live"
            ? getStringConfig(game, "liveText", "Şimdi! İlk dokunan kazanır.")
            : game?.instructions ?? "Telefonu aranıza koyun. Işık yanınca ilk dokunan kazanır."}
      </p>

      <div className="mt-6 grid gap-3">
        <DuelTapZone player={players[0]} state={state} position="top" onTap={handlePlayerTap} />
        <motion.div
          animate={state === "live" && !reduceMotion ? { scale: [1, 1.08, 1], opacity: [0.78, 1, 0.78] } : undefined}
          transition={{ duration: 0.5, repeat: state === "live" ? Infinity : 0 }}
          className={cn(
            "rounded-[8px] border border-white/10 px-4 py-5 text-center",
            state === "live" ? "bg-[#f4dcc0]/18 text-[#f4dcc0]" : "bg-white/[0.05] text-[#fffaf2]/70",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em]">Orta çizgi</p>
          <p className="mt-2 text-lg font-semibold">{state === "live" ? "Dokun" : state === "waiting" ? "Bekle" : "Başlat"}</p>
        </motion.div>
        <DuelTapZone player={players[1]} state={state} position="bottom" onTap={handlePlayerTap} />
      </div>

      {displayResult ? (
        <ResultPanel result={displayResult} alcoholNote={getStringConfig(game, "alcoholNote", null)} />
      ) : null}

      <div className="mt-6 grid gap-3">
        {!displayResult ? (
          <PrimaryActionButton disabled={state !== "idle" && state !== "result"} onClick={startRound}>
            Düelloyu Başlat
            <Sparkles size={18} strokeWidth={1.7} />
          </PrimaryActionButton>
        ) : (
          <PrimaryActionButton disabled={!canSave || isSubmitting} onClick={saveResult}>
            {isSubmitting ? "Kaydediliyor" : isCompleted ? "Sonuç Kaydedildi" : "Sonucu Kaydet"}
            <Check size={18} strokeWidth={1.8} />
          </PrimaryActionButton>
        )}

        {displayResult && !isCompleted ? (
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/82 backdrop-blur transition hover:bg-white/[0.1] active:translate-y-px"
            type="button"
            onClick={startRound}
          >
            <RotateCcw size={17} strokeWidth={1.7} />
            Tekrar Oyna
          </button>
        ) : null}
      </div>
    </PremiumCard>
  );
}

function DuelTapZone({
  player,
  state,
  position,
  onTap,
}: {
  player: Player;
  state: "idle" | "waiting" | "live" | "result";
  position: "top" | "bottom";
  onTap: (player: Player, timestamp: number) => void;
}) {
  return (
    <button
      className={cn(
        "min-h-24 touch-none select-none rounded-[8px] border border-white/12 bg-white/[0.07] px-4 py-5 text-center transition active:translate-y-px [-webkit-tap-highlight-color:transparent]",
        state === "live" && "border-[#f4dcc0]/42 bg-[#f4dcc0]/14 shadow-[0_18px_55px_rgba(244,220,192,0.12)]",
        position === "top" && "origin-bottom",
        position === "bottom" && "origin-top",
      )}
      type="button"
      disabled={state === "idle" || state === "result"}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        onTap(player, performance.now());
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onTap(player, performance.now());
      }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/72">{position === "top" ? "Üst taraf" : "Alt taraf"}</p>
      <p className="mt-2 text-xl font-semibold text-[#fffaf2]">{player.label}</p>
    </button>
  );
}

function CoupleQuizGame({
  game,
  savedResult,
  isCompleted,
  isSubmitting,
  onComplete,
}: {
  game: JourneyMiniGame | null;
  savedResult: GameResult | null;
  isCompleted: boolean;
  isSubmitting: boolean;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const players = useMemo(() => getPlayers(game), [game]);
  const penalties = useMemo(() => getPenalties(game), [game]);
  const questions = useMemo(() => getQuizQuestions(game), [game]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [result, setResult] = useState<GameResult | null>(savedResult);
  const [submitted, setSubmitted] = useState(isCompleted);

  function answer(optionIndex: number) {
    if (result || submitted || isCompleted) return;

    const question = questions[questionIndex];
    const isCorrect = optionIndex === question.correctIndex;
    const nextScores = [...scores];
    if (isCorrect) nextScores[playerIndex] += 1;
    setScores(nextScores);

    const nextPlayerIndex = playerIndex === 0 ? 1 : 0;
    const nextQuestionIndex = nextPlayerIndex === 0 ? questionIndex + 1 : questionIndex;

    if (nextQuestionIndex >= questions.length) {
      const winnerIndex = nextScores[0] >= nextScores[1] ? 0 : 1;
      const loserIndex = winnerIndex === 0 ? 1 : 0;
      setResult({
        winner: players[winnerIndex].label,
        loser: players[loserIndex].label,
        penalty: pickPenalty(penalties),
        reason: `${nextScores[0]} - ${nextScores[1]}`,
        score: Math.max(...nextScores),
      });
      return;
    }

    setPlayerIndex(nextPlayerIndex);
    setQuestionIndex(nextQuestionIndex);
  }

  function saveResult() {
    if (!result || submitted || isCompleted) return;
    setSubmitted(true);
    onComplete({
      gameKey: game?.gameKey,
      score: result.score ?? Math.max(...scores),
      rewardKey: game?.rewardKey,
      payload: {
        gameType: game?.type,
        mode: "same_phone_couple_quiz",
        scores,
        ...result,
        completedAt: new Date().toISOString(),
      },
    });
  }

  const displayResult = result ?? savedResult;
  const question = questions[questionIndex] ?? questions[0];

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          <Trophy size={21} strokeWidth={1.7} />
        </div>
        <div className="rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-3 py-1 text-xs font-medium text-[#f4dcc0]/88">
          {displayResult ? "Quiz bitti" : `${questionIndex + 1} / ${questions.length}`}
        </div>
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game?.title ?? "Kim Daha İyi Tanıyor?"}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {displayResult ? "Sonuç hazır. Kaybedenin küçük cezası aşağıda." : `${players[playerIndex].label} cevaplıyor. Telefonu sırayla birbirinize verin.`}
      </p>

      {displayResult ? (
        <ResultPanel result={displayResult} alcoholNote={getStringConfig(game, "alcoholNote", null)} />
      ) : (
        <div className="mt-6">
          <div className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
            <p className="text-lg font-semibold leading-tight text-[#fffaf2]">{question.prompt}</p>
          </div>
          <div className="mt-4 grid gap-3">
            {question.options.map((option, index) => (
              <button
                key={option}
                className="min-h-12 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/84 backdrop-blur transition hover:bg-white/[0.1] active:translate-y-px"
                type="button"
                onClick={() => answer(index)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            {players.map((player, index) => (
              <div key={player.id} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#f4dcc0]/68">{player.label}</p>
                <p className="mt-1 text-xl font-semibold text-[#fffaf2]">{scores[index]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {displayResult ? (
        <div className="mt-6">
          <PrimaryActionButton disabled={submitted || isCompleted || isSubmitting} onClick={saveResult}>
            {isSubmitting ? "Kaydediliyor" : isCompleted ? "Sonuç Kaydedildi" : "Sonucu Kaydet"}
            <Check size={18} strokeWidth={1.8} />
          </PrimaryActionButton>
        </div>
      ) : null}
    </PremiumCard>
  );
}

function TapSequenceGame({
  game,
  isCompleted,
  isSubmitting,
  onComplete,
}: {
  game: JourneyMiniGame | null;
  isCompleted: boolean;
  isSubmitting: boolean;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const reduceMotion = useReducedMotion();
  const labels = useMemo(() => getLabels(game), [game]);
  const sequence = useMemo(() => getSequence(game, labels), [game, labels]);
  const [step, setStep] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game?.title ?? "Küçük Oyun"}</p>
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

function PenaltyPickerGame({
  game,
  savedResult,
  isCompleted,
  isSubmitting,
  onComplete,
}: {
  game: JourneyMiniGame | null;
  savedResult: GameResult | null;
  isCompleted: boolean;
  isSubmitting: boolean;
  onComplete: (params: CompleteMiniGameParams) => void;
}) {
  const players = useMemo(() => getPlayers(game), [game]);
  const penalties = useMemo(() => getPenalties(game), [game]);
  const [armedCard, setArmedCard] = useState(() => Math.floor(Math.random() * 2));
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [result, setResult] = useState<GameResult | null>(savedResult);
  const [submitted, setSubmitted] = useState(isCompleted);

  function pickCard(cardIndex: number) {
    if (result || submitted || isCompleted) return;

    const loserIndex = cardIndex === armedCard ? 0 : 1;
    const winnerIndex = loserIndex === 0 ? 1 : 0;
    setSelectedCard(cardIndex);
    setResult({
      winner: players[winnerIndex].label,
      loser: players[loserIndex].label,
      penalty: pickPenalty(penalties),
      reason: `${cardIndex + 1}. kart seçildi`,
      score: 1,
    });
  }

  function resetCards() {
    setSelectedCard(null);
    setResult(null);
    setSubmitted(false);
    setArmedCard(Math.floor(Math.random() * 2));
  }

  function saveResult() {
    if (!result || submitted || isCompleted) return;
    setSubmitted(true);
    onComplete({
      gameKey: game?.gameKey,
      score: result.score ?? 1,
      rewardKey: game?.rewardKey,
      payload: {
        gameType: game?.type,
        mode: "same_phone_penalty_picker",
        selectedCard,
        ...result,
        completedAt: new Date().toISOString(),
      },
    });
  }

  const displayResult = result ?? savedResult;

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          <Sparkles size={21} strokeWidth={1.7} />
        </div>
        <div className="rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-3 py-1 text-xs font-medium text-[#f4dcc0]/88">
          {displayResult ? "Kart açıldı" : "2 kart"}
        </div>
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{game?.title ?? "Ceza Kartları"}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {game?.instructions ?? "Telefonu aranıza koyun. Bir kart seçin; ceza kime kaldıysa küçük görev onun."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[0, 1].map((cardIndex) => {
          const isSelected = selectedCard === cardIndex || Boolean(savedResult);
          return (
            <button
              key={cardIndex}
              className={cn(
                "aspect-[0.82] rounded-[8px] border border-white/12 bg-white/[0.07] p-4 text-center transition active:translate-y-px",
                isSelected && "border-[#f4dcc0]/38 bg-[#f4dcc0]/14 shadow-[0_18px_55px_rgba(244,220,192,0.12)]",
              )}
              type="button"
              disabled={Boolean(displayResult) || isSubmitting}
              onClick={() => pickCard(cardIndex)}
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
                {isSelected ? <Check size={20} strokeWidth={1.8} /> : <Sparkles size={19} strokeWidth={1.7} />}
              </span>
              <span className="mt-5 block text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/68">
                Kart {cardIndex + 1}
              </span>
              <span className="mt-2 block text-lg font-semibold text-[#fffaf2]">{isSelected ? "Açıldı" : "Kapalı"}</span>
            </button>
          );
        })}
      </div>

      {displayResult ? (
        <ResultPanel result={displayResult} alcoholNote={getStringConfig(game, "alcoholNote", null)} />
      ) : null}

      {displayResult ? (
        <div className="mt-6 grid gap-3">
          <PrimaryActionButton disabled={submitted || isCompleted || isSubmitting} onClick={saveResult}>
            {isSubmitting ? "Kaydediliyor" : isCompleted ? "Sonuç Kaydedildi" : "Sonucu Kaydet"}
            <Check size={18} strokeWidth={1.8} />
          </PrimaryActionButton>
          {!isCompleted ? (
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/82 backdrop-blur transition hover:bg-white/[0.1] active:translate-y-px"
              type="button"
              onClick={resetCards}
            >
              <RotateCcw size={17} strokeWidth={1.7} />
              Kartları Yenile
            </button>
          ) : null}
        </div>
      ) : null}
    </PremiumCard>
  );
}

function ResultPanel({ result, alcoholNote }: { result: GameResult; alcoholNote?: string | null }) {
  return (
    <div className="mt-6 rounded-[8px] border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/76">Sonuç</p>
      <p className="mt-3 text-2xl font-semibold leading-tight text-[#fffaf2]">{result.winner} kazandı</p>
      <p className="mt-2 text-base leading-7 text-[#fffaf2]/72">
        {result.loser} için ceza: <span className="font-semibold text-[#f4dcc0]">{result.penalty}</span>
      </p>
      {result.reason ? <p className="mt-2 text-sm text-[#fffaf2]/54">Detay: {result.reason}</p> : null}
      {alcoholNote ? <p className="mt-4 text-xs leading-5 text-[#fffaf2]/52">{alcoholNote}</p> : null}
    </div>
  );
}

function getPlayers(game: JourneyMiniGame | null | undefined): Player[] {
  const players = Array.isArray(game?.config.players) ? game.config.players : ["Sen", "Ben"];
  const normalized = players
    .slice(0, 2)
    .map((value, index) => ({
      id: `p${index}`,
      label: typeof value === "string" && value.trim() ? value : index === 0 ? "Sen" : "Ben",
    }));

  return normalized.length === 2 ? normalized : [{ id: "p0", label: "Sen" }, { id: "p1", label: "Ben" }];
}

function getPenalties(game: JourneyMiniGame | null | undefined) {
  const penalties = Array.isArray(game?.config.penalties) ? game.config.penalties : [];
  const normalized = penalties.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return normalized.length > 0
    ? normalized
    : [
        "Kaybeden bir yudum su içer ve kazanana güzel bir iltifat eder.",
        "Kaybeden bugünün en sevdiği anını anlatır.",
        "Kaybeden kazananın seçeceği küçük görevi yapar.",
      ];
}

function pickPenalty(penalties: string[]) {
  return penalties[Math.floor(Math.random() * penalties.length)] ?? penalties[0] ?? "Kaybeden küçük bir görev yapar.";
}

function getQuizQuestions(game: JourneyMiniGame | null | undefined) {
  const questions = Array.isArray(game?.config.questions) ? game.config.questions : [];
  const normalized = questions
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((item) => ({
      prompt: typeof item?.prompt === "string" ? item.prompt : "Bizi en iyi anlatan cevap hangisi?",
      options: Array.isArray(item?.options)
        ? item.options.filter((option): option is string => typeof option === "string").slice(0, 4)
        : ["İlk cevap", "İkinci cevap"],
      correctIndex: typeof item?.correctIndex === "number" ? item.correctIndex : 0,
    }))
    .filter((item) => item.options.length >= 2);

  return normalized.length > 0
    ? normalized
    : [
        {
          prompt: "Birlikte en güzel plan hangisi?",
          options: ["Gece yürüyüşü", "Erken uyumak", "Sessiz kalmak"],
          correctIndex: 0,
        },
        {
          prompt: "Kazananın ödülü ne olsun?",
          options: ["İltifat", "Şarkı", "Kahve"],
          correctIndex: 0,
        },
      ];
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

function getStringConfig(game: JourneyMiniGame | null | undefined, key: string, fallback: string | null) {
  const value = game?.config[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function getNumberConfig(game: JourneyMiniGame | null | undefined, key: string, fallback: number) {
  const value = game?.config[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getSavedResult(scene: JourneyScene): GameResult | null {
  const payload = scene.taskResponse?.payload;
  if (!payload) return null;

  const winner = payload.winner;
  const loser = payload.loser;
  const penalty = payload.penalty;

  if (typeof winner !== "string" || typeof loser !== "string" || typeof penalty !== "string") {
    return null;
  }

  return {
    winner,
    loser,
    penalty,
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
    score: typeof payload.score === "number" ? payload.score : undefined,
  };
}
