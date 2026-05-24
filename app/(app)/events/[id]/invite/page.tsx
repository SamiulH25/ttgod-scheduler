import Link from "next/link";
import { getSession } from "@/lib/session";
import { getEventForUser } from "@/lib/event-access";
import { formatEventWhen } from "@/lib/dates";
import { notFound, redirect } from "next/navigation";
import { PrintInviteToolbar } from "@/components/print-invite-toolbar";
import { InvitePageCopyLink } from "@/components/campaign/invite-page-actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EventInvitePage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const { id } = await params;

  const event = await getEventForUser(id, session.user.id);
  if (!event) notFound();

  const isHost = event.createdById === session.user.id;
  const when = formatEventWhen(
    event.phase,
    event.start ? event.start.toISOString() : null,
    event.end ? event.end.toISOString() : null,
    event.proposals.length,
  );

  return (
    <div className="min-h-screen bg-plaster-wall px-4 py-12 print:bg-white">
      <div className="mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 print:hidden">
        <PrintInviteToolbar eventId={id} />
        {isHost && <InvitePageCopyLink eventId={id} />}
      </div>
      <div className="paper-sheet tape-both tape-tl tape-tr mx-auto max-w-md p-8 text-center">
        <p className="prose-label">You&apos;re invited</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{event.title}</h1>
        <p className="mt-4 font-display text-xl">{when}</p>
        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
        )}
        <p className="mt-6 text-sm text-muted-foreground print:hidden">
          Host: {event.createdBy.name ?? "Squad member"}
        </p>
        <div className="mt-6 flex flex-col gap-2 print:hidden">
          <Link
            href={`/events/${id}`}
            className="text-sm font-semibold text-primary underline"
          >
            Open campaign to RSVP
          </Link>
        </div>
      </div>
    </div>
  );
}
