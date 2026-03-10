<script>
  import { selectedNodeId, popupState } from '../ui-store.js';
  import { removeNode, nodes } from '../store.js';
  import { getNodeColor, colorRange } from '../colormap-store.js';
  export let node;
  export let index;
  export let onMouseDown;

  $: isSelected = $selectedNodeId === node.id;
  $: displayDesc = node.description ? (node.description.includes('\n') || node.description.length > 20 ? node.description.split('\n')[0].substring(0, 20) + '...' : node.description) : '';

  // Compute fill color: use manual override if set to something other than default, otherwise use colormap
  $: fillColor = node.color && node.color !== '#3b82f6' ? node.color : getNodeColor(index, $nodes.length);

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
    // Convert SVG coordinates to screen coordinates using CTM (Current Transformation Matrix).
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
</script>

<g 
  class="node-group {isSelected ? 'selected' : ''}" 
  role="button"
  tabindex="0"
  transform="translate({node.x}, {node.y})"
  on:mousedown|stopPropagation={onMouseDown}
  on:dblclick|stopPropagation={handleDoubleClick}
>
  <circle
    r="24"
    fill={fillColor}
    stroke={isSelected ? 'var(--accent-color)' : 'var(--border-color)'}
    stroke-width={isSelected ? "3" : "2"}
    class="node-circle"
  />
  <text 
    y="40" 
    text-anchor="middle" 
    fill="var(--text-color)"
    class="node-label"
  >
    {node.label}
  </text>
  {#if node.description}
    <text 
      y="58" 
      text-anchor="middle" 
      fill="var(--canvas-edge)"
      class="node-description"
    >
      {displayDesc}
    </text>
  {/if}
  
  {#if isSelected}
    <!-- Small plus button to add relation -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <g class="action-btn" transform="translate(20, -20)" on:mousedown|stopPropagation={handleAddRelation}>
      <circle r="12" fill="var(--primary-color)" />
      <path d="M-5,0 H5 M0,-5 V5" stroke="white" stroke-width="2" />
    </g>

    <!-- Small trash/delete button to remove node -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <g class="action-btn delete-node-btn" transform="translate(-20, -20)" on:mousedown|stopPropagation={() => removeNode(node.id)}>
      <circle r="12" fill="var(--danger-color)" />
      <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" stroke-width="2" stroke-linecap="round" />
    </g>
  {/if}
</g>

<style>
  .node-group {
    cursor: grab;
    /* smooth movement */
  }
  .node-group.selected {
    z-index: 10;
  }
  .node-group:active {
    cursor: grabbing;
  }
  .node-circle {
    transition: stroke 0.2s, stroke-width 0.2s, fill 0.2s, filter 0.2s;
    filter: var(--node-shadow);
  }
  .node-group:hover .node-circle {
    filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.4));
  }
  .node-label {
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    text-shadow: var(--text-shadow);
    transition: fill 0.3s ease;
  }
  .node-description {
    font-size: 11px;
    font-style: italic;
    pointer-events: none;
    text-shadow: var(--text-shadow);
    transition: fill 0.3s ease;
  }
  .action-btn {
    cursor: pointer;
  }
  .action-btn circle {
    transition: fill 0.15s;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
  }
  .action-btn:hover circle {
    fill: var(--accent-color);
  }
</style>
