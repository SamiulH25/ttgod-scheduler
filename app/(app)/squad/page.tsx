import { getSession } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { SquadGrid } from "@/components/squad-grid";
import { SquadGroupsPanel } from "@/components/squad-groups-panel";
import { SquadHeatmapCard } from "@/components/squad-heatmap-card";
import { WallNoteBanner } from "@/components/wall-note-banner";
import { prisma } from "@/lib/db";
import { defaultWeekRange } from "@/lib/dates";
import { resolveActiveGuildId } from "@/lib/guild-context";
import { endOfMonth, startOfMonth } from "date-fns";
import { PaperPanel } from "@/components/layout/paper-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SquadPage() {
  const session = await getSession();
  const { from, to } = defaultWeekRange();

  const guildId = await resolveActiveGuildId(session!.user!.id);
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const [users, activities, sessionsPinnedThisMonth] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.activity.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.event.count({
      where: {
        phase: "scheduled",
        start: { gte: monthStart, lte: monthEnd },
        ...(guildId ? { guildId } : {}),
      },
    }),
  ]);

  return (
    <PageContainer variant="wide">
      <div className="space-y-8">
        <PageHeader
          title="Team"
          subtitle="Everyone who's signed in. Nudge anyone without availability this week."
        />

        <WallNoteBanner />

        <PaperPanel variant="flat">
          <div className="flex items-center gap-3">
            <p className="font-display text-3xl font-bold tabular-nums text-[var(--paper-ink)]">
              {sessionsPinnedThisMonth}
            </p>
            <p className="text-sm font-medium text-[var(--paper-ink-muted)]">
              Sessions pinned this month
            </p>
          </div>
        </PaperPanel>

        <SquadHeatmapCard />

        <SquadGroupsPanel />

        <Card tiltId="squad-activity" tape>
          <CardHeader>
            <CardTitle className="font-display">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li
                    key={a.id}
                    className="paper-sheet px-3 py-2 text-sm text-[var(--paper-ink)]"
                  >
                    <span className="font-display font-bold">{a.type}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {a.actor?.name ?? "System"} ·{" "}
                      {a.createdAt.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {users.length === 0 ? (
          <EmptyState
            iconName="users"
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
