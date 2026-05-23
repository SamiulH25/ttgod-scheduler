# TTGOD Scheduler — Product pillars

Discord-signed-in **squad calendar**: post availability → discover overlaps → run campaigns → pin sessions → plans/expenses.

## Core loop (always visible)

| Step | Where |
|------|--------|
| Post availability | Calendar (`/availability`) |
| See overlaps | Hub (`/dashboard`) |
| Start / schedule campaign | Campaigns (`/events`), overlap CTAs |
| Pin time + plans | Campaign detail, itinerary |

## What appears where

| Surface | Primary content |
|---------|-----------------|
| **Hub** | Next overlap, hold window, start campaign, upcoming events, manage holds (dialog) |
| **Calendar** | Personal blocks, status, LFG note, quiet hours overlay |
| **Campaigns** | Bulletin stickies, create flow, organize-by-season (collapsed) |
| **Campaign detail** | Interest, schedule + conflict lens, share (when pinned), more options (poll/roles), expenses, photos |
| **Team** | Wall note, collapsible heatmap, groups, activity |
| **Settings** | Theme, timezone, rhythm (away/quiet/energy), ICS + public week link |

## UI system

See [VISUAL.md](./VISUAL.md) for the surface matrix (calendar pad, tear-off, sheet, sticky, flat).

- **Tilt allowed:** bulletin stickies, hub tear-off overlap, landing hero, empty states.
- **Tilt forbidden:** dialogs, selects, dropdown lists, tables, form fields (use `.paper-flat`).
- **Typography:** `font-display` for headings; `font-sans` inside flat overlays and inputs.

## Out of scope

Discord bot slash commands, in-app chat, enterprise SSO.

See [ROADMAP.md](./ROADMAP.md) (v1) and [WAVE2.md](./WAVE2.md) (inventory + keep/simplify/hide).
