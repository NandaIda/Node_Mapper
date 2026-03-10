# Graph Plotter Node Relation — Implementation Plan
Generated: 2026-03-10
Source: Codebase exploration
Phases: 4 total | Total steps: 12

## Architecture Snapshot
- Svelte 5 + Vite SPA, SVG-based graph editor
- State in `src/store.js` (nodes/edges arrays, localStorage persistence)
- UI state in `src/ui-store.js` (popups, selection)
- Key components: `GraphCanvas.svelte`, `Node.svelte`, `Edge.svelte`, `Popups.svelte`, `App.svelte`
- No pan/zoom currently; SVG fills viewport 100%

## Big Picture
Transform the fixed-viewport SVG canvas into an infinite, pannable, zoomable canvas with auto-fit. Replace per-node manual color picking with a colormap system where node colors are assigned automatically from a configurable colormap based on node count, with a settings panel to switch cmaps and a dynamic color range that starts at 0–5 and grows with graph size.

## Phase Overview
| Phase | Title | Goal | Effort | Dependencies |
|---|---|---|---|---|
| 1 | Infinite Canvas with Pan/Zoom | SVG viewBox-based pan, zoom (wheel), drag-to-pan | M | none |
| 2 | Auto-Fit & Zoom Controls | Fit-all-nodes button, zoom in/out buttons in toolbar | S | Phase 1 |
| 3 | Colormap System & Store | Colormap definitions, dynamic color range store, auto-assign colors | M | none |
| 4 | Colormap Settings UI | Settings panel/button to switch cmap, display current range | S | Phase 3 |

---

## Phase 1 — Infinite Canvas with Pan/Zoom

### Step 1.1 — Add viewport state to ui-store

📁 Location
  Primary   : src/ui-store.js

🎯 What To Do
  Add writable stores for canvas viewport: `viewBox` store with `{ x: 0, y: 0, width: 1000, height: 700 }`, `zoom` store (number, default 1). Add helper functions `panBy(dx, dy)`, `zoomTo(level, centerX, centerY)`. Persist viewBox to localStorage.

🚫 What NOT To Do
  - Do not use CSS transform for zoom — use SVG viewBox
  - Do not remove existing stores

⚡ Potential Conflicts
  - Shared resource: `src/ui-store.js` — also touched by Step 2.1
  - Node coordinates in store.js remain in SVG coordinate space (not screen space)

📏 Rules & Standards
  - PEP8-style naming not applicable; use camelCase (existing convention)
  - Export all new stores/functions

✅ Done Criteria
  `viewBox` and `zoom` stores exist and are importable; `panBy` and `zoomTo` update viewBox correctly.

### Step 1.2 — Apply viewBox to SVG and add pan/zoom handlers

📁 Location
  Primary   : src/lib/GraphCanvas.svelte

🎯 What To Do
  1. Import `viewBox`, `zoom`, `panBy`, `zoomTo` from ui-store.
  2. Set SVG `viewBox="{$viewBox.x} {$viewBox.y} {$viewBox.width} {$viewBox.height}"` instead of relying on 100% width/height.
  3. Add `on:wheel` handler: zoom in/out centered on mouse position. Adjust viewBox width/height and x/y to keep mouse point stable. Clamp zoom between 0.1 and 5.
  4. Add canvas drag-to-pan: when middle-click or when clicking on empty canvas area (not a node), track mousemove to call `panBy`. Use a flag `isPanning` to distinguish from node drag.
  5. Convert `handleDoubleClick` and `handleMouseMove` (for node dragging) to use SVG coordinate conversion: use `svg.createSVGPoint()` + `svg.getScreenCTM().inverse()` to transform client coords to SVG coords.
  6. Keep SVG CSS at `width: 100%; height: 100%`.

🚫 What NOT To Do
  - Do not use CSS transform/scale — viewBox handles everything
  - Do not break existing node dragging
  - Do not change the node coordinate system — nodes stay in SVG-space coordinates

