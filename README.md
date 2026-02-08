# Mission Control

Local Mission Control console for OpenClaw: Activity Feed, Weekly Calendar, Alerts, Autopilot, and Global Search.

## Requirements
- Windows 10/11
- Node.js 20+ (works on 22+)
- OpenClaw CLI on PATH (recommended)

## Setup (local)

### 1) Install
```bash
npm install
```

### 2) Start Convex (local backend)
```bash
npm run convex
```
First run creates a local deployment and writes `.env.local`.

### 3) Generate types
```bash
npm run convex:codegen
```

### 4) Start Next.js
```bash
npm run dev
```
Open: http://localhost:3000

Optional (run both):
```bash
npm run dev:all
```

## Features

### Activity Feed
- Stores every event as `activity_events` in Convex.
- Ingestion:
  - `POST /api/activity`
  - CLI: `npm run emit-activity`

### Weekly Calendar
- Imports upcoming runs from:
  - OpenClaw cron jobs (`openclaw cron list --json --all`)
  - Windows Scheduled Tasks (`schtasks /Query /FO LIST /V`)

Refresh via UI button or:
```bash
npm run refresh-schedules
```

### Global Search
- Searches a unified `search_items` index.
- Workspace indexing:
```bash
npm run index-workspace
```

### Alerts (Telegram)
- A simple rules engine assigns tags/severity and enqueues alerts.
- Dispatch queued alerts:
```bash
npm run dispatch-alerts
```

Defaults:
- `MC_ALERT_CHANNEL=telegram`
- `MC_ALERT_TARGET=6723471511`

(You can set these as env vars if you want different targets.)

### Autopilot
Runs in a loop:
- refresh schedules
- import cron run history
- dispatch alerts

Start manually:
```bash
npm run autopilot
```
Or via UI: `/autopilot`.

## Language toggle
- UI supports **DA/EN**.
- Toggle via the **DA/EN** button in the sidebar/topbar.

## Useful scripts
- `npm run refresh-schedules`
- `npm run index-workspace`
- `npm run import-openclaw-cron-runs`
- `npm run dispatch-alerts`
- `npm run autopilot`

## Notes
- This app is intended to be **local-only**. Do not expose to the internet without auth.
- Workspace path can be overridden with `OPENCLAW_WORKSPACE`.
