<script>
  import { popupState } from '../ui-store.js';
  import { addNode, addEdge, updateNode, updateEdge, nodes, edges } from '../store.js';
  
  let nodeLabel = '';
  let nodeDescription = '';
  let nodeColor = '#3b82f6';
  
  // Array to hold multiple target relations for the new node
  let targetRelations = [];
  
  let edgeLabel = '';
  let edgeDescription = '';
  let edgeTargetId = '';
  
  import { onMount, tick } from 'svelte';

  function closePopup() {
    popupState.set({ type: null, x: 0, y: 0, sourceNodeId: null, editTargetId: null });
    nodeLabel = '';
    nodeDescription = '';
    targetRelations = [];
    edgeLabel = '';
    edgeDescription = '';
    edgeTargetId = '';
  }

  function handleAddNode() {
    if (nodeLabel.trim() === '') return;
    const newId = addNode($popupState.svgX, $popupState.svgY, nodeLabel, nodeDescription);

    // Create relations
    targetRelations.forEach(rel => {
      if (rel.selected && rel.targetId) {
        addEdge(newId, rel.targetId, rel.label, rel.description || '');
      }
    });

    closePopup();
  }

  function handleAddRelation() {
    if (edgeTargetId === '') return;
    addEdge($popupState.sourceNodeId, edgeTargetId, edgeLabel, edgeDescription);
    closePopup();
  }

  function handleEditNode() {
    if (nodeLabel.trim() === '') return;
    updateNode($popupState.editTargetId, { label: nodeLabel, description: nodeDescription, color: nodeColor });
    closePopup();
  }

  function handleEditRelation() {
    updateEdge($popupState.editTargetId, { label: edgeLabel, description: edgeDescription });
    closePopup();
  }

  // Initialize list/fields when popup opens
  $: if ($popupState.type === 'ADD_NODE') {
    if (targetRelations.length === 0 && $nodes.length > 0) {
      targetRelations = $nodes.map(n => ({
        targetId: n.id,
        targetLabel: n.label,
        selected: false,
        label: '',
        description: ''
      }));
    }
  } else if ($popupState.type === 'EDIT_NODE') {
    const nodeToEdit = $nodes.find(n => n.id === $popupState.editTargetId);
    if (nodeToEdit && nodeLabel === '') {
      nodeLabel = nodeToEdit.label || '';
      nodeDescription = nodeToEdit.description || '';
      nodeColor = nodeToEdit.color || '#3b82f6';
    }
  } else if ($popupState.type === 'EDIT_RELATION') {
    const edgeToEdit = $edges.find(e => e.id === $popupState.editTargetId);
    if (edgeToEdit && edgeLabel === '' && edgeDescription === '') {
      edgeLabel = edgeToEdit.label || '';
      edgeDescription = edgeToEdit.description || '';
    }
  }

  let popupEl;
  let isTopBound = false;
  let isLeftBound = false;
  let isRightBound = false;
  let isBottomBound = false;

  // Reactively calculate bounds when popup appears or moves
  $: if ($popupState.type && popupEl) {
    tick().then(() => {
      if (!popupEl) return;
      const rect = popupEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Test boundaries (allow 20px padding)
      isTopBound = ($popupState.y - rect.height - 20) < 0;
      isLeftBound = ($popupState.x - rect.width / 2) < 0;
      isRightBound = ($popupState.x + rect.width / 2) > windowWidth;
      
      // Test bottom bound: if drawing downwards (because it hit the top bound), would it hit the bottom?
      // Or if drawing upwards (default), would the starting point be too close to the bottom?
      isBottomBound = ($popupState.y + 20) > windowHeight;

      // If both top and bottom are bound, prioritize top (draw downwards)
      if (isTopBound && isBottomBound) {
         isBottomBound = false; // Cannot satisfy both, default to dropping down
      }
    });
  }

  // Compute transform variables dynamically based on boundaries
  $: tx = isLeftBound ? '0%' : isRightBound ? '-100%' : '-50%';
  $: ty = isBottomBound ? '-100%' : isTopBound ? '0%' : '-100%';
</script>

