"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LightboxImage = {
  id: string;
  url: string;
  alt?: string;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  open: boolean;
  index: number;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
};

export function ImageLightbox({
  images,
  open,
  index,
  onOpenChange,
  onIndexChange,
}: ImageLightboxProps) {
  const current = images[index];
  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasMultiple) goPrev();
      if (e.key === "ArrowRight" && hasMultiple) goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasMultiple, goPrev, goNext]);

  if (!current) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-dialog)] bg-[var(--wall-plaster)]/90 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[calc(var(--z-dialog)+1)] w-[min(96vw,56rem)] -translate-x-1/2 -translate-y-1/2",
            "focus:outline-none",
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Photo preview</Dialog.Title>
          <div className="paper-flat relative overflow-hidden p-3 sm:p-4">
            <div className="relative flex min-h-[200px] items-center justify-center bg-[var(--paper-cream)]/50">
              <Image
                src={current.url}
                alt={current.alt ?? "Campaign photo"}
                width={1200}
                height={800}
                unoptimized
                className="max-h-[min(78vh,720px)] w-auto max-w-full object-contain"
                priority
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {hasMultiple ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Previous photo"
                    onClick={goPrev}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[4rem] text-center font-sans text-sm tabular-nums text-[var(--paper-ink-muted)]">
                    {index + 1} / {images.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Next photo"
                    onClick={goNext}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <span />
              )}
              <Button type="button" variant="ghost" size="sm" asChild>
                <a href={current.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open original
                </a>
              </Button>
            </div>

            <Dialog.Close
              type="button"
              className="absolute right-3 top-3 rounded-sm bg-[var(--paper-cream)]/90 p-1 text-[var(--paper-ink-muted)] shadow-sm transition-colors hover:text-[var(--paper-ink)] focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close preview"
            >
              <X className="size-5 stroke-[2.5px]" />
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ImageZoomButtonProps = {
  images: LightboxImage[];
  index?: number;
  className?: string;
  children: React.ReactNode;
  /** Stop click from bubbling (e.g. sticky note card) */
  stopPropagation?: boolean;
};

export function ImageZoomButton({
  images,
  index = 0,
  className,
  children,
  stopPropagation = false,
}: ImageZoomButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(index);

  return (
    <>
      <button
        type="button"
        className={cn(
          "cursor-zoom-in border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setActiveIndex(index);
          setOpen(true);
        }}
      >
        {children}
      </button>
      <ImageLightbox
        images={images}
        open={open}
        index={activeIndex}
        onOpenChange={setOpen}
        onIndexChange={setActiveIndex}
      />
    </>
  );
}
