# Multi-Room Office

## Problem Statement

The isometric office is hard-coded to 8 agent desks (2 columns x 4 rows). Users who need more than 8 concurrent agents are blocked from spawning new ones. Raising the limit within a single room degrades the visual experience — desks become too small, the room too cluttered, or the viewport needs scroll/zoom. The office metaphor needs to scale without losing the cozy, at-a-glance feel that makes it useful.

## Solution

Introduce multiple rooms, each containing up to 8 desks in the existing 2x4 layout. Users create rooms explicitly and navigate between them via a tab bar, wall doors, keyboard shortcuts, or swipe gestures (mobile). The isometric room visual stays untouched — scaling happens by adding rooms, not by stretching one room. Rooms are numbered (not named), persist until manually closed, and renumber to stay contiguous when one is removed.

## User Stories

1. As a desktop user, I want to create a new room when my current rooms are full, so that I can spawn more agents beyond 8.
2. As a desktop user, I want to see a tab bar of rooms at the top of the office view, so that I can switch between rooms quickly.
3. As a desktop user, I want the tab bar to auto-appear when Room 1 is full, so that the UI stays clean when I only need one room.
4. As a desktop user, I want to click a door on the left wall to go to the previous room, so that navigation feels spatial and intuitive.
5. As a desktop user, I want to click a door on the right wall to go to the next room, so that navigation feels spatial and intuitive.
6. As a desktop user, I want the doors to show the room number they lead to, so that I know which room I'm navigating to.
7. As a desktop user, I want doors to not render when there is no adjacent room in that direction, so that the UI isn't misleading.
8. As a desktop user, I want to press Tab/Shift+Tab in office view to switch between rooms, so that I can navigate without the mouse.
9. As a desktop user, I want to press 1-8 in office view to focus an agent at that desk in the current room, so that keyboard navigation is fast.
10. As a desktop user, I want to press Tab/Shift+Tab in log view to cycle through agents within the current room only, so that cycling is scoped and predictable.
11. As a desktop user, I want to click an empty desk in a room to spawn an agent into that room, so that spawning is room-scoped without extra UI.
12. As a desktop user, I want to move an agent to a different room via the edit agent menu, so that I can reorganize my agents across rooms.
13. As a desktop user, I want full rooms to be greyed out in the move-to-room picker, so that I know which rooms have space.
14. As a desktop user, I want moved agents to land on the first available desk in the target room, so that I don't have to pick a desk.
15. As a desktop user, I want to close an empty room by clicking x on its tab, so that I can clean up rooms I no longer need.
16. As a desktop user, I want Room 1 to be permanent and unclosable, so that there is always at least one room.
17. As a desktop user, I want rooms to renumber when an intermediate room is closed, so that room numbers stay contiguous.
18. As a mobile user, I want to see room tabs at the top of the agent list, so that I can switch between rooms.
19. As a mobile user, I want to swipe horizontally between rooms, so that navigation feels native.
20. As a mobile user, I want a (+) button scoped to the current room, so that new agents go into the room I'm viewing.
21. As a mobile user, I want a create-room button, so that I can add rooms from my phone.
22. As an existing user, I want my current agents to automatically migrate to Room 1 on first load, so that the upgrade is seamless.
23. As a user, I want empty rooms to persist across the session until I manually close them, so that rooms don't disappear unexpectedly.
24. As a user, I want desk numbers to be per-room (1-8), so that keyboard shortcuts work identically in every room.

## Implementation Decisions

### Persistence format

- `agents.json` changes from a flat array of agents to an array of arrays (rooms). Each sub-array is a room; agents within it have `desk: 0-7` scoped to that room. Empty rooms are represented as empty arrays.
- Migration is a standalone preprocessing step shipped before room features: detect flat format (array of objects), wrap in `[existingAgents]`, write back immediately.
- The persistence interface is `loadAgents(): Agent[][]` and `saveAgents(rooms: Agent[][]): void`.

### Server-side room management

