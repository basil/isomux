# Plan: Agent Terminal Panel

> Source: Design discussion — PTY-backed terminal in the isomux UI for running interactive commands (auth flows, sudo, etc.) on the remote server where isomux runs.

## Architectural decisions

Durable decisions that apply across all phases:

- **PTY per agent**: Each agent gets its own PTY, spawned on demand in that agent's CWD
- **Transport**: Terminal I/O over the existing WebSocket connection using new message types (`terminal_open`, `terminal_input`, `terminal_output`, `terminal_resize`, `terminal_close`)
- **UI location**: Optional side panel in LogView, toggled by the user
- **Shell**: User's default shell (`$SHELL`)
- **PTY lifecycle**: Created on first open, persists across panel close/reopen and new conversations. Only destroyed when the agent is killed.
- **Dependencies**: `xterm.js`, `@xterm/addon-fit`, `node-pty` (via Node.js sidecar — Bun can't drive PTY master fds due to missing libuv)

---

## Phase 1: Bare-bones terminal round-trip

**User stories**: As a user viewing an agent's log, I can open a side panel that gives me an interactive terminal on the server in the agent's working directory.

### What to build

End-to-end: clicking a button in LogView opens a side panel containing a working terminal. The server spawns a PTY in the agent's CWD, pipes stdin/stdout over the existing WebSocket using new message types. The client renders with xterm.js. Closing the panel does not kill the PTY — reopening reconnects to the same session. Killing the agent destroys the PTY.

Fixed terminal size in this phase (no resize handling).

### Acceptance criteria

- [x] LogView has a toggle button that opens/closes a side panel
- [x] Opening the panel for the first time spawns a PTY on the server in the agent's CWD
- [x] User can type commands and see output (interactive: sudo, auth flows, etc.)
- [x] Closing and reopening the panel reconnects to the same PTY session
- [x] Killing the agent cleans up the PTY process
- [x] Works when accessing isomux remotely via browser (no localhost assumptions)

---

## Phase 2: Resize, polish, and theme

**User stories**: As a user, the terminal panel feels like a natural part of the isomux UI — it resizes properly, matches my theme, and has a convenient keyboard shortcut.

### What to build

Terminal resizes when the panel or browser window changes size (xterm-addon-fit). Panel styling matches light/dark theme. Keyboard shortcut to toggle the panel. Panel width is adjustable (drag to resize) or picks a sensible default. If the PTY process exits (user types `exit`), show a message and allow respawning.

### Acceptance criteria

- [x] Terminal columns/rows update when panel is resized, and server PTY is notified
- [x] Terminal colors and background match the current isomux theme (light/dark)
- [x] Keyboard shortcut toggles the panel open/closed
- [x] If the shell process exits, the panel shows a message with an option to restart
- [x] Panel does not break LogView layout or scrolling

