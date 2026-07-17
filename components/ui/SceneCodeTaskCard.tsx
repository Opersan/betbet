"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, KeyRound, Lightbulb } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { normalizeSceneCode, type SceneCodeTaskDefinition } from "@/lib/journey/scene-code-task";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

type SubmissionState = "idle" | "invalid" | "verified";

export function SceneCodeTaskCard({
  task,
  fallbackTitle,
  isCompleted,
  isSubmitting,
  onComplete,
}: {
  task: SceneCodeTaskDefinition;
  fallbackTitle: string;
  isCompleted: boolean;
  isSubmitting: boolean;
  onComplete: () => void | Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const [input, setInput] = useState("");
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const { config } = task;
  const hasAnswer = Boolean(config.answer);
  const showCompleted = isCompleted || submissionState === "verified";
  const isInputLocked = showCompleted || isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config.answer || isInputLocked || submittedRef.current) {
      return;
    }

    if (normalizeSceneCode(input) !== normalizeSceneCode(config.answer)) {
      setSubmissionState("invalid");
      inputRef.current?.focus();
      return;
    }

    submittedRef.current = true;
    setSubmissionState("verified");

    try {
      await onComplete();
    } catch {
      submittedRef.current = false;
      setSubmissionState("idle");
    }
  }

  if (showCompleted) {
    return (
      <PremiumCard className="w-full border-[#f4dcc0]/24 p-6 shadow-[0_22px_90px_rgba(217,167,160,0.16),inset_0_1px_0_rgba(255,255,255,0.14)]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/24 bg-[#f4dcc0]/12 text-[#f4dcc0]">
            <Check size={22} strokeWidth={1.9} aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">Kod doğrulandı</p>
          <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">{config.successText}</p>
        </motion.div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="w-full p-6">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
        <KeyRound size={21} strokeWidth={1.7} aria-hidden="true" />
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{task.title ?? fallbackTitle}</p>
      {task.body ? <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">{task.body}</p> : null}

      {!hasAnswer ? (
        <div className="mt-6 flex gap-3 rounded-[8px] border border-amber-200/20 bg-amber-200/[0.08] p-4 text-amber-100/82" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} strokeWidth={1.7} aria-hidden="true" />
          <p className="text-sm leading-6">
            Bu kod görevinin <code className="text-amber-100">metadata.answer</code> alanı eksik. İçerik düzeltilmeden sahne tamamlanamaz.
          </p>
        </div>
      ) : (
        <form className="mt-7" onSubmit={handleSubmit}>
          <label htmlFor="scene-code-input" className="block text-sm font-medium text-[#fffaf2]/78">
            {config.inputLabel}
          </label>
          <input
            ref={inputRef}
            id="scene-code-input"
            className={cn(
              "mt-2 min-h-[3.25rem] w-full rounded-[8px] border bg-black/20 px-4 text-base text-[#fffaf2] outline-none transition placeholder:text-[#fffaf2]/30 focus:border-[#f4dcc0]/52 focus:ring-2 focus:ring-[#f4dcc0]/12",
              submissionState === "invalid" ? "border-rose-300/48" : "border-white/12",
            )}
            type="text"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (submissionState === "invalid") setSubmissionState("idle");
            }}
            placeholder={config.placeholder}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            disabled={isInputLocked}
            aria-invalid={submissionState === "invalid"}
            aria-describedby={submissionState === "invalid" ? "scene-code-error" : undefined}
          />

          <div className="min-h-7 pt-2" aria-live="polite">
            {submissionState === "invalid" ? (
              <p id="scene-code-error" className="text-sm leading-5 text-rose-200/88">
                Bu kod doğru görünmüyor. İpucuna yeniden bakıp tekrar deneyebilirsin.
              </p>
            ) : null}
          </div>

          <PrimaryActionButton type="submit" disabled={isInputLocked || input.trim().length === 0}>
            {isSubmitting ? "Doğrulanıyor" : config.submitLabel}
            <Check size={18} strokeWidth={1.8} aria-hidden="true" />
          </PrimaryActionButton>
        </form>
      )}

      {config.hints.length > 0 ? (
        <div className="mt-6 border-t border-white/10 pt-5">
          {visibleHintCount > 0 ? (
            <motion.ol
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {config.hints.slice(0, visibleHintCount).map((hint, index) => (
                <li key={`${index}-${hint}`} className="flex gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4dcc0]/10 text-xs font-semibold text-[#f4dcc0]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[#fffaf2]/68">{hint}</p>
                </li>
              ))}
            </motion.ol>
          ) : null}

          {visibleHintCount < config.hints.length ? (
            <button
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/[0.06] px-4 text-sm font-semibold text-[#f4dcc0]/82 transition hover:bg-[#f4dcc0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4dcc0]/30"
              type="button"
              onClick={() => setVisibleHintCount((count) => Math.min(count + 1, config.hints.length))}
            >
              <Lightbulb size={16} strokeWidth={1.7} aria-hidden="true" />
              {visibleHintCount === 0 ? "İpucu Göster" : "Sonraki İpucu"}
            </button>
          ) : null}
        </div>
      ) : null}
    </PremiumCard>
  );
}
