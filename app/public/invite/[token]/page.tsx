import Link from "next/link";
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
      id: true,
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

  const signInHref = `/?callbackUrl=${encodeURIComponent(`/events/${event.id}`)}`;

  return (
    <div className="min-h-screen bg-plaster-wall px-4 py-12 print:bg-white">
      <div className="paper-sheet tape-both tape-tl tape-tr mx-auto max-w-md p-8 text-center">
        <p className="prose-label">You&apos;re invited</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{event.title}</h1>
        <p className="mt-4 font-display text-xl">{when}</p>
        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Host: {event.createdBy.name ?? "Squad member"}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={signInHref}
            className="inline-flex h-11 items-center justify-center rounded-sm bg-[#5865F2] px-4 font-display text-base font-bold text-white hover:bg-[#4752C4]"
          >
            Sign in with Discord to respond
          </Link>
          <p className="text-xs text-muted-foreground">
            {event.phase === "scheduled"
              ? "After sign-in you can accept or decline the pinned time."
              : "After sign-in, say if you’re in and vote when the host opens times."}
          </p>
        </div>
      </div>
    </div>
  );
}
