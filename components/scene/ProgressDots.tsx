import { cn } from "@/lib/utils";

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`${current} / ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index + 1 === current ? "w-6 bg-[#f4dcc0]" : "w-1.5 bg-white/24",
          )}
        />
      ))}
    </div>
  );
}
