# Documentation Locations

An index of every place that describes Isomux features to users. When a new feature lands, check each of these to decide whether it needs an update. They drift apart easily — this doc exists so none get forgotten.

These documents are written in my voice, so I need to approve any copy changes before they are applied.

## 1. GitHub README

- **File:** `README.md`
- **Audience:** Developers landing on the GitHub repo.
- **Structure:**
  - `## Feature Highlights` — short bulleted list of the headline features.
  - `## Get Started` — install & first-run instructions.
  - `## Full Feature List` — the canonical, comprehensive inventory. Sub-sections mirror the site's chatbot prompt (Office View, Skeuomorphic Details, Agent Creation & Editing, Conversation View, Keyboard Shortcuts, Slash Commands, Inter-agent Communication, Persistence & Lifecycle, Mobile Support, Safety, Notifications, Other).
- **Update when:** any user-visible feature is added, removed, or meaningfully changed.

## 2. Landing page (isomux.com)

- **File:** `site/index.html`
- **Audience:** Visitors to isomux.com.
- **Structure:**
  - `<section id="features">` with `<ul class="feature-highlights">` (~line 648) — mirrors the README's Feature Highlights.
  - Links out to the README's Full Feature List rather than duplicating it.
  - Setup instructions and self-hosted/Tailscale guide further down.
- **Update when:** headline features change. Keep the list short — depth lives in the README.
- **Deploy note:** static site, served from this repo via Vercel (see `vercel.json`).

## 3. Site chatbot system prompt

- **File:** `api/chat.ts` — `SYSTEM_PROMPT` constant (around line 25).
- **Audience:** Indirect. Feeds the chatbot on isomux.com that answers visitor questions.
- **Structure:** voice/tone rules, "What is Isomux?", getting started, self-hosted guide, and a `## Full Feature List` section that mirrors the README.
- **Update when:** any feature changes. The prompt has an explicit "never make up features" guideline, so stale content here makes the bot lie by omission.
- **Deploy note:** Vercel Edge function, redeployed with the site.

## 4. `/help` slash command

- **File:** `server/agent-manager.ts` — the `/help` branch (around lines 1592–1651).
- **Audience:** Agents/users inside Isomux who type `/help` in a conversation.
- **Content:** agent info, usage tips, and a list of available commands/skills with short descriptions.
- **Related:** `server/commands.ts` holds the command registry with a `description` field on every bundled command — keep those in sync.
- **Update when:** a new slash command or skill is added, or existing command behavior changes.

## 5. Blog post (external repo)

- **File:** `/home/nil/nilmamano.com/blog/isomux.mdx` (separate repo: `nilmamano.com`).
- **Audience:** Readers of nilmamano.com — architecture deep dive, not a feature list.
- **Structure:** Introduction, How the Claude Agent SDK Works, The Agent Lifecycle, The WebSocket Layer, The Frontend, QoL Features, Final Thoughts.
- **Images:** `/home/nil/nilmamano.com/public/blog/isomux/`.
- **Update when:** architecture-level changes land (SDK upgrades, lifecycle changes, new subsystems). Small feature tweaks usually don't need a blog update; the QoL Features section is the most likely to go stale.
- **Deploy note:** lives in a separate Next.js repo — commit and push there, not here.

## Secondary / internal references

These aren't user-facing docs, but they do describe features and can fall out of date:

- `CLAUDE.md` — developer/agent-facing overview of the codebase. Update when architecture or conventions change.
- `docs/` — design documents for individual features. Historical/reference only; not expected to stay current.
- `server/commands.ts` — per-command `description` fields surface in the slash-command autocomplete UI.
- `server/agent-manager.ts` `buildSystemPrompt()` (around lines 194–225) — the system prompt injected into every spawned agent. Update when the agent's role or capabilities change.

## Quick checklist when adding a user-visible feature

1. `README.md` — Feature Highlights and/or Full Feature List.
2. `site/index.html` — only if it belongs on the headline list.
3. `api/chat.ts` `SYSTEM_PROMPT` — the feature-list section and any relevant guideline.
4. `server/agent-manager.ts` `/help` output and/or `server/commands.ts` — only if it adds a command or changes tips.
5. `nilmamano.com/blog/isomux.mdx` — only for architecture-level changes.
