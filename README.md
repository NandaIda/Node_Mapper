# Graph Plotter Node Relation

An interactive graph visualization tool for brainstorming and clustering ideas. Create nodes, connect them with directed edges, and let the visual hierarchy emerge automatically — the more connected a node is, the bigger, bolder, and more colorful it appears.

Built with Svelte 5 and Vite.

![dark mode graph example](https://img.shields.io/badge/theme-dark%20%2F%20light-blueviolet)

## Features

- **Automatic visual importance** — Node size, color intensity, label size, and edge thickness all scale with the number of connections. No manual styling needed.
- **Color palettes** — 5 built-in colormaps (Default, Ocean, Warm, Pastel, Neon) that map connection count to color, like matplotlib colormaps.
- **Infinite canvas** — Pan (middle-click drag) and zoom (scroll wheel) with no boundaries.
- **Graph statistics** — Bottom-left stats panel showing node/edge counts, most connected nodes, and degree breakdown.
- **Export / Import** — Save and load workspaces as JSON files. Palette preference is saved with the export.
- **Dark / Light theme** — Toggle with the theme button. Preference persists across sessions.
- **Quick node creation** — Double-click canvas to create a node and optionally connect it to existing nodes in the same form.
- **Edge management** — Select a node and click `+` to add a relation. Double-click an edge to edit its label/description.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

| Action | How |
|---|---|
| Create node | Double-click empty canvas |
| Move node | Drag it |
| Select node | Click it |
| Edit node | Double-click it |
| Delete node | Select → click X button |
| Add relation | Select node → click + button |
| Edit relation | Double-click the edge |
| Delete relation | Click edge → click X button |
| Pan canvas | Middle-click drag or drag empty area |
| Zoom | Scroll wheel |
| Fit all nodes | Click Fit button |

## Build

```bash
npm run build     # Production build to dist/
npm run preview   # Preview the production build
```

## Tech Stack

- [Svelte 5](https://svelte.dev/) — Reactive UI framework
- [Vite](https://vitejs.dev/) — Build tool with HMR
- [Lucide Svelte](https://lucide.dev/) — Icon library
- SVG-based rendering with viewBox pan/zoom

## Recommended IDE

[VS Code](https://code.visualstudio.com/) + [Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
