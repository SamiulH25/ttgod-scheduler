"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SeasonBoard } from "@/components/season-board";
import { cn } from "@/lib/utils";

export function SeasonBoardCollapsible({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-sm border border-dashed border-border/60">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-display text-lg font-bold"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Organize by season
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="border-t border-dashed border-border/60 px-2 pb-4">
          <SeasonBoard currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