- Agents gain a `room: number` field in the in-memory model. The room is determined by the agent's position in the persisted array, not stored redundantly on disk.
- Room operations: `createRoom()` appends an empty array; `closeRoom(room)` removes it and renumbers all higher rooms (updating agents' `room` fields); `moveAgent(agentId, targetRoom)` assigns first available desk.
- `spawn()` accepts a `room` parameter. Desk search is scoped to the target room (0-7).
- `swapDesks()` validates both desks are in the same room.
- New WebSocket messages: `create_room`, `close_room { room }`, `move_agent { agentId, targetRoom }`.
- Room state broadcasts: initial sync includes room count; live updates via `room_created` / `room_closed` events.

### Frontend room state

- Store tracks `currentRoom: number` and the room list (derived from agent data + empty room tracking).
- Office view filters agents by current room before rendering.
- The existing `Array.from({ length: 8 })` desk loop is unchanged — it just operates on the filtered set.

### Tab bar

- Auto-shows when Room 1 has all 8 desks occupied.
- Once visible, stays visible even if agents are removed (since rooms persist until manually closed).
- Disappears only when all rooms except Room 1 are closed and Room 1 is no longer full.
- `+` button at the end creates a new room.
- `x` button on tabs only enabled for empty rooms. Room 1 never shows `x`.
- Horizontally scrollable if many rooms exist.

### Wall doors

- Doors render on left wall (previous room) and right wall (next room), conditionally based on adjacent room existence.
- Each door is labeled with the destination room number.
- Doors are clickable to navigate.
- Wall decorations (window, corkboard, sign, clock, neon sign, vent) coexist with doors; exact positioning resolved during implementation.

### Keyboard navigation

- Office view: Tab/Shift+Tab switches rooms. 1-8 focuses desk in current room.
- Log view: Tab/Shift+Tab cycles agents within current room only.
- The previous global agent cycling (Tab across all agents) is removed.

### Mobile

- Room tabs at top of agent list view, matching desktop tab bar concept.
- Swipe gesture to switch between rooms.
- (+) button is scoped to the current room.
- Create-room button available in mobile UI.

### Agent movement

- "Move to room" option in the edit agent dialog.
- Shows list of rooms; full rooms (8/8) are greyed out.
- Agent moves to first available desk in target room.

### Room identity

- Rooms are identified by number only (no user-defined names).
- Numbers are always contiguous: closing Room 2 of [1,2,3] renumbers to [1,2].
- Room 1 is permanent.

## Testing Decisions

Good tests for this feature verify external behavior through the module's public interface, not implementation details. They should be resilient to refactoring — if the internals change but the behavior stays the same, tests should still pass.

### Module 1: Persistence Migration

- Test that a flat array of agents is detected and wrapped into `[[...agents]]`.
- Test that an already-nested array is loaded as-is (no double-wrapping).
- Test that empty rooms (empty arrays) survive a save/load round-trip.
- Test that agent desk fields are preserved through migration.

### Module 2: Room Management

- Test `createRoom()` increments room count.
- Test `closeRoom()` removes the room and renumbers higher rooms.
- Test `closeRoom(0)` is rejected (Room 1 is permanent).
- Test `closeRoom()` is rejected when room has agents.
- Test `moveAgent()` assigns first available desk in target room.
- Test `moveAgent()` rejects move to a full room.
- Test `spawn()` with room parameter places agent in correct room.
- Test `swapDesks()` within the same room works.
- Test `swapDesks()` across rooms is rejected.

### Prior art

Check existing test files in the repo for patterns and test runner setup.

## Out of Scope

- Room naming (rooms are numbered only).
- Per-room visual variation (different props, wall art, themes). All rooms render identically for now.
- Configurable room capacity (fixed at 8).
- Drag-and-drop agent movement between rooms (use edit menu instead).
- Building/campus view or zoom-out overview.
- Door visual design and exact wall positioning (resolved during implementation).

## Implementation Plan

### Phase 1: Persistence Migration

Ship and merge before any room features. Changes the data foundation everything else builds on.

1. Update `loadAgents()` return type from `PersistedAgent[]` to `PersistedAgent[][]`. On load, detect flat array (array of objects) vs nested (array of arrays). If flat, wrap in `[existingAgents]`.
2. Update `saveAgents()` parameter from `PersistedAgent[]` to `PersistedAgent[][]`. Always write nested format.
3. Update all call sites of `loadAgents()` and `saveAgents()` in agent-manager. For now, just index into `rooms[0]` to maintain single-room behavior.
4. Update `writeManifest()` to flatten the nested array when writing `agents-summary.json` (external consumers don't need room structure).
5. Write tests: flat-to-nested migration, already-nested passthrough, empty rooms survive round-trip, desk fields preserved.

**Shippable checkpoint**: Everything works exactly as before, but `agents.json` is now `[[...agents]]` on disk.

### Phase 2: Server Room Management + Shared Types

Add room awareness to the server and protocol. No UI yet — just the backend infrastructure.

1. Add `room: number` to `AgentInfo` in shared types. Derived from array position when loading, maintained in memory.
2. Add new `ClientCommand` types: `create_room`, `close_room { room }`, `move_agent { agentId, targetRoom }`.
3. Add new `ServerMessage` types: `room_created { roomCount }`, `room_closed { room, roomCount }`. Update `full_state` to include `roomCount`.
4. Implement `createRoom()` in agent manager — appends empty array to rooms, persists, broadcasts `room_created`.
5. Implement `closeRoom(room)` — validates room is empty and not room 0, removes it, renumbers all agents in higher rooms (decrement their `room` field), persists, broadcasts `room_closed`.
6. Implement `moveAgent(agentId, targetRoom)` — validates target room exists and has a free desk (0-7), moves agent, updates `room` and `desk`, persists, broadcasts `agent_updated` with new room and desk.
7. Update `spawn()` to accept `room` parameter. Desk search scoped to agents in that room.
8. Update `swapDesks()` to include room — both desks must be in the same room. Update signature to `swapDesks(room, deskA, deskB)`.
9. Update `persistAll()` to rebuild the nested array structure from in-memory agents grouped by room.
10. Wire new `ClientCommand` types to handlers in the WebSocket message router.
11. Write tests: create/close/move operations, renumbering, spawn with room, swap validation, close-room-0 rejection, move-to-full-room rejection.

**Shippable checkpoint**: Server fully supports rooms. Protocol is ready. UI still shows only Room 1.

### Phase 3: Frontend Store + Office View Room Scoping

Make the frontend room-aware. Rooms work but no navigation UI yet (stuck on Room 1 until Phase 4).

1. Add to `AppState`: `currentRoom: number` (default 0), `roomCount: number` (default 1).
2. Add dispatch actions: `set_current_room`, `set_room_count`.
3. Update `full_state` handler in store to read `roomCount` from server sync payload.
4. Handle `room_created` and `room_closed` server messages — update `roomCount`, adjust `currentRoom` if the current room was closed (fall back to room 0).
5. Update `agent_updated` handler to process room changes (agent may have moved rooms).
6. In `OfficeView`, filter `agents` to `agents.filter(a => a.room === currentRoom)` before rendering the 8-desk loop. No changes to the loop itself.
7. Update `spawn` command sent from `EmptySlot` click to include `room: currentRoom`.
8. Update `swap_desks` command to include `room: currentRoom`.

**Shippable checkpoint**: Frontend is room-aware. All agents appear in Room 1. Everything works as before.

### Phase 4: Tab Bar + Keyboard Navigation

First user-visible room feature. Users can now create rooms and switch between them.

1. Build `RoomTabBar` component. Horizontally-scrollable row of numbered room tabs. `+` button at end creates a room (sends `create_room`). `x` button on empty room tabs closes them (sends `close_room`). Room 1 has no `x`. Highlighted tab = `currentRoom`.
2. Conditionally render `RoomTabBar` in `OfficeView` — only visible when `roomCount > 1` OR when Room 1 is full (8 agents with `room === 0`). Position it above the office scene.
3. Update keyboard handling in `App.tsx`:
   - Office view: `Tab`/`Shift+Tab` increments/decrements `currentRoom` (clamped to 0..roomCount-1).
   - `1-8` number keys: filter agents by `currentRoom` before finding desk match.
   - Log view: `Tab`/`Shift+Tab` cycles agents where `agent.room === currentRoom`. Same priority logic (non-idle first, then all).
4. Add room-scoped attention indicators on tabs — tab shows a dot/badge if any agent in that room `needsAttention`.

**Shippable checkpoint**: Core multi-room experience is complete. Users can create rooms, switch between them, spawn into specific rooms, close empty rooms.

### Phase 5: Wall Doors

Add spatial navigation between adjacent rooms.

1. Add a `Door` SVG component — isometric door shape with a room number label. Clickable, with hover state.
2. In `Walls` component, conditionally render:
   - Left wall door (labeled with previous room number) when `currentRoom > 0`.
   - Right wall door (labeled with next room number) when `currentRoom < roomCount - 1`.
3. Door click dispatches `set_current_room` with the adjacent room index.
4. Adjust existing wall decoration positions to coexist with doors. May require shifting the window, corkboard, sign, clock, neon sign, or vent depending on which walls have doors.

**Shippable checkpoint**: Rooms feel spatially connected. Users see doors leading to neighboring rooms.

### Phase 6: Edit Agent Dialog — Move Between Rooms

Let users reorganize agents across rooms.

1. In the edit agent dialog, add a "Move to Room" section. Show a button/option for each room except the agent's current room. Grey out rooms that have 8 agents.
2. Clicking a room sends `move_agent { agentId, targetRoom }` to the server.
3. After the move, the agent disappears from the current room's view. Optionally auto-navigate to the target room.

**Shippable checkpoint**: Full agent management across rooms without killing and re-spawning.

### Phase 7: Mobile Room Support

Bring room features to the mobile UI.

1. Add room tabs to the top of `AgentListView`, horizontally scrollable. Tapping a tab filters the agent list to that room.
2. Add swipe gesture (horizontal) to switch between rooms. Swipe left = next room, swipe right = previous room.
3. Scope the FAB (+) button to spawn into the current room.
4. Add a "create room" affordance — `+` tab in the tab bar or a button in the header menu.
5. Add room-close capability via context menu on empty room tab.

**Shippable checkpoint**: Full feature parity with desktop.

## Further Notes

- Each phase is independently shippable and testable. Phases 1-4 are the critical path. Phases 5-7 are polish and can be parallelized.
- The `room` field on agents is purely an in-memory convenience derived from array position in persistence. It is not stored redundantly in `agents.json`.
- Room renumbering on close means room numbers are not stable identifiers across a session — UI and server must handle renumbering atomically.
