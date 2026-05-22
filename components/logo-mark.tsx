import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight",
        className,
      )}
    >
      <span
        className="inline-block h-4 w-8 -rotate-6 bg-[var(--tape-beige)] shadow-sm"
        aria-hidden
      />
      <span>TTGOD</span>
    </span>
  );
}
