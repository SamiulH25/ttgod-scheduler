"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

type OverlapPosterButtonProps = {
  start: string;
  end: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
};

export function OverlapPosterButton({
  start,
  end,
  variant = "outline",
  size = "sm",
}: OverlapPosterButtonProps) {
  function openPoster() {
    const url = `/api/share/overlap-poster?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={openPoster}>
      <ImageIcon className="size-3.5" />
      Overlap poster
    </Button>
  );
}
