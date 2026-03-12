<script>
  import { selectedNodeId, popupState, hoveredNodeId, openNote } from '../ui-store.js';
  import { removeNode } from '../store.js';
  import { getNodeColorByDegree, currentCmap } from '../colormap-store.js';
  export let node;
  export let degree = 0;
  export let maxDegree = 0;
  export let animating = false;
  export let onMouseDown;

  $: isSelected = $selectedNodeId === node.id;
  $: displayDesc = node.description ? (node.description.includes('\n') || node.description.length > 20 ? node.description.split('\n')[0].substring(0, 20) + '...' : node.description) : '';

  // Color by degree
  $: fillColor = getNodeColorByDegree(degree, maxDegree, $currentCmap);

  // Scale node size and label by degree (importance)
  $: t = maxDegree > 0 ? degree / maxDegree : 0;
  $: radius = 18 + t * 22;
  $: fontSize = 12 + t * 6;
  $: descFontSize = 9 + t * 3;
  // Glow intensity scales with importance
  $: glowOpacity = 0.15 + t * 0.35;

  function handleAddRelation() {
    popupState.set({
      type: 'ADD_RELATION',
      x: node.x + 40,
      y: node.y - 40,
      sourceNodeId: node.id,
      editTargetId: null
    });
  }

  function handleDoubleClick(e) {
    const svg = e.target.closest('svg');
    const ctm = svg.getScreenCTM();
    const screenX = ctm.a * node.x + ctm.e + 40;
    const screenY = ctm.d * node.y + ctm.f;
    popupState.set({
      type: 'EDIT_NODE',
      x: screenX,
      y: screenY,
      sourceNodeId: null,
      editTargetId: node.id
    });
  }

  function handleOpenNotes(e) {
    const svg = e.target.closest('svg');
    const ctm = svg.getScreenCTM();
    const screenX = ctm.a * node.x + ctm.e + 40;
    const screenY = ctm.d * node.y + ctm.f;
    // Use the new window-based openNote
    openNote(node.id, screenX, screenY, 'preview');
  }
</script>

<g
  class="node-group {isSelected ? 'selected' : ''}"
  role="button"
  tabindex="0"
  transform="translate({node.x}, {node.y})"
  on:mousedown|stopPropagation={onMouseDown}
  on:dblclick|stopPropagation={handleDoubleClick}
  on:mouseenter={() => hoveredNodeId.set(node.id)}
  on:mouseleave={() => hoveredNodeId.set(null)}
>
  <!-- Ambient glow — real blur, browser caches when static, pulse is opacity-only so still cheap -->
  <circle
    r={radius * 1.8}
    fill={fillColor}
    opacity={glowOpacity}
    class="node-glow {animating ? 'pulsing' : ''}"
    style={animating ? `animation-duration: ${2.5 + (degree * 0.7) % 3}s; animation-delay: -${(degree * 1.37 + radius * 0.3) % 4}s;` : ''}
  />
  <!-- Main circle -->
  <circle
    r={radius}
    fill={fillColor}
    stroke={isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)'}
    stroke-width={isSelected ? "2.5" : "1"}
    class="node-circle"
  />
  <!-- Inner highlight -->
  <circle
    r={radius * 0.65}
    fill="rgba(255,255,255,0.06)"
    class="node-highlight"
  />
  <text
    y={radius + 16}
    text-anchor="middle"
    fill="var(--text-bright)"
    class="node-label"
    style="font-size: {fontSize}px;"
  >
    {node.label}
  </text>
  {#if node.description}
    <text
      y={radius + 30}
      text-anchor="middle"
      fill="var(--text-muted)"
      class="node-description"
      style="font-size: {descFontSize}px;"
    >
      {displayDesc}
    </text>
  {/if}

  {#if node.notes}
    <g transform="translate({radius * 0.8}, {radius * 0.2})">
      <!-- Inner group handles the scale transform relative to local (0,0) -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <g class="notes-icon-btn" on:mousedown|stopPropagation={handleOpenNotes}>
        <rect x="-6" y="-6" width="12" height="12" rx="2" fill="var(--bg-elevated)" stroke="#fbbf24" stroke-width="1.2" />
        <path d="M-3 -2 H3 M-3 0 H3 M-3 2 H1" stroke="#fbbf24" stroke-width="1" stroke-linecap="round" />
      </g>
    </g>
  {/if}

  {#if isSelected}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <g class="action-btn" transform="translate({radius * 0.75}, {-radius * 0.75})" on:mousedown|stopPropagation={handleAddRelation}>
      <circle r="11" fill="var(--primary-color)" opacity="0.9"/>
      <path d="M-4,0 H4 M0,-4 V4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <g class="action-btn" transform="translate({-radius * 0.75}, {-radius * 0.75})" on:mousedown|stopPropagation={() => removeNode(node.id)}>
      <circle r="11" fill="var(--danger-color)" opacity="0.9"/>
      <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  {/if}
</g>

<style>
  .node-group {
    cursor: grab;
  }
  .node-group.selected {
    z-index: 10;
  }
  .node-group:active {
    cursor: grabbing;
  }
  .node-glow {
    pointer-events: none;
    filter: blur(18px);
    transition: opacity 0.4s ease;
  }
  .node-glow.pulsing {
    animation: constellation-pulse 3s ease-in-out infinite;
  }
  @keyframes constellation-pulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.55; }
  }
  .node-circle {
    transition: stroke 0.2s, stroke-width 0.2s, fill 0.3s;
  }
  .node-highlight {
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .node-group:hover .node-glow {
    opacity: 0.6;
  }
  .node-group:hover .node-circle {
    stroke: var(--primary-color, #06b6d4);
    stroke-width: 2;
  }
  .node-label {
    font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
    font-weight: 500;
    pointer-events: none;
    text-shadow: var(--text-shadow);
    transition: fill 0.3s ease;
    letter-spacing: -0.01em;
  }
  .node-description {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-style: normal;
    pointer-events: none;
    text-shadow: var(--text-shadow);
    transition: fill 0.3s ease;
  }
  .action-btn {
    cursor: pointer;
  }
  .action-btn circle {
    transition: fill 0.15s, opacity 0.15s;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  }
  .action-btn:hover circle {
    opacity: 1;
    filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5));
  }
  .notes-icon-btn {
    cursor: pointer;
    transition: transform 0.15s ease;
    transform-origin: 0 0;
  }
  .notes-icon-btn:hover {
    transform: scale(1.25);
  }
</style>