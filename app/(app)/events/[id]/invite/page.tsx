import Link from "next/link";
import { getSession } from "@/lib/session";
import { getEventForUser } from "@/lib/event-access";
import { formatEventWhen } from "@/lib/dates";
import { notFound, redirect } from "next/navigation";
import { PrintInviteToolbar } from "@/components/print-invite-toolbar";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EventInvitePage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const { id } = await params;

  const event = await getEventForUser(id, session.user.id);
  if (!event) notFound();

  const when = formatEventWhen(
    event.phase,
    event.start ? event.start.toISOString() : null,
    event.end ? event.end.toISOString() : null,
    event.proposals.length,
  );

  return (
    <div className="min-h-screen bg-plaster-wall px-4 py-12 print:bg-white">
      <div className="mx-auto max-w-md">
        <PrintInviteToolbar eventId={id} />
      </div>
      <div className="paper-sheet tape-both tape-tl tape-tr mx-auto max-w-md p-8 text-center">
        <p className="prose-label">Campaign invite</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{event.title}</h1>
        <p className="mt-4 font-display text-xl">{when}</p>
        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
        )}
        <p className="mt-6 text-sm text-muted-foreground print:hidden">
          Mint a share token with{" "}
          <code className="rounded bg-muted px-1 text-xs">POST /api/events/{id}/public-invite</code>{" "}
          then share <code className="rounded bg-muted px-1 text-xs">/public/invite/&lt;token&gt;</code>
        </p>
        <div className="mt-6 print:hidden">
          <Link
            href={`/events/${id}`}
            className="text-sm font-semibold text-primary underline"
          >
            Back to campaign
          </Link>
        </div>
      </div>
    </div>
  );
}
