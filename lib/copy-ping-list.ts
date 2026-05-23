import { format } from "date-fns";

export type PingPerson = { name: string | null };

/**
 * One block to paste into Discord — who + when.
 */
export function buildCopyPingList(params: {
  start: Date;
  end: Date;
  people: PingPerson[];
  title?: string;
}): string {
  const when = `${format(params.start, "EEE MMM d, HH:mm")} – ${format(params.end, "HH:mm")}`;
  const names = params.people
    .map((p) => p.name?.split(" ")[0] ?? "friend")
    .filter(Boolean);
  const roster = names.length ? names.join(", ") : "squad";
  const head = params.title ? `**${params.title}**\n` : "";
  return `${head}${when}\nPing: ${roster}`;
}
