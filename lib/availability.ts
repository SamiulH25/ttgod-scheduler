import type { AvailabilityBlock } from "@prisma/client";

export function blocksOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function findOverlappingBlock(
  blocks: Pick<AvailabilityBlock, "id" | "start" | "end">[],
  start: Date,
  end: Date,
  excludeId?: string,
): Pick<AvailabilityBlock, "id" | "start" | "end"> | undefined {
  return blocks.find(
    (block) =>
      block.id !== excludeId &&
      blocksOverlap(block.start, block.end, start, end),
  );
}

/** Union new range with all of the user's blocks that overlap it. */
export function computeCombinedOwnBlock(
  blocks: Pick<AvailabilityBlock, "id" | "start" | "end">[],
  start: Date,
  end: Date,
  excludeId?: string,
): {
  overlapping: Pick<AvailabilityBlock, "id" | "start" | "end">[];
  combinedStart: Date;
  combinedEnd: Date;
} {
  const overlapping = blocks.filter(
    (block) =>
      block.id !== excludeId &&
      blocksOverlap(block.start, block.end, start, end),
  );

  let combinedStart = start;
  let combinedEnd = end;
  for (const block of overlapping) {
    if (block.start < combinedStart) combinedStart = block.start;
    if (block.end > combinedEnd) combinedEnd = block.end;
  }

  return { overlapping, combinedStart, combinedEnd };
}
