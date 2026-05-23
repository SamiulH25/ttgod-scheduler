"use client";

import { useCallback, useRef } from "react";
import {
  minutesToDate,
  yToMinutesInViewport,
  type CalendarViewport,
} from "@/lib/calendar";
import { TIME_GUTTER_WIDTH_PX } from "@/components/calendar/constants";

export const DRAG_THRESHOLD_PX = 6;

export type DragRange = { start: Date; end: Date };

export function normalizeDragRange(
  anchorDay: Date,
  anchorMin: number,
  currentDay: Date,
  currentMin: number,
  viewport: CalendarViewport,
): DragRange {
  let start = minutesToDate(anchorDay, anchorMin);
  let end = minutesToDate(currentDay, currentMin);
  if (end < start) {
    const tmp = start;
    start = end;
    end = tmp;
  }
  if (end <= start) {
    end = minutesToDate(currentDay, Math.min(currentMin + 60, viewport.endMin));
  }
  if (end <= start) {
    end = new Date(start.getTime() + 30 * 60 * 1000);
  }
  return { start, end };
}

type UseWeekPointerOptions = {
  weekDays: Date[];
  viewport: CalendarViewport;
  columnHeight: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onRangeCommit: (start: Date, end: Date, flash?: boolean) => void;
  onDragPreview?: (range: DragRange | null) => void;
  onClickSlot?: (day: Date, y: number) => void;
};

export function useWeekPointer({
  weekDays,
  viewport,
  columnHeight,
  gridRef,
  onRangeCommit,
  onDragPreview,
  onClickSlot,
}: UseWeekPointerOptions) {
  const dragRef = useRef({
    active: false,
    didDrag: false,
    anchorDay: null as Date | null,
    anchorMin: 0,
  });

  const resolvePointer = useCallback(
    (clientX: number, clientY: number) => {
      const grid = gridRef.current;
      if (!grid) return null;
      const rect = grid.getBoundingClientRect();
      const x = clientX - rect.left - TIME_GUTTER_WIDTH_PX;
      if (x < 0) return null;
      const colWidth = (rect.width - TIME_GUTTER_WIDTH_PX) / 7;
      const index = Math.floor(x / colWidth);
      if (index < 0 || index >= 7) return null;
      const day = weekDays[index]!;
      const y = clientY - rect.top;
      const min = yToMinutesInViewport(y, columnHeight, viewport);
      return { day, min, y };
    },
    [weekDays, columnHeight, viewport, gridRef],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (!target.closest("[data-day-column]")) return;
    const hit = resolvePointer(e.clientX, e.clientY);
    if (!hit) return;
    dragRef.current = {
      active: true,
      didDrag: false,
      anchorDay: hit.day,
      anchorMin: hit.min,
    };
    const endMin = Math.min(hit.min + 60, viewport.endMin);
    onDragPreview?.({
      start: minutesToDate(hit.day, hit.min),
      end: minutesToDate(hit.day, endMin),
    });
    gridRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active || !dragRef.current.anchorDay) return;
    const hit = resolvePointer(e.clientX, e.clientY);
    if (!hit) return;
    const anchor = dragRef.current;
    if (
      Math.abs(e.movementX) > DRAG_THRESHOLD_PX ||
      Math.abs(e.movementY) > DRAG_THRESHOLD_PX
    ) {
      anchor.didDrag = true;
    }
    onDragPreview?.(
      normalizeDragRange(
        anchor.anchorDay!,
        anchor.anchorMin,
        hit.day,
        hit.min,
        viewport,
      ),
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const anchor = dragRef.current;
    dragRef.current.active = false;
    gridRef.current?.releasePointerCapture(e.pointerId);

    if (anchor.didDrag) {
      const hit = resolvePointer(e.clientX, e.clientY);
      if (hit && anchor.anchorDay) {
        const range = normalizeDragRange(
          anchor.anchorDay,
          anchor.anchorMin,
          hit.day,
          hit.min,
          viewport,
        );
        onDragPreview?.(null);
        onRangeCommit(range.start, range.end, true);
      } else {
        onDragPreview?.(null);
      }
      return;
    }

    onDragPreview?.(null);
    const hit = resolvePointer(e.clientX, e.clientY);
    if (!hit || !onClickSlot) return;
    onClickSlot(hit.day, hit.y);
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resolvePointer,
  };
}
