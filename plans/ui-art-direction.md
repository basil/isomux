# UI Art Direction & Asset Strategy

## Core Thesis

Isomux's differentiator is that it looks cute — like a video game — hiding a productivity powerhouse behind a delightful UI. The current hand-drawn inline SVGs are functional but not polished enough to nail this.

## Current State

All visuals are procedural inline SVGs in React components:

- **Office environment**: `Floor.tsx` (checkerboard tiles, walls, whiteboard, clock, poster), `DeskSprite.tsx` (desk, chair, monitor, keyboard, coffee mug, plant), `RoomProps.tsx` (potted plant, water cooler)
- **Characters**: `Character.tsx` — procedural SVG with 4 states (idle/sleeping, working, waiting/hand-raised, error), customizable outfit (shirt color, hair color, hat, glasses/headphones)
- **UI icons**: Copy, checkmark, status lights — all hand-drawn inline SVG

## Strategy: Two-Track Approach

### Track 1: Office Environment — Pixel Salvaje Isometric Interiors ($16)

- 800+ isometric PNG sprites: walls, floors, furniture, computers, animated screens, plants, appliances
- True isometric perspective, 7 color variations, animations
- Commercial license allowed
- **Integration notes**:
  - Replace `DeskSprite.tsx`, `Floor.tsx`, `RoomProps.tsx` with pack assets
  - Pack is PNG at fixed resolutions (8x8 to 128x128) — current SVGs scale infinitely, so pick appropriate sizes
  - Pack's isometric angle must match our grid math (2:1 iso ratio in `grid.ts`) — may need grid constant adjustments
  - State-dependent effects (monitor glow, coffee steam) would overlay as CSS/JS animations on static PNGs
  - Estimated effort: ~1 day of integration work
- **URL**: https://pixel-salvaje.itch.io/isometric-interiors

### Track 2: Characters — Commission a Rive Animator

The character system is the personality of the app and needs to be owned end-to-end by an artist: design, animation, and state machine.

**What to commission:**
- Isometric office character with Rive state machine
- States: idle/sleeping, working/typing, waiting/hand-raised, error/distressed
- Customization via Rive inputs: shirt color, hair color/style, hat, glasses/headphones
- Runtime-swappable — React drives state transitions and outfit changes programmatically
- Cute, modern, clean vector style — cozy management sim vibe
- Character sits above an isometric desk in a ~52x68px viewport, must read well at small scale

**Deliverable**: `.riv` file with state machine, integrated via `@rive-app/react-canvas` (`useRive` + `useStateMachineInput` hooks)

**Where to hire:**
- [Contra — Rive Animators](https://contra.com/hire/rive-animators) — strongest Rive-specific talent pool
- [Upwork — Rive freelancers](https://www.upwork.com/services/product/design-rive-animations-rive-animator-for-dynamic-ui-ux-design-1633819706986098688)
- [Fiverr — Rive animation gigs](https://www.fiverr.com/gigs/rive-animation) — 24 gigs available, more variable quality
- [RiveAnimator.com](https://riveanimator.com/) — dedicated Rive freelancer

## Rejected Options

| Option | Why rejected |
|---|---|
| Pixel art icon libs (Pixelarticons, NES.css) | Pixel/retro aesthetic doesn't match the project's clean modern look |
| DiceBear, react-nice-avatar | Static only — no animation support |
| Kodama | Animated but abstract spirit blobs, not human characters |
| Lottie marketplace | Pre-baked animations, can't customize appearance at runtime |
| Ready Player Me | 3D realistic style, too heavy, overkill |
| MagicPath + Gemini 3.1 Pro | Good for one-off SVG animations/icons but can't produce a coherent character system with state machine and runtime customization |

## Open Questions

- Does Pixel Salvaje's isometric angle match our 2:1 ratio, or will the grid need rework?
- Budget and timeline expectations for the Rive commission
- Do we want the artist to also redesign the office furniture (replacing Pixel Salvaje), or only characters?
