import type { CalendarViewport } from "@/lib/calendar";

export function hourLabelStyle(
  hour: number,
  viewport: CalendarViewport,
  hours: number[],
): React.CSSProperties {
  const pct =
    ((hour * 60 - viewport.startMin) / viewport.durationMin) * 100;
  if (hour === hours[0]) {
    return { top: 4, transform: "none" };
  }
  if (hour === hours[hours.length - 1]) {
    return { top: "100%", transform: "translateY(calc(-100% - 4px))" };
  }
  return { top: `${pct}%`, transform: "translateY(-50%)" };
}
