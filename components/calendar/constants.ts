export const TIME_GUTTER_WIDTH_PX = 56;
export const DAY_COLUMN_MIN_WIDTH_DESKTOP_PX = 120;
export const DAY_COLUMN_MIN_WIDTH_COMPACT_PX = 88;

export function getGridTemplateColumns(dayColumnMinWidth: number): string {
  return `${TIME_GUTTER_WIDTH_PX}px repeat(7, minmax(${dayColumnMinWidth}px, 1fr))`;
}

export function getGridMinWidth(dayColumnMinWidth: number): number {
  return TIME_GUTTER_WIDTH_PX + 7 * dayColumnMinWidth;
}
