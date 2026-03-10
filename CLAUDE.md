# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Interactive SVG-based graph visualization editor built with **Svelte 5** and **Vite 8 (beta)**. Users create nodes, connect them with directed edges, and navigate an infinite pannable/zoomable canvas. Data persists to localStorage and can be exported/imported as JSON.

## Commands

```bash
npm run dev       # Dev server with HMR (localhost:5173)
npm run build     # Production build to /dist
npm run preview   # Preview production build
```

No test framework, linter, or formatter is configured.

## Architecture

**State management** uses three Svelte writable stores with localStorage auto-persistence:
- `store.js` — graph data (nodes, edges) + JSON file import/export
- `ui-store.js` — viewport (viewBox, zoom level), popup state, selection
- `colormap-store.js` — 5 built-in color palettes with HSL interpolation for >5 nodes

**Component tree:**
```
App.svelte          → header controls (export, import, zoom, palette, theme)
├── GraphCanvas.svelte → SVG container, pan/zoom via viewBox manipulation
│   ├── Edge.svelte    → directed edge with arrow, label, description
│   └── Node.svelte    → draggable node with label, color, action buttons
└── Popups.svelte      → modal forms for creating/editing nodes and edges
```

**Key patterns:**
- Pan/zoom uses SVG viewBox manipulation (not CSS transforms). Coordinate conversion via `SVGPoint` + `getScreenCTM()`.
- Nodes: `{ id, x, y, label, description, color }`. Edges: `{ id, sourceId, targetId, label, description }`.
- Color assignment: first 5 nodes get palette colors directly; 6+ nodes use HSL interpolation between palette stops.
- Pure JavaScript (no TypeScript). Minimal dependencies (only lucide-svelte for icons).

## Known Issues

The latest commit notes zoom/pan may need fixes (centering, scaling, fit-all bounds calculation).
