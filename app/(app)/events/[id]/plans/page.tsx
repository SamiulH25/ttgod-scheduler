import { auth } from "@/auth";
import { EventItinerary } from "@/components/event-itinerary";
import { getEventForUser } from "@/lib/event-access";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EventPlansPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;
  const event = await getEventForUser(id, session!.user!.id);

  if (!event) {
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
