import { auth } from "@/auth";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";

export default async function AvailabilityPage() {
  const session = await auth();

  return (
    <PageContainer variant="fullBleed">
      <div className="space-y-6">
        <PageHeader
          title="Calendar"
          subtitle="Drag to add free time. Solo blocks use your color; overlap bands show shared availability only."
          action={<StatusBadge variant="muted">Up to 14 people</StatusBadge>}
        />
        <AvailabilityCalendar currentUserId={session!.user!.id} />
      </div>
    </PageContainer>
  );
}
