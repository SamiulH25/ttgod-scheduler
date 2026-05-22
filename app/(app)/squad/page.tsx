import { auth } from "@/auth";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { SquadGrid } from "@/components/squad-grid";
import { prisma } from "@/lib/db";
import { defaultWeekRange } from "@/lib/dates";
import { Users } from "lucide-react";

export default async function SquadPage() {
  const session = await auth();
  const { from, to } = defaultWeekRange();

  const users = await prisma.user.findMany({
    where: { discordId: { not: null }, id: { not: session!.user!.id } },
    select: {
      id: true,
      name: true,
      image: true,
      availabilityBlocks: {
        where: { start: { lt: to }, end: { gt: from } },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <PageContainer variant="wide">
      <div className="space-y-8">
        <PageHeader
          title="Team"
          subtitle="Everyone who's signed in. Nudge anyone without availability this week."
        />

        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No other team members yet"
            description="When friends sign in, they'll show up here. Share the Discord bot invite."
          />
        ) : (
          <SquadGrid users={users} />
        )}
      </div>
    </PageContainer>
  );
}
