import { auth } from "@/auth";
import { EventsManager } from "@/components/events-manager";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  return (
    <PageContainer variant="wide">
      <div className="space-y-6">
        <PageHeader
          title="Events"
          subtitle="Pin squad sessions on the bulletin board — accept invites and build itineraries."
        />
        <EventsManager
          currentUserId={session!.user!.id}
          presetStart={params.start}
          presetEnd={params.end}
        />
      </div>
    </PageContainer>
  );
}
