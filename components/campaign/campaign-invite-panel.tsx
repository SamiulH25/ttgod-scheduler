"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { CampaignSection } from "@/components/campaign/campaign-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { summarizeCampaignInterest } from "@/lib/campaign-interest";
import {
  inviteLinkHint,
  invitePanelDescription,
} from "@/lib/campaign-invite-copy";
import { cn } from "@/lib/utils";
import { ChevronDown, Link2, UserPlus, Users } from "lucide-react";

type SquadUser = { id: string; name: string | null; image: string | null };

type ParticipantRow = {
  id?: string;
  userId: string | null;
  status: string;
  waitlistPosition?: number | null;
  guestEmail?: string | null;
  displayName?: string | null;
  user?: { id: string; name: string | null; image: string | null } | null;
};

type CampaignInvitePanelProps = {
  eventId: string;
  phase: string;
  isHost: boolean;
  currentUserId: string;
  participants: ParticipantRow[];
  onUpdated: () => void;
};

const INVITE_STEPS = [
  { n: 1, label: "Add squad" },
  { n: 2, label: "Share link" },
  { n: 3, label: "They respond" },
] as const;

function statusLabel(status: string, phase: string): string {
  if (status === "pending") {
    return phase === "scheduled" ? "awaiting RSVP" : "awaiting reply";
  }
  return status.replace(/_/g, " ");
}

export function CampaignInvitePanel({
  eventId,
  phase,
  isHost,
  currentUserId,
  participants,
  onUpdated,
}: CampaignInvitePanelProps) {
  const [users, setUsers] = useState<SquadUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");

  const stats = summarizeCampaignInterest(participants);
  const participantIds = new Set(
    participants.map((p) => p.userId).filter((id): id is string => Boolean(id)),
  );
  const addable = users.filter((u) => !participantIds.has(u.id));

  const loadUsers = useCallback(async () => {
    if (!isHost) return;
    setLoadingUsers(true);
    const res = await fetch("/api/users");
    setLoadingUsers(false);
    if (res.ok) {
      const data = (await res.json()) as { users?: SquadUser[] };
      setUsers(data.users ?? []);
    }
  }, [isHost]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function inviteUser(userId: string) {
    setInviteBusy(true);
    const res = await fetch(`/api/events/${eventId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    });
    setInviteBusy(false);
    if (!res.ok) {
      toast.error("Could not add squad member");
      return;
    }
    toast.success("Added to campaign");
    onUpdated();
  }

  async function copyInviteLink() {
    setLinkBusy(true);
    const res = await fetch(`/api/events/${eventId}/public-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLinkBusy(false);
    if (!res.ok) {
      toast.error("Could not create invite link");
      return;
    }
    const data = (await res.json()) as { url?: string };
    if (data.url && typeof window !== "undefined") {
      const full = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(full);
      toast.success("Invite link copied");
    }
  }

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!guestEmail.trim() || !guestName.trim()) return;
    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestEmail: guestEmail.trim(),
        displayName: guestName.trim(),
      }),
    });
    if (!res.ok) {
      toast.error("Could not add guest");
      return;
    }
    toast.success("Guest added");
    setGuestEmail("");
    setGuestName("");
    setGuestOpen(false);
    onUpdated();
  }

  return (
    <CampaignSection
      id="campaign-invites"
      variant="flat"
      title={isHost ? "Invite the squad" : "Squad"}
      description={invitePanelDescription(phase, isHost)}
    >
      {isHost && (
        <ol className="mb-4 grid grid-cols-3 gap-1.5" aria-label="Invite steps">
          {INVITE_STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-sm border border-paper-border bg-[var(--paper-inset-bg)] px-2 py-1.5 text-center"
            >
              <span className="font-display text-[10px] font-bold uppercase text-primary">
                {step.n}
              </span>
              <p className="font-display text-xs font-bold text-[var(--paper-ink)]">
                {step.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {isHost && (
        <div className="space-y-3 border-b border-paper-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-[var(--paper-ink)]">
              <Users className="mr-1 inline size-3.5" />
              Add from squad
            </p>
            {loadingUsers && (
              <span className="text-xs text-[var(--paper-ink-muted)]">Loading…</span>
            )}
          </div>
          {addable.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {addable.map((u) => (
                <Button
                  key={u.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={inviteBusy}
                  className="h-8 gap-1.5 px-2"
                  onClick={() => void inviteUser(u.id)}
                >
                  <UserAvatar name={u.name} image={u.image} size="xs" />
                  <span className="max-w-[6rem] truncate">{u.name ?? "Member"}</span>
                  <UserPlus className="size-3 shrink-0 opacity-70" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--paper-ink-muted)]">
              {users.length === 0
                ? "No other Discord members in the app yet."
                : "Everyone on the squad is already on this campaign."}
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={linkBusy}
            onClick={() => void copyInviteLink()}
          >
            <Link2 className="size-4" />
            {linkBusy ? "Creating link…" : "Copy invite link"}
          </Button>
          <p className="text-xs leading-relaxed text-[var(--paper-ink-muted)]">
            {inviteLinkHint(phase)} Paste in Discord when you&apos;re ready.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-sm bg-[var(--overlap)]/20 px-2 py-0.5 font-bold text-[var(--paper-ink)]">
            {stats.interested.length} in
          </span>
          {stats.awaiting.length > 0 && (
            <span className="rounded-sm border border-dashed border-paper-border px-2 py-0.5 font-medium text-[var(--paper-ink-muted)]">
              {stats.awaiting.length} awaiting
            </span>
          )}
        </div>
        <ul className="max-h-48 space-y-1.5 overflow-y-auto scroll-paper pr-0.5">
          {participants.map((p) => (
            <li
              key={p.userId ?? p.guestEmail ?? p.id ?? "guest"}
              className="flex items-center gap-2 rounded-sm border border-paper-border bg-[var(--paper-inset-bg)] px-2 py-1.5 text-sm"
            >
              <UserAvatar
                name={p.user?.name ?? p.displayName ?? p.guestEmail ?? "Guest"}
                image={p.user?.image ?? null}
                size="xs"
              />
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--paper-ink)]">
                {p.user?.name ?? p.displayName ?? p.guestEmail ?? "Guest"}
                {p.userId === currentUserId ? " (you)" : ""}
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-[9px] uppercase tracking-wide",
                  p.status === "pending"
                    ? "text-primary"
                    : "text-[var(--paper-ink-muted)]",
                )}
              >
                {statusLabel(p.status, phase)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <details
          className="mt-4 rounded-sm border border-dashed border-paper-border"
          open={guestOpen}
          onToggle={(e) => setGuestOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-display text-sm font-bold text-[var(--paper-ink)] [&::-webkit-details-marker]:hidden">
            <ChevronDown
              className={cn("size-4 transition-transform", guestOpen && "rotate-180")}
            />
            Guest outside Discord
          </summary>
          <form onSubmit={addGuest} className="space-y-3 border-t border-paper-border px-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="invite-g-name">Name</Label>
              <Input
                id="invite-g-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-g-email">Email</Label>
              <Input
                id="invite-g-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="w-full">
              Add guest
            </Button>
          </form>
        </details>
      )}
    </CampaignSection>
  );
}
