"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type GuildRow = { id: string; name: string };

type GuildSwitcherProps = {
  variant?: "rail" | "default";
};

export function GuildSwitcher({ variant = "default" }: GuildSwitcherProps) {
  const [guilds, setGuilds] = useState<GuildRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/guilds");
    if (!res.ok) return;
    const data = await res.json();
    setGuilds(data.guilds ?? []);
    setActiveId(data.activeGuildId ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchGuild(id: string) {
    const res = await fetch("/api/guilds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId: id }),
    });
    if (!res.ok) {
      toast.error("Could not switch guild");
      return;
    }
    setActiveId(id);
    toast.success("Guild updated");
  }

  if (guilds.length <= 1) return null;

  return (
    <div
      className={
        variant === "rail"
          ? "px-3 py-3"
          : "border-t border-dashed border-border/60 px-3 py-2"
      }
    >
      <p className="mb-2 px-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nav-section-label,var(--paper-ink-muted))]">
        Guild
      </p>
      <div className="flex flex-col gap-1">
        {guilds.map((g) => (
          <Button
            key={g.id}
            type="button"
            size="sm"
            variant={g.id === activeId ? "default" : "outline"}
            className="h-8 justify-start truncate font-display text-xs"
            onClick={() => void switchGuild(g.id)}
          >
            {g.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
