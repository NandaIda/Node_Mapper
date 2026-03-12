<script>
  import { onMount, onDestroy } from 'svelte';
  import { nodes, edges, updateNodePosition } from '../store.js';
  import { popupState, selectedNodeId, selectedEdgeId, hoveredNodeId, viewBox, zoom, panBy, zoomTo, isAnimating, closeUnpinnedNotes } from '../ui-store.js';
  import Node from './Node.svelte';
  import Edge from './Edge.svelte';
  import * as gestures from 'svelte-gestures';

  const { pan, pinch } = gestures;

  // Compute degree for each node
  $: degreeMap = (() => {
    const map = {};
    $nodes.forEach(n => map[n.id] = 0);
    $edges.forEach(e => {
      if (map[e.sourceId] !== undefined) map[e.sourceId]++;
      if (map[e.targetId] !== undefined) map[e.targetId]++;
    });
    return map;
  })();
  $: maxDegree = Math.max(0, ...Object.values(degreeMap));

  let svg;
  let isDraggingNode = false;
  let draggedNodeId = null;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartViewBoxX = 0;
  let panStartViewBoxY = 0;
  let resizeObserver;

  // Pinch zoom state
  let initialPinchZoom = 1;

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
      
      // Attempt to close unpinned notes
      const allClosed = closeUnpinnedNotes();
      if (!allClosed) {
        // If some notes didn't close (due to dirty state), we might want to prevent selection clearing
        // but for now we let it clear.
      }
      
      if ($popupState.type) {
        popupState.set({ type: null, x: 0, y: 0, sourceNodeId: null, editTargetId: null, startMode: null });
      }
    }
  }

  function handleNodeMouseDown(e, id) {
    isDraggingNode = true;
    draggedNodeId = id;
    selectedNodeId.set(id);
    selectedEdgeId.set(null);
    
    // Attempt to close other unpinned notes
    closeUnpinnedNotes(id);
  }

  function handleMouseDown(e) {
    if (isDraggingNode) return;
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
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, $zoom * zoomFactor));

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

  // Gesture Handlers
  function handlePanStart() {
    if (isDraggingNode) return;
    panStartViewBoxX = $viewBox.x;
    panStartViewBoxY = $viewBox.y;
  }

  function handlePan(e) {
    if (isDraggingNode) return;
    const { detail } = e;
    const screenCTM = svg.getScreenCTM();
    const scale = screenCTM ? screenCTM.a : 1;
    
    viewBox.set({
      x: panStartViewBoxX - detail.x / scale,
      y: panStartViewBoxY - detail.y / scale,
      width: $viewBox.width,
      height: $viewBox.height
    });
  }

  function handlePinchStart() {
    initialPinchZoom = $zoom;
  }

  function handlePinch(e) {
    const { detail } = e;
    const newZoom = Math.max(0.1, Math.min(5, initialPinchZoom * detail.scale));
    zoomTo(newZoom, detail.center.x, detail.center.y);
  }

  onMount(() => {
    if (svg && svg.parentElement) {
      const width = svg.clientWidth;
      const height = svg.clientHeight;

      viewBox.set({ x: 0, y: 0, width, height });

      resizeObserver = new ResizeObserver(() => {
        if (svg) {
          viewBox.update(vb => ({
            ...vb,
            width: svg.clientWidth,
            height: svg.clientHeight
          }));
        }
      });
      resizeObserver.observe(svg);
    }
  });

  onDestroy(() => {
    if (resizeObserver) resizeObserver.disconnect();
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
  use:pan={{ delay: 100 }}
  on:panstart={handlePanStart}
  on:pan={handlePan}
  use:pinch
  on:pinchstart={handlePinchStart}
  on:pinch={handlePinch}
>
  <defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="var(--canvas-edge)" />
    </marker>
    <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="var(--primary-color)" />
    </marker>
    <marker id="arrowhead-selected" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
    </marker>
  </defs>

  <!-- Edges -->
  <g class="edges">
    {#each $edges as edge (edge.id)}
      <Edge {edge} {degreeMap} {maxDegree} hoveredNodeId={$hoveredNodeId} />
    {/each}
  </g>

  <!-- Nodes -->
  <g class="nodes">
    {#each $nodes as node, index (node.id)}
      <Node
        {node}
        degree={degreeMap[node.id] || 0}
        {maxDegree}
        animating={$isAnimating}
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
    touch-action: none;
  }
</style>