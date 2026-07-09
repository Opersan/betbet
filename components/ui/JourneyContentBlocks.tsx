"use client";

import { Quote, Video } from "lucide-react";
import type { JourneyContentBlock } from "@/lib/journey/types";
import { PremiumCard } from "./PremiumCard";

export function JourneyContentBlocks({ blocks }: { blocks: JourneyContentBlock[] }) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {blocks.map((block) => {
        if (block.type === "divider") {
          return <div key={block.id} className="mx-auto h-px w-24 bg-[#f4dcc0]/24" />;
        }

        if (block.type === "image" && block.mediaUrl) {
          return (
            <PremiumCard key={block.id} className="w-full p-3">
              <div className="overflow-hidden rounded-[8px] border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="aspect-[4/5] w-full object-cover" src={block.mediaUrl} alt={block.altText ?? block.title ?? ""} />
              </div>
              {block.title ? <p className="px-2 pt-4 text-lg font-semibold text-[#fffaf2]">{block.title}</p> : null}
              {block.body ? <p className="px-2 pb-2 pt-2 text-sm leading-6 text-[#fffaf2]/68">{block.body}</p> : null}
            </PremiumCard>
          );
        }

        if (block.type === "video" && block.mediaUrl) {
          return (
            <PremiumCard key={block.id} className="w-full p-3">
              <div className="overflow-hidden rounded-[8px] border border-white/10 bg-black/24">
                <video className="aspect-[4/5] w-full object-cover" src={block.mediaUrl} controls playsInline preload="metadata" />
              </div>
              <div className="px-2 pb-2 pt-4">
                <Video className="mb-2 text-[#f4dcc0]" size={18} strokeWidth={1.6} />
                {block.title ? <p className="text-lg font-semibold text-[#fffaf2]">{block.title}</p> : null}
                {block.body ? <p className="mt-2 text-sm leading-6 text-[#fffaf2]/68">{block.body}</p> : null}
              </div>
            </PremiumCard>
          );
        }

        if (block.type === "quote") {
          return (
            <PremiumCard key={block.id} className="w-full p-5">
              <Quote className="mb-4 text-[#f4dcc0]" size={20} strokeWidth={1.6} />
              {block.body ? <p className="text-xl font-semibold leading-tight text-[#fffaf2]">{block.body}</p> : null}
              {block.title ? <p className="mt-4 text-sm text-[#f4dcc0]/78">{block.title}</p> : null}
            </PremiumCard>
          );
        }

        if (block.type === "text" || block.type === "prompt") {
          return (
            <PremiumCard key={block.id} className="w-full p-5">
              {block.title ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#f4dcc0]/78">{block.title}</p> : null}
              {block.body ? <p className="text-lg leading-8 text-[#fffaf2]/78">{block.body}</p> : null}
            </PremiumCard>
          );
        }

        return null;
      })}
    </div>
  );
}
