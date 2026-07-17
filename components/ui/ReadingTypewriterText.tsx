"use client";

import { motion, type Variants } from "framer-motion";
import { memo, useMemo } from "react";
import { useSceneRevealStatus } from "@/components/scene/AnimatedPageTransition";
import { READING_TYPEWRITER_TIMING } from "@/lib/journey/scene-reveal";

type AnimatedToken =
  | { type: "space"; value: string; key: string }
  | {
      type: "word";
      key: string;
      characters: Array<{ value: string; delay: number; key: string }>;
    };

const characterVariants: Variants = {
  hidden: { opacity: 0, y: 2 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: READING_TYPEWRITER_TIMING.characterDuration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const ReadingTypewriterText = memo(function ReadingTypewriterText({ text }: { text: string }) {
  const { enabled, isVisible, reduceMotion } = useSceneRevealStatus();
  const tokens = useMemo(() => buildAnimatedTokens(text), [text]);

  if (!enabled || reduceMotion) {
    return <>{text}</>;
  }

  return (
    <span className="whitespace-pre-wrap">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token) => {
          if (token.type === "space") {
            return <span key={token.key}>{token.value}</span>;
          }

          return (
            <span key={token.key} className="inline-block">
              {token.characters.map((character) => (
                <motion.span
                  key={character.key}
                  className="inline-block"
                  custom={character.delay}
                  variants={characterVariants}
                  initial="hidden"
                  animate={isVisible ? "visible" : "hidden"}
                >
                  {character.value}
                </motion.span>
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
});

function buildAnimatedTokens(text: string): AnimatedToken[] {
  const sourceTokens = text.split(/(\s+)/).filter(Boolean);
  const words = sourceTokens.filter((token) => !/^\s+$/.test(token));
  const characterCount = words.reduce((total, word) => total + Array.from(word).length, 0);
  const targetDuration = clamp(
    words.length / READING_TYPEWRITER_TIMING.wordsPerSecond,
    READING_TYPEWRITER_TIMING.minDuration,
    READING_TYPEWRITER_TIMING.maxDuration,
  );
  const characterDelay = clamp(
    targetDuration / Math.max(characterCount, 1),
    READING_TYPEWRITER_TIMING.minCharacterDelay,
    READING_TYPEWRITER_TIMING.maxCharacterDelay,
  );
  let delayCursor = READING_TYPEWRITER_TIMING.startDelay;

  return sourceTokens.map((token, tokenIndex) => {
    if (/^\s+$/.test(token)) {
      return { type: "space", value: token, key: `space-${tokenIndex}` };
    }

    const characters = Array.from(token).map((character, characterIndex) => {
      const delay = delayCursor;
      delayCursor += characterDelay;
      if (/[.!?;:,]/.test(character)) {
        delayCursor += READING_TYPEWRITER_TIMING.punctuationPause;
      }

      return {
        value: character,
        delay,
        key: `${tokenIndex}-${characterIndex}`,
      };
    });

    return { type: "word", characters, key: `word-${tokenIndex}` };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
