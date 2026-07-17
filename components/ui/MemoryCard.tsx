"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { SceneRevealItem } from "@/components/scene/AnimatedPageTransition";
import { PositionedImage } from "./PositionedImage";
import { PremiumCard } from "./PremiumCard";

export function MemoryCard({
  imageUrl,
  dateLabel,
  title,
  content,
}: {
  imageUrl?: string | null;
  dateLabel?: string | null;
  title: string;
  content?: string | null;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl && failedImageUrl !== imageUrl);

  return (
    <PremiumCard className="w-full p-4">
      <SceneRevealItem stage="media" className="relative aspect-[4/5] max-h-[min(48dvh,22rem)] w-full overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.06]">
        {showImage ? (
          <PositionedImage
            value={imageUrl}
            alt={title}
            loading="lazy"
            onError={() => setFailedImageUrl(imageUrl ?? null)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_40%_30%,rgba(244,220,192,0.20),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(217,167,160,0.08))]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
              <Camera size={26} strokeWidth={1.5} />
            </div>
          </div>
        )}
      </SceneRevealItem>
      <div className="px-2 pb-2 pt-5">
        {dateLabel ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/78">{dateLabel}</p>
        ) : null}
        <h3 className="text-2xl font-semibold leading-tight text-[#fffaf2]">{title}</h3>
        {content ? <p className="mt-3 text-base leading-7 text-[#fffaf2]/70">{content}</p> : null}
      </div>
    </PremiumCard>
  );
}
