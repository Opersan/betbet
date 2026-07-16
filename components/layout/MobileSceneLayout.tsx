"use client";

import type { ReactNode } from "react";
import { SoftGradientBackground } from "@/components/background/SoftGradientBackground";
import { FloatingParticles } from "@/components/background/FloatingParticles";
import { AnimatedPageTransition } from "@/components/scene/AnimatedPageTransition";
import { BottomNavigationControls, type SceneAction } from "@/components/scene/BottomNavigationControls";
import { ProgressDots, type ProgressDotState } from "@/components/scene/ProgressDots";
import { SideArrowNavigation } from "@/components/scene/SideArrowNavigation";
import { SoundControlButton } from "@/components/audio/SoundControlButton";
import type { BackgroundVariant } from "@/lib/journey/types";
import { cn } from "@/lib/utils";

export type MobileSceneLayoutProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  previousAction?: () => void;
  nextAction?: () => void;
  primaryAction?: SceneAction;
  progress?: {
    current: number;
    total: number;
    states?: ProgressDotState[];
  };
  showSideArrows?: boolean;
  isLocked?: boolean;
  animationDirection?: "forward" | "backward";
  backgroundVariant?: BackgroundVariant;
  showSoundControl?: boolean;
  embeddedViewport?: boolean;
};

export function MobileSceneLayout({
  title,
  subtitle,
  children,
  previousAction,
  nextAction,
  primaryAction,
  progress,
  showSideArrows = false,
  isLocked = false,
  animationDirection = "forward",
  backgroundVariant = "night",
  showSoundControl = false,
  embeddedViewport = false,
}: MobileSceneLayoutProps) {
  return (
    <main
      className={cn(
        "relative overflow-x-hidden bg-[#070814] text-[#fffaf2]",
        embeddedViewport ? "h-full min-h-full" : "min-h-[100dvh]",
      )}
    >
      <SoftGradientBackground variant={backgroundVariant} />
      <FloatingParticles />
      {showSoundControl ? <SoundControlButton /> : null}

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[430px] flex-col px-5 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))]",
          embeddedViewport ? "h-full min-h-full" : "min-h-[100dvh]",
        )}
      >
        <section className="flex min-h-0 flex-1 flex-col">
          <header className={cn("shrink-0 pb-4 pt-2", showSoundControl && "pr-12")}>
            {progress ? (
              <div className="mb-5">
                <ProgressDots current={progress.current} total={progress.total} states={progress.states} />
              </div>
            ) : null}
            {title ? (
              <h1 className="break-words text-[clamp(1.78rem,7.4vw,2.05rem)] font-semibold leading-[1.08] tracking-normal [text-wrap:balance]">
                {title}
              </h1>
            ) : null}
            {subtitle ? <p className="mt-3 text-base leading-7 text-[#fffaf2]/70">{subtitle}</p> : null}
          </header>

          <div
            className={cn(
              "relative flex min-h-0 flex-1 items-center overflow-y-auto overscroll-contain py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              isLocked && "opacity-95",
            )}
          >
            {showSideArrows ? <SideArrowNavigation onPrevious={previousAction} onNext={nextAction} /> : null}
            <AnimatedPageTransition
              animationDirection={animationDirection}
              transitionKey={`${progress?.current ?? 0}-${title ?? "scene"}`}
            >
              {children}
            </AnimatedPageTransition>
          </div>
        </section>

        <footer className="shrink-0 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-3">
          <BottomNavigationControls
            previousAction={previousAction}
            nextAction={nextAction}
            primaryAction={primaryAction}
          />
        </footer>
      </div>
    </main>
  );
}
