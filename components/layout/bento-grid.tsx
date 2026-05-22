import { cn } from "@/lib/utils";

type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_1fr]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoTile({
  children,
  className,
  span = 1,
  rowSpan = 1,
}: {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
}) {
  const spanClass =
    span === 2
      ? "sm:col-span-2"
      : span === 3
        ? "sm:col-span-2 lg:col-span-3"
        : span === 4
          ? "col-span-full"
          : "";
  const rowClass = rowSpan === 2 ? "lg:row-span-2" : "";

  return (
    <div className={cn(spanClass, rowClass, className)}>{children}</div>
  );
}
