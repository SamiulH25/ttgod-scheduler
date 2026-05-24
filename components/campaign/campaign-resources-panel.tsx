"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PaperPanel } from "@/components/layout/paper-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EventResourceKind } from "@/lib/validations";
import {
  ChevronDown,
  ChevronUp,
  Link2,
  MapPin,
  Pencil,
  StickyNote,
  Trash2,
} from "lucide-react";

export type CampaignResourceRow = {
  id: string;
  kind: string;
  title: string;
  url: string | null;
  body: string | null;
  address: string | null;
  sortOrder: number;
};

type CampaignResourcesPanelProps = {
  eventId: string;
  resources: CampaignResourceRow[];
  isHost: boolean;
  onUpdated: () => void;
};

const KIND_LABELS: Record<EventResourceKind, string> = {
  link: "Link",
  note: "Note",
  location: "Location",
};

function KindIcon({ kind }: { kind: string }) {
  if (kind === "link") return <Link2 className="size-4 shrink-0" />;
  if (kind === "location") return <MapPin className="size-4 shrink-0" />;
  return <StickyNote className="size-4 shrink-0" />;
}

function ResourceBody({ resource }: { resource: CampaignResourceRow }) {
  if (resource.kind === "link" && resource.url) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        {resource.url}
      </a>
    );
  }
  if (resource.kind === "note" && resource.body) {
    return (
      <p className="whitespace-pre-wrap text-sm text-[var(--paper-ink-muted)]">
        {resource.body}
      </p>
    );
  }
  if (resource.kind === "location") {
    return (
      <div className="space-y-1 text-sm">
        {resource.address && (
          <p className="text-[var(--paper-ink-muted)]">{resource.address}</p>
        )}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Open map
          </a>
        )}
      </div>
    );
  }
  return null;
}

type FormState = {
  kind: EventResourceKind;
  title: string;
  url: string;
  body: string;
  address: string;
};

const emptyForm = (kind: EventResourceKind = "link"): FormState => ({
  kind,
  title: "",
  url: "",
  body: "",
  address: "",
});

export function CampaignResourcesPanel({
  eventId,
  resources,
  isHost,
  onUpdated,
}: CampaignResourcesPanelProps) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: form.kind,
        title: form.title,
        url: form.url || null,
        body: form.body || null,
        address: form.address || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Could not add resource");
      return;
    }
    toast.success("Resource added");
    setForm(emptyForm());
    setAdding(false);
    onUpdated();
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    const res = await fetch(
      `/api/events/${eventId}/resources/${editingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.kind,
          title: form.title,
          url: form.url || null,
          body: form.body || null,
          address: form.address || null,
        }),
      },
    );
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Could not update resource");
      return;
    }
    toast.success("Resource updated");
    setEditingId(null);
    setForm(emptyForm());
    onUpdated();
  }

  async function remove(id: string) {
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/resources/${id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not delete resource");
      return;
    }
    toast.success("Resource removed");
    onUpdated();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = resources.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= resources.length) return;
    const orderedIds = resources.map((r) => r.id);
    [orderedIds[idx], orderedIds[j]] = [orderedIds[j]!, orderedIds[idx]!];
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/resources/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not reorder");
      return;
    }
    onUpdated();
  }

  function startEdit(r: CampaignResourceRow) {
    setEditingId(r.id);
    setAdding(false);
    setForm({
      kind: r.kind as EventResourceKind,
      title: r.title,
      url: r.url ?? "",
      body: r.body ?? "",
      address: r.address ?? "",
    });
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function renderForm(onSubmit: (e: React.FormEvent) => void) {
    return (
      <form onSubmit={onSubmit} className="space-y-3 rounded-sm border border-paper-border bg-[var(--paper-inset-bg)] p-3">
        <div className="space-y-1">
          <Label>Type</Label>
          <Select
            value={form.kind}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, kind: v as EventResourceKind }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABELS) as EventResourceKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            maxLength={120}
          />
        </div>
        {form.kind === "link" && (
          <div className="space-y-1">
            <Label>URL</Label>
            <Input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://"
              required
            />
          </div>
        )}
        {form.kind === "note" && (
          <div className="space-y-1">
            <Label>Note</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              maxLength={2000}
            />
          </div>
        )}
        {form.kind === "location" && (
          <>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                required
                maxLength={500}
              />
            </div>
            <div className="space-y-1">
              <Label>Map link (optional)</Label>
              <Input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={busy}>
            {editingId ? "Save" : "Add"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={cancelForm}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <PaperPanel
      variant="flat"
      title="Resources"
      description="Links, notes, and places for the squad."
      action={
        isHost && !adding && !editingId ? (
          <Button type="button" size="sm" onClick={() => setAdding(true)}>
            Add
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        {adding && renderForm(submitCreate)}
        {editingId && renderForm(submitEdit)}

        {resources.length === 0 && !adding && (
          <p className="text-sm text-[var(--paper-ink-muted)]">
            {isHost
              ? "Add Discord invites, maps, or notes the squad needs before you pin a time."
              : "No resources yet."}
          </p>
        )}

        <ul className="space-y-2">
          {resources.map((r, i) => (
            <li
              key={r.id}
              className={cn(
                "rounded-sm border border-paper-border bg-[var(--paper-inset-bg)] p-3",
                editingId === r.id && "ring-2 ring-primary/30",
              )}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">
                  <KindIcon kind={r.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-[var(--paper-ink)]">
                    {r.title}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--paper-ink-muted)]">
                    {KIND_LABELS[r.kind as EventResourceKind] ?? r.kind}
                  </p>
                  <div className="mt-1.5">
                    <ResourceBody resource={r} />
                  </div>
                </div>
                {isHost && editingId !== r.id && (
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={busy || i === 0}
                      onClick={() => void move(r.id, -1)}
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={busy || i === resources.length - 1}
                      onClick={() => void move(r.id, 1)}
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={busy}
                      onClick={() => startEdit(r)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive"
                      disabled={busy}
                      onClick={() => void remove(r.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PaperPanel>
  );
}
