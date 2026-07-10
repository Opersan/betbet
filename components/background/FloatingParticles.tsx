"use client";

import { motion, useReducedMotion } from "framer-motion";

const stars = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  left: `${-8 + ((index * 17) % 120)}%`,
  top: `${4 + ((index * 29) % 92)}%`,
  size: index % 9 === 0 ? 3.2 : index % 4 === 0 ? 2.4 : 1.35,
  opacity: index % 7 === 0 ? 0.82 : index % 3 === 0 ? 0.58 : 0.42,
  drift: 88 + (index % 6) * 18,
  duration: 8.5 + (index % 8) * 1.35,
  delay: -index * 0.42,
}));

export function FloatingParticles() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden [perspective:900px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,rgba(0,0,0,0.24)_74%,rgba(0,0,0,0.46)_100%)]" />
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-[#fffaf2] shadow-[0_0_12px_rgba(255,250,242,0.42),0_0_26px_rgba(244,220,192,0.22)] after:absolute after:right-full after:top-1/2 after:h-px after:w-8 after:-translate-y-1/2 after:bg-gradient-to-l after:from-[#fffaf2]/30 after:to-transparent after:content-['']"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [star.opacity * 0.48, star.opacity, star.opacity * 0.64],
                  x: [star.drift * 0.22, -star.drift],
                  y: [0, star.id % 2 === 0 ? 8 : -6],
                  scale: [0.82, 1.18, 0.92],
                }
          }
          transition={{
            duration: reduceMotion ? 5 : star.duration,
            repeat: Infinity,
            ease: reduceMotion ? "easeInOut" : "linear",
            delay: star.delay,
          }}
        />
      ))}
      <motion.div
        className="absolute inset-y-0 left-[-35%] w-[170%] opacity-30 [background-image:linear-gradient(100deg,transparent_0%,rgba(255,250,242,0.055)_50%,transparent_100%)]"
        animate={reduceMotion ? undefined : { x: ["10%", "-10%"] }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
