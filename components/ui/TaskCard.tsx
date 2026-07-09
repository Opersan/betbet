"use client";

import { Check, HeartHandshake } from "lucide-react";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

export function TaskCard({
  title,
  isCompleted,
  onComplete,
}: {
  title: string;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  return (
    <PremiumCard className="w-full p-6">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
        {isCompleted ? <Check size={21} strokeWidth={1.8} /> : <HeartHandshake size={21} strokeWidth={1.6} />}
      </div>
      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">{title}</p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        Acele etme. Bu sahne küçük ama hikayenin içinde senin yerin olsun diye var.
      </p>
      <div className="mt-7">
        <PrimaryActionButton onClick={onComplete} disabled={isCompleted}>
          {isCompleted ? "Tamamlandı" : "Tamamladım"}
          <Check size={18} strokeWidth={1.8} />
        </PrimaryActionButton>
      </div>
    </PremiumCard>
  );
}
