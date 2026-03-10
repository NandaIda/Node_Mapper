<script>
  import { nodes, removeEdge } from '../store.js';
  import { selectedEdgeId, selectedNodeId } from '../ui-store.js';
  export let edge;
  export let degreeMap = {};
  export let maxDegree = 0;
  
  $: source = $nodes.find(n => n.id === edge.sourceId);
  $: target = $nodes.find(n => n.id === edge.targetId);
  $: isSelected = $selectedEdgeId === edge.id;
  $: displayDesc = edge.description ? (edge.description.includes('\n') || edge.description.length > 20 ? edge.description.split('\n')[0].substring(0, 20) + '...' : edge.description) : '';

  function handleSelect() {
    selectedEdgeId.set(edge.id);
    selectedNodeId.set(null);
  }

  function handleDoubleClick(e) {
    // The popups are positioned relative to the `.canvas-wrapper` which is the offset parent.
    // Currently, e.clientX/Y are viewport coordinates. Let's make it relative to the SVG container.
    const svgEl = e.target.closest('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    
    // We want the popup to spawn near the midpoint of the node, similar to where click happened 
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    import('../ui-store.js').then(({ popupState }) => {
      popupState.set({
        type: 'EDIT_RELATION',
        x: relX,
        y: relY,
        sourceNodeId: null,
        editTargetId: edge.id
      });
    });
  }

  // Edge thickness based on combined importance of source + target
  $: sourceDeg = source ? (degreeMap[source.id] || 0) : 0;
  $: targetDeg = target ? (degreeMap[target.id] || 0) : 0;
  $: edgeImportance = maxDegree > 0 ? (sourceDeg + targetDeg) / (2 * maxDegree) : 0;
  $: edgeWidth = 1.5 + edgeImportance * 3;

  // Dynamic radius per node based on degree
  function nodeRadius(nodeId) {
    const deg = degreeMap[nodeId] || 0;
    const t = maxDegree > 0 ? deg / maxDegree : 0;
    return 18 + t * 22;
  }

  // Calculate coordinates to draw arrow boundary to boundary
  $: pathStr = source && target ? calculatePath(source, target) : '';

  function calculatePath(s, t) {
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return '';

    const sRadius = nodeRadius(s.id);
    const tRadius = nodeRadius(t.id);
    const nx = dx / dist;
    const ny = dy / dist;

    const startX = s.x + nx * sRadius;
    const startY = s.y + ny * sRadius;
    const endX = t.x - nx * (tRadius + 4);
    const endY = t.y - ny * (tRadius + 4);

    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
</script>

{#if source && target}
  <g class="edge-group">
    <!-- Thicker transparent path to make hovering easier -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <path 
      d={pathStr}
      stroke="transparent"
      stroke-width="20"
      fill="none"
      class="edge-hover-area"
      on:click|stopPropagation={handleSelect}
      on:dblclick|stopPropagation={handleDoubleClick}
      on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect()}
      role="button"
      tabindex="0"
    />
    <path
      d={pathStr}
      stroke={isSelected ? "var(--accent-color)" : "var(--canvas-edge)"}
      stroke-width={isSelected ? edgeWidth + 1.5 : edgeWidth}
      fill="none"
      marker-end="url(#arrowhead)"
      class="edge-path"
    />
      {#if edge.label || edge.description}
      <!-- Background for text readability if label or description -->
      <rect
        x={(source.x + target.x) / 2 - 40}
        y={(source.y + target.y) / 2 - 14}
        width="80"
        height={edge.description ? "34" : "24"}
        fill="var(--bg-color)"
        rx="4"
        class="edge-label-bg"
      />
      {/if}
      {#if edge.label}
        <text 
          x={(source.x + target.x) / 2} 
          y={(source.y + target.y) / 2 + (edge.description ? -2 : 4)}
          text-anchor="middle"
          fill="var(--text-color)"
          class="edge-label"
        >
          {edge.label}
        </text>
      {/if}
      {#if edge.description}
        <text 
          x={(source.x + target.x) / 2} 
          y={(source.y + target.y) / 2 + 10}
          text-anchor="middle"
          fill="var(--canvas-edge)"
          class="edge-description"
        >
          {displayDesc}
        </text>
      {/if}
      {#if isSelected}
        <g 
          class="delete-btn" 
          transform="translate({(source.x + target.x) / 2}, {(source.y + target.y) / 2 + (edge.label ? -16 : 0)})"
          on:click|stopPropagation={() => removeEdge(edge.id)}
          on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && removeEdge(edge.id)}
          role="button"
          tabindex="0"
        >
          <circle r="12" fill="var(--danger-color)" />
          <!-- The X icon inside the circle -->
          <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" stroke-width="2" stroke-linecap="round" />
        </g>
      {/if}
  </g>
{/if}

<style>
  .edge-group .edge-path {
    transition: stroke-width 0.2s, stroke 0.3s ease;
  }
  .edge-hover-area {
    pointer-events: stroke; /* Ensure this thick transparent path triggers hover */
  }
  .edge-group:hover .edge-path {
    stroke-width: 3;
    stroke: var(--primary-color);
  }
  .edge-label-bg {
    pointer-events: none;
    opacity: 0.8;
    transition: fill 0.3s ease;
  }
  .edge-label {
    font-size: 11px;
    font-weight: 500;
    pointer-events: none;
    transition: fill 0.3s ease;
  }
  .edge-description {
    font-size: 9px;
    font-style: italic;
    pointer-events: none;
    transition: fill 0.3s ease;
  }
  .delete-btn {
    cursor: pointer;
    transition: opacity 0.2s; /* Removed transform transition */
    pointer-events: auto;
  }
  .delete-btn:hover circle {
    fill: #ef4444; /* darker red or just stay same */
  }
  .delete-btn circle {
    transition: fill 0.2s;
  }
</style>
