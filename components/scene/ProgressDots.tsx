import { cn } from "@/lib/utils";

export type ProgressDotState = "completed" | "unlocked" | "locked" | "current";

export function ProgressDots({
  current,
  total,
  states,
}: {
  current: number;
  total: number;
  states?: ProgressDotState[];
}) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`${current} / ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const state = index + 1 === current ? "current" : states?.[index] ?? "unlocked";

        return (
          <span
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              state === "current" && "w-6 bg-[#f4dcc0]",
              state === "completed" && "w-2 bg-[#d9a7a0]/80",
              state === "unlocked" && "w-1.5 bg-white/28",
              state === "locked" && "w-1.5 bg-white/12",
            )}
          />
        );
      })}
    </div>
  );
}
