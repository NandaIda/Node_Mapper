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
- `ui-store.js` — viewport (viewBox, zoom), popup state, selection, `activeNotes` (floating windows), `isAnimating` (constellation mode)
- `colormap-store.js` — 5 color palettes, `getNodeColorByDegree(degree, maxDegree, cmapName)` maps connection count to color via HSL interpolation

### Component Tree

```
App.svelte              → floating toolbar, stats panel, music player, help dialog
├── GraphCanvas.svelte  → SVG container, pan/zoom, constellation animation loop, touch gestures
│   ├── Edge.svelte     → directed edge with dynamic thickness/opacity by importance
│   └── Node.svelte     → node with dynamic radius/color/glow by degree + clickable Notes icon
├── NoteWindow.svelte   → floating, movable, resizable, pinnable Markdown note window
└── Popups.svelte       → glassmorphism modal forms for creating/editing nodes and edges
```

### Key Patterns

- **Svelte 5 Performance**: Leverage Svelte 5's surgical DOM updates and reactive stores to ensure 60fps performance on both PC and Mobile. Avoid unnecessary re-renders.
- **Pan/zoom**: SVG viewBox manipulation. Supported by both Mouse (Wheel/Drag) and Touch (Pinch/Pan via `svelte-gestures`).
- **Degree-based visuals**: Node radius (18–40px), font size (12–18px), color, and glow intensity all derive from `degree / maxDegree`.
- **Floating Note Windows**: 
  - Managed via `activeNotes` store in `ui-store.js`.
  - Supports multiple windows, pinning, resizing, and dragging.
  - Automatic dirty-state tracking with "Save/Discard" confirmation before closing.
  - Interactive yellow icon (`#fbbf24`) on nodes triggers the window.
- **Persistence**: Theme, selected palette, selected music track, viewport, and graph data all persist to localStorage.
- Pure JavaScript (no TypeScript). Minimal dependencies (lucide-svelte, svelte-gestures, marked).

### Music

Three ambient tracks in `public/musics/` from pixabay.com (free license):
- `delosound-space-ambient-cinematic-442834.mp3`
- `prettyjohn1-meditation-495674.mp3`
- `universfield-ambient-space-background-350710.mp3`

## Design Philosophy — "Observatory"

The UI follows a **deep-space cartography** aesthetic. All new features and UI additions must adhere to this:

### Typography
- **Body**: `DM Sans` — warm, slightly geometric
- **Data/labels/tags/editor**: `JetBrains Mono` — technical precision
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
| **Notes Icon** | `#fbbf24` | Persistent yellow for visibility across themes |

### UI Rules
- **Lag-Free Experience**: Ensure `touch-action: none` on interactive surfaces. Use `transform-box: fill-box` for SVG icons.
- **Glassmorphism**: All floating panels use `backdrop-filter: blur(20px)` + semi-transparent background + subtle 1px border.
- **Animations**: Use `cubic-bezier(0.16, 1, 0.3, 1)` for panel entrances.
- **Interactive Icons**: Grouped SVG elements with stable hover scaling (nested groups + transform-origin).

### Adding New Features
1. Keep the Observatory aesthetic — dark, atmospheric, technical.
2. **Prefer Svelte 5 patterns** for all logic to ensure cross-platform performance.
3. Test interactions on both Mouse and Touch.
4. Persist user preferences and ensure Export/Import remains compatible.
