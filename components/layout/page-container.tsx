import { cn } from "@/lib/utils";

type PageContainerVariant = "default" | "wide" | "fullBleed";

const variantClasses: Record<PageContainerVariant, string> = {
  default: "mx-auto w-full max-w-5xl px-4 py-6 sm:py-8",
  wide: "mx-auto w-full max-w-7xl px-4 py-6 sm:py-8",
  fullBleed: "w-full px-4 py-6 sm:px-6 sm:py-8 xl:max-w-none",
};

type PageContainerProps = {
  children: React.ReactNode;
  variant?: PageContainerVariant;
  className?: string;
};

export function PageContainer({
  children,
  variant = "default",
  className,
}: PageContainerProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>{children}</div>
  );
}
