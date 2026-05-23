import { BotHealthCard } from "@/components/bot-health-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getSession } from "@/lib/session";
import type { AppFont } from "@/lib/fonts";
import type { AppTheme } from "@/lib/themes";

export default async function SettingsPage() {
  const session = await getSession();
  const user = session!.user!;

  return (
    <PageContainer variant="default">
      <div className="space-y-8">
        <PageHeader
          title="Settings"
          subtitle="Themes, global font, timezone, and bot connection."
        />
        <SettingsForm
          initialTimezone={user.timezone ?? "UTC"}
          initialTheme={(user.theme ?? "light") as AppTheme}
          initialFont={(user.font ?? "caveat") as AppFont}
          userName={user.name ?? null}
          userImage={user.image ?? null}
        />
        <BotHealthCard />
      </div>
    </PageContainer>
  );
}
