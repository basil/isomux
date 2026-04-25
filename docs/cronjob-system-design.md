# Cronjob System Design

## Overview

A new "page" (UI view) that lets humans schedule recurring SDK sessions in the office. Each cronjob has a schedule, a name, a prompt, and the same configurability as an isomux agent (model, thinking effort, working directory, permission mode). On schedule, the cronjob spawns a fresh subagent session that runs the prompt; the resulting transcript is preserved as a "run" and is browsable, resumable, and forkable from the UI.

Cronjobs are **not** isomux agents. They have no desk, no room, no persistent identity — only configuration and a history of runs. They are a separate top-level concept stored under `~/.isomux/cronjobs/`.

Example use case: a daily 09:00 cronjob with prompt "look at what every agent accomplished yesterday and summarize" produces a browsable history of daily summaries, each one resumable for follow-up questions.

## Architecture

- Each scheduled fire creates a fresh SDK V2 session via `unstable_v2_createSession` (in-process, same SDK already used by `agent-manager.ts`). No `ManagedAgent` wrapper, no PTY, no desk.
- Each run is one session lineage: a root session plus any forks the user creates by editing past messages. This mirrors the agent log structure exactly.
- A single server-side scheduler tick runs every 60s, checks every enabled cronjob's `nextFireAt`, and fires any whose time has passed. Same pattern as `update-checker.ts`.
- Live SDK message stream is broadcast over the existing log-broadcast WebSocket channel, so any UI viewing a currently-running run gets a live tail.

## Data Model

### Cronjob

```ts
interface Cronjob {
  id: string;                  // 8-char hex (matches Task ID format)
  name: string;                // free text, not unique
  schedule: Schedule;          // tagged union below
  prompt: string;              // the user message sent at each fire
  cwd: string;                 // working directory; default "~"
  modelFamily: ModelFamily;    // "opus" | "sonnet" | "haiku"; default "opus"
  effort: EffortLevel;         // default "xhigh"
  permissionMode: "bypassPermissions" | "auto";  // default "bypassPermissions"
  enabled: boolean;            // default true
  createdBy: string;           // username or agent name
  device: string | null;       // boss name (multi-boss attribution)
  createdAt: number;           // unix ms
  lastFireAt: number | null;   // unix ms of most recent successful start
  nextFireAt: number;          // unix ms of next scheduled fire
}

type Schedule =
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: 0|1|2|3|4|5|6; hour: number; minute: number }  // 0 = Sunday
  | { type: "interval"; minutes: number };  // floor enforced server-side (e.g., min 5)
```

All times are server-local. Timezone handling is out of scope for v1.

### Run

```ts
interface CronjobRun {
  id: string;                  // 8-char hex
  cronjobId: string;
  cronjobName: string;         // denormalized so deleted-cronjob runs still display
  trigger: "scheduled" | "manual";
  status: "running" | "completed" | "failed" | "timed_out" | "skipped";
  startedAt: number;           // unix ms
  endedAt: number | null;      // unix ms, null while running
  errorReason: string | null;  // populated for failed/timed_out/skipped
  promptSnapshot: string;      // prompt at fire time (config-edits-while-running don't change it)
  modelFamilySnapshot: ModelFamily;
  effortSnapshot: EffortLevel;
  cwdSnapshot: string;
  permissionModeSnapshot: "bypassPermissions" | "auto";
  rootSessionId: string;       // first session id created at fire time
  previewText: string;         // last assistant text block, truncated ~120 chars
}
```

`status: "skipped"` is recorded for the **overlap** case (a scheduled fire happened while a previous scheduled run was still executing). Missed fires due to server downtime do not produce skipped rows.

### Office config addition

```ts
// added to existing office-config.json
cronjobsPrompt: string | null;  // applied to every cronjob's system prompt
```

## Storage Layout

```
~/.isomux/
  office-config.json                   (existing; gains cronjobsPrompt field)
  cronjobs/
    cronjobs.json                      (configs: Cronjob[])
    cronjob-history.json               (deleted cronjob name preservation: { id -> { lastName } })
    <jobId>/
      runs.json                        (run index: CronjobRun[])
      <runId>/
        sessions.json                  (fork lineage + per-session usage; same shape as agents')
        <sessionId>.jsonl              (one per session in fork tree)
```

Mirrors `~/.isomux/logs/<agentId>/` exactly with one extra layer of nesting (jobId/runId).

## Scheduler Engine

- `setInterval(tick, 60_000)` started in `server/index.ts` alongside the existing update checker.
- Each tick:
  1. Load `cronjobs.json`.
  2. For each enabled cronjob where `now >= nextFireAt`:
     - Check overlap: is there a `runs.json` entry with `trigger == "scheduled" && status == "running"` for this jobId? If yes, write a new run with `status: "skipped"`, leave `nextFireAt` recomputed for the next future instant, and continue.
     - Otherwise, fire (see Run Lifecycle).
