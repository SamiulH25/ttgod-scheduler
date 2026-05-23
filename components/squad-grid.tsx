"use client";

import { PopIn } from "@/components/motion/pop-in";
import { StaggerChildren, StaggerItem } from "@/components/motion/stagger-children";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent } from "@/components/ui/card";

type SquadUser = {
  id: string;
  name: string | null;
  image: string | null;
  availabilityBlocks: { id: string }[];
};

export function SquadGrid({ users }: { users: SquadUser[] }) {
  return (
    <StaggerChildren className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((u, index) => {
        const active = u.availabilityBlocks.length > 0;
        return (
          <StaggerItem key={u.id}>
            <Card
              tiltId={u.id}
              interactive
              tape
              className={active ? "" : "border-dashed"}
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <PopIn delay={index * 0.05}>
                  <UserAvatar name={u.name} image={u.image} size="md" />
                </PopIn>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-bold">
                    {u.name ?? "Member"}
                  </p>
                  <StatusBadge variant={active ? "default" : "muted"} className="mt-2">
                    {active
                      ? `${u.availabilityBlocks.length} crayon blocks`
                      : "No availability yet"}
                  </StatusBadge>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerChildren>
  );
}
