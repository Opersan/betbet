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
  const offset = animationDirection === "forward" ? 34 : -34;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={reduceMotion ? false : { opacity: 0, x: offset, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={reduceMotion ? undefined : { opacity: 0, x: -offset, filter: "blur(10px)" }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="flex min-h-full w-full flex-1 items-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
