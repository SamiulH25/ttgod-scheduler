"use client";

import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import { withAlpha } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

type CrayonBlockProps = {
  color: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: "fill" | "overlap" | "preview";
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  role?: string;
  tabIndex?: number;
  title?: string;
  "data-block-id"?: string;
};

export const CrayonBlock = React.forwardRef<HTMLDivElement, CrayonBlockProps>(
  (
    {
      color,
      children,
      className,
      style,
      variant = "fill",
      onClick,
      onContextMenu,
      role,
      tabIndex,
      title,
      "data-block-id": dataBlockId,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role={role}
        tabIndex={tabIndex}
        title={title}
        data-block-id={dataBlockId}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={cn(
          "absolute overflow-hidden rounded-sm text-[var(--crayon-fill-ink)]",
          variant === "overlap" && "crayon-overlap-scribble",
          variant === "fill" &&
            "border-[3px] border-[var(--crayon-stroke)] shadow-[inset_0_0_0_1px_oklch(0.2_0.02_50/0.1)]",
          variant === "preview" &&
            "border-[3px] border-dashed border-[var(--ink-pencil)] bg-transparent opacity-80",
          className,
        )}
        style={{
          ...style,
          ...(variant === "fill"
            ? { backgroundColor: withAlpha(color, 0.62) }
            : {}),
        }}
      >
        {children}
      </div>
    );
  },
);
CrayonBlock.displayName = "CrayonBlock";
