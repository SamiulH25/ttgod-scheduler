"use client";

type PolaroidImage = { id: string; url: string };

type RecapPolaroidStripProps = {
  images: PolaroidImage[];
};

export function RecapPolaroidStrip({ images }: RecapPolaroidStripProps) {
  if (images.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-min gap-4 px-1">
        {images.map((img) => (
          <figure
            key={img.id}
            className="tape-polaroid w-[140px] shrink-0 rotate-[-1.5deg] bg-[var(--polaroid-paper)] p-2 pb-8 shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 text-center font-display text-xs text-[var(--polaroid-ink)]">
              memory
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
