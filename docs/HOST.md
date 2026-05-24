# Host playbook

Host-first scheduling: find overlapping squad time, run polls, pin with conflict checks, then plans.

## Find slots API

`GET /api/scheduling/find-slots`

| Query | Notes |
|-------|--------|
| `from`, `to` | ISO datetimes; range max **14 days** |
| `durationMinutes` | 15–1440 |
| `eventId` | Optional; uses interested campaign roster (full overlap required) |
| `participantUserIds` | Optional comma-separated; guild members only |
| (none) | Active guild members, min 2 free |

Response: `{ slots: RankedSlot[] }` with `start`, `end`, `overlapCount`, `userIds`, `score`, `reasons[]`.

Auth: session + active guild.

## Scoring (v1)

Transparent weights in `lib/scheduling/find-slots.ts`:

- More overlapping members → higher score
- Full roster match → bonus
- Daytime (10–21) → small bonus
- Host weather: high precip that day → small penalty (never blocks)

## Campaign resources

Hosts can add **links**, **notes**, and **locations** on the campaign sidebar (Resources panel) in any phase — Discord invites, maps, parking, etc. Squad sees the list; host can reorder, edit, or remove.

API: `GET/POST /api/events/[id]/resources`, `PATCH/DELETE .../resources/[resourceId]`, `POST .../resources/reorder`.

## Interest before scheduling

1. **Interest phase** — squad marks yes / no / no reply yet.
2. **Host opens poll** — only after at least one **interested** response (UI blocks earlier).
3. **Scheduling** — time finder includes everyone except `not_interested` / `declined` (pending members still count toward overlap).

## Surfaces

| Surface | Behavior |
|---------|----------|
| **Hub** | Find a time panel — duration, 1 vs 2 weeks, hold / campaign / copy ping |
| **Campaign scheduling** | Suggest squad times → ranked list; compare weeks strip; top picks highlighted on grid |
| **Host playbook** | Collapsible checklist on campaign detail (hosts only) |

## Campaign suggest API

`GET /api/events/[id]/suggest-proposals` — scheduling phase only.

Returns `slots[]` (backward compatible) and `ranked[]` (full scored list). Uses shared `findFullRosterSlots`.

## Fun polish

Celebrations use existing stamp/seal motion (`prefers-reduced-motion` respected). No XP or leaderboards in v1.
