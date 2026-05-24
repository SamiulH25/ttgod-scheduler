import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export async function BotHealthCard() {
  const secret = process.env.BOT_API_SECRET;
  let ok = false;
  let version: string | null = null;

  if (secret) {
    try {
      const base = process.env.AUTH_URL ?? "http://localhost:3000";
      const res = await fetch(`${base}/api/bot/v1/health`, {
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        ok = data.ok === true;
        version = data.version ?? null;
      }
    } catch {
      ok = false;
    }
  }

  return (
    <Card tape>
      <CardHeader>
        <CardTitle className="font-display">Discord bot link</CardTitle>
        <CardDescription>API health for your separate bot service</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {secret
            ? ok
              ? `Bot API is reachable${version ? ` (v${version})` : ""}.`
              : "Bot API did not respond — check BOT_API_SECRET and server URL."
            : "Set BOT_API_SECRET in .env to enable bot integration."}
        </p>
        <StatusBadge variant={ok ? "default" : "warning"}>
          {ok ? "Online" : secret ? "Offline" : "Not configured"}
        </StatusBadge>
      </CardContent>
    </Card>
  );
}
