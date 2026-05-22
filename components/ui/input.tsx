import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full border-0 border-b-[3px] border-[var(--crayon-stroke)] bg-transparent px-1 py-2 font-display text-base font-semibold transition-colors duration-fast placeholder:text-[var(--paper-ink-muted)] focus-visible:outline-none focus-visible:border-secondary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
