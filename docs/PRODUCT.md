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
| **Hub** | Next overlap, **Find a time** (2-week ranked slots), hold window, start campaign, upcoming events, manage holds (dialog) |
| **Calendar** | Personal blocks, status, LFG note, quiet hours overlay |
| **Campaigns** | Bulletin stickies, create flow, organize-by-season (collapsed) |
| **Campaign detail** | Host playbook checklist, **Invite the squad** (add members → copy link → they respond), interest, schedule + ranked squad times + conflict lens, RSVP banner when pinned, share/printable (when pinned), more options (poll/roles), **resources**, expenses, photos |
| **Team** | Sessions pinned this month, wall note, collapsible heatmap, groups, activity |
| **Settings** | Theme, timezone, rhythm (away/quiet/energy), ICS + public week link |

## Landing (logged out)

- **CTA-first** public page at `/`: headline and Discord sign-in above the fold; product preview and four-step loop below.
- **Dev sign-in** lives in a collapsed `<details>` panel (development only), not beside the primary CTA.
- **No card tilt** on landing; wall copy uses `wall-title` / `wall-subtitle`.

## UI system

- **No rotation:** cards, stickies, bento, nav, dialogs, and forms stay axis-aligned (`.paper-sheet`, `.paper-flat`, `.nav-rail-item`).
- **Surfaces:** wall (`--foreground` on `--app-canvas`); cream paper (`--paper-cream`, `--paper-ink`); panels (`.paper-panel`, `.paper-callout`); taped hero cards (`.paper-sheet` + tape).
- **Borders:** theme-aware `--paper-border` / `--paper-border-strong` (from `--crayon-stroke`), not generic `border-border` on paper.
- **Typography:** `font-display` for headings; `wall-title` / `wall-subtitle` on canvas; `paper-panel-title` on cream; muted copy uses `--paper-ink-muted` on paper.
- **Layout:** `PageContainer` → `.app-page`; structured blocks → `PaperPanel` (`CampaignSection` alias).

## Out of scope

Discord bot slash commands, in-app chat, enterprise SSO.

See [ROADMAP.md](./ROADMAP.md) (v1), [WAVE2.md](./WAVE2.md) (inventory), and [HOST.md](./HOST.md) (find-slots + host flows).

**Fun in v1:** micro-celebrations (stamp/seal on pin/vote), unicorn overlap badge — not chat bots or progression meta-game.
