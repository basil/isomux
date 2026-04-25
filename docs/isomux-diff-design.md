# `/isomux-diff` Rich Rendering Design

## Overview
Upgrade the existing `/isomux-diff` slash command from its current ` ```diff ` markdown fence to a first-class diff card embedded in the chat stream. The card resembles a GitHub PR diff: per-file headers with +/- counts, collapsible patch bodies, syntax highlighting, and an overlay for files too large to render inline.

## Status quo (what already exists)
- Command registered at `server/commands.ts:107-114`, dispatched to handler `isomuxDiff` at `server/agent-manager.ts:2207-2282`.
- Handler runs `git diff HEAD`, `git diff --stat`, and `git ls-files --others --exclude-standard` in the agent's `cwd`.
- Output today is a markdown system message with a ` ```diff ` fence; highlight.js applies its `diff` language theme client-side.
- Truncates raw patch at 500KB with a system message footer.

## Goals
- Inline rendering in the chat stream (the diff is part of the conversation, not a side panel).
- GitHub-style readability: per-file headers, +/- gutter, syntax highlighting per file's language.
- Graceful behavior on big diffs and big files.
- Render quality close to Conductor's diff view, achievable in days rather than weeks.

## Non-goals (v1)
- Custom IDE-grade diff viewer hand-rolled on top of Shiki.
- `/isomux-diff <ref>` argument forms (range diffs, branch comparisons). Defer to a follow-up.
- Per-card unified/split override on top of the global preference.
- Rerun-from-card refresh button. Users re-invoke the command instead.
- "Open single big file from a >2MB summary-only diff" (rare; defer).

## Architecture

### Render tier
**Tier B**: off-the-shelf library (`diff2html`) wrapped in our own `<DiffCard>` shell, themed with isomux color tokens. Targets ~80% of a hand-rolled "Tier A" Shiki+custom build at a fraction of the cost. The chat layer hands a structured payload to `<DiffCard>`; the renderer behind that boundary is replaceable, so a future Tier A swap is local.

### Server vs client split
**Hybrid**: server runs git, ships *both* a structured per-file summary and the raw unified-diff text in a new `LogEntry` payload. Client parses and renders. This keeps client logic theme-able and renderer-swappable, and matches the existing JSON `LogEntry` architecture (no HTML through the WebSocket).

## Data contract

New discriminated `LogEntry` variant in `shared/types.ts`:

```ts
{
  kind: "diff";
  cwd: string;
  branch: string | null;            // null on detached HEAD
  head: string;                     // short SHA
  stats: { additions: number; deletions: number; filesChanged: number };
  files: DiffFileSummary[];
  patchText: string | null;         // null when over 2MB safety rail
  truncated: boolean;
}

type DiffFileSummary = {
  path: string;
  oldPath?: string;                 // set on rename / copy
  status: "added" | "modified" | "deleted" | "renamed" | "copied" | "untracked" | "binary";
  additions: number;
  deletions: number;
  lineCount: number;
  inlineEligible: boolean;          // server-computed: lineCount <= 500 && !binary
};
```

Design choices:
- Server pre-computes `inlineEligible` so the client does not re-parse the patch to decide rendering strategy.
- `patchText: null` is the clean signal for the 2MB safety rail (no sentinel string).
- `stats` are pre-computed so the card header renders without client-side reduction.

## Server behavior

In the existing `isomuxDiff` handler:

1. Run `git diff HEAD` (existing behavior).
2. Run `git diff --stat` for whole-diff stats.
3. Run `git ls-files --others --exclude-standard` for untracked names.
4. For each untracked file:
   - Skip if binary (null-byte scan).
   - Otherwise synthesize an "all lines added" patch (equivalent to `git diff --no-index /dev/null <path>`).
   - Concatenate into the unified patch.
5. Parse the merged patch into `DiffFileSummary[]` (renames, copies, status, line counts).
6. Compute `inlineEligible` per file using the rules below.
7. If total patch size > 2MB: drop `patchText`, set `truncated: true`. Per-file summaries still ship.
8. Emit a `LogEntry` of `kind: "diff"` with the structured payload.

The current 500KB markdown truncation is replaced by the 2MB safety rail (raw patch only, since the rendering pipeline is now richer).

## Sizing rules (the three knobs)

| Knob | Default | Controls |
|---|---|---|
| 500 lines per file | per-file `inlineEligible` | inline render vs. overlay-only |
| 200 total inline lines | whole-card collapse default | expand-all vs. collapse-all on initial render |
| 2MB total patch | server-side safety rail | ship `patchText` vs. summary-only |

### Per-file rule
- File patch ≤ 500 lines: renders inline. Its expand/collapse state follows the whole-diff rule.
- File patch > 500 lines: never renders inline. The file row in the card shows path, status, +/- counts. Clicking "expand" opens the patch in the lightbox-style overlay alongside a "copy patch" affordance.

### Whole-diff rule
- Sum line counts across *inline-eligible* files only (overlay-only files do not count).
- Total < 200: all inline-eligible files expanded by default.
- Otherwise: all collapsed by default.
- Card header always offers "expand all / collapse all".