⚡ Potential Conflicts
  - `handleMouseMove` currently uses `getBoundingClientRect` — must switch to SVG coord transform
  - `handleDoubleClick` for adding nodes must place nodes in SVG coords, not screen coords
  - Blocks: Step 2.1 (zoom controls need zoom functions from Step 1.1)

📏 Rules & Standards
  - Use `svg.createSVGPoint()` for all client-to-SVG coordinate conversions
  - Prevent default on wheel to avoid page scroll

✅ Done Criteria
  Mouse wheel zooms in/out centered on cursor. Dragging empty canvas pans. Node dragging still works correctly at all zoom levels. Double-click places node at correct SVG position regardless of zoom/pan.

### Step 1.3 — Fix Node popup positioning for zoomed/panned canvas

📁 Location
  Primary   : src/lib/Node.svelte
  Secondary : src/lib/Popups.svelte

🎯 What To Do
  In `Node.svelte#handleDoubleClick`, the popup position calculation uses `getBoundingClientRect` + node.x. With viewBox, we need screen-space coordinates for the popup (which is a DOM element, not SVG). Convert node SVG coords to screen coords using `svg.getScreenCTM()` matrix: `screenX = ctm.a * node.x + ctm.e`, `screenY = ctm.d * node.y + ctm.f`. Pass these as popup x/y.

🚫 What NOT To Do
  - Do not change Popups.svelte positioning logic (it already handles boundary detection)
  - Do not move popups into SVG space

⚡ Potential Conflicts
  - Shared resource: popup position calculation — must stay in screen pixels

📏 Rules & Standards
  - Use CTM (Current Transformation Matrix) for SVG-to-screen conversion

✅ Done Criteria
  Edit-node popup appears next to the node visually, regardless of zoom/pan state.

### Step 1.4 — Initialize viewBox from container size

📁 Location
  Primary   : src/lib/GraphCanvas.svelte

🎯 What To Do
  On mount, read the SVG container's actual pixel dimensions (`svg.clientWidth`, `svg.clientHeight`) and set the initial viewBox width/height to match. Add a `ResizeObserver` on the SVG element to update viewBox width/height (scaled by zoom) when the window resizes.

🚫 What NOT To Do
  - Do not set a fixed viewBox size that ignores the actual container

⚡ Potential Conflicts
  - Blocks: None

📏 Rules & Standards
  - Clean up ResizeObserver in `onDestroy`

✅ Done Criteria
  Canvas fills the viewport correctly on load and after window resize, at any zoom level.

### Phase 1 — Dependency Graph
Step 1.1 → Step 1.2 → Step 1.3   (sequential)
Step 1.4 ∥ Step 1.3               (can run in parallel after 1.2)
⚠️ SHARED: `src/ui-store.js` — Steps 1.1, 2.1

### Phase 1 — Standards Checklist
- [ ] No hardcoded secrets or API keys
- [ ] No unused imports
- [ ] SVG coordinate conversion used everywhere (no raw clientX/clientY for SVG positions)
- [ ] Node dragging works at all zoom levels
- [ ] Double-click node placement correct at all zoom levels
- [ ] Popup positioning correct at all zoom levels
- [ ] Canvas panning does not interfere with node dragging
- [ ] Wheel zoom is smooth and centered on cursor

---

## Phase 2 — Auto-Fit & Zoom Controls

### Step 2.1 — Add auto-fit function

📁 Location
  Primary   : src/ui-store.js

🎯 What To Do
  Add `fitToNodes(nodesArray, svgWidth, svgHeight)` function that:
  1. Computes bounding box of all nodes (min/max x/y) with padding (50px in SVG space).
  2. Calculates the viewBox that fits all nodes while maintaining aspect ratio of the SVG container.
  3. Updates the `viewBox` store and `zoom` store accordingly.
  4. If no nodes exist, reset to default viewBox.

🚫 What NOT To Do
  - Do not animate the transition (keep it simple for now)

⚡ Potential Conflicts
  - Shared resource: `src/ui-store.js` — also touched by Step 1.1

📏 Rules & Standards
  - Maintain aspect ratio when fitting
  - Add padding so nodes aren't flush with edges

✅ Done Criteria
  Calling `fitToNodes` with current nodes array centers and scales the view to show all nodes with padding.

