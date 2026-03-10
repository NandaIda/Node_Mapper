<script>
  import { popupState } from '../ui-store.js';
  import { addNode, addEdge, nodes } from '../store.js';
  
  let nodeLabel = '';
  let nodeColor = '#3b82f6';
  
  let edgeLabel = '';
  let edgeTargetId = '';
  
  function closePopup() {
    popupState.set({ type: null, x: 0, y: 0, sourceNodeId: null });
    nodeLabel = '';
    edgeLabel = '';
    edgeTargetId = '';
  }

  function handleAddNode() {
    if (nodeLabel.trim() === '') return;
    addNode($popupState.x, $popupState.y, nodeLabel, nodeColor);
    closePopup();
  }

  function handleAddRelation() {
    if (edgeTargetId === '') return;
    addEdge($popupState.sourceNodeId, edgeTargetId, edgeLabel);
    closePopup();
  }
</script>

{#if $popupState.type === 'ADD_NODE'}
  <div 
    class="popup" 
    style="left: {$popupState.x}px; top: {$popupState.y}px"
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
      <div class="color-picker">
        <label for="nodeColorInput">Color:</label>
        <input id="nodeColorInput" type="color" bind:value={nodeColor} />
      </div>
      <button class="primary-btn" on:click={handleAddNode}>Create Node</button>
    </div>
  </div>
{/if}

{#if $popupState.type === 'ADD_RELATION'}
  <div 
    class="popup" 
    style="left: {$popupState.x}px; top: {$popupState.y}px"
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
      <button class="primary-btn" on:click={handleAddRelation} disabled={!edgeTargetId}>Connect Nodes</button>
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
    transform: translate(-50%, -100%);
    margin-top: -15px;
    animation: fadeScale 0.2s ease-out forwards;
  }

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

  input, select {
    width: 100%;
    padding: 8px 10px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-color);
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  
  input:focus, select:focus {
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
      transform: translate(-50%, -90%) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -100%) scale(1);
    }
  }
</style>
