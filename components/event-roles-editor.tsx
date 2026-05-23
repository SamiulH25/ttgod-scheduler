"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = { id: string; name: string; maxCount: number | null; sortOrder: number };

type Part = {
  userId: string | null;
  status: string;
  user?: { id: string; name: string | null; image: string | null } | null;
  roleId?: string | null;
  isBackup?: boolean;
};

type EventRolesEditorProps = {
  eventId: string;
  isHost: boolean;
  participants: Part[];
  onChanged: () => void;
};

export function EventRolesEditor({
  eventId,
  isHost,
  participants,
  onChanged,
}: EventRolesEditorProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/roles`);
    if (!res.ok) return;
    const data = await res.json();
    setRoles(data.roles ?? []);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addRole(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch(`/api/events/${eventId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      toast.error("Could not add role");
      return;
    }
    toast.success("Role added");
    setName("");
    load();
    onChanged();
  }

  async function removeRole(roleId: string) {
    const res = await fetch(`/api/events/${eventId}/roles/${roleId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Could not remove role");
      return;
    }
    load();
    onChanged();
  }

  async function patchParticipation(
    targetUserId: string,
    patch: { roleId?: string | null; isBackup?: boolean; status?: string },
  ) {
    const p = participants.find((x) => x.userId === targetUserId);
    const res = await fetch(`/api/events/${eventId}/participation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: patch.status ?? p?.status ?? "pending",
        ...(patch.roleId !== undefined ? { roleId: patch.roleId } : {}),
        ...(patch.isBackup !== undefined ? { isBackup: patch.isBackup } : {}),
        targetUserId,
      }),
    });
    if (!res.ok) {
      toast.error("Could not update member");
      return;
    }
    onChanged();
  }

  if (!isHost) return null;

  return (
    <div className="paper-sheet space-y-3 p-4">
      <p className="font-display text-lg font-bold">Role slots & bench</p>
      <form onSubmit={addRole} className="flex flex-wrap items-end gap-2">
        <div className="min-w-[8rem] flex-1 space-y-1">
          <Label htmlFor="role-name">New role</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tank, healer…"
          />
        </div>
        <Button type="submit" size="sm">
          Add role
        </Button>
      </form>
      {roles.length > 0 && (
        <ul className="text-sm">
          {roles.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-1">
              <span>
                {r.name}
                {r.maxCount != null ? ` · max ${r.maxCount}` : ""}
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeRole(r.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2 border-t border-border/30 pt-3">
        <p className="text-xs font-semibold text-muted-foreground">Assign roles / bench</p>
        {participants
          .filter((p) => p.userId)
          .map((p) => (
            <div key={p.userId!} className="flex flex-wrap items-center gap-2">
              <span className="min-w-[6rem] text-sm">{p.user?.name ?? p.userId}</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={p.roleId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  void patchParticipation(p.userId!, {
                    roleId: v === "" ? null : v,
                  });
                }}
              >
                <option value="">Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(p.isBackup)}
                  onChange={(e) =>
                    void patchParticipation(p.userId!, { isBackup: e.target.checked })
                  }
                />
                Bench
              </label>
            </div>
          ))}
      </div>
    </div>
  );
}
