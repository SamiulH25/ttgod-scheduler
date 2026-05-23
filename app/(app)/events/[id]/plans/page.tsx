import { getSession } from "@/lib/session";
import { EventItinerary } from "@/components/event-itinerary";
import { getEventForUser } from "@/lib/event-access";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EventPlansPage({ params }: Props) {
  const session = await getSession();
  const { id } = await params;
  const event = await getEventForUser(id, session!.user!.id);

  if (!event || event.phase !== "scheduled" || !event.start || !event.end) {
    notFound();
  }

  return (
    <EventItinerary
      eventId={event.id}
      eventTitle={event.title}
      eventStart={event.start.toISOString()}
      eventEnd={event.end.toISOString()}
      isHost={event.createdById === session!.user!.id}
    />
  );
}
