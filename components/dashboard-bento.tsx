"use client";

import { HubCalendarDesk } from "@/components/hub/calendar-desk";
import { SoftHoldsManageDialog } from "@/components/soft-holds-manage-dialog";

type OverlapSlot = {
  start: string;
  end: string;
  count: number;
  users: { id: string; name: string | null; image: string | null }[];
  unicorn?: boolean;
};

type EventRow = {
  id: string;
  title: string;
  start: Date | null;
  createdBy: { name: string | null; image: string | null };
};

type DashboardBentoProps = {
  currentUserId: string;
  myBlockCount: number;
  teamBlockCount: number;
  pendingInvites?: number;
  overlaps: OverlapSlot[];
  events: EventRow[];
  userTimezone?: string | null;
};

export function DashboardBento({
  currentUserId,
  myBlockCount,
  teamBlockCount,
  pendingInvites = 0,
  overlaps,
  events,
  userTimezone,
}: DashboardBentoProps) {
  return (
    <div className="hub-desk-surface -mx-2 rounded-lg px-2 py-4 sm:mx-0 sm:px-4">
      <div className="mb-3 flex justify-end">
        <SoftHoldsManageDialog currentUserId={currentUserId} />
      </div>
      <HubCalendarDesk
        myBlockCount={myBlockCount}
        teamBlockCount={teamBlockCount}
        pendingInvites={pendingInvites}
        overlaps={overlaps}
        events={events}
        userTimezone={userTimezone}
      />
    </div>
  );
}
