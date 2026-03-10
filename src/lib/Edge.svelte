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
    const svgEl = e.target.closest('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
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
  $: edgeWidth = 1 + edgeImportance * 2.5;
  $: edgeOpacity = 0.25 + edgeImportance * 0.45;

  // Dynamic radius per node based on degree
  function nodeRadius(nodeId) {
    const deg = degreeMap[nodeId] || 0;
    const t = maxDegree > 0 ? deg / maxDegree : 0;
    return 18 + t * 22;
  }

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
      stroke-opacity={isSelected ? 0.9 : edgeOpacity}
      fill="none"
      marker-end="url(#arrowhead)"
      class="edge-path"
    />
    {#if edge.label || edge.description}
      <rect
        x={(source.x + target.x) / 2 - 40}
        y={(source.y + target.y) / 2 - 12}
        width="80"
        height={edge.description ? "30" : "22"}
        fill="var(--bg-color)"
        fill-opacity="0.8"
        rx="5"
        class="edge-label-bg"
      />
    {/if}
    {#if edge.label}
      <text
        x={(source.x + target.x) / 2}
        y={(source.y + target.y) / 2 + (edge.description ? -1 : 4)}
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
        y={(source.y + target.y) / 2 + 11}
        text-anchor="middle"
        fill="var(--text-muted)"
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
        <circle r="11" fill="var(--danger-color)" opacity="0.9"/>
        <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    {/if}
  </g>
{/if}

<style>
  .edge-group .edge-path {
    transition: stroke-width 0.25s, stroke 0.25s, stroke-opacity 0.25s;
  }
  .edge-hover-area {
    pointer-events: stroke;
  }
  .edge-group:hover .edge-path {
    stroke: var(--primary-color);
    stroke-opacity: 0.6;
  }
  .edge-label-bg {
    pointer-events: none;
    transition: fill 0.3s;
  }
  .edge-label {
    font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
    font-size: 10px;
    font-weight: 500;
    pointer-events: none;
    transition: fill 0.3s;
  }
  .edge-description {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 8px;
    font-style: normal;
    pointer-events: none;
    transition: fill 0.3s;
  }
  .delete-btn {
    cursor: pointer;
    pointer-events: auto;
  }
  .delete-btn circle {
    transition: fill 0.15s;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  }
  .delete-btn:hover circle {
    fill: #ef4444;
  }
</style>
