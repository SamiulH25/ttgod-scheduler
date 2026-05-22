import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-display text-lg font-bold transition-all duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[3px] border-[var(--crayon-stroke)] bg-primary text-primary-foreground shadow-sm hover:brightness-105",
        accent:
          "border-[3px] border-[var(--crayon-stroke)] bg-primary text-primary-foreground shadow-sm",
        destructive:
          "border-[3px] border-[var(--crayon-stroke)] bg-destructive text-white",
        outline:
          "border-[3px] border-[var(--crayon-stroke)] bg-[var(--paper-cream)] text-foreground hover:bg-muted",
        secondary:
          "border-[3px] border-[var(--crayon-stroke)] bg-secondary text-secondary-foreground",
        ghost: "border-2 border-transparent hover:border-border hover:bg-muted/60",
        "ghost-accent": "border-2 border-transparent text-primary hover:bg-primary/10",
        link: "border-0 text-primary underline-offset-4 hover:underline active:scale-100",
        sticker:
          "border-[3px] border-dashed border-[var(--ink-pencil)] bg-[var(--paper-cream)] text-foreground shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-base",
        lg: "h-11 px-7 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
