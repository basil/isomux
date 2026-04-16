# Per-Room Environment Variables and Prompt Hierarchy

Design doc for supporting per-room env vars and a layered prompt system.

## Problem

Three users share one isomux office (same Linux user). Each user's agents live in their own room. Agents need to commit and push using different GitHub identities, but there's no mechanism for per-room environment variables. The prompt system is also flat — office-wide prompt plus per-agent custom instructions, with no room layer.

## Decisions

### Prompt hierarchy: office → room → agent

Three layers, concatenated in order with clear headers. No layer overrides another; they accumulate. The agent sees all three.

- **Office prompt** — already exists (`~/.isomux/office-prompt.md`, edited via OfficePromptModal)
- **Room prompt** — new, stored inline in `Room` type within `agents.json`
- **Agent prompt** — already exists (`customInstructions` field on agent)

### Env hierarchy: office → room

Two layers. Shallow merge — room env overrides matching keys from office env. Unset keys fall through.

- **Office env** — new, loaded from a user-specified file path
- **Room env** — new, loaded from a user-specified file path

No per-agent env. Identity is per-room (all agents in a room act as the same user). If a use case emerges, adding `envFile` to the agent type is trivial.

### Env files are user-managed, paths are absolute

Isomux does not own or manage an env directory. The user creates env files wherever they want and provides absolute paths. Isomux reads from those paths at spawn time. Standard dotenv format.

Example:

```
# /home/nil/.secrets/marc.env
GH_TOKEN=ghp_...
GIT_AUTHOR_NAME=Marc
GIT_AUTHOR_EMAIL=marc@example.com
GIT_COMMITTER_NAME=Marc
GIT_COMMITTER_EMAIL=marc@example.com
```

### Env injection via SDK, not launcher scripts

The Claude Agent SDK accepts an `env` option on session creation:

```typescript
env?: { [envVar: string]: string | undefined };
```

> "Environment variables to pass to the Claude Code process. Defaults to `process.env`."

At spawn time, isomux reads the office and room env files, merges them, and passes the result via the SDK session options. Credentials never appear in launcher scripts or any isomux-managed file.

Spawn path:
1. Read office env file (if configured) → parse dotenv → `officeEnv`
2. Read room env file (if configured) → parse dotenv → `roomEnv`
3. Merge: `{ ...process.env, ...officeEnv, ...roomEnv }`
4. Pass to `unstable_v2_createSession({ env: mergedEnv, ... })`

### Rooms get stable IDs

Rooms are currently identified by array index, which shifts on reorder/delete. Room names are mutable display strings. Neither is suitable for anchoring configuration.

Each room gets an `id` field: 8-character random hex string, generated at creation time. Internal only, never shown in UI. Existing rooms get IDs assigned on first load (migration).

### Data model changes

Rename `PersistedRoom` to `Room`:

```typescript
interface Room {
  id: string;                  // stable 8-char hex, e.g. "a3f8b2e1"
  name: string;                // display name, user-editable
  prompt: string | null;       // room-level prompt, concatenated after office prompt
  envFile: string | null;      // absolute path to dotenv file
  agents: PersistedAgent[];
}
```

Office-level env file path needs a home. Options:
- New field in a hypothetical office config file
- Stored alongside `office-prompt.md` as a sibling setting
- Added to an existing persistence structure

This is unresolved. The office prompt is currently a standalone file (`office-prompt.md`) with its path hardcoded in `persistence.ts`. The office env file path needs similar treatment — likely a small `office-config.json` or similar. To be decided during implementation.

### Wire protocol changes

`full_state` message adds:
- `rooms: { id: string; name: string; prompt: string | null; envFile: string | null }[]` (agents already transmitted separately)

New server messages:
- `{ type: "room_settings_updated"; room: number; prompt: string | null; envFile: string | null }`

New client commands:
- `{ type: "update_room_settings"; room: number; prompt: string | null; envFile: string | null }`
- `{ type: "set_office_env_file"; path: string | null }`

### Effect timing

Changes to prompts and env file paths take effect on the next agent conversation, not mid-session. This matches the existing office prompt behavior ("Changes take effect when an agent starts a new conversation").

## Unresolved: UI

The settings UI was not fully designed. Entry points that need design:

- **Office level**: `OfficePromptModal` exists (prompt + boss name). Needs office env file path added.
- **Room level**: no settings surface exists. Needs room prompt + env file path. Entry point TBD (tab context menu, gear icon, or other).
- **Agent level**: `EditAgentDialog` exists. No changes needed for this feature.

The UI design should be done holistically — office settings, room settings, and how they relate visually and in interaction flow.

## Files to modify

1. `shared/types.ts` — Room type (renamed from PersistedRoom), wire protocol additions
2. `server/persistence.ts` — Room type, loadAgents migration (add IDs to existing rooms), env file reading
3. `server/agent-manager.ts` — room settings state, env merging at spawn time, pass `env` to SDK session
4. `server/index.ts` — handle new commands, include room metadata in full_state
5. `ui/store.tsx` — room metadata in state, reducer cases
6. UI components — TBD pending UI design

## Out of scope

- Per-agent env vars
- Env file creation/editing UI (users manage files externally)
- Encryption at rest (inherent limitation of single Linux user; real isolation needs the hub)
- Validating env file contents beyond basic dotenv parsing
