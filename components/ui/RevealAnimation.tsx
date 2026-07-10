"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function RevealAnimation({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative"
      initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.975, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.96, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
      {!reduceMotion ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] rounded-[8px] bg-[linear-gradient(112deg,transparent_0%,rgba(244,220,192,0.00)_24%,rgba(244,220,192,0.18)_42%,rgba(240,183,198,0.10)_50%,rgba(244,220,192,0.00)_68%,transparent_100%)]"
          initial={{ opacity: 0, x: "-34%" }}
          animate={{ opacity: [0, 1, 0], x: ["-34%", "10%", "42%"] }}
          transition={{ duration: 1.18, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        />
      ) : null}
    </motion.div>
  );
}
