# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Graphn** — an interactive SVG-based graph visualization tool for brainstorming and clustering ideas. Built with **Svelte 5** and **Vite 8 (beta)**. Importance emerges naturally from connections: node size, color, label size, edge thickness, and glow all scale with degree (connection count). Includes constellation mode with ambient music.

## Commands

```bash
npm run dev       # Dev server with HMR (localhost:5173)
npm run build     # Production build to /dist
npm run preview   # Preview production build
```

No test framework, linter, or formatter is configured.

## Architecture

### State Management

Three Svelte writable stores with localStorage auto-persistence:

- `store.js` — graph data (nodes, edges) + JSON file import/export (includes palette in export)
- `ui-store.js` — viewport (viewBox, zoom), popup state, selection, `isAnimating` (constellation mode)
- `colormap-store.js` — 5 color palettes, `getNodeColorByDegree(degree, maxDegree, cmapName)` maps connection count to color via HSL interpolation

### Component Tree

```
App.svelte              → floating toolbar, stats panel, music player, help dialog
├── GraphCanvas.svelte  → SVG container, pan/zoom, constellation animation loop
│   ├── Edge.svelte     → directed edge with dynamic thickness/opacity by importance
│   └── Node.svelte     → node with dynamic radius/color/glow by degree
└── Popups.svelte       → glassmorphism modal forms for creating/editing nodes and edges
```

### Key Patterns

- **Pan/zoom**: SVG viewBox manipulation (not CSS transforms). Coordinate conversion via `SVGPoint` + `getScreenCTM()`.
- **Degree-based visuals**: Node radius (18–40px), font size (12–18px), color, and glow intensity all derive from `degree / maxDegree`. Edge thickness and opacity scale by combined source+target degree.
- **Constellation mode**: Visual-only animation via offset props (`offsetX`, `offsetY`) — never mutates store positions. Glow pulse uses CSS animation with per-node unique duration/delay. Ambient music plays/pauses (not resets) with the animation.
- **Data shapes**: Nodes `{ id, x, y, label, description }`. Edges `{ id, sourceId, targetId, label, description }`.
- **Persistence**: Theme, selected palette, selected music track, viewport, and graph data all persist to localStorage.
- Pure JavaScript (no TypeScript). Minimal dependencies (only lucide-svelte for icons).

### Music

Three ambient tracks in `public/musics/` from pixabay.com (free license):
- `delosound-space-ambient-cinematic-442834.mp3`
- `prettyjohn1-meditation-495674.mp3`
- `universfield-ambient-space-background-350710.mp3`

## Design Philosophy — "Observatory"

The UI follows a **deep-space cartography** aesthetic. All new features and UI additions must adhere to this:

### Typography
- **Body**: `DM Sans` — warm, slightly geometric
- **Data/labels/tags**: `JetBrains Mono` — technical precision
- Never use generic fonts (Inter, Arial, Roboto, system-ui alone)

### Color System (Dark Mode Primary)
| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#060a14` | Page background |
| `--bg-color` | `#0a0e1a` | Canvas background |
| `--bg-elevated` | `rgba(16, 22, 40, 0.92)` | Panels, toolbar, dialogs |
| `--primary-color` | `#06b6d4` | Cyan — primary actions, data values |
| `--accent-color` | `#a78bfa` | Violet — secondary accent |
| `--accent-pink` | `#f472b6` | Pink — constellation/play button |
| `--danger-color` | `#f43f5e` | Delete actions |
| `--text-bright` | `#e8ecf2` | Headings, important text |
| `--text-color` | `#c8d6e5` | Body text |
| `--text-muted` | `#5a6a80` | Secondary, labels |

### UI Rules
- **Glassmorphism**: All floating panels use `backdrop-filter: blur(20px)` + semi-transparent background + subtle 1px border (`rgba(148, 163, 184, 0.06)`)
- **Animations**: Use `cubic-bezier(0.16, 1, 0.3, 1)` for panel entrances. Keep durations 0.15–0.25s for interactions.
- **Toolbar**: Compact floating bar at top center. Icon-only buttons (34x34px), dividers between groups. No text labels on toolbar buttons.
- **Panels** (stats, dropdowns): Appear near their trigger with `dropdown-enter` animation. Use monospace uppercase section headers.
- **Canvas**: Dot grid background (`40px` spacing). Subtle radial gradient atmosphere.
- **Nodes**: Always have ambient glow blur circle behind them. Glow scales with degree.
- **Buttons**: `tool-btn` class — transparent bg, 1px transparent border, hover shows colored bg + border.
- **Data display**: Use `var(--font-mono)` for numbers, percentages, counts. Use `kbd` styling for keyboard shortcuts.

### Adding New Features
1. Keep the Observatory aesthetic — dark, atmospheric, technical
2. Use CSS variables for all colors, never hardcode
3. New panels/dialogs follow glassmorphism pattern (see `.dialog`, `.palette-dropdown`)
4. Persist user preferences to localStorage
5. Animations should be subtle — no jarring transitions
6. Constellation mode animations must be visual-only (offsets/CSS), never mutate store data
7. Music/audio: pause/resume pattern, never reset to 0 on toggle
8. Export format includes all relevant preferences (palette, etc.)
