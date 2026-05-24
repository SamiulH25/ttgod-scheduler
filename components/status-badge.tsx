import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 border-[2px] border-[var(--crayon-stroke)] px-2 py-0.5 font-display text-sm font-bold",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary",
        overlap: "bg-overlap/25 text-overlap-foreground",
        warning: "bg-secondary/20 text-secondary",
        muted: "border-dashed border-[var(--ink-pencil)] bg-muted/50 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function StatusBadge({
  className,
  variant,
  children,
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
  );
}