### Step 2.2 — Add zoom control buttons to header

📁 Location
  Primary   : src/App.svelte
  Secondary : src/ui-store.js, src/store.js

🎯 What To Do
  Add three buttons to `header-actions` div in App.svelte:
  1. **Zoom In** (+) — calls `zoomTo(currentZoom * 1.25, centerX, centerY)` where center is viewport center
  2. **Zoom Out** (-) — calls `zoomTo(currentZoom / 1.25, centerX, centerY)`
  3. **Fit All** — calls `fitToNodes($nodes, svgWidth, svgHeight)`

  Use inline SVG icons consistent with existing export/import buttons. Style with `.action-btn` class.

  For Fit All, need to know SVG container dimensions — either pass them via a store or use `window.innerWidth`/`innerHeight` minus header height as approximation.

🚫 What NOT To Do
  - Do not add a separate toolbar component — keep buttons in the existing header
  - Do not add keyboard shortcuts yet

⚡ Potential Conflicts
  - None significant

📏 Rules & Standards
  - Match existing button styling (`.action-btn` class)
  - Use inline SVGs for icons (existing pattern)

✅ Done Criteria
  Three new buttons visible in header. Zoom in/out change zoom level. Fit All shows all nodes in view.

### Phase 2 — Dependency Graph
Step 2.1 → Step 2.2   (sequential)
⚠️ SHARED: `src/ui-store.js` — Steps 1.1, 2.1

### Phase 2 — Standards Checklist
- [ ] Fit-all works with 0 nodes (no crash)
- [ ] Fit-all works with 1 node
- [ ] Zoom buttons respect min/max zoom limits
- [ ] Buttons match existing header style

---

## Phase 3 — Colormap System & Store

### Step 3.1 — Create colormap definitions and store

📁 Location
  Primary   : src/colormap-store.js (new file)

🎯 What To Do
  Create a new store file with:
  1. **Colormap definitions**: Object mapping cmap names to arrays of hex colors. Include at least:
     - `"default"`: `['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']` (6 base colors)
     - `"ocean"`: blues/teals palette
     - `"warm"`: reds/oranges/yellows palette
     - `"pastel"`: soft pastel palette
     - `"neon"`: bright vibrant palette
  2. **Stores**:
     - `currentCmap` writable store (string, default `"default"`)
     - `colorRange` writable store (number, default 5) — how many colors are currently active
  3. **Functions**:
     - `getNodeColor(index, totalNodes)`: Returns a color from the current cmap. Uses interpolation if totalNodes > cmap length:
       - If totalNodes <= 5: use first 5 colors from cmap directly (range 0–5)
       - If totalNodes > 5: dynamically expand by interpolating between cmap colors to generate `totalNodes` distinct colors
     - `setCmap(name)`: Updates `currentCmap` store
     - `getAvailableCmaps()`: Returns list of cmap names
  4. Persist `currentCmap` to localStorage.

🚫 What NOT To Do
  - Do not import any external color library — implement simple HSL interpolation
  - Do not modify individual node.color in the node data — colors are computed from index

⚡ Potential Conflicts
  - Breaking change: nodes currently store `color` property — Phase 4 will need to handle backward compat
  - Shared resource: node rendering in `Node.svelte` — also touched by Step 3.2

📏 Rules & Standards
  - camelCase for all exports
  - Each cmap must have at least 6 base colors
  - Interpolation should produce visually distinct colors (not just lightening)

✅ Done Criteria
  `getNodeColor(0, 3)` returns first color of default cmap. `getNodeColor(2, 10)` returns an interpolated color. `setCmap('ocean')` switches the active palette. `colorRange` updates when node count changes.

### Step 3.2 — Apply colormap to node rendering

📁 Location
  Primary   : src/lib/Node.svelte
  Secondary : src/lib/GraphCanvas.svelte, src/store.js

