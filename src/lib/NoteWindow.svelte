<script>
  import { nodes, updateNode } from '../store.js';
  import { activeNotes, closeNote, updateNoteWindow, requestCloseNote } from '../ui-store.js';
  import { onMount, onDestroy, tick } from 'svelte';

  export let windowState; // { nodeId, x, y, width, height, mode, isPinned, isDirty, showConfirm }

  $: node = $nodes.find(n => n.id === windowState.nodeId);

  let nodeNotes = '';
  let initialNotes = '';
  let lastInitializedNodeId = null;

  // Sync with store on open or node change
  $: if (node && windowState.nodeId !== lastInitializedNodeId) {
    lastInitializedNodeId = windowState.nodeId;
    nodeNotes = node.notes || '';
    initialNotes = node.notes || '';
    updateNoteWindow(windowState.nodeId, { isDirty: false, showConfirm: false });
  }

  // Reactive dirty check
  $: {
    const dirty = nodeNotes !== initialNotes;
    if (dirty !== windowState.isDirty) {
      updateNoteWindow(windowState.nodeId, { isDirty: dirty });
    }
  }

  $: renderedNotes = typeof marked !== 'undefined' ? marked.parse(nodeNotes || '') : nodeNotes;

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let isResizing = false;
  let resizeStartSize = { w: 0, h: 0 };
  let resizeStartPos = { x: 0, y: 0 };

  function handleHeaderMouseDown(e) {
    if (e.target.closest('button')) return;
    isDragging = true;
    dragOffset = { x: e.clientX - windowState.x, y: e.clientY - windowState.y };
    // Bring to front
    const updated = [...$activeNotes].filter(n => n.nodeId !== windowState.nodeId);
    activeNotes.set([...updated, windowState]);
  }

  function handleResizeMouseDown(e) {
    isResizing = true;
    resizeStartSize = { w: windowState.width, h: windowState.height };
    resizeStartPos = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  }

  function handleMouseMove(e) {
    if (isDragging) {
      updateNoteWindow(windowState.nodeId, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    } else if (isResizing) {
      updateNoteWindow(windowState.nodeId, {
        width: Math.max(260, resizeStartSize.w + (e.clientX - resizeStartPos.x)),
        height: Math.max(200, resizeStartSize.h + (e.clientY - resizeStartPos.y))
      });
    }
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
  }

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });

  function handleSave() {
    updateNode(windowState.nodeId, { notes: nodeNotes });
    initialNotes = nodeNotes;
    updateNoteWindow(windowState.nodeId, { isDirty: false, showConfirm: false });
  }

  function handleDiscard() {
    nodeNotes = initialNotes;
    updateNoteWindow(windowState.nodeId, { isDirty: false, showConfirm: false });
    closeNote(windowState.nodeId);
  }

  function handleSaveAndClose() {
    handleSave();
    closeNote(windowState.nodeId);
  }

  function toggleMode(mode) {
    updateNoteWindow(windowState.nodeId, { mode });
  }

  function togglePin() {
    updateNoteWindow(windowState.nodeId, { isPinned: !windowState.isPinned });
  }

  function handleCloseRequest() {
    requestCloseNote(windowState.nodeId);
  }
</script>

