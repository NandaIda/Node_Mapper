<script>
  import GraphCanvas from './lib/GraphCanvas.svelte';
  import Popups from './lib/Popups.svelte';
  import { onMount } from 'svelte';
  import { exportData, importData } from './store.js';
  import { currentCmap, setCmap, getAvailableCmaps, getSwatchColor } from './colormap-store.js';
  import { nodes, edges } from './store.js';
  import { viewBox, zoom, zoomTo, fitToNodes } from './ui-store.js';

  // Statistics panel state
  let showStats = false;

  // Compute statistics reactively
  $: nodeCount = $nodes.length;
  $: edgeCount = $edges.length;
  $: nodesWithDesc = $nodes.filter(n => n.description).length;
  $: edgesWithLabel = $edges.filter(e => e.label).length;

  // Degree counts per node
  $: degreeMap = (() => {
    const map = {};
    $nodes.forEach(n => map[n.id] = { label: n.label, in: 0, out: 0 });
    $edges.forEach(e => {
      if (map[e.sourceId]) map[e.sourceId].out++;
      if (map[e.targetId]) map[e.targetId].in++;
    });
    return map;
  })();

  $: mostConnected = Object.values(degreeMap)
    .map(d => ({ ...d, total: d.in + d.out }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Nodes with no connections (isolated)
  $: isolatedCount = Object.values(degreeMap).filter(d => d.in + d.out === 0).length;

  // Default to dark mode for visual excellence
  let isDarkMode = true;

  // Palette dropdown state
  let showPaletteDropdown = false;
  let paletteButtonEl;

  // Zoom control handlers
  function handleZoomIn() {
    const centerX = $viewBox.x + $viewBox.width / 2;
    const centerY = $viewBox.y + $viewBox.height / 2;
    zoomTo($zoom * 1.25, centerX, centerY);
  }

  function handleZoomOut() {
    const centerX = $viewBox.x + $viewBox.width / 2;
    const centerY = $viewBox.y + $viewBox.height / 2;
    zoomTo($zoom / 1.25, centerX, centerY);
  }

  function handleFitAll() {
    // Get SVG container dimensions
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
      const width = canvasWrapper.clientWidth;
      const height = canvasWrapper.clientHeight;
      fitToNodes($nodes, width, height);
    }
  }

  function togglePaletteDropdown() {
    showPaletteDropdown = !showPaletteDropdown;
  }

  function handleSelectCmap(cmapName) {
    setCmap(cmapName);
    showPaletteDropdown = false;
  }

  function handleClickOutside(e) {
    if (showPaletteDropdown && paletteButtonEl && !paletteButtonEl.contains(e.target)) {
      showPaletteDropdown = false;
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    // Persist to document for global CSS target
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }

  let fileInput;

  function handleImport(e) {
    const file = e.target.files[0];
    if (file) {
      importData(file).then(() => {
        // Reset file input
        fileInput.value = '';
      }).catch(err => {
        alert('Invalid workspace file.');
      });
    }
  }

  onMount(() => {
    // Initialize theme from local storage or default to dark
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        isDarkMode = storedTheme === 'dark';
      }
    }
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  });
</script>

