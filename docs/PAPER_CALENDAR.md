# Paper calendar system

TTGOD uses a shared **paper calendar** UI: cream paper, crayon blocks, ruled hour lines, and tape-corner sheets—not a flat SaaS grid.

## Components (`components/calendar/`)

| Module | Use |
|--------|-----|
| `week-time-grid.tsx` | Sticky week header, time gutter, 7 day columns via `renderDayColumn` |
| `week-toolbar.tsx` | Week nav + optional AM/PM/Full |
| `paper-calendar-shell.tsx` | Border, shadow, optional `PaperFlip` on week change |
| `time-gutter.tsx` | Hour labels and ruled lines |
| `compact-day-strip.tsx` | Mobile horizontal day chips |
| `agenda-day-list.tsx` | Mobile list of blocks/overlaps for one day |
| `event-day-column.tsx` | Events, proposals, selection, ghost availability |
| `hooks/use-week-pointer.ts` | Cross-day drag for event picker |

## CSS (`app/globals.css`)

- `.paper-calendar-grid-shell` — main grid frame (binding accent on left)
- `.paper-calendar-grid-scroll` — scroll area max height
- `.paper-calendar-day-column--today` / `.paper-calendar-day-header--today`
- `.paper-calendar-member-chip` — roster and day strip chips
- Legacy `.availability-*` classes remain as aliases

## When to use grid vs agenda

- **Desktop (`lg+`)**: full `WeekTimeGrid` with availability or event layers.
- **Mobile (`<lg`)**: `CompactDayStrip` + `AgendaDayList` on `/availability`; event picker still shows scrollable grid below strip.

## Data layers

- **Availability**: `buildDayLayout` in `lib/calendar.ts` → solo rects + overlap bands.
- **Events**: `lib/event-calendar-segments.ts` → multi-day segment positions.
- **Agenda**: `lib/agenda-items.ts` → sorted list for one day.

## Deep links

- `/availability?week=YYYY-MM-DD` — week containing that Monday-based week start
- `/availability?day=YYYY-MM-DD` — mobile selected day + week

## Tokens

Reuse `--paper-cream`, `--crayon-stroke`, `--overlap`, `font-display`, `paper-sheet`, `tape-*`, `scroll-paper`.
