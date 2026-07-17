"use client";

import { AnimatePresence, motion, useReducedMotion, type MotionProps } from "framer-motion";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { prepareSceneImage } from "@/lib/journey/scene-media";
import {
  SCENE_MEDIA_MAX_WAIT_MS,
  SCENE_PAGE_TRANSITION_DURATION_SECONDS,
  SCENE_REDUCED_MOTION_DELAY,
  SCENE_REDUCED_MOTION_DURATION_SECONDS,
  SCENE_REVEAL_TIMING,
  type SceneRevealStage,
} from "@/lib/journey/scene-reveal";

export function AnimatedPageTransition({
  children,
  animationDirection = "forward",
  transitionKey = "scene",
  criticalMediaUrl,
  nextMediaUrl,
  revealSceneContent = false,
  className = "flex min-h-full w-full flex-1 items-center",
}: {
  children: ReactNode;
  animationDirection?: "forward" | "backward";
  transitionKey?: string;
  criticalMediaUrl?: string | null;
  nextMediaUrl?: string | null;
  revealSceneContent?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    void prepareSceneImage(criticalMediaUrl);
    void prepareSceneImage(nextMediaUrl);
  }, [criticalMediaUrl, nextMediaUrl]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <SceneTransitionFrame
        key={transitionKey}
        animationDirection={animationDirection}
        criticalMediaUrl={criticalMediaUrl}
        reduceMotion={Boolean(reduceMotion)}
        revealSceneContent={revealSceneContent}
        className={className}
      >
        {children}
      </SceneTransitionFrame>
    </AnimatePresence>
  );
}

type SceneRevealContextValue = {
  enabled: boolean;
  isVisible: boolean;
  reduceMotion: boolean;
};

const SceneRevealContext = createContext<SceneRevealContextValue>({
  enabled: false,
  isVisible: true,
  reduceMotion: false,
});

function SceneTransitionFrame({
  children,
  animationDirection,
  criticalMediaUrl,
  reduceMotion,
  revealSceneContent,
  className,
}: {
  children: ReactNode;
  animationDirection: "forward" | "backward";
  criticalMediaUrl?: string | null;
  reduceMotion: boolean;
  revealSceneContent: boolean;
  className: string;
}) {
  const [initialCriticalMediaUrl] = useState(criticalMediaUrl);
  const [isPageEntered, setIsPageEntered] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(!revealSceneContent || !initialCriticalMediaUrl);
  const offset = animationDirection === "forward" ? 24 : -24;

  useEffect(() => {
    if (!revealSceneContent || !initialCriticalMediaUrl) {
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      if (isMounted) setIsMediaReady(true);
    }, SCENE_MEDIA_MAX_WAIT_MS);

    void prepareSceneImage(initialCriticalMediaUrl).then(() => {
      if (!isMounted) return;
      window.clearTimeout(timeoutId);
      setIsMediaReady(true);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [initialCriticalMediaUrl, revealSceneContent]);

  const pageTransitionDuration = reduceMotion
    ? SCENE_REDUCED_MOTION_DURATION_SECONDS
    : SCENE_PAGE_TRANSITION_DURATION_SECONDS;
  const revealIsVisible = !revealSceneContent || (isPageEntered && isMediaReady);

  useEffect(() => {
    const fallbackId = window.setTimeout(
      () => setIsPageEntered(true),
      pageTransitionDuration * 1000 + 50,
    );

    return () => window.clearTimeout(fallbackId);
  }, [pageTransitionDuration]);

  return (
    <motion.div
      variants={{
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, x: offset },
        entered: {
          opacity: 1,
          x: 0,
          transition: { duration: pageTransitionDuration, ease: [0.16, 1, 0.3, 1] },
        },
        exit: reduceMotion
          ? { opacity: 0, transition: { duration: SCENE_REDUCED_MOTION_DURATION_SECONDS } }
          : {
              opacity: 0,
              x: -offset * 0.55,
              transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
            },
      }}
      initial="initial"
      animate="entered"
      exit="exit"
      onAnimationComplete={(definition) => {
        if (definition === "entered") setIsPageEntered(true);
      }}
      className={className}
    >
      <SceneRevealContext.Provider
        value={{ enabled: revealSceneContent, isVisible: revealIsVisible, reduceMotion }}
      >
        {children}
      </SceneRevealContext.Provider>
    </motion.div>
  );
}

export function SceneRevealItem({
  stage,
  children,
  className,
}: {
  stage: SceneRevealStage;
  children: ReactNode;
  className?: string;
}) {
  const motionProps = useSceneRevealMotion(stage);

  return (
    <motion.div {...motionProps} className={className}>
      {children}
    </motion.div>
  );
}

export function useSceneRevealMotion(
  stage: SceneRevealStage,
  options: { opacityOnly?: boolean } = {},
): MotionProps {
  const { enabled, isVisible, reduceMotion } = useContext(SceneRevealContext);

  if (!enabled) {
    return { initial: false };
  }

  const timing = SCENE_REVEAL_TIMING[stage];
  const duration = reduceMotion ? SCENE_REDUCED_MOTION_DURATION_SECONDS : timing.duration;
  const delay = reduceMotion ? SCENE_REDUCED_MOTION_DELAY[stage] : timing.delay;
  const opacityOnly = options.opacityOnly || reduceMotion || stage === "media" || timing.y === 0;

  return {
    initial: "hidden",
    animate: isVisible ? "visible" : "hidden",
    variants: opacityOnly
      ? {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }
      : {
          hidden: { opacity: 0, y: timing.y },
          visible: { opacity: 1, y: 0 },
        },
    transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
  };
}

export function useSceneRevealStatus() {
  return useContext(SceneRevealContext);
}
