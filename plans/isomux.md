# Plan: Isomux

> Source PRD: [nmamano/isomux#1](https://github.com/nmamano/isomux/issues/1)

## Architectural decisions

Durable decisions that apply across all phases:

- **Single process**: One Bun process serves static UI, manages agents in-process via SDK, communicates with browser via WebSocket.
- **WebSocket protocol**: Browser connects to `/ws`. First message from server is `full_state` (snapshot of all agents). Subsequent messages are incremental: `agent_added`, `agent_removed`, `agent_updated`, `log_entry`. Browser sends commands: `spawn`, `kill`, `send_message`, `new_conversation`, `resume`.
- **Data models**: Two core concepts — **Agent** (persistent: name, desk, cwd, outfit, permissionMode, lastSessionId) and **Conversation** (ephemeral: sessionId, SDKSession, state, logEntries).
- **Agent states**: `idle`, `starting`, `thinking`, `tool_executing`, `waiting_permission`, `error`, `stopped`. Derived from SDK stream events.
- **State directory**: `~/.isomux/` — `agents.json` for agent configs, `logs/<agentId>/<sessionId>.jsonl` for log files.
- **SDK**: Agent SDK V2 (`unstable_v2_createSession` / `unstable_v2_resumeSession`). One `SDKSession` per agent. Subscription auth.
- **Default model**: Opus 4.6, no per-agent selection in v1.
- **Frontend**: React/SVG (no Pixi.js), bundled with Bun's built-in bundler.

---

## Phase 1: Static Office + WebSocket Skeleton

**User stories**: 1, 3, 4, 5, 9, 24, 26

### What to build

The full UI shell with no real agent backend. Bun serves the bundled React app. The browser opens a WebSocket connection and receives a `full_state` message (initially empty). The office view renders an isometric 8-desk grid using SVG (ported from `reference_ui.jsx`). Clicking an empty desk opens a spawn dialog (name, working directory defaulting to server startup dir, permission mode dropdown). Submitting the dialog sends a `spawn` command over WebSocket. The server creates a mock agent (no SDK session) and broadcasts `agent_added`. The agent appears at the desk with a deterministic outfit generated from the name hash. Clicking an occupied desk switches to a bare log view (empty message list + input box). Pressing Escape returns to the office view.

### Acceptance criteria

- [ ] `bun dev` starts the server and serves the UI on a local port
- [ ] Browser connects via WebSocket and receives `full_state`
- [ ] Office view renders 8 desks in an isometric grid
- [ ] Clicking an empty desk opens the spawn dialog
- [ ] Spawn dialog has fields: name, working directory (pre-filled), permission mode
- [ ] Submitting the dialog creates a mock agent visible at the desk
- [ ] Agent has a unique outfit deterministically derived from the name
- [ ] Clicking an agent switches to a log view with an input box
- [ ] Pressing Escape returns to the office view
- [ ] Multiple browser tabs stay in sync via WebSocket

---

## Phase 2: Real Agent (SDK Integration)

**User stories**: 6, 7, 10, 20, 21, 22, 25

### What to build

Replace the mock agent with a real SDK V2 session. When an agent is spawned, the server calls `unstable_v2_createSession` with the agent's cwd, permission mode, and Opus 4.6 as the model. When the user types a message in the log view and submits, the browser sends a `send_message` command. The server calls `session.send()` and iterates `session.stream()`, parsing SDK events to derive agent state and log entries. State changes (`idle` → `thinking` → `tool_executing` → `idle`) are broadcast to the browser, which updates the desk animation (typing, idle Zzz, error shake). Log entries (raw text for now) are broadcast and appended to the log view. The `canUseTool` callback auto-allows or auto-denies based on the agent's permission mode. Log entries are also appended to the flat log file in `~/.isomux/logs/`.

### Acceptance criteria

- [ ] Spawning an agent creates a real SDK V2 session using subscription auth
- [ ] Sending a message triggers the agent to work (visible in log view as text output)
- [ ] Agent desk animation reflects current state (idle, working, error)
- [ ] Permission mode chosen at spawn is respected (tools auto-allowed or auto-denied accordingly)
- [ ] Agent uses Opus 4.6
- [ ] Log entries are written to `~/.isomux/logs/` as JSON lines
- [ ] Multiple agents can run concurrently on different desks
- [ ] Agent crash results in an error state on the desk, not a server crash
- [ ] User's global Claude skills and MCP servers are available to the agent

---

## Phase 3: Structured Log View

**User stories**: 2, 8

### What to build

Upgrade the log view from raw text to structured message cards. Each SDK message type gets a distinct visual treatment: assistant text rendered as markdown, tool calls as collapsible blocks showing tool name + input + result, thinking as dimmed collapsible sections, errors highlighted in red, user messages as distinct blocks. Streaming text appears incrementally as `text_delta` events arrive rather than waiting for the full message. The input box remains at the bottom, auto-scrolling to the latest message.

### Acceptance criteria

- [ ] Assistant text renders as formatted markdown
- [ ] Tool calls display as collapsible blocks with tool name, input, and result
- [ ] Thinking blocks are dimmed and collapsible
- [ ] Errors are visually distinct (red highlight)
- [ ] User messages are visually distinct from agent output
- [ ] Text streams incrementally as the agent generates it
- [ ] Log view auto-scrolls to the latest entry
- [ ] Scrolling up pauses auto-scroll; scrolling to bottom resumes it

---

## Phase 4: Agent Lifecycle

**User stories**: 13, 14, 16, 17, 18, 19

### What to build

Right-click context menu on an agent's desk with "New Conversation" and "Kill" options. "Kill" closes the SDK session and removes the agent from the office (frees the desk). "New Conversation" closes the current session and creates a fresh one with the same agent config (name, desk, cwd, outfit, permission mode). Agent configs are persisted to `~/.isomux/agents.json` — written on spawn, updated on session change, removed on kill. On server startup, agents are restored from `agents.json` and their last session is auto-resumed via `unstable_v2_resumeSession()`. If resume fails, the agent starts idle. The office is global — `~/.isomux/` is the same regardless of where the server is started.

### Acceptance criteria

- [ ] Right-click on an agent opens a context menu
- [ ] "Kill" removes the agent from the office and frees the desk
- [ ] "New Conversation" clears context and starts a fresh session (same agent config)
- [ ] Agent configs persist in `~/.isomux/agents.json`
- [ ] Restarting the server restores all agents at their desks
- [ ] Agents auto-resume their last conversation on restart
- [ ] If auto-resume fails, agent appears idle (no crash)
- [ ] Office state is the same regardless of server startup directory

---

## Phase 5: Resume + Notifications + Polish

**User stories**: 11, 12, 15, 23

### What to build

Add "Resume" to the context menu — lists past sessions for the agent's cwd (from SDK session files on disk) and lets the user pick one to resume. Add notification indicators: a visual badge/pulse on the agent's desk when the agent's state changes to something requiring attention (idle after working, error, waiting for permission) and the user is viewing a different agent or the office. Play a notification sound when the browser tab is unfocused (`document.hidden`). Add a monitor preview on each desk showing a short snippet of the agent's latest output.

### Acceptance criteria

- [ ] "Resume" in context menu lists past sessions and resumes the selected one
- [ ] Visual badge appears on desk when agent needs attention and user is elsewhere
- [ ] Notification sound plays when agent needs attention and browser tab is not focused
- [ ] Desk monitor shows a preview of the agent's latest output
- [ ] Notification badge clears when user views the agent
- [ ] Sound does not play when user is actively viewing the agent
