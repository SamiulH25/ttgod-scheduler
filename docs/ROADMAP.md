# TTGOD roadmap checklist

High-level delivery tracker (see product plan elsewhere for full spec).

## Phase 0 — Foundation

- [x] Activity logging on availability create/update/delete, event create, phase transitions, archive
- [x] Overlap windows show “who’s free” on mobile + agenda (`SlotFreeUsers`)
- [x] Duplicate campaign (host) via `POST /api/events/[id]/duplicate`

## Phase 1 — Availability depth

- [x] Status (free / tentative / busy) + weekly recurrence JSON on blocks
- [x] Copy last week (`POST /api/availability/copy-week`)
- [x] Paper styles for busy/tentative blocks; overlaps use `free` only
- [x] Timezone captions on hub + settings calendar subscribe

## Phase 2 — Campaigns

- [x] Suggest slots from squad availability (`GET …/suggest-proposals`)
- [x] Ranked voting UI + Borda finalize path
- [x] Waitlist promote (host), guest invites, templates on create, archived recap card

## Phase 3 — Collaboration

- [x] Copy ping list helper + button (hub overlap + scheduling preview)
- [x] Squad activity feed + squad groups panel
- [x] Guest form on campaign detail

## Phase 4 — Shell

- [x] Week strip links/dots; Ctrl+K command palette
- [x] Settings notification JSON + onboarding stats from API
- [x] Onboarding banner uses `/api/user/onboarding`

## Phase 5 — Plans & money

- [x] Even-split preview (`lib/expense-settle`)
- [x] Plan items: URL + checklist JSON on itinerary

## Phase 6 — Ops

- [x] This checklist + README / `.env.example` PostgreSQL note
- [x] Default guild seed on sign-in + guild switcher (side rail)
- [x] Playwright smoke (`e2e/smoke.spec.ts`)
