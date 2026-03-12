<script>
  import { popupState, openNote } from '../ui-store.js';
  import { addNode, addEdge, updateNode, updateEdge, nodes, edges } from '../store.js';

  let nodeLabel = '';
  let nodeDescription = '';
  let nodeNotes = ''; // Still kept for ADD_NODE to allow initial notes

  // Array to hold multiple target relations for the new node
  let targetRelations = [];

  let edgeLabel = '';
  let edgeDescription = '';
  let edgeTargetId = '';

  import { onMount, tick } from 'svelte';

  function closePopup() {
    popupState.set({ type: null, x: 0, y: 0, sourceNodeId: null, editTargetId: null, startMode: null });
    nodeLabel = '';
    nodeDescription = '';
    nodeNotes = '';
    targetRelations = [];
    edgeLabel = '';
    edgeDescription = '';
    edgeTargetId = '';
  }

  function handleAddNode() {
    if (nodeLabel.trim() === '') return;
    const newId = addNode($popupState.svgX, $popupState.svgY, nodeLabel, nodeDescription, nodeNotes);
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
    updateNode($popupState.editTargetId, { label: nodeLabel, description: nodeDescription });
    closePopup();
  }

  function handleOpenNotes() {
    if ($popupState.editTargetId) {
      openNote($popupState.editTargetId, $popupState.x + 20, $popupState.y + 20, 'edit');
      closePopup();
    }
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
      nodeNotes = nodeToEdit.notes || '';
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

  $: if ($popupState.type && popupEl) {
    tick().then(() => {
      if (!popupEl) return;
      const rect = popupEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      isTopBound = ($popupState.y - rect.height - 20) < 0;
      isLeftBound = ($popupState.x - rect.width / 2) < 0;
      isRightBound = ($popupState.x + rect.width / 2) > windowWidth;
      isBottomBound = ($popupState.y + 20) > windowHeight;
      if (isTopBound && isBottomBound) {
        isBottomBound = false;
      }
    });
  }

  $: tx = isLeftBound ? '0%' : isRightBound ? '-100%' : '-50%';
  $: ty = isBottomBound ? '-100%' : isTopBound ? '0%' : '-100%';
</script>

{#if $popupState.type === 'ADD_NODE'}
  <div
    bind:this={popupEl}
    class="popup popup-large {isTopBound ? 'bound-top' : ''} {isBottomBound ? 'bound-bottom' : ''} {isLeftBound ? 'bound-left' : ''} {isRightBound ? 'bound-right' : ''}"
    style="left: {$popupState.x}px; top: {$popupState.y}px; --tx: {tx}; --ty: {ty};"
  >
    <div class="popup-header">
      <span class="popup-tag">new node</span>
      <button class="close-btn" on:click={closePopup}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="popup-body">
      <input
        type="text"
        placeholder="Label"
        bind:value={nodeLabel}
        on:keydown={e => e.key === 'Enter' && handleAddNode()}
      />
      <textarea
        placeholder="Description (optional)"
        bind:value={nodeDescription}
        rows="2"
      ></textarea>

      <div class="popup-actions">
        <button class="primary-btn" style="flex: 1" on:click={handleAddNode}>
          <span>Create</span>
          <kbd>Enter</kbd>
        </button>
      </div>

      {#if targetRelations.length > 0}
        <div class="relations-section">
          <span class="section-label">connect to</span>
          <div class="relations-list">
            {#each targetRelations as rel}
              <div class="relation-item" class:active={rel.selected}>
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={rel.selected} />
                  <span>{rel.targetLabel}</span>
                </label>
                {#if rel.selected}
                  <input
                    type="text"
                    class="relation-input"
                    placeholder="Relation label"
                    bind:value={rel.label}
                    on:keydown={e => e.key === 'Enter' && handleAddNode()}
                  />
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
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
      <span class="popup-tag">new relation</span>
      <button class="close-btn" on:click={closePopup}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="popup-body">
      <select bind:value={edgeTargetId}>
        <option value="" disabled selected>Select target</option>
        {#each $nodes.filter(n => n.id !== $popupState.sourceNodeId) as node}
          <option value={node.id}>{node.label}</option>
        {/each}
      </select>
      <input
        type="text"
        placeholder="Label (optional)"
        bind:value={edgeLabel}
        on:keydown={e => e.key === 'Enter' && handleAddRelation()}
      />
      <textarea
        placeholder="Description (optional)"
        bind:value={edgeDescription}
        rows="2"
      ></textarea>
      <button class="primary-btn" on:click={handleAddRelation} disabled={!edgeTargetId}>Connect</button>
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
      <span class="popup-tag">edit node</span>
      <button class="close-btn" on:click={closePopup}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="popup-body">
      <input
        type="text"
        placeholder="Label"
        bind:value={nodeLabel}
        on:keydown={e => e.key === 'Enter' && handleEditNode()}
      />
      <textarea
        placeholder="Description (optional)"
        bind:value={nodeDescription}
        rows="2"
      ></textarea>
      <div class="popup-actions">
        <button class="secondary-btn" on:click={handleOpenNotes}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          Notes
        </button>
        <button class="primary-btn" on:click={handleEditNode}>Save</button>
      </div>
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
      <span class="popup-tag">edit relation</span>
      <button class="close-btn" on:click={closePopup}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="popup-body">
      <input
        type="text"
        placeholder="Label (optional)"
        bind:value={edgeLabel}
        on:keydown={e => e.key === 'Enter' && handleEditRelation()}
      />
      <textarea
        placeholder="Description (optional)"
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
    background: var(--bg-elevated);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(148, 163, 184, 0.06);
    border-radius: 14px;
    width: 280px;
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(148, 163, 184, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.02);
    z-index: 100;
    transform: translate(var(--tx, -50%), var(--ty, -100%));
    margin-top: -15px;
    animation: popup-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .popup-large {
    width: 320px;
  }

  @keyframes popup-enter {
    from { opacity: 0; transform: translate(var(--tx, -50%), calc(var(--ty, -100%) + 8px)) scale(0.96); }
    to { opacity: 1; transform: translate(var(--tx, -50%), var(--ty, -100%)) scale(1); }
  }

  .popup.bound-top {
    margin-top: 15px;
    animation: popup-enter-top 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes popup-enter-top {
    from { opacity: 0; transform: translate(var(--tx, -50%), -8px) scale(0.96); }
    to { opacity: 1; transform: translate(var(--tx, -50%), 0) scale(1); }
  }

  .popup.bound-bottom { margin-top: -30px; }
  .popup.bound-left { margin-left: 10px; }
  .popup.bound-right { margin-left: -10px; }

  /* Caret */
  .popup::after {
    content: '';
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 7px 7px 0;
    border-style: solid;
    border-color: var(--bg-elevated) transparent transparent transparent;
  }
  .popup.bound-top::after {
    bottom: auto;
    top: -7px;
    border-width: 0 7px 7px;
    border-color: transparent transparent var(--bg-elevated) transparent;
  }
  .popup.bound-left::after { left: 15px; transform: none; }
  .popup.bound-right::after { left: auto; right: 15px; transform: none; }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .popup-tag {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 12px;
    font-weight: 500;
    color: var(--primary-color);
    letter-spacing: 0.02em;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }
  .close-btn:hover {
    color: var(--text-bright);
    background: rgba(148, 163, 184, 0.08);
  }

  .popup-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  input, select, textarea {
    width: 100%;
    padding: 10px 14px;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-bright);
    font-size: 14px;
    font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.08);
  }

  input::placeholder, textarea::placeholder {
    color: var(--text-muted);
    font-weight: 400;
  }

  .relations-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
  }

  .section-label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .relations-list {
    max-height: 160px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 4px;
  }

  .relation-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s;
  }

  .relation-item.active {
    background: rgba(6, 182, 212, 0.04);
    border-color: var(--border-active);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    color: var(--text-color);
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--primary-color);
  }

  .relation-input {
    font-size: 12px;
    padding: 8px 10px;
    margin-left: 26px;
    width: calc(100% - 26px);
  }

  .primary-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2);
  }

  .primary-btn:hover {
    opacity: 0.92;
    box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
  }

  .primary-btn:active {
    transform: scale(0.98);
  }

  .primary-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }

  .primary-btn kbd {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    font-weight: 400;
  }

  /* Scrollbar */
  .relations-list::-webkit-scrollbar { width: 5px; }
  .relations-list::-webkit-scrollbar-track { background: transparent; }
  .relations-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

  /* New note styles */
  .popup-actions {
    display: flex;
    gap: 10px;
  }

  .secondary-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(148, 163, 184, 0.08);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .secondary-btn:hover {
    background: rgba(148, 163, 184, 0.12);
    border-color: var(--text-muted);
    color: var(--text-bright);
  }
</style>