🎯 What To Do
  1. In `GraphCanvas.svelte`, pass `index` (loop index from `{#each}`) to each `<Node>` component.
  2. In `Node.svelte`, accept `index` prop. Import `getNodeColor` from colormap-store. Compute fill color as `getNodeColor(index, $nodes.length)` instead of `node.color`.
  3. Keep `node.color` as an optional override — if a node has a manually set color that differs from the default `#3b82f6`, use it. Otherwise use cmap color. (This preserves imported data.)
  4. Update the `colorRange` store reactively: subscribe to `nodes` store length and update `colorRange` to `Math.max(5, $nodes.length)`.

🚫 What NOT To Do
  - Do not remove the `color` field from node data structure
  - Do not break existing color picker in edit popup (it should still work as an override)

⚡ Potential Conflicts
  - Shared resource: `Node.svelte` fill logic — currently `node.color || 'var(--node-bg)'`
  - Must handle the case where cmap changes and all nodes re-render

📏 Rules & Standards
  - Reactive: changing cmap should instantly update all node colors
  - Node color override takes precedence over cmap

✅ Done Criteria
  Nodes display colors from the active colormap based on their index. Adding/removing nodes updates colors for all nodes. Manual color override still works.

### Step 3.3 — Remove per-node color picker from Add Node popup

📁 Location
  Primary   : src/lib/Popups.svelte

🎯 What To Do
  In the `ADD_NODE` popup section, remove the color picker (`<div class="color-picker">` block around lines 142-145). New nodes will get their color from the colormap automatically. Keep the color picker in `EDIT_NODE` popup as an override mechanism.

🚫 What NOT To Do
  - Do not remove the color picker from the Edit Node popup
  - Do not remove the `nodeColor` variable (still used by edit)

⚡ Potential Conflicts
  - `handleAddNode` currently passes `nodeColor` to `addNode` — change to pass `null` or omit color

📏 Rules & Standards
  - Keep the edit popup color picker functional

✅ Done Criteria
  Add Node popup no longer shows a color picker. New nodes get colormap-assigned colors. Edit Node popup still has color picker for overrides.

### Phase 3 — Dependency Graph
Step 3.1 → Step 3.2   (sequential)
Step 3.3 ∥ Step 3.2   (can run in parallel)
⚠️ SHARED: `Node.svelte` fill logic — Steps 3.2, 3.3

### Phase 3 — Standards Checklist
- [ ] Colormap colors are visually distinct
- [ ] 0 nodes: no crash
- [ ] 1–5 nodes: uses base range (0–5 colors)
- [ ] 6+ nodes: dynamically generates more colors
- [ ] Switching cmap instantly recolors all nodes
- [ ] Manual color override persists through cmap changes
- [ ] No unused imports
- [ ] localStorage persistence for selected cmap

---

## Phase 4 — Colormap Settings UI

### Step 4.1 — Add cmap switcher button to header

📁 Location
  Primary   : src/App.svelte
  Secondary : src/colormap-store.js

🎯 What To Do
  1. Add a "Palette" button in `header-actions` (use a palette SVG icon).
  2. On click, toggle a dropdown/popover showing available colormaps.
  3. Each option shows the cmap name + a row of small color swatches (first 5-6 colors).
  4. Clicking an option calls `setCmap(name)` and closes the dropdown.
  5. Show current cmap name or highlight the active option.
  6. Display current color range info: "Colors: {colorRange}" as a small label near the button or in the dropdown.

🚫 What NOT To Do
  - Do not create a separate settings page/modal — use a simple dropdown
  - Do not add settings for anything other than colormap

⚡ Potential Conflicts
  - None significant

📏 Rules & Standards
  - Match existing button/dropdown styling
  - Dropdown should close when clicking outside
  - Use inline SVG for palette icon

✅ Done Criteria
  Palette button visible in header. Clicking opens dropdown with cmap options showing color swatches. Selecting a cmap changes all node colors. Current range displayed. Dropdown closes on selection or outside click.

### Phase 4 — Dependency Graph
Step 4.1 (single step)

### Phase 4 — Standards Checklist
- [ ] Dropdown closes on outside click
- [ ] Active cmap visually highlighted
- [ ] Color swatches render correctly in both themes
- [ ] No unused imports
- [ ] Accessible: keyboard navigable dropdown
