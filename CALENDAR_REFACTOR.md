# Calendar module refactor plan

## Current
- `/src/app/calendar/page.tsx` does all UI + state.
- Data source is `scheduled_items` with only `nextRunAt` per item.
- Two views: grid + list.

## Goals
1) Refactor into smaller components + clearer state.
2) Redesign calendar to be more interactive and pleasant on smaller screens.
3) Add week navigation + quick filters.
4) Improve "what runs when" by expanding recurring schedules into multiple occurrences within the week (where possible).

## Proposed UX
- Top controls:
  - Week picker: Prev / Today / Next
  - View toggle: Timeline | Grid | Agenda (rename list to Agenda)
  - Filters: system (openclaw/windows), enabled, text search, severity (optional)
  - Refresh button + last refresh time
- Main area:
  - **Agenda view** (default on small screens): grouped by day with collapsible sections.
  - **Grid view**: keep for big screens; better spacing + sticky day header.
  - **Timeline view**: vertical "upcoming" list with hour separators.
- Item interactions:
  - Click item → detail drawer with:
    - schedule text, command/payload preview, next occurrence(s)
    - quick actions:
      - For openclaw jobs: "Run now" (calls `openclaw cron run` via API)
      - For windows tasks: "Run now" (calls schtasks /Run) (local-only)
      - Copy command / copy externalId

## Data improvements
- During schedule refresh, generate **occurrences** for the selected week:
  - For OpenClaw cron schedules: use cron-parser + tz to compute all run times within [start,end)
  - For Windows tasks: we may only have Next Run Time; treat as single occurrence.
- Store occurrences in Convex:
  - `schedule_occurrences` table keyed by `scheduled_item_id + runAt`
  - Or embed occurrences in UI generated on the fly.

## Implementation approach
- Phase A: UI refactor + redesign without DB change.
- Phase B: Occurrence expansion + Run-now actions.
