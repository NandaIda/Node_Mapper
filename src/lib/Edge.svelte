<script>
  import { nodes } from '../store.js';
  export let edge;
  
  $: source = $nodes.find(n => n.id === edge.sourceId);
  $: target = $nodes.find(n => n.id === edge.targetId);

  // Calculate coordinates to draw arrow boundary to boundary
  $: pathStr = source && target ? calculatePath(source, target) : '';

  function calculatePath(s, t) {
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return '';
    
    const radius = 24; 
    const nx = dx / dist;
    const ny = dy / dist;

    const startX = s.x + nx * radius;
    const startY = s.y + ny * radius;
    const endX = t.x - nx * (radius + 4); 
    const endY = t.y - ny * (radius + 4);

    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
</script>

{#if source && target}
  <g class="edge-group">
    <path 
      d={pathStr}
      stroke="rgba(148, 163, 184, 0.6)"
      stroke-width="2"
      fill="none"
      marker-end="url(#arrowhead)"
    />
    {#if edge.label}
      <!-- Background for text readability -->
      <rect
        x={(source.x + target.x) / 2 - 30}
        y={(source.y + target.y) / 2 - 12}
        width="60"
        height="24"
        fill="var(--bg-color)"
        rx="4"
        class="edge-label-bg"
      />
      <text 
        x={(source.x + target.x) / 2} 
        y={(source.y + target.y) / 2 + 4}
        text-anchor="middle"
        fill="var(--text-color)"
        class="edge-label"
      >
        {edge.label}
      </text>
    {/if}
  </g>
{/if}

<style>
  .edge-group path {
    transition: stroke-width 0.2s, stroke 0.2s;
  }
  .edge-group:hover path {
    stroke-width: 3;
    stroke: var(--primary-color);
    cursor: pointer;
  }
  .edge-label-bg {
    pointer-events: none;
    opacity: 0.8;
  }
  .edge-label {
    font-size: 11px;
    font-weight: 500;
    pointer-events: none;
  }
</style>
