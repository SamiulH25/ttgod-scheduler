import { auth } from "@/auth";
import { DashboardBento } from "@/components/dashboard-bento";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { defaultWeekRange } from "@/lib/dates";
import { toCalendarBlocks } from "@/lib/calendar";
import { findSquadOverlaps } from "@/lib/overlaps";
import Link from "next/link";
import { Calendar } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const { from, to } = defaultWeekRange();

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const [myBlockCount, teamBlockCount, events, allBlocks, pendingInvites] =
    await Promise.all([
      prisma.availabilityBlock.count({
        where: { userId, start: { lt: to }, end: { gt: from } },
      }),
      prisma.availabilityBlock.count({
        where: {
          start: { lt: to },
          end: { gt: from },
        },
      }),
      prisma.event.findMany({
        where: {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } },
          ],
          start: { gte: new Date() },
        },
        orderBy: { start: "asc" },
        take: 5,
        include: {
          createdBy: { select: { name: true, image: true } },
        },
      }),
      prisma.availabilityBlock.findMany({
        where: {
          start: { lt: to },
          end: { gt: from },
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.eventParticipant.count({
        where: { userId, status: "pending" },
      }),
    ]);

  const overlaps = findSquadOverlaps(toCalendarBlocks(allBlocks), from, to).slice(
    0,
    3,
  );
  const showOnboarding =
    !user?.onboardingCompleted && myBlockCount === 0;

  return (
    <PageContainer variant="wide">
      <div className="space-y-8">
        <PageHeader
          title={`Hello, ${session?.user?.name?.split(" ")[0] ?? "there"}`}
          subtitle="Your overview — see who's free and plan the next session."
          action={
            <Button asChild size="lg">
              <Link href="/availability" className="group">
                <Calendar className="h-4 w-4 transition-transform duration-fast group-hover:scale-110" />
                Open calendar
              </Link>
            </Button>
          }
        />

        {showOnboarding && (
          <OnboardingBanner
            timezone={user?.timezone ?? "UTC"}
            hasAvailability={myBlockCount > 0}
          />
        )}

        <DashboardBento
          myBlockCount={myBlockCount}
          teamBlockCount={teamBlockCount}
          pendingInvites={pendingInvites}
          overlaps={overlaps}
          events={events}
        />
      </div>
    </PageContainer>
  );
}
