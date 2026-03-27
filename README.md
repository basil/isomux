# Isomux

An isometric office for managing multiple concurrent Claude Code agents. Each agent sits at a desk, has a unique outfit, and visually reflects its current state.

![Isomux office view](screenshot.png)

## Setup

```bash
bun install
bun run dev
```

Then open http://localhost:4000.

## How it works

- Click an empty desk to spawn a new agent
- Click an agent to open the conversation view
- Right-click an agent for actions (new conversation, resume, kill)
- Agents persist across restarts
- Uses your Claude subscription via the Agent SDK
