import type { BackgroundVariant } from "@/lib/journey/types";
import { cn } from "@/lib/utils";

const variants: Record<BackgroundVariant, string> = {
  night:
    "bg-[radial-gradient(circle_at_18%_8%,rgba(217,167,160,0.22),transparent_30%),radial-gradient(circle_at_90%_16%,rgba(87,58,137,0.28),transparent_34%),linear-gradient(160deg,#070814_0%,#11172d_52%,#070814_100%)]",
  rose:
    "bg-[radial-gradient(circle_at_16%_12%,rgba(240,183,198,0.26),transparent_32%),radial-gradient(circle_at_88%_20%,rgba(217,167,160,0.20),transparent_36%),linear-gradient(160deg,#090713_0%,#21101f_54%,#090713_100%)]",
  champagne:
    "bg-[radial-gradient(circle_at_18%_10%,rgba(244,220,192,0.26),transparent_32%),radial-gradient(circle_at_86%_22%,rgba(217,167,160,0.16),transparent_34%),linear-gradient(160deg,#090813_0%,#171221_56%,#080814_100%)]",
  deep:
    "bg-[radial-gradient(circle_at_20%_10%,rgba(95,83,154,0.25),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(217,167,160,0.16),transparent_30%),linear-gradient(160deg,#05050d_0%,#0d1024_58%,#05050d_100%)]",
};

export function SoftGradientBackground({
  variant = "night",
  className,
}: {
  variant?: BackgroundVariant;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", variants[variant], className)}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,242,0.05),transparent_28%,rgba(0,0,0,0.30))]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />
    </div>
  );
}
