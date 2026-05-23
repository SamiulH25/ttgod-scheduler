"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone } from "lucide-react";

type WallNote = {
  id: string;
  body: string;
  expiresAt: string;
  createdBy: { id: string; name: string | null; image: string | null };
};

export function WallNoteBanner() {
  const [notes, setNotes] = useState<WallNote[]>([]);
  const [body, setBody] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/wall-notes");
    if (!res.ok) return;
    const data = await res.json();
    setNotes(data.notes ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postNote(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !expiresAt) {
      toast.error("Note and expiry required");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/wall-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: body.trim(),
        expiresAt: new Date(expiresAt).toISOString(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not post note");
      return;
    }
    toast.success("Posted to the wall");
    setBody("");
    setExpiresAt("");
    load();
  }

  if (notes.length === 0) {
    return (
      <div className="paper-sheet tape-both tape-tl tape-tr rounded-lg border border-border/40 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <Megaphone className="mt-0.5 size-5 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-display text-lg font-bold">Guild wall</p>
            <form onSubmit={postNote} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1 space-y-1">
                <Label htmlFor="wall-body">Shout something</Label>
                <Input
                  id="wall-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Boss week, raid night, pizza budget…"
                  maxLength={2000}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wall-exp">Expires</Label>
                <Input
                  id="wall-exp"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={busy}>
                Pin
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const top = notes[0]!;
  return (
    <div className="paper-sheet tape-both tape-tl tape-tr rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Megaphone className="mt-0.5 size-5 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Guild wall · until {new Date(top.expiresAt).toLocaleString()}
          </p>
          <p className="mt-1 font-display text-lg font-bold">{top.body}</p>
          <p className="text-xs text-muted-foreground">— {top.createdBy.name ?? "Squad"}</p>
        </div>
        <form onSubmit={postNote} className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[14rem]">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add another note"
            maxLength={2000}
          />
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={busy}>
            Stack note
          </Button>
        </form>
      </div>
    </div>
  );
}
