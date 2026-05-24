"use client";

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "@/lib/utils";

const ContextMenu = ({
  modal = false,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Root>) => {
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (typeof document !== "undefined") {
        document.body.classList.toggle("context-menu-open", open);
      }
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("context-menu-open");
      }
    };
  }, []);

  return (
    <ContextMenuPrimitive.Root
      modal={modal}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
};

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal container={typeof document !== "undefined" ? document.body : undefined}>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "paper-flat pointer-events-auto z-[var(--z-popover)] min-w-[10rem] overflow-hidden rounded-sm p-1 font-sans shadow-lg",
        className,
      )}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>(({ className, inset, variant = "default", ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm font-medium outline-none",
      "hover:bg-[color-mix(in_oklch,var(--primary)_12%,var(--paper-cream))]",
      "focus:bg-[color-mix(in_oklch,var(--primary)_12%,var(--paper-cream))] focus:text-[var(--paper-ink)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      variant === "destructive" &&
        "text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive",
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--paper-border)]", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuGroup,
};
