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

## Context menus

- **Availability grid (desktop):** right-click **your** crayon block → Edit slot or Remove slot. Left-click still opens the edit dialog.
- **Availability agenda (mobile):** long-press your solo row for the same menu.
- **Campaign scheduling (host):** right-click a dashed **poll slot** on the grid → Remove slot. Right-click the **draft preview** → Clear preview.
- Empty grid areas suppress the browser menu so right-click does not show default browser items over the paper.

## Deep links

- `/availability?week=YYYY-MM-DD` — week containing that Monday-based week start
- `/availability?day=YYYY-MM-DD` — mobile selected day + week

## Canadian holidays

- **Scope:** Federal public holidays in Canada (`date-holidays`, `CA` only in v1).
- **UI:** `HolidayDayChip` in day column headers and mobile `CompactDayStrip`; `HolidayDayLayer` tints the full day column (availability + event time picker).
- **Logic:** `lib/holidays/canada.ts`, `useWeekHolidays(weekStart)` — no API call.

## Weather

- **Location:** per-user city in Settings → Regional (`weatherCity` + lat/lon on `User`).
- **API:** `GET /api/weather/week?start=YYYY-MM-DD` (Open-Meteo, server-cached). `GET /api/weather/geocode?q=` for city search.
- **UI:** day column headers (`weather-day-chip` + hourly dialog), mobile `CompactDayStrip`, and small per-hour icons on the desktop week grid (`WeatherHourLayer` in availability + event time picker when location is set). AM/PM views only show icons for visible hours. Unconfigured users see a link to Settings in headers only.
- **Units:** Fahrenheit in UI (`lib/weather/format-temp.ts`).

## Tokens

Reuse `--paper-cream`, `--crayon-stroke`, `--overlap`, `font-display`, `paper-sheet`, `tape-*`, `scroll-paper`.
