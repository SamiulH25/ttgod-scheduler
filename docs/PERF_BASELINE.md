# Navigation performance baseline

Record before/after when tuning app speed. Dev builds log transition timing when `NODE_ENV=development`.

## Routes to test

| Route | Document (Network) | XHR after paint | Notes |
|-------|-------------------|-----------------|-------|
| `/dashboard` | | | RSC overlap query |
| `/events` | | | Was 3× API; now server-prefetched |
| `/availability` | | | `GET /api/availability` on mount |
| `/events/[id]` | | | Campaign detail RSC |

## How to measure

1. **Chrome DevTools → Network**: disable cache, click nav link, note **document** time until response.
2. **Performance panel**: record click → LCP; note main-thread long tasks.
3. **Console (dev)**: look for `[perf] page-transition:*` after route changes.

## Targets (subjective)

- Nav click → readable content: **&lt; 500ms** on local dev after optimizations
- No full-page skeleton flash on bulletin Yes/No/archive

## Env flags

| Variable | Effect |
|----------|--------|
| `NEXT_PUBLIC_PLAYFUL_NAV=1` | Full spring page transition (slower) |
| (default) | Snappy opacity-only nav (~120ms fade, no `mode="wait"`) |

## Optimizations applied (2026-05)

- `getSession()` dedupes `auth()` per RSC request
- Root layout reads theme/font from JWT (no extra Prisma read)
- `/events` server-prefetches bulletin data (no post-nav triple fetch)
- `eventListInclude` + throttled `autoArchive` on list GET
- Optimistic bulletin interest/RSVP/archive (no full reload skeleton)
- Campaign detail loads calendar ranges client-side (`?ranges=1`)
- API `requireSession` uses JWT user (no per-request `findUnique`)
- Calendar drag preview localized per column; week flip shortened when snappy
