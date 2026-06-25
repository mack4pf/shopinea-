import { cn } from "@/lib/utils";

interface CardBrandBadgeProps {
  brand?: string;
  className?: string;
}

export function CardBrandBadge({ brand, className }: CardBrandBadgeProps) {
  if (!brand || brand === "unknown") return null;

  const label = brand.toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300",
        className
      )}
    >
      {label}
    </span>
  );
}
