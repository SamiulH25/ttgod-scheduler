import { auth } from "@/auth";
import { BotHealthCard } from "@/components/bot-health-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });

  return (
    <PageContainer variant="default">
      <div className="space-y-8">
        <PageHeader
          title="Settings"
          subtitle="Themes, global font, timezone, and bot connection."
        />
        <SettingsForm
          initialTimezone={user?.timezone ?? "UTC"}
          initialTheme={user?.theme ?? "light"}
          initialFont={user?.font ?? "caveat"}
          userName={session?.user?.name ?? null}
          userImage={session?.user?.image ?? null}
        />
        <BotHealthCard />
      </div>
    </PageContainer>
  );
}
