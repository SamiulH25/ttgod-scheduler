"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PaletteItem = { href: string; label: string; hint?: string };

const ITEMS: PaletteItem[] = [
  { href: "/dashboard", label: "Hub", hint: "overview" },
  { href: "/availability", label: "Calendar", hint: "availability" },
  { href: "/events", label: "Campaigns", hint: "events" },
  { href: "/squad", label: "Team", hint: "squad" },
  { href: "/settings", label: "Settings", hint: "prefs" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(needle) ||
        i.hint?.includes(needle) ||
        i.href.includes(needle),
    );
  }, [q]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="font-display text-lg">Jump to…</DialogTitle>
          <p className="text-xs text-muted-foreground">Ctrl+K anywhere in the app</p>
        </DialogHeader>
        <div className="p-3">
          <Label htmlFor="cmd-q" className="sr-only">
            Search
          </Label>
          <Input
            id="cmd-q"
            autoFocus
            placeholder="Type a page…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="font-sans"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto border-t border-border/40 px-2 pb-2">
          {filtered.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-sm px-3 py-2 font-sans text-sm font-medium text-[var(--paper-ink)] no-underline hover:bg-muted/50",
                )}
                onClick={() => {
                  setOpen(false);
                  setQ("");
                }}
              >
                {item.label}
                <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                  {item.href}
                </span>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-sm text-muted-foreground">No matches</li>
          )}
        </ul>
        <div className="border-t border-border/60 px-3 py-2 text-right">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