- `nextFireAt` is computed from the schedule at config-save time and after each fire.
- **Missed fires (server was down):** on startup, recompute `nextFireAt` for every cronjob from current time forward — the next future scheduled instant. Past instants are skipped silently.
- **Editing a cronjob's schedule** recomputes `nextFireAt` immediately.
- **`interval` schedules** anchor to the cronjob's `createdAt` so the cadence is predictable.

## Run Lifecycle

- **Fire:** create a new run row with `status: "running"`, generate `rootSessionId`, build the system prompt (see below), open SDK session, send `promptSnapshot` as the first user message. Stream messages append to the run's JSONL and broadcast over WebSocket.
- **Successful completion:** SDK emits its terminal `result` message. Set `status: "completed"`, `endedAt`, and compute `previewText` from the last assistant text block.
- **Hard timeout:** global server constant (30 min for v1). Timer fires, session is killed, `status: "timed_out"`, `errorReason: "exceeded global run timeout"`.
- **Server crash mid-run:** on startup, scan `runs.json` for any row with `status: "running"` whose process is no longer alive; mark `status: "failed"`, `errorReason: "server restarted during run"`. Transcript may be partial; that's fine.
- **`enabled: false`:** cronjob still exists in the table; scheduler skips it. Existing runs remain accessible.
- **Manual "Run now":** identical execution path with `trigger: "manual"`. Does not affect `nextFireAt`. Independent of overlap rule (the user explicitly chose to run it).
- **Edit while running:** allowed. The in-flight run uses its `*Snapshot` fields; the edit applies to the next scheduled fire.

## System Prompt Layering

Built when a session is created (root or fork). Layers, in order:

1. **Cronjob baseline boilerplate** — "You are a scheduled cronjob named <name> running on schedule <schedule>. You don't have a desk or persistent identity. Each scheduled run starts fresh."
2. **Office prompt** — same field already shared by all agents.
3. **Cronjobs-wide prompt** — `office-config.json::cronjobsPrompt`. Edited from a "Cronjobs settings" button in the Cronjobs page header (mirror of the office-settings dialog). Optional.
4. **Discovery hints** — same task-board curl docs and `~/.isomux/agents-summary.json` reference that regular agents get, plus a pointer to past run transcripts: "Past runs of this cronjob are at `~/.isomux/cronjobs/<jobId>/<runId>/`. Read them if you need continuity."

The cronjob's own `prompt` field is **not** part of the system prompt — it is sent as the first user message at fire time.

There is no per-cronjob `customInstructions` field. If you want behavioral guidance specific to one cronjob, put it in the prompt itself; the prompt is static per-cronjob and re-sent each fire.

## Permissions / Safety

- Permission mode picker offers only `bypassPermissions` and `auto` (others would block forever in unattended runs).
- Default: `bypassPermissions`.
- The same `safety-hooks.ts` (PreToolUse hooks) attached to every agent session is also attached to every cronjob session: blocks writes to `~/.isomux/`, destructive git, `rm -rf`, and reads of secrets.
- Cwd validation reuses `validateCwd` from agent spawn.
- Cwd suggestions use the existing `recent-cwds.json`.

## HTTP / WebSocket API

WebSocket commands (added to `ClientCommand` union in `shared/types.ts`):

```
add_cronjob       { name, schedule, prompt, cwd?, modelFamily?, effort?, permissionMode?, username, device? }
update_cronjob    { id, changes: Partial<Pick<Cronjob, "name" | "schedule" | "prompt" | "cwd" | "modelFamily" | "effort" | "permissionMode" | "enabled">> }
delete_cronjob    { id }
run_cronjob_now   { id, username, device? }
update_cronjobs_prompt { value: string }
```

Run rows are immortal: no `delete_run`, no edit. The user can resume any run's lineage by sending a turn into its log view; that goes through the existing log-resume command path.

HTTP endpoints (mirror `/tasks`):

```
GET  /cronjobs                    list configs
GET  /cronjobs/:id                single config + run summary
GET  /cronjobs/:id/runs           paginated run list
GET  /cronjobs/:id/runs/:runId    run metadata + transcript
```

DELETE blocked at HTTP level (WebSocket-only, mirroring tasks).

## UI

Two flat top-level tables, accessed via:
- A new "Cronjobs" entry in the office nav bar with a clock icon.
- A click handler on the existing decorative clock at `Floor.tsx:271-290`.

Both routes land on the **Runs** tab by default.

### Top-level state

```ts
cronjobsOpen: boolean
cronjobsView: "runs" | "cronjobs"   // tab toggle inside the page
runFilter: { cronjobId: string } | null
```

Selected-cronjob and selected-run remain component-local UI state (not in the back-button stack). `goHome()` from any cronjob view returns to the office in one back step.

