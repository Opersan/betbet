"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { RevealAnimation } from "./RevealAnimation";

export function LockedRevealCard({
  title,
  content,
  isRevealed,
  onReveal,
}: {
  title: string;
  content?: string | null;
  isRevealed: boolean;
  onReveal: () => void;
}) {
  return (
    <PremiumCard className="w-full p-6">
      {!isRevealed ? (
        <div className="min-h-[18rem]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <LockKeyhole size={21} strokeWidth={1.6} />
          </div>
          <div className="select-none blur-[6px]">
            <p className="text-3xl font-semibold leading-tight text-[#fffaf2]">{title}</p>
            <p className="mt-5 text-base leading-7 text-[#fffaf2]/70">
              Bu bölüm birazdan açılacak. Merak duygusu da hediyenin bir parçası.
            </p>
          </div>
          <div className="mt-8">
            <PrimaryActionButton onClick={onReveal}>
              Sürprizi Aç
              <Sparkles size={18} strokeWidth={1.7} />
            </PrimaryActionButton>
          </div>
        </div>
      ) : (
        <RevealAnimation>
          <div className="min-h-[18rem]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
              <Sparkles size={21} strokeWidth={1.6} />
            </div>
            <p className="text-3xl font-semibold leading-tight text-[#fffaf2]">{title}</p>
            {content ? <p className="mt-5 text-lg leading-8 text-[#fffaf2]/76">{content}</p> : null}
          </div>
        </RevealAnimation>
      )}
    </PremiumCard>
  );
}
