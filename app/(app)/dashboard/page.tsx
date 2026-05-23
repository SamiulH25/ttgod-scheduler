import { DashboardBento } from "@/components/dashboard-bento";
import { OnboardingRitual } from "@/components/onboarding-ritual";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { defaultWeekRange } from "@/lib/dates";
import { toCalendarBlocks } from "@/lib/calendar";
import { findSquadOverlaps } from "@/lib/overlaps";
import { isUnicornOverlap } from "@/lib/unicorn-slot";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { Calendar } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.user!.id;
  const { from, to } = defaultWeekRange();

  const now = new Date();
  const [myBlockCount, teamBlockCount, events, allBlocks] = await Promise.all([
    prisma.availabilityBlock.count({
      where: { userId, start: { lt: to }, end: { gt: from } },
    }),
    prisma.availabilityBlock.count({
      where: {
        start: { lt: to },
        end: { gt: from },
        user: {
          OR: [{ awayUntil: null }, { awayUntil: { lte: now } }],
        },
      },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { createdById: userId },
          { participants: { some: { userId } } },
        ],
        phase: "scheduled",
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
        user: {
          OR: [{ awayUntil: null }, { awayUntil: { lte: now } }],
        },
      },
      select: {
        id: true,
        userId: true,
        start: true,
        end: true,
        label: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    ]);

  const overlapsRaw = findSquadOverlaps(toCalendarBlocks(allBlocks), from, to).slice(
    0,
    3,
  );
  const distinctAvailUsers = new Set(allBlocks.map((b) => b.userId)).size;
  const overlaps = overlapsRaw.map((o) => ({
    ...o,
    unicorn: isUnicornOverlap(o, distinctAvailUsers),
  }));
  const showOnboarding =
    !session!.user!.onboardingCompleted && myBlockCount === 0;

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
          <OnboardingRitual
            timezone={session!.user!.timezone ?? "UTC"}
            hasAvailability={myBlockCount > 0}
          />
        )}

        <DashboardBento
          currentUserId={session!.user!.id}
          myBlockCount={myBlockCount}
          teamBlockCount={teamBlockCount}
          overlaps={overlaps}
          events={events}
          userTimezone={session!.user!.timezone ?? null}
        />
      </div>
    </PageContainer>
  );
}
