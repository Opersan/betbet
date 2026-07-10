"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function AnimatedPageTransition({
  children,
  animationDirection = "forward",
  transitionKey = "scene",
}: {
  children: ReactNode;
  animationDirection?: "forward" | "backward";
  transitionKey?: string;
}) {
  const reduceMotion = useReducedMotion();
  const offset = animationDirection === "forward" ? 24 : -24;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={reduceMotion ? false : { opacity: 0, x: offset, y: 10, scale: 0.985, filter: "blur(14px)" }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 0.78, ease: [0.16, 1, 0.3, 1] },
        }}
        exit={
          reduceMotion
            ? undefined
            : {
                opacity: 0,
                x: -offset * 0.55,
                y: -6,
                scale: 0.992,
                filter: "blur(8px)",
                transition: { duration: 0.34, ease: [0.4, 0, 0.2, 1] },
              }
        }
        className="flex min-h-full w-full flex-1 items-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
