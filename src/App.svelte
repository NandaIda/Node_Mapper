<script>
  import GraphCanvas from './lib/GraphCanvas.svelte';
  import Popups from './lib/Popups.svelte';
  import { onMount } from 'svelte';
  import { exportData, importData } from './store.js';

  // Default to dark mode for visual excellence
  let isDarkMode = true;

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

<main class="app-container">
  <header class="app-header">
    <div class="header-text">
      <h1>Graph Plotter Node Relation</h1>
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
</style>
