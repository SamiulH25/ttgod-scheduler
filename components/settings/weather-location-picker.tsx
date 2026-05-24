"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GeocodeResult } from "@/lib/weather/types";

export type WeatherLocationValue = {
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type WeatherLocationPickerProps = {
  value: WeatherLocationValue;
  onChange: (next: WeatherLocationValue) => void;
};

export function WeatherLocationPicker({
  value,
  onChange,
}: WeatherLocationPickerProps) {
  const [query, setQuery] = useState(value.city ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value.city ?? "");
  }, [value.city]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      fetch(`/api/weather/geocode?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d: { results?: GeocodeResult[] }) => {
          setResults(d.results ?? []);
          setOpen((d.results?.length ?? 0) > 0);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function select(row: GeocodeResult) {
    setQuery(row.label);
    onChange({
      city: row.label,
      latitude: row.latitude,
      longitude: row.longitude,
    });
    setOpen(false);
  }

  function clear() {
    setQuery("");
    onChange({ city: null, latitude: null, longitude: null });
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="weather-city">Weather location</Label>
      <div className="relative">
        <Input
          id="weather-city"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            if (!next.trim()) clear();
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search city…"
          autoComplete="off"
          className="font-sans"
        />
        {open && results.length > 0 && (
        <ul
          className="paper-flat absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto border-2 border-[var(--crayon-stroke)] shadow-md"
          role="listbox"
        >
          {results.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                role="option"
                aria-selected={value.city === row.label}
                className={cn(
                  "w-full px-3 py-2 text-left font-sans text-sm hover:bg-muted/50",
                  value.city === row.label && "bg-muted/40",
                )}
                onClick={() => select(row)}
              >
                {row.label}
              </button>
            </li>
          ))}
        </ul>
        )}
      </div>
      <p className="font-sans text-xs text-muted-foreground">
        Used for weather on your calendar (your view only).
      </p>
      {searching && (
        <p className="font-sans text-xs text-muted-foreground">Searching…</p>
      )}
    </div>
  );
}
