/**
 * Short labels for common IANA zones (paper UI / bento).
 * Falls back to the raw zone string when unknown.
 */
const SHORT: Record<string, string> = {
  UTC: "UTC",
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  "Europe/London": "UK",
  "Europe/Paris": "CET",
  "Europe/Berlin": "CET",
  "Asia/Tokyo": "JST",
  "Asia/Shanghai": "CST",
  "Australia/Sydney": "AEST",
};

export function shortTimezoneLabel(iana: string | null | undefined): string {
  if (!iana) return "local";
  return SHORT[iana] ?? iana.split("/").pop() ?? iana;
}

export function timezoneCaption(iana: string | null | undefined): string {
  if (!iana) return "Local time";
  const short = shortTimezoneLabel(iana);
  return short === iana ? iana : `${short} · ${iana}`;
}

/** e.g. "GMT-5" for America/New_York at `instant` */
export function formatTimezoneOffsetLabel(
  iana: string,
  instant: Date = new Date(),
): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      timeZoneName: "shortOffset",
    });
    const parts = fmt.formatToParts(instant);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? iana;
  } catch {
    return iana;
  }
}

export function formatTimezoneLabel(
  iana: string,
  instant: Date = new Date(),
): string {
  const off = formatTimezoneOffsetLabel(iana, instant);
  return `${off} · ${iana}`;
}