### Hard safety rail
- Total patch > 2MB on the server: do not ship `patchText`. The card renders a pure file list. Per-file rows still show +/- counts and status, but every "expand" opens an overlay that explains the patch was too large to ship and suggests re-running with a narrower scope.

## Card UI

### Header (always visible)
- `+X -Y across N files` (from `stats`).
- Branch name and short HEAD SHA (anchor for "diff relative to what").
- Unified / split toggle (see preference below).
- "Expand all / collapse all" button.

### File list
Each `DiffFileSummary` renders a row:
- Status badge (`added` / `modified` / `deleted` / `renamed` / `copied` / `untracked` / `binary`).
- File path. For renames/copies: `oldPath → path`.
- `+additions / -deletions` counts.
- Click target:
  - Inline-eligible file: toggles inline expand/collapse.
  - Non-inline-eligible file: opens overlay.

### Inline patch body
When a file is expanded inline, diff2html renders the unified patch for that file inside a constrained container. Syntax highlighting via diff2html's built-in extension-based language inference (delegates to highlight.js, which is already in the bundle).

### Overlay
Reuses the existing image-lightbox pattern at `LogEntryCard.tsx:81-156`. Shell consists of:
- File path in the overlay header.
- Close button.
- "Copy patch" button.
- Body: same diff2html renderer, unconstrained height.

## Layout preference (unified vs. split)

Persisted in localStorage. A toggle in any diff card's header changes the preference for all current and future diff cards in the view. No per-card override (avoids state-management complexity for a feature most users set once).

Default: **unified**. Chat panes can be narrow, especially on mobile, and unified always fits.

## Rename / copy visualization

- File row header shows `oldPath → newPath`, status badge `renamed` or `copied`.
- Diff body renders any actual content delta (empty body for pure renames; matches GitHub).
- diff2html handles this natively from the unified-diff input.

## Untracked files

- Synthesized server-side as "new file with all lines added" patches.
- Status `added` once synthesized; the `untracked` status code is reserved for the rare case we want to surface them as a distinct visual state (currently we do not).
- Honor `.gitignore` via `git ls-files --others --exclude-standard`.
- Skip binary untracked files via null-byte scan; surface them with `status: "binary"` and no patch content.

## Theming

diff2html ships `github` and `github-dark` CSS. Start with stock themes, switching based on isomux's existing theme state (whatever `styles.ts` exposes). If the GitHub palette clashes with isomux's color tokens in practice, override diff2html's CSS variables with isomux tokens. Do not invest in custom theming up-front.

## Syntax highlighting

Defer to diff2html's built-in extension-based language inference. It uses highlight.js (already in the bundle) and covers common extensions out of the box. If output quality is visibly poor for specific languages, add a server-side extension-to-language map shipped per `DiffFileSummary` and pass to diff2html. Not needed for v1.

## Files to modify

### Shared
- `shared/types.ts`: add `kind: "diff"` `LogEntry` variant and `DiffFileSummary` type.

### Server
- `server/agent-manager.ts`: rework `isomuxDiff` handler (lines 2207-2282) to emit the structured `LogEntry` instead of a markdown system message. Add untracked-file patch synthesis, binary detection, line counting, eligibility computation, and the 2MB safety rail.

### Client
- `ui/log-view/LogEntryCard.tsx`: add a branch for `entry.kind === "diff"` that renders `<DiffCard>`. Reuse the existing lightbox overlay pattern for the per-file overlay.
- New `ui/log-view/DiffCard.tsx`: the card shell (header, file list, inline expand/collapse, overlay invocation).
- New `ui/log-view/DiffRenderer.tsx`: thin wrapper around diff2html. The replaceable boundary that a future Tier A rewrite would target.

### Dependencies
- Add `diff2html` to the UI package.
- Optional: a small unified-diff parser (`parse-diff` or similar) if we need per-file patch extraction client-side. Likely doable with a few-dozen-line splitter; assess at implementation time.

## Implementation order
1. Define the `LogEntry` `kind: "diff"` variant in `shared/types.ts`.
2. Rework the server handler to emit the structured payload (initially without untracked synthesis or the 2MB rail; emit a minimal valid payload).
3. Build `<DiffRenderer>` around diff2html; render a single file inline.
4. Build `<DiffCard>` shell with header and file list; wire inline expand/collapse with the 200-line whole-diff rule.
5. Add untracked-file patch synthesis server-side.
6. Add the per-file overlay path (>500 lines, lightbox shell).
7. Add the 2MB safety rail and summary-only fallback.
8. Wire the unified/split preference to localStorage.
9. Theme pass: confirm stock diff2html themes integrate with isomux's color system, override only if needed.

## Future work (not v1)
- `/isomux-diff <ref>` argument forms.
- Per-card unified/split override on top of the global preference.
- Rerun-from-card refresh button.
- On-demand per-file patch fetch when the whole-diff hit the 2MB rail.
- Tier A migration: hand-rolled React diff component on Shiki tokens, swapped in behind the `<DiffRenderer>` boundary without touching `<DiffCard>` consumers.
