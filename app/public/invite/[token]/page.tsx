import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyEventInviteToken } from "@/lib/public-share";
import { formatEventWhen } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function PublicInvitePage({ params }: Props) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);
  const verified = await verifyEventInviteToken(token);
  if (!verified) notFound();

  const event = await prisma.event.findUnique({
    where: { id: verified.eventId },
    select: {
      title: true,
      description: true,
      phase: true,
      start: true,
      end: true,
      createdBy: { select: { name: true } },
      _count: { select: { proposals: true } },
    },
  });
  if (!event) notFound();

  const when = formatEventWhen(
    event.phase,
    event.start?.toISOString() ?? null,
    event.end?.toISOString() ?? null,
    event._count.proposals,
  );

  return (
    <div className="min-h-screen bg-plaster-wall px-4 py-12 print:bg-white">
      <div
        className="paper-sheet tape-both tape-tl tape-tr mx-auto max-w-md p-8 text-center"
        style={{ "--paper-tilt": "0.5deg" } as Record<string, string>}
      >
        <p className="prose-label">You are invited</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{event.title}</h1>
        <p className="mt-4 font-display text-xl">{when}</p>
        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Host: {event.createdBy.name ?? "Squad member"}
        </p>
        <p className="mt-8 text-xs">
          Sign in at TTGOD Scheduler with Discord to RSVP.
        </p>
      </div>
    </div>
  );
}
