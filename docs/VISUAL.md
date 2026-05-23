# Visual system (paper calendar)

Companion to [PRODUCT.md](./PRODUCT.md). Surfaces must read as a **calendar desk**, not identical taped tiles.

## Surface matrix

| Variant | CSS / component | Tilt | Attachment |
|---------|-----------------|------|------------|
| `calendarPad` | `.calendar-pad`, `CalendarPadFrame` | none | spiral binding |
| `tearOff` | `.tear-off-sheet` | slight | optional one corner |
| `sheet` | `.paper-sheet`, `PaperSurface` | subtle | max one of `tape-tl/tr/br/bl` |
| `sticky` | `.sticky-note` | bulletin spread | pushpin or one tape corner |
| `flat` | `.paper-flat` | none | none |

## Rules

- **Tilt forbidden:** Dialog, Select, tables, form fields, scroll panels.
- **Tape:** At most **one** corner per non-bulletin surface; never default `tape-both` on `Card`.
- **Bulletin:** Cork board only on Campaigns; stickies use `attachmentForId()` + `bulletinTiltFromId()`.
- **Calendar + Hub:** Use `CalendarPadFrame` / `HubCalendarDesk`; not generic bento Cards.

## Manual QA

1. Settings timezone select — axis-aligned menu.
2. `/availability` — spiral pad, ruled grid, tear-off week header.
3. `/dashboard` — desk layout, tear-off overlap note, ruled event list.
4. `/events` — cork + varied stickies, chalk phase labels.
