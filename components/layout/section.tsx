import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  animate?: boolean;
};

export function Section({
  children,
  title,
  description,
  className,
  animate = true,
}: SectionProps) {
  const content = (
    <section className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );

  if (animate) {
    return <FadeIn>{content}</FadeIn>;
  }

  return content;
}