{#if $popupState.type === 'ADD_NODE'}
  <div 
    bind:this={popupEl}
    class="popup {$popupState.type === 'ADD_NODE' ? 'popup-large' : ''} {isTopBound ? 'bound-top' : ''} {isBottomBound ? 'bound-bottom' : ''} {isLeftBound ? 'bound-left' : ''} {isRightBound ? 'bound-right' : ''}" 
    style="left: {$popupState.x}px; top: {$popupState.y}px; --tx: {tx}; --ty: {ty};"
  >
    <div class="popup-header">
      <h3>Add Node</h3>
      <button class="close-btn" on:click={closePopup}>&times;</button>
    </div>
    <div class="popup-body">
      <input 
        type="text" 
        placeholder="Node Label" 
        bind:value={nodeLabel} 
        on:keydown={e => e.key === 'Enter' && handleAddNode()}
      />
      <textarea
        placeholder="Description (Optional)"
        bind:value={nodeDescription}
        rows="2"
      ></textarea>

      {#if targetRelations.length > 0}
        <div class="relations-section">
          <h4>Connect to existing nodes:</h4>
          <div class="relations-list">
            {#each targetRelations as rel}
              <div class="relation-item">
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={rel.selected} />
                  <span>{rel.targetLabel}</span>
                </label>
                {#if rel.selected}
                  <input 
                    type="text" 
                    class="relation-input"
                    placeholder="Relation label (optional)" 
                    bind:value={rel.label}
                    on:keydown={e => e.key === 'Enter' && handleAddNode()}
                  />
                  <input 
                    type="text" 
                    class="relation-input relation-desc"
                    placeholder="Description (optional)" 
                    bind:value={rel.description}
                    on:keydown={e => e.key === 'Enter' && handleAddNode()}
                  />
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <button class="primary-btn" on:click={handleAddNode}>Create Node</button>
    </div>
  </div>
{/if}

{#if $popupState.type === 'ADD_RELATION'}
  <div 
    bind:this={popupEl}
    class="popup {isTopBound ? 'bound-top' : ''} {isBottomBound ? 'bound-bottom' : ''} {isLeftBound ? 'bound-left' : ''} {isRightBound ? 'bound-right' : ''}" 
    style="left: {$popupState.x}px; top: {$popupState.y}px; --tx: {tx}; --ty: {ty};"
  >
    <div class="popup-header">
      <h3>Add Relation</h3>
      <button class="close-btn" on:click={closePopup}>&times;</button>
    </div>
    <div class="popup-body">
      <select bind:value={edgeTargetId}>
        <option value="" disabled selected>Select Target Node</option>
        {#each $nodes.filter(n => n.id !== $popupState.sourceNodeId) as node}
          <option value={node.id}>{node.label}</option>
        {/each}
      </select>
      <input 
        type="text" 
        placeholder="Relation Label (Optional)" 
        bind:value={edgeLabel} 
        on:keydown={e => e.key === 'Enter' && handleAddRelation()}
      />
      <textarea
        placeholder="Description (Optional)"
        bind:value={edgeDescription}
        rows="2"
      ></textarea>
      <button class="primary-btn" on:click={handleAddRelation} disabled={!edgeTargetId}>Connect Nodes</button>
    </div>
  </div>
{/if}

{#if $popupState.type === 'EDIT_NODE'}
  <div 
    bind:this={popupEl}
    class="popup {isTopBound ? 'bound-top' : ''} {isBottomBound ? 'bound-bottom' : ''} {isLeftBound ? 'bound-left' : ''} {isRightBound ? 'bound-right' : ''}" 
    style="left: {$popupState.x}px; top: {$popupState.y}px; --tx: {tx}; --ty: {ty};"
  >
    <div class="popup-header">
      <h3>Edit Node</h3>
      <button class="close-btn" on:click={closePopup}>&times;</button>
    </div>
    <div class="popup-body">
      <input 
        type="text" 
        placeholder="Node Label" 
        bind:value={nodeLabel} 
        on:keydown={e => e.key === 'Enter' && handleEditNode()}
      />
      <textarea
        placeholder="Description (Optional)"
        bind:value={nodeDescription}
        rows="2"
      ></textarea>
      <div class="color-picker">
        <label for="nodeColorInput">Color:</label>
        <input id="nodeColorInput" type="color" bind:value={nodeColor} />
      </div>
      <button class="primary-btn" on:click={handleEditNode}>Save</button>
    </div>
  </div>
{/if}

{#if $popupState.type === 'EDIT_RELATION'}
  <div 
    bind:this={popupEl}
    class="popup {isTopBound ? 'bound-top' : ''} {isBottomBound ? 'bound-bottom' : ''} {isLeftBound ? 'bound-left' : ''} {isRightBound ? 'bound-right' : ''}" 
    style="left: {$popupState.x}px; top: {$popupState.y}px; --tx: {tx}; --ty: {ty};"
  >
    <div class="popup-header">
      <h3>Edit Relation</h3>
      <button class="close-btn" on:click={closePopup}>&times;</button>
    </div>
    <div class="popup-body">
      <input 
        type="text" 
        placeholder="Relation Label (Optional)" 
        bind:value={edgeLabel} 
        on:keydown={e => e.key === 'Enter' && handleEditRelation()}
      />
      <textarea
        placeholder="Description (Optional)"
        bind:value={edgeDescription}
        rows="2"
      ></textarea>
      <button class="primary-btn" on:click={handleEditRelation}>Save</button>
    </div>
  </div>
{/if}

<style>
  .popup {
    position: absolute;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    width: 260px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    z-index: 100;
    
    /* Dynamic transform powered by CSS variables */
    transform: translate(var(--tx, -50%), var(--ty, -100%));
    margin-top: -15px;
    animation: fadeScale 0.2s ease-out forwards;
  }

  .popup-large {
    width: 300px;
  }

  .relations-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
  }

  .relations-section h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.9;
  }

  .relations-list {
    max-height: 150px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 4px;
  }

  /* Custom Scrollbar for relation list */
  .relations-list::-webkit-scrollbar {
    width: 4px;
  }
  .relations-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .relations-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }

  .relation-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: rgba(0, 0, 0, 0.1);
    padding: 8px;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: border-color 0.2s;
  }

  .relation-item:focus-within {
    border-color: var(--primary-color);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-label input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--primary-color);
  }

  .relation-input {
    font-size: 12px;
    padding: 6px 8px;
    margin-left: 22px;
    width: calc(100% - 22px);
  }
  .relation-desc {
    margin-top: -2px;
  }

  /* Vertical boundary adjustments */
  .popup.bound-top {
    margin-top: 15px;
    animation: fadeScaleTop 0.2s ease-out forwards;
  }

  .popup.bound-bottom {
    margin-top: -30px;
  }

  /* Horizontal margin adjustments (shift slightly away from cursor so it doesn't block clicks) */
  .popup.bound-left {
    margin-left: 10px;
  }
  
  .popup.bound-right {
    margin-left: -10px;
  }

  /* Base caret pseudo-element */
  .popup::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px 8px 0;
    border-style: solid;
    border-color: var(--secondary-color) transparent transparent transparent;
  }

  /* Adjust caret vertical position when drawing downwards */
  .popup.bound-top::after {
    bottom: auto;
    top: -8px;
    border-width: 0 8px 8px;
    border-color: transparent transparent var(--secondary-color) transparent;
  }

  /* Adjust caret horizontal position when shifted left/right */
  .popup.bound-left::after {
    left: 15px;
    transform: none;
  }
  .popup.bound-right::after {
    left: auto;
    right: 15px;
    transform: none;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-color);
  }

  .popup-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-color);
    font-size: 18px;
    cursor: pointer;
    opacity: 0.6;
    padding: 0;
  }
  .close-btn:hover {
    opacity: 1;
  }

  .popup-body {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  input, select, textarea {
    width: 100%;
    padding: 8px 10px;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-color);
    font-size: 14px;
    box-sizing: border-box;
    transition: background-color 0.3s ease, border-color 0.2s, color 0.3s ease;
  }
  
  textarea {
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .color-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
  }
  .color-picker input[type="color"] {
    width: 40px;
    height: 30px;
    padding: 0;
    border: none;
    cursor: pointer;
    border-radius: 4px;
  }

  .primary-btn {
    background: linear-gradient(to right, var(--primary-color), var(--accent-color));
    color: white;
    border: none;
    padding: 8px 0;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .primary-btn:hover {
    opacity: 0.9;
  }
  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes fadeScale {
    0% {
      opacity: 0;
      transform: translate(var(--tx, -50%), calc(var(--ty, -100%) + 5%)) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translate(var(--tx, -50%), var(--ty, -100%)) scale(1);
    }
  }

  /* Specifically for when it drops down instead of up */
  @keyframes fadeScaleTop {
    0% {
      opacity: 0;
      transform: translate(var(--tx, -50%), -5%) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translate(var(--tx, -50%), 0) scale(1);
    }
  }
</style>
