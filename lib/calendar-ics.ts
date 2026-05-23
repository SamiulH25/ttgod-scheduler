function icsEscapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function formatIcsUtc(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const min = String(dt.getUTCMinutes()).padStart(2, "0");
  const sec = String(dt.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}${sec}Z`;
}

export type IcsEventInput = {
  uid: string;
  title: string;
  description?: string | null;
  start: Date;
  end: Date;
};

export function buildGoogleCalendarIcsFeed(params: {
  calendarName: string;
  events: IcsEventInput[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TTGOD Scheduler//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${icsEscapeText(params.calendarName)}`,
  ];

  for (const ev of params.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${icsEscapeText(ev.uid)}`);
    lines.push(`DTSTAMP:${formatIcsUtc(new Date())}`);
    lines.push(`DTSTART:${formatIcsUtc(ev.start)}`);
    lines.push(`DTEND:${formatIcsUtc(ev.end)}`);
    lines.push(`SUMMARY:${icsEscapeText(ev.title)}`);
    if (ev.description) {
      lines.push(`DESCRIPTION:${icsEscapeText(ev.description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
