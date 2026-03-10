<script>
  import { nodes, edges, updateNodePosition } from '../store.js';
  import { popupState, selectedNodeId } from '../ui-store.js';
  import Node from './Node.svelte';
  import Edge from './Edge.svelte';

  let svg;
  let isDraggingNode = false;
  let draggedNodeId = null;

  function handleDoubleClick(e) {
    if (e.target !== svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    popupState.set({
      type: 'ADD_NODE',
      x,
      y,
      sourceNodeId: null
    });
  }

  function handleCanvasClick(e) {
    if (e.target === svg) {
      selectedNodeId.set(null);
      // Also close popup if open
      if ($popupState.type) {
        popupState.set({ type: null, x: 0, y: 0, sourceNodeId: null });
      }
    }
  }

  function handleNodeMouseDown(e, id) {
    isDraggingNode = true;
    draggedNodeId = id;
    selectedNodeId.set(id);
  }

  function handleMouseMove(e) {
    if (isDraggingNode && draggedNodeId) {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateNodePosition(draggedNodeId, x, y);
    }
  }

  function handleMouseUp() {
    isDraggingNode = false;
    draggedNodeId = null;
  }
</script>

<svg 
  bind:this={svg}
  class="graph-canvas"
  role="application"
  aria-label="Interactive Graph Canvas"
  on:dblclick={handleDoubleClick}
  on:click={handleCanvasClick}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.4)" />
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
    {#each $nodes as node (node.id)}
      <Node 
        {node} 
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
