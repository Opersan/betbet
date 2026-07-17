"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useSceneRevealMotion } from "@/components/scene/AnimatedPageTransition";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";

export type SceneAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
};

export function BottomNavigationControls({
  previousAction,
  nextAction,
  primaryAction,
}: {
  previousAction?: () => void;
  nextAction?: () => void;
  primaryAction?: SceneAction;
}) {
  const actionReveal = useSceneRevealMotion("action");
  const navigationReveal = useSceneRevealMotion("navigation");

  if (!primaryAction && !previousAction && !nextAction) {
    return null;
  }

  const navActions = [
    previousAction
      ? {
          key: "previous",
          label: "Geri",
          icon: <ArrowLeft size={17} strokeWidth={1.7} />,
          onClick: previousAction,
        }
      : null,
    nextAction && !primaryAction
      ? {
          key: "next",
          label: "İleri",
          icon: <ArrowRight size={17} strokeWidth={1.7} />,
          onClick: nextAction,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
  }>;

  return (
    <div className="space-y-3">
      {primaryAction ? (
        <motion.div {...actionReveal}>
          <PrimaryActionButton
            href={primaryAction.href}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
            <ArrowRight size={18} strokeWidth={1.7} />
          </PrimaryActionButton>
        </motion.div>
      ) : null}

      {navActions.length > 0 ? (
        <motion.div
          {...navigationReveal}
          className={navActions.length === 1 ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}
        >
          {navActions.map((action) => (
            <button
              key={action.key}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/82 backdrop-blur transition hover:bg-white/[0.1] active:translate-y-px"
              onClick={action.onClick}
              type="button"
            >
              {action.key === "previous" ? action.icon : null}
              {action.label}
              {action.key === "next" ? action.icon : null}
            </button>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}
