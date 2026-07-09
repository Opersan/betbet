import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PremiumCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-white/12 bg-white/[0.08] shadow-[0_22px_90px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_36%,rgba(217,167,160,0.08))]",
        className,
      )}
      {...props}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
