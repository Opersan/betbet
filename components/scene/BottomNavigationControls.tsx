"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
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
  return (
    <div className="space-y-3">
      {primaryAction ? (
        <PrimaryActionButton
          href={primaryAction.href}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
          <ArrowRight size={18} strokeWidth={1.7} />
        </PrimaryActionButton>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/82 backdrop-blur transition active:translate-y-px disabled:opacity-35"
          onClick={previousAction}
          disabled={!previousAction}
          type="button"
        >
          <ArrowLeft size={17} strokeWidth={1.7} />
          Geri
        </button>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/82 backdrop-blur transition active:translate-y-px disabled:opacity-35"
          onClick={nextAction}
          disabled={!nextAction}
          type="button"
        >
          İleri
          <ArrowRight size={17} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
