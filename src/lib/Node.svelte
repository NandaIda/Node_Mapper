<script>
  import { selectedNodeId, popupState } from '../ui-store.js';
  export let node;
  export let onMouseDown;

  $: isSelected = $selectedNodeId === node.id;

  function handleAddRelation() {
    popupState.set({
      type: 'ADD_RELATION',
      x: node.x + 40,
      y: node.y - 40,
      sourceNodeId: node.id
    });
  }
</script>

<g 
  class="node-group {isSelected ? 'selected' : ''}" 
  role="button"
  tabindex="0"
  transform="translate({node.x}, {node.y})"
  on:mousedown|stopPropagation={onMouseDown}
>
  <circle
    r="24"
    fill={node.color || 'var(--node-bg)'}
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
  
  {#if isSelected}
    <!-- Small plus button to add relation -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <g class="action-btn" transform="translate(20, -20)" on:mousedown|stopPropagation={handleAddRelation}>
      <circle r="12" fill="var(--primary-color)" />
      <path d="M-5,0 H5 M0,-5 V5" stroke="white" stroke-width="2" />
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
    transition: stroke 0.2s, stroke-width 0.2s, fill 0.2s;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
  }
  .node-group:hover .node-circle {
    filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.4));
  }
  .node-label {
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
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