{#if node}
<div
  class="note-window {windowState.isPinned ? 'pinned' : ''}"
  style="left: {windowState.x}px; top: {windowState.y}px; width: {windowState.width}px; height: {windowState.height}px;"
>
  <div class="window-header" on:mousedown={handleHeaderMouseDown}>
    <div class="window-title">
      <span class="title-label">Note —</span>
      <span class="node-name">{node.label}</span>
    </div>
    <div class="window-controls">
      <button class="win-btn pin-btn" class:active={windowState.isPinned} on:click|stopPropagation={togglePin} title={windowState.isPinned ? 'Unpin' : 'Pin Window'}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill={windowState.isPinned ? "currentColor" : "none"} stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </button>
      <button class="win-btn close-btn" on:click|stopPropagation={handleCloseRequest}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </div>

  <div class="window-tabs">
    <button class="tab-btn" class:active={windowState.mode === 'edit'} on:click={() => toggleMode('edit')}>Edit</button>
    <button class="tab-btn" class:active={windowState.mode === 'preview'} on:click={() => toggleMode('preview')}>Preview</button>
  </div>

  <div class="window-content markdown-body">
    {#if windowState.mode === 'edit'}
      <textarea
        class="notes-editor"
        placeholder="Markdown notes..."
        bind:value={nodeNotes}
      ></textarea>
      <div class="save-bar">
        {#if windowState.isDirty}
          <span class="dirty-indicator">Unsaved changes</span>
        {/if}
        <button class="primary-btn mini-btn" on:click={handleSave} disabled={!windowState.isDirty}>Save</button>
      </div>
    {:else}
      <div class="notes-preview">
        {@html renderedNotes}
      </div>
    {/if}

    {#if windowState.showConfirm}
      <div class="confirm-overlay">
        <div class="confirm-dialog">
          <span class="confirm-text">Save changes before closing?</span>
          <div class="confirm-actions">
            <button class="confirm-btn discard" on:click={handleDiscard}>Discard</button>
            <button class="confirm-btn save" on:click={handleSaveAndClose}>Save</button>
          </div>
          <button class="cancel-link" on:click={() => updateNoteWindow(windowState.nodeId, { showConfirm: false })}>Cancel</button>
        </div>
      </div>
    {/if}
  </div>

  <div class="resize-handle" on:mousedown={handleResizeMouseDown}></div>
</div>
{/if}

<style>
  .note-window {
    position: fixed;
    z-index: 1000;
    background: var(--bg-elevated);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(148, 163, 184, 0.06);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    animation: window-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes window-enter {
    from { opacity: 0; transform: scale(0.97) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .window-header {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--border-color);
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .window-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-family: var(--font-mono);
  }

  .title-label {
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .node-name {
    color: var(--primary-color);
    font-weight: 500;
  }

  .window-controls {
    display: flex;
    gap: 4px;
  }

  .win-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .win-btn:hover {
    background: rgba(148, 163, 184, 0.1);
    color: var(--text-bright);
  }

  .pin-btn.active {
    color: var(--accent-color);
    background: rgba(167, 139, 250, 0.1);
  }

  .window-tabs {
    padding: 6px 14px;
    display: flex;
    gap: 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .tab-btn {
    background: transparent;
    border: none;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
    cursor: pointer;
    padding-bottom: 4px;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }

  .tab-btn:hover {
    color: var(--text-color);
  }

  .tab-btn.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }

  .window-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .notes-editor {
    flex: 1;
    width: 100%;
    background: transparent;
    border: none;
    padding: 14px;
    color: var(--text-color);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    resize: none;
    outline: none;
  }

  .save-bar {
    padding: 8px 14px;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
  }

  .dirty-indicator {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--accent-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .notes-preview {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-color);
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, var(--border-color) 50%);
  }

  /* Confirm Overlay */
  .confirm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(6, 10, 20, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .confirm-dialog {
    background: var(--bg-elevated);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .confirm-text {
    font-size: 13px;
    text-align: center;
    color: var(--text-bright);
  }

  .confirm-actions {
    display: flex;
    gap: 8px;
  }

  .confirm-btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }

  .confirm-btn.discard {
    background: rgba(244, 63, 94, 0.1);
    color: var(--danger-color);
    border: 1px solid rgba(244, 63, 94, 0.2);
  }

  .confirm-btn.discard:hover {
    background: var(--danger-color);
    color: white;
  }

  .confirm-btn.save {
    background: var(--primary-color);
    color: white;
  }

  .cancel-link {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 11px;
    text-decoration: underline;
    cursor: pointer;
  }

  /* Markdown styles within preview */
  .notes-preview :global(h1), .notes-preview :global(h2) {
    color: var(--text-bright);
    margin-top: 1em;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.2em;
  }
  .notes-preview :global(code) {
    font-family: var(--font-mono);
    background: rgba(148, 163, 184, 0.1);
    padding: 0.1em 0.3em;
    border-radius: 4px;
  }

  .primary-btn.mini-btn {
    padding: 4px 12px;
    font-size: 11px;
    border-radius: 6px;
    background: var(--primary-color);
    color: white;
    border: none;
    font-weight: 500;
    cursor: pointer;
  }
  .primary-btn.mini-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>