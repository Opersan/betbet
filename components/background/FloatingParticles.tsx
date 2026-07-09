"use client";

import { motion, useReducedMotion } from "framer-motion";

const particles = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 19) % 84)}%`,
  top: `${10 + ((index * 23) % 76)}%`,
  size: 2 + (index % 3),
  delay: index * 0.28,
}));

export function FloatingParticles() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-[#f4dcc0]/45 shadow-[0_0_18px_rgba(244,220,192,0.28)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.18, 0.48, 0.18],
                  y: [0, -12, 0],
                  scale: [1, 1.25, 1],
                }
          }
          transition={{
            duration: 7 + (particle.id % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