<main class="app-container" on:click={handleClickOutside}>
  <header class="app-header">
    <div class="header-text">
      <div class="brand">
        <img src="/logo.svg" alt="Logo" class="brand-logo" />
        <h1>Graph Plotter Node Relation</h1>
      </div>
      <p>Double-click to create a node. Click an existing node to select it, or drag to move.</p>
    </div>
    <div class="header-actions">
      <button class="action-btn" on:click={exportData} title="Export Workspace">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>Export</span>
      </button>
      <button class="action-btn" on:click={() => fileInput.click()} title="Import Workspace">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <span>Import</span>
      </button>
      <input type="file" accept=".json" bind:this={fileInput} on:change={handleImport} style="display: none;" />

      <button class="action-btn" on:click={handleZoomIn} title="Zoom In">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        <span>+</span>
      </button>

      <button class="action-btn" on:click={handleZoomOut} title="Zoom Out">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        <span>−</span>
      </button>

      <button class="action-btn" on:click={handleFitAll} title="Fit All Nodes">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m14 0h3a2 2 0 0 0 2-2v-3"></path></svg>
        <span>Fit</span>
      </button>

      <div class="palette-button-wrapper" bind:this={paletteButtonEl}>
        <button class="action-btn palette-btn" on:click={togglePaletteDropdown} title="Switch Color Palette">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.3"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
          <span>Palette</span>
        </button>

        {#if showPaletteDropdown}
          <div class="palette-dropdown" role="listbox" on:click|stopPropagation>
            <div class="palette-dropdown-header">
              <h4>Color Palettes</h4>
              <span class="color-range-label">Colors: {Math.max(5, $nodes.length)}</span>
            </div>
            <div class="palette-list">
              {#each getAvailableCmaps() as cmapName}
                <button
                  class="palette-option {$currentCmap === cmapName ? 'active' : ''}"
                  on:click={() => handleSelectCmap(cmapName)}
                  title={`Switch to ${cmapName} palette`}
                >
                  <span class="palette-name">{cmapName.charAt(0).toUpperCase() + cmapName.slice(1)}</span>
                  <div class="color-swatches">
                    {#each [0, 1, 2, 3, 4] as i}
                      <div
                        class="swatch"
                        style="background-color: {getSwatchColor(cmapName, i)};"
                      ></div>
                    {/each}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <button class="theme-toggle" on:click={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
        {#if isDarkMode}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        {/if}
      </button>
    </div>
  </header>
  
  <div class="canvas-wrapper">
    <GraphCanvas />
  </div>

  <!-- Statistics Button & Panel -->
  <div class="stats-wrapper">
    <button
      class="stats-btn"
      on:click={() => showStats = !showStats}
      title="Graph Statistics"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
      <span>Stats</span>
    </button>

    {#if showStats}
      <div class="stats-panel">
        <div class="stats-header">
          <h4>Graph Statistics</h4>
          <button class="stats-close" on:click={() => showStats = false}>&times;</button>
        </div>
        <div class="stats-body">
          <div class="stats-row">
            <span class="stats-label">Nodes</span>
            <span class="stats-value">{nodeCount}</span>
          </div>
          <div class="stats-row">
            <span class="stats-label">Edges</span>
            <span class="stats-value">{edgeCount}</span>
          </div>
          <div class="stats-row">
            <span class="stats-label">Nodes with description</span>
            <span class="stats-value">{nodesWithDesc}</span>
          </div>
          <div class="stats-row">
            <span class="stats-label">Edges with label</span>
            <span class="stats-value">{edgesWithLabel}</span>
          </div>
          <div class="stats-row">
            <span class="stats-label">Isolated nodes</span>
            <span class="stats-value">{isolatedCount}</span>
          </div>

          {#if mostConnected.length > 0}
            <div class="stats-section-title">Most Connected</div>
            {#each mostConnected as node}
              <div class="stats-row compact">
                <span class="stats-label">{node.label}</span>
                <span class="stats-value">{node.total} <span class="stats-detail">({node.in}in {node.out}out)</span></span>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <Popups />
</main>

<style>
  :global(:root) {
    /* Dark Theme (Default) */
    --bg-color: #0f172a;
    --text-color: #f8fafc;
    --primary-color: #3b82f6;
    --secondary-color: #1e293b;
    --accent-color: #8b5cf6;
    --danger-color: #ef4444;
    --node-bg: rgba(30, 41, 59, 0.9);
    --border-color: rgba(255, 255, 255, 0.1);
    --canvas-edge: rgba(148, 163, 184, 0.6);
    --header-bg: rgba(15, 23, 42, 0.8);
    --input-bg: rgba(15, 23, 42, 0.6);
    --node-shadow: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    --text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  }

  :global(:root[data-theme="light"]) {
    /* Light Theme Overrides */
    --bg-color: #f8fafc;
    --text-color: #0f172a;
    --primary-color: #2563eb;
    --secondary-color: #ffffff;
    --accent-color: #7c3aed;
    --node-bg: rgba(255, 255, 255, 0.9);
    --border-color: rgba(0, 0, 0, 0.1);
    --canvas-edge: rgba(100, 116, 139, 0.6);
    --header-bg: rgba(255, 255, 255, 0.8);
    --input-bg: rgba(255, 255, 255, 0.8);
    --node-shadow: none;
    --text-shadow: none;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    overflow: hidden;
    user-select: none;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: var(--header-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    z-index: 10;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-logo {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }

  .app-header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(to right, var(--primary-color), var(--accent-color));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .app-header p {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .theme-toggle {
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    background-color: var(--border-color);
    transform: scale(1.05);
  }

  .theme-toggle:active {
    transform: scale(0.95);
  }

  .canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .palette-button-wrapper {
    position: relative;
  }

  .palette-btn {
    position: relative;
  }

  .palette-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    z-index: 200;
    min-width: 260px;
    margin-top: 8px;
    animation: fadeScale 0.2s ease-out forwards;
  }

  .palette-dropdown-header {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .palette-dropdown-header h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
  }

  .color-range-label {
    font-size: 12px;
    color: var(--text-color);
    opacity: 0.7;
    white-space: nowrap;
  }

  .palette-list {
    display: flex;
    flex-direction: column;
    max-height: 300px;
    overflow-y: auto;
  }

  .palette-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 15px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
  }

  .palette-option:last-child {
    border-bottom: none;
  }

  .palette-option:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .palette-option.active {
    background-color: rgba(59, 130, 246, 0.2);
    border-left: 3px solid var(--primary-color);
    padding-left: 12px;
  }

  .palette-name {
    font-size: 13px;
    font-weight: 500;
    min-width: 70px;
  }

  .color-swatches {
    display: flex;
    gap: 6px;
    flex: 1;
  }

  .swatch {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  /* Custom Scrollbar for palette list */
  .palette-list::-webkit-scrollbar {
    width: 6px;
  }
  .palette-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .palette-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }
  .palette-list::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
  }

  /* Statistics */
  .stats-wrapper {
    position: fixed;
    bottom: 16px;
    left: 16px;
    z-index: 100;
  }

  .stats-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .stats-btn:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .stats-panel {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    min-width: 260px;
    animation: fadeScale 0.2s ease-out forwards;
  }

  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
  }

  .stats-header h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }

  .stats-close {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 18px;
    cursor: pointer;
    opacity: 0.6;
    padding: 0 4px;
    line-height: 1;
  }

  .stats-close:hover {
    opacity: 1;
  }

  .stats-body {
    padding: 10px 14px;
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
  }

  .stats-row.compact {
    padding: 3px 0;
  }

  .stats-label {
    font-size: 12px;
    opacity: 0.8;
  }

  .stats-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
  }

  .stats-detail {
    font-size: 10px;
    font-weight: 400;
    opacity: 0.6;
    color: var(--text-color);
  }

  .stats-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.5;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
  }

  @keyframes fadeScale {
    0% {
      opacity: 0;
      transform: translateY(-5px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
