"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SquadGroup = { id: string; name: string; memberCount: number };

export function SquadGroupsPanel() {
  const [groups, setGroups] = useState<SquadGroup[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/squad-groups");
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not load squad groups");
      return;
    }
    const data = await res.json();
    const raw = data.groups ?? [];
    setGroups(
      raw.map((g: { id: string; name: string; members?: unknown[] }) => ({
        id: g.id,
        name: g.name,
        memberCount: g.members?.length ?? 0,
      })),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/squad-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      toast.error("Could not create group");
      return;
    }
    toast.success("Group created");
    setName("");
    load();
  }

  return (
    <Card tiltId="squad-groups" tape>
      <CardHeader>
        <CardTitle className="font-display">Squad groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={createGroup} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 space-y-1">
            <Label htmlFor="sg-name">New group name</Label>
            <Input
              id="sg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend drivers"
            />
          </div>
          <Button type="submit" disabled={!name.trim()}>
            Add
          </Button>
        </form>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No groups yet — create one for ping lists.
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="paper-sheet flex items-center justify-between px-3 py-2">
                <span className="font-display font-bold">{g.name}</span>
                <span className="text-xs text-muted-foreground">
                  {g.memberCount} members
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
