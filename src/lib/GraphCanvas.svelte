<script>
  import { onMount, onDestroy } from 'svelte';
  import { nodes, edges, updateNodePosition } from '../store.js';
  import { popupState, selectedNodeId, selectedEdgeId, viewBox, zoom, panBy, zoomTo } from '../ui-store.js';
  import Node from './Node.svelte';
  import Edge from './Edge.svelte';

  let svg;
  let isDraggingNode = false;
  let draggedNodeId = null;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartViewBoxX = 0;
  let panStartViewBoxY = 0;
  let resizeObserver;

  function clientToSvgCoords(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const screenCTM = svg.getScreenCTM();
    if (screenCTM) {
      const transformedPt = pt.matrixTransform(screenCTM.inverse());
      return { x: transformedPt.x, y: transformedPt.y };
    }
    return { x: clientX, y: clientY };
  }

  function handleDoubleClick(e) {
    if (e.target !== svg) return;
    const svgCoords = clientToSvgCoords(e.clientX, e.clientY);

    // Get screen coordinates for popup positioning
    const rect = svg.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    popupState.set({
      type: 'ADD_NODE',
      x: screenX,
      y: screenY,
      sourceNodeId: null,
      editTargetId: null,
      svgX: svgCoords.x,
      svgY: svgCoords.y
    });
  }

  function handleCanvasClick(e) {
    if (e.target === svg) {
      selectedNodeId.set(null);
      selectedEdgeId.set(null);
      // Also close popup if open
      if ($popupState.type) {
        popupState.set({ type: null, x: 0, y: 0, sourceNodeId: null, editTargetId: null });
      }
    }
  }

  function handleNodeMouseDown(e, id) {
    isDraggingNode = true;
    draggedNodeId = id;
    selectedNodeId.set(id);
    selectedEdgeId.set(null);
  }

  function handleMouseDown(e) {
    if (isDraggingNode) return;

    // Middle mouse button or if clicking on empty canvas
    if (e.button === 1 || (e.button === 0 && e.target === svg)) {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartViewBoxX = $viewBox.x;
      panStartViewBoxY = $viewBox.y;
    }
  }

  function handleMouseMove(e) {
    if (isDraggingNode && draggedNodeId) {
      const coords = clientToSvgCoords(e.clientX, e.clientY);
      updateNodePosition(draggedNodeId, coords.x, coords.y);
    } else if (isPanning) {
      const deltaX = e.clientX - panStartX;
      const deltaY = e.clientY - panStartY;

      // Convert screen delta to SVG space delta
      // The delta needs to be scaled by the current zoom level
      const screenCTM = svg.getScreenCTM();
      const scale = screenCTM ? screenCTM.a : 1;

      const svgDeltaX = -deltaX / scale;
      const svgDeltaY = -deltaY / scale;

      viewBox.set({
        x: panStartViewBoxX + svgDeltaX,
        y: panStartViewBoxY + svgDeltaY,
        width: $viewBox.width,
        height: $viewBox.height
      });
    }
  }

  function handleMouseUp() {
    isDraggingNode = false;
    draggedNodeId = null;
    isPanning = false;
  }

  function handleWheel(e) {
    e.preventDefault();

    if (!svg) return;

    const coords = clientToSvgCoords(e.clientX, e.clientY);

    // Determine zoom direction
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, $zoom * zoomFactor));

    // Calculate new viewBox to keep mouse position stable
    const oldViewBox = $viewBox;
    const scaleChange = newZoom / $zoom;

    const newX = coords.x - (oldViewBox.width / scaleChange) * (coords.x - oldViewBox.x) / oldViewBox.width;
    const newY = coords.y - (oldViewBox.height / scaleChange) * (coords.y - oldViewBox.y) / oldViewBox.height;

    viewBox.set({
      x: newX,
      y: newY,
      width: oldViewBox.width / scaleChange,
      height: oldViewBox.height / scaleChange
    });

    zoom.set(newZoom);
  }

  onMount(() => {
    // Initialize viewBox based on container size
    if (svg && svg.parentElement) {
      const width = svg.clientWidth;
      const height = svg.clientHeight;

      viewBox.set({
        x: 0,
        y: 0,
        width: width,
        height: height
      });

      // Set up ResizeObserver to update viewBox on window resize
      resizeObserver = new ResizeObserver(() => {
        if (svg) {
          const newWidth = svg.clientWidth;
          const newHeight = svg.clientHeight;

          viewBox.update(vb => ({
            ...vb,
            width: newWidth,
            height: newHeight
          }));
        }
      });

      resizeObserver.observe(svg);
    }
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>

<svg
  bind:this={svg}
  class="graph-canvas"
  role="application"
  aria-label="Interactive Graph Canvas"
  viewBox="{$viewBox.x} {$viewBox.y} {$viewBox.width} {$viewBox.height}"
  on:dblclick={handleDoubleClick}
  on:click={handleCanvasClick}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  on:wheel={handleWheel}
>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="var(--canvas-edge)" />
    </marker>
  </defs>

  <!-- Edges -->
  <g class="edges">
    {#each $edges as edge (edge.id)}
      <Edge {edge} />
    {/each}
  </g>

  <!-- Nodes -->
  <g class="nodes">
    {#each $nodes as node, index (node.id)}
      <Node
        {node}
        {index}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
      />
    {/each}
  </g>
</svg>

<style>
  .graph-canvas {
    width: 100%;
    height: 100%;
    background-color: transparent;
    cursor: crosshair;
  }
</style>
