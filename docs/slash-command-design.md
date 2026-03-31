# Slash Command Design

Last audited against: Claude Code ~1.0.x (March 2026)

## Problem

Claude Code has built-in commands (`/clear`, `/compact`, `/fast`, etc.) and bundled skills (`/review`, `/simplify`, etc.). When Isomux sends these through the SDK's `session.send()`, they arrive as plain text — the SDK does not expand or handle them internally. Commands that appear in autocomplete but don't work are misleading.

## Taxonomy

There are 5 sources of slash commands, in resolution priority order:

| # | Source | Example | Discoverable? | Overridable? |
|---|--------|---------|---------------|--------------|
| 1 | Isomux built-in handlers | `/clear`, `/context`, `/help` | No (hardcoded) | No |
| 2 | User skills | `~/.claude/skills/*/SKILL.md`, `~/.claude/commands/*.md` | Yes (disk scan) | N/A (highest skill tier) |
| 3 | Project skills | `<cwd>/.claude/skills/*/SKILL.md`, `<cwd>/.claude/commands/*.md` | Yes (disk scan) | N/A |
| 4 | Isomux bundled skills | `isomux/skills/*/SKILL.md` | Yes (disk scan) | Yes (by tiers 2-3) |
| 5 | Claude's bundled skills | `/review`, `/simplify` | No (inside CLI binary) | Yes (by tiers 2-4) |

Claude Code's own categories (see `docs/skills-investigation.md` for full list):
- **Hardcoded commands** — fixed logic, not prompt-based (`/clear`, `/compact`, `/fast`, `/model`, etc.)
- **Bundled skills** — prompt-based, overridable (`/review`, `/simplify`, `/debug`, `/claude-api`)
- **Bundled skills** also include `/batch`, `/loop`, `/schedule` — these are prompt-based skills that instruct the model to call specific tools (e.g. CronCreate)

## Config File: `server/commands.ts`

A single declarative registry of every known Claude Code command and bundled skill. Pure data — no handler logic.

### Entry shape

```typescript
type CommandConfig = {
  type: "hardcoded" | "bundled-skill";  // Claude Code's category
  supported: boolean;       // does Isomux handle this?
  autocomplete: boolean;    // show in autocomplete?
  overridable: boolean;     // can skills shadow this?
  handler?: keyof typeof commandHandlers;  // compile-time link to handler
  message?: string;         // custom ephemeral message (unsupported commands)
};
```

- `type` documents what the command is in Claude Code. It does not drive runtime behavior.
- `overridable: false` for all hardcoded commands. `overridable: true` for bundled-skill types.
- `handler` is a string key into a handler registry, providing compile-time enforcement that every `supported: true` entry has a matching handler.
- `message` is optional. Unsupported commands without a custom message get a default: "`/<name>` is not available in Isomux."

### Startup assertion

```typescript
for (const [cmd, cfg] of Object.entries(commands)) {
  if (cfg.supported && cfg.handler && !commandHandlers[cfg.handler]) {
    throw new Error(`Command /${cmd} is marked supported but has no handler`);
  }
}
```

## Resolution Order

When a user types `/<something>`:

1. **Config lookup (non-overridable).** If the command is in the config with `overridable: false`:
   - `supported: true` → run the handler
   - `supported: false` → show unsupported message (custom or default)
   - Stop here.

2. **Skill override check.** If the command is in the config with `overridable: true`, OR is not in the config at all, check for skill files in priority order:
   - User skills (`~/.claude/skills/`, `~/.claude/commands/`)
   - Project skills (`<cwd>/.claude/skills/`, `<cwd>/.claude/commands/`)
   - Isomux bundled skills (`isomux/skills/`)
   - If a skill is found → execute the skill prompt. Stop here.

3. **Config lookup (overridable, no skill found).** If the command is in the config with `overridable: true` and no skill override was found:
   - `supported: true` → run the handler
   - `supported: false` → show unsupported message
   - Stop here.

4. **SDK-reported commands.** If the command was reported by the SDK in the `system:init` message's `slash_commands` array, pass it through to the agent via `session.send()`. Stop here.

5. **Unknown.** Show: "Unknown command `/<name>`. Type `/help` to see available commands."

## Autocomplete

The autocomplete list is built from two sources:
- Config entries with `autocomplete: true`
- All dynamically discovered skills (user, project, Isomux bundled)

SDK-reported commands are NOT added to autocomplete (they may overlap with config entries, and their behavior through `session.send()` is unreliable).

## Current State

### Supported (have handlers)
- `/clear` — resets conversation, creates new session
- `/context` — shows context window usage via SDK internal API
- `/cost` — stub ("not yet available")
- `/help` — lists commands and skills
- `/resume` — session picker
- `/login` — instructions for terminal auth
- `/logout` — instructions for terminal logout

### Unsupported (all other Claude Code commands)
Everything listed in `docs/skills-investigation.md` that isn't in the supported list above. All marked `supported: false`, `autocomplete: false`. Custom messages where we can be helpful (e.g., `/login` style guidance).

### Notable
- `/compact` — previously assumed to work as SDK pass-through, but `session.send("[Username] /compact")` likely does not trigger SDK compaction. Marked unsupported until verified or reimplemented.
- `/review`, `/simplify`, `/debug`, `/claude-api` — Claude bundled skills. Overridable. Users can provide their own skill files to make these work.
- `/batch`, `/loop`, `/schedule` — bundled skills that instruct the model to call specific tools (CronCreate, etc.). Overridable.
