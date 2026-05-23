import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

function CalendarFallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-[min(60vh,640px)] w-full rounded-xl" />
    </div>
  );
}

export default async function AvailabilityPage() {
  const session = await getSession();

  return (
    <PageContainer variant="fullBleed">
      <div className="space-y-6">
        <PageHeader
          title="Calendar"
          subtitle="Paint free time on the week grid. Filter the squad roster, spotlight one person, or view overlap zones only."
          action={<StatusBadge variant="muted">Up to 14 people</StatusBadge>}
        />
        <Suspense fallback={<CalendarFallback />}>
          <AvailabilityCalendar currentUserId={session!.user!.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