### Cronjobs tab

Full-width table. Columns: enabled toggle, name, schedule (humanized, e.g., "Daily at 09:00"), last run, next run, lifetime token spend, createdBy, device, actions (edit pencil).

- "+ New cronjob" button opens a modal (`CronjobDialog`) — borrows the form layout from `EditAgentDialog.tsx` for cwd/model/effort/permission pickers, plus schedule and prompt fields.
- Clicking a row body navigates to the Runs tab with a pinned filter chip `Cronjob: <name>  ✕`.
- Clicking the pencil opens the edit modal.
- Delete is a confirm-dialog action inside the edit modal; soft delete (config row removed, runs preserved with denormalized name).

### Runs tab

Full-width table. Columns: status icon (✓ ✗ ⏱ ⊘), trigger icon (clock vs play), cronjob name, started at (relative), preview text, duration, tokens.

- Pagination (standard 50-row pages).
- Pinned filter chip when arriving from a cronjob row click.
- Clicking a run opens a LogView-style transcript (full reuse of `LogView.tsx`), including the input box for sending follow-up turns and the edit-message-to-fork affordance. Resuming uses `unstable_v2_resumeSession`. Forks within a run are tracked in the run's `sessions.json` exactly like agent forks.

### Cronjobs settings dialog

Header button on the Cronjobs page → modal with one textarea for `cronjobsPrompt`. Mirrors the office-prompt dialog.

### Mobile

Same two tables, single-column on phone width. Tab switcher `[ Runs | Cronjobs ]` at the top. Three navigation steps maximum (table → row → transcript), all using the existing back-button history stack.

## Usage Command Integration

`renderUsageReport()` in `agent-manager.ts:1755-1853` gains a third table: per-cronjob usage. Same columns as the per-room table, sorted by lifetime cost descending.

- Each run's usage is computed exactly like an agent's lifetime usage today: `sum across (session.usage - session.forkBaseUsage)` over the run's `sessions.json`. Manual follow-ups and forks accrue to the same run map and therefore to the cronjob.
- A cronjob's lifetime usage = sum of all its runs' usage.
- Deleted cronjobs render with `_(deleted)_` suffix (mirrors deleted-room handling). `cronjob-history.json` preserves the last name.
- The grand total at the bottom of the per-room table is renamed to "Office total" and folds in cronjob spend so the office-wide number is honest.

## Out of Scope for v1

- Cron-expression syntax (only the three primitive types above). Can be added later as a fourth `Schedule` variant.
- Timezone configuration (server local only).
- Catch-up / replay of missed fires.
- Run retention policy (all runs kept forever; pagination handles size).
- Run deletion affordance.
- Notifications / alerts on failure.
- Per-cronjob hard-timeout override (single global constant).
- Per-cronjob `customInstructions` field (prompt covers it).
- Branched fork visualization beyond what LogView already does.
- Sharing / deep-linking individual runs by URL.

## Files

**Create**
- `ui/components/CronjobsView.tsx` — top-level page with tab toggle + Cronjobs table + Runs table.
- `ui/components/CronjobDialog.tsx` — create/edit modal (borrows from `EditAgentDialog`).
- `ui/components/CronjobsPromptDialog.tsx` — single-textarea modal for `cronjobsPrompt`.
- `server/cronjob-manager.ts` — scheduler tick, fire path, run lifecycle, usage rollup helpers.
- `server/cronjob-persistence.ts` (or extend `persistence.ts`) — load/save for cronjobs.json, runs.json, sessions.json under cronjobs/, cronjob-history.json.
- `docs/cronjob-system-design.md` — this file.

**Modify**
- `shared/types.ts` — Cronjob, CronjobRun, Schedule types; new ClientCommand variants; ServerMessage events for cronjob and run state changes.
- `server/index.ts` — start scheduler tick on boot; HTTP routes; WebSocket command handlers; startup reconciliation of `running` rows.
- `server/agent-manager.ts` — extend `renderUsageReport()` with per-cronjob table; share fork-usage helpers.
- `server/safety-hooks.ts` — no change (hooks reused as-is).
- `server/persistence.ts` — gain `cronjobsPrompt` in `OfficeConfig` load/save.
- `ui/App.tsx` — add `cronjobsOpen` + `cronjobsView` state; conditional render; deep-state tracking.
- `ui/office/OfficeView.tsx` — add Cronjobs nav action with clock icon.
- `ui/office/Floor.tsx` — make the decorative clock clickable.
- `ui/components/LogView.tsx` — minor: accept a "scope" prop so it can render run transcripts as well as agent logs (same data shape, slightly different header).
- `ui/store.tsx` — add cronjobs and runs to AppState; subscribe to relevant ServerMessages.
- `ui/ws.ts` — typed senders for new commands.
