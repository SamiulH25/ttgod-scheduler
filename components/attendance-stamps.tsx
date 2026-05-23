"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AttendanceRow = {
  userId: string;
  status: string;
  user: { id: string; name: string | null; image: string | null };
};

type Stats = {
  total: number;
  attended: number;
  missed: number;
  excused: number;
  unknown: number;
};

type AttendanceStampsProps = {
  eventId: string;
  isHost: boolean;
  currentUserId: string;
  /** Participants with userId for stamping */
  participantUserIds: string[];
};

const STATUSES = ["attended", "missed", "excused", "unknown"] as const;

export function AttendanceStamps({
  eventId,
  isHost,
  currentUserId,
  participantUserIds,
}: AttendanceStampsProps) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/attendance`);
    setLoading(false);
    if (!res.ok) {
      setRows([]);
      setStats(null);
      return;
    }
    const data = await res.json();
    setRows(data.attendances ?? []);
    setStats(data.stats ?? null);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(userId: string, status: (typeof STATUSES)[number]) {
    const res = await fetch(`/api/events/${eventId}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    if (!res.ok) {
      toast.error("Could not update stamp");
      return;
    }
    const data = await res.json();
    setStats(data.stats);
    setRows((prev) => {
      const rest = prev.filter((r) => r.userId !== userId);
      return [...rest, data.attendance];
    });
    toast.success("Stamp saved");
  }

  const byUser = new Map(rows.map((r) => [r.userId, r]));

  if (loading) {
    return (
      <Card tiltId="attendance-loading" tape>
        <CardHeader>
          <CardTitle>Attendance stamps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card tiltId="campaign-attendance" tape>
      <CardHeader>
        <CardTitle>Attendance stamps</CardTitle>
        <p className="text-sm text-muted-foreground">
          {stats.attended} showed · {stats.missed} missed · {stats.excused} excused ·{" "}
          {stats.unknown} unknown
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {participantUserIds.map((uid) => {
          const row = byUser.get(uid);
          const status = row?.status ?? "unknown";
          const user = row?.user;
          const canEdit = isHost || uid === currentUserId;
          return (
            <div
              key={uid}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <UserAvatar
                  name={user?.name ?? null}
                  image={user?.image ?? null}
                  size="sm"
                />
                <span className="font-medium">{user?.name ?? uid}</span>
                <span className="text-xs uppercase text-muted-foreground">{status}</span>
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={status === s ? "default" : "outline"}
                      className={cn("capitalize", status === s && "ring-2 ring-primary/30")}
                      onClick={() => void setStatus(uid, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
