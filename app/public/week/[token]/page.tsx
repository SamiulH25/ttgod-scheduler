import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPublicWeekToken } from "@/lib/public-share";
import { defaultWeekRange, formatShort } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function PublicWeekPage({ params }: Props) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);
  const verified = await verifyPublicWeekToken(token);
  if (!verified) notFound();

  const guild = await prisma.guild.findUnique({
    where: { id: verified.guildId },
    select: { name: true },
  });

  const { from, to } = defaultWeekRange();

  const members = await prisma.guildMember.findMany({
    where: { guildId: verified.guildId },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      userId: { in: userIds },
      start: { lt: to },
      end: { gt: from },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { start: "asc" },
  });

  const events = await prisma.event.findMany({
    where: {
      guildId: verified.guildId,
      archivedAt: null,
      phase: "scheduled",
      start: { gte: from, lt: to },
    },
    select: { id: true, title: true, start: true, end: true },
    orderBy: { start: "asc" },
    take: 30,
  });

  return (
    <div className="mx-auto max-w-2xl rounded-md border border-[var(--crayon-stroke)] bg-[var(--paper-cream)] p-6 shadow-md">
      <h1 className="font-display text-2xl font-bold">
        {guild?.name ?? "Guild"} — this week
      </h1>
      <p className="mt-1 text-sm text-[var(--paper-ink-muted)]">
        Read-only · {formatShort(from)} – {formatShort(to)}
      </p>

      <h2 className="mt-8 font-display text-lg font-bold">Pinned sessions</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {events.length === 0 ? (
          <li className="text-muted-foreground">No scheduled events in this window.</li>
        ) : (
          events.map((e) => (
            <li key={e.id} className="rounded border border-border/50 bg-muted/20 px-3 py-2">
              <span className="font-semibold">{e.title}</span>
              {e.start && (
                <span className="block text-xs text-muted-foreground">
                  {formatShort(e.start)}
                  {e.end ? ` – ${formatShort(e.end)}` : ""}
                </span>
              )}
            </li>
          ))
        )}
      </ul>

      <h2 className="mt-8 font-display text-lg font-bold">Squad availability</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {blocks.length === 0 ? (
          <li className="text-muted-foreground">No crayon blocks this window.</li>
        ) : (
          blocks.map((b) => (
            <li key={b.id} className="rounded border border-border/50 bg-muted/20 px-3 py-2">
              <span className="font-semibold">{b.user.name ?? "Member"}</span>
              <span className="text-muted-foreground">
                {" "}
                · {formatShort(b.start)} – {formatShort(b.end)}
              </span>
              {b.label && (
                <span className="block text-xs text-muted-foreground">{b.label}</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
