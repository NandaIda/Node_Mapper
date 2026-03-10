<script>
  import GraphCanvas from './lib/GraphCanvas.svelte';
  import Popups from './lib/Popups.svelte';
  import { onMount } from 'svelte';
  import { exportData, importData, loadDemoData } from './store.js';
  import { currentCmap, setCmap, getAvailableCmaps, getSwatchColor } from './colormap-store.js';
  import { nodes, edges } from './store.js';
  import { viewBox, zoom, zoomTo, fitToNodes, isAnimating } from './ui-store.js';

  // Music
  const tracks = [
    { file: '/musics/delosound-space-ambient-cinematic-442834.mp3', title: 'Space Ambient Cinematic', author: 'Delosound' },
    { file: '/musics/prettyjohn1-meditation-495674.mp3', title: 'Meditation', author: 'Prettyjohn1' },
    { file: '/musics/universfield-ambient-space-background-350710.mp3', title: 'Ambient Space Background', author: 'Universfield' },
  ];
  const storedTrack = typeof localStorage !== 'undefined' ? localStorage.getItem('selected-track') : null;
  let selectedTrack = storedTrack ? parseInt(storedTrack, 10) : 0;
  let audio;
  let audioReady = false;
  let showTrackPicker = false;
  let trackPickerEl;

  // Initialize audio once mounted, keep src stable
  onMount(() => {
    if (audio) {
      audio.src = tracks[selectedTrack].file;
      audio.loop = true;
      audio.volume = 0.4;
      audioReady = true;
    }
  });

  // Play/pause music with constellation mode — never reset currentTime
  $: if (audioReady && audio) {
    if ($isAnimating) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function selectTrack(i) {
    selectedTrack = i;
    showTrackPicker = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selected-track', i.toString());
    }
    if (audio) {
      audio.src = tracks[i].file;
      audio.currentTime = 0;
      if ($isAnimating) {
        audio.play().catch(() => {});
      }
    }
  }

  // Help / Credit dialog
  let showHelp = false;

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
    if (showTrackPicker && trackPickerEl && !trackPickerEl.contains(e.target)) {
      showTrackPicker = false;
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
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
        fileInput.value = '';
      }).catch(err => {
        alert('Invalid workspace file.');
      });
    }
  }

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        isDarkMode = storedTheme === 'dark';
      }
    }
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  });

  $: zoomPercent = Math.round($zoom * 100);
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<main class="app-container" on:click={handleClickOutside}>
  <!-- Floating toolbar -->
  <header class="toolbar">
    <div class="toolbar-brand">
      <img src="/logo.svg" alt="Logo" class="toolbar-logo" />
      <div class="toolbar-title">
        <span class="title-text">Graphn</span>
        <span class="title-sub">node relation mapper</span>
      </div>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button class="tool-btn" on:click={exportData} title="Export">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="tool-btn" on:click={() => fileInput.click()} title="Import">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </button>
      <input type="file" accept=".json" bind:this={fileInput} on:change={handleImport} style="display: none;" />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group zoom-group">
      <button class="tool-btn" on:click={handleZoomOut} title="Zoom Out">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <span class="zoom-label">{zoomPercent}%</span>
      <button class="tool-btn" on:click={handleZoomIn} title="Zoom In">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button class="tool-btn" on:click={handleFitAll} title="Fit All">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <audio bind:this={audio}></audio>

    <div class="toolbar-group">
      <button
        class="tool-btn constellation-btn"
        class:active={$isAnimating}
        on:click={() => isAnimating.update(v => !v)}
        title={$isAnimating ? 'Stop' : 'Constellation Mode'}
      >
        {#if $isAnimating}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,4 20,12 6,20"/></svg>
        {/if}
      </button>

      <div class="track-picker-wrapper" bind:this={trackPickerEl}>
        <button class="tool-btn music-btn" on:click={() => showTrackPicker = !showTrackPicker} title="Select Music">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </button>

        {#if showTrackPicker}
          <div class="track-dropdown" on:click|stopPropagation>
            <div class="track-dd-header">
              <span class="track-dd-title">Ambient Music</span>
            </div>
            {#each tracks as track, i}
              <button class="track-option" class:active={selectedTrack === i} on:click={() => selectTrack(i)}>
                <span class="track-name">{track.title}</span>
                <span class="track-author">{track.author}</span>
              </button>
            {/each}
            <div class="track-credit">from pixabay.com</div>
          </div>
        {/if}
      </div>
    </div>

    <div class="toolbar-divider"></div>

    <div class="palette-button-wrapper" bind:this={paletteButtonEl}>
      <button class="tool-btn palette-trigger" on:click={togglePaletteDropdown} title="Color Palette">
        <div class="palette-dots">
          {#each [0, 1, 2, 3, 4] as i}
            <span class="palette-dot" style="background: {getSwatchColor($currentCmap, i)};"></span>
          {/each}
        </div>
      </button>

      {#if showPaletteDropdown}
        <div class="palette-dropdown" role="listbox" on:click|stopPropagation>
          <div class="palette-dd-header">
            <span class="palette-dd-title">Palettes</span>
            <span class="palette-dd-count">{Math.max(5, $nodes.length)} colors</span>
          </div>
          {#each getAvailableCmaps() as cmapName}
            <button
              class="palette-option {$currentCmap === cmapName ? 'active' : ''}"
              on:click={() => handleSelectCmap(cmapName)}
            >
              <span class="palette-name">{cmapName}</span>
              <div class="palette-bar">
                {#each [0, 1, 2, 3, 4, 5] as i}
                  <span class="bar-segment" style="background: {getSwatchColor(cmapName, i)};"></span>
                {/each}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <button class="tool-btn theme-btn" on:click={toggleTheme} title="Toggle Theme">
      {#if isDarkMode}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      {/if}
    </button>

    <button class="tool-btn help-btn" on:click={() => showHelp = true} title="Help & Credits">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </button>
  </header>

  <!-- Canvas -->
  <div class="canvas-wrapper">
    <GraphCanvas />

    <!-- Hint (only when empty) -->
    {#if $nodes.length === 0}
      <div class="canvas-hint">
        <span class="hint-icon">+</span>
        <span>Double-click to add a node</span>
      </div>
    {/if}
  </div>

  <!-- Stats panel — bottom left -->
  <div class="stats-wrapper">
    <button
      class="stats-trigger"
      class:stats-open={showStats}
      on:click={() => showStats = !showStats}
      title="Statistics"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span class="stats-badge">{nodeCount}</span>
    </button>

    {#if showStats}
      <div class="stats-panel">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-num">{nodeCount}</span>
            <span class="stat-lbl">nodes</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{edgeCount}</span>
            <span class="stat-lbl">edges</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{nodesWithDesc}</span>
            <span class="stat-lbl">described</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{isolatedCount}</span>
            <span class="stat-lbl">isolated</span>
          </div>
        </div>

        {#if mostConnected.length > 0}
          <div class="stats-rank">
            <span class="rank-title">top connected</span>
            {#each mostConnected as node, i}
              <div class="rank-row">
                <span class="rank-pos">{i + 1}</span>
                <span class="rank-name">{node.label}</span>
                <span class="rank-score">{node.total}<span class="rank-detail">{node.in}in {node.out}out</span></span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Help & Credits Dialog -->
  {#if showHelp}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="dialog-overlay" on:click={() => showHelp = false}>
      <div class="dialog" on:click|stopPropagation>
        <div class="dialog-header">
          <div class="dialog-brand">
            <img src="/logo.svg" alt="Logo" class="dialog-logo" />
            <div>
              <span class="dialog-title">Graphn</span>
              <span class="dialog-version">node relation mapper</span>
            </div>
          </div>
          <button class="dialog-close" on:click={() => showHelp = false}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="dialog-body">
          <div class="dialog-section">
            <span class="dialog-section-title">controls</span>
            <div class="help-grid">
              <kbd>Double-click</kbd><span>Create node</span>
              <kbd>Click</kbd><span>Select node/edge</span>
              <kbd>Drag</kbd><span>Move node</span>
              <kbd>Double-click node</kbd><span>Edit node</span>
              <kbd>Scroll</kbd><span>Zoom in/out</span>
              <kbd>Drag canvas</kbd><span>Pan</span>
              <kbd>+ button</kbd><span>Add relation</span>
              <kbd>x button</kbd><span>Delete</span>
            </div>
          </div>

          <div class="dialog-section">
            <span class="dialog-section-title">features</span>
            <ul class="feature-list">
              <li>Node size and color scale by connection count</li>
              <li>Edge thickness reflects importance of connected nodes</li>
              <li>Constellation mode animates with ambient music</li>
              <li>Export/import workspaces as JSON with palette</li>
              <li>Built-in demo graph to explore the tool instantly</li>
              <li>5 color palettes with automatic degree mapping</li>
            </ul>
          </div>

          <div class="dialog-section">
            <span class="dialog-section-title">music credits</span>
            <div class="credit-list">
              {#each tracks as track}
                <div class="credit-row">
                  <span class="credit-title">{track.title}</span>
                  <span class="credit-author">by {track.author}</span>
                </div>
              {/each}
              <span class="credit-source">All music from pixabay.com (free license)</span>
            </div>
          </div>

          <div class="dialog-section">
            <span class="dialog-section-title">about</span>
            <p class="about-text">
              Built with Svelte 5 and Vite. Designed for brainstorming and clustering ideas — importance emerges naturally from connections.
            </p>
          </div>

          <div class="dialog-section">
            <span class="dialog-section-title">try it out</span>
            <p class="about-text" style="margin-bottom: 10px;">
              Load a sample graph to see how node mapping reveals what matters most. This demo maps the challenges of launching a startup — watch how Funding, MVP, and Team emerge as critical nodes.
            </p>
            <button class="demo-btn" on:click={() => { loadDemoData(); showHelp = false; setTimeout(handleFitAll, 100); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Load Demo — Startup Launch
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <Popups />
</main>

<style>
  /* ============================
     DESIGN SYSTEM: OBSERVATORY
     Deep-space cartography aesthetic
     ============================  */

  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

  :global(:root) {
    --bg-deep: #060a14;
    --bg-color: #0a0e1a;
    --bg-surface: rgba(12, 17, 30, 0.85);
    --bg-elevated: rgba(16, 22, 40, 0.92);
    --text-color: #c8d6e5;
    --text-muted: #5a6a80;
    --text-bright: #e8ecf2;
    --primary-color: #06b6d4;
    --secondary-color: #0d1224;
    --accent-color: #a78bfa;
    --accent-pink: #f472b6;
    --danger-color: #f43f5e;
    --border-color: rgba(148, 163, 184, 0.08);
    --border-active: rgba(6, 182, 212, 0.3);
    --canvas-edge: rgba(100, 120, 150, 0.35);
    --header-bg: rgba(10, 14, 26, 0.8);
    --input-bg: rgba(6, 10, 20, 0.6);
    --node-bg: rgba(30, 41, 59, 0.9);
    --node-shadow: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    --text-shadow: 0 1px 4px rgba(0,0,0,0.9);
    --glass-blur: blur(20px);
    --glass-border: 1px solid rgba(148, 163, 184, 0.06);
    --font-body: 'DM Sans', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
    font-family: var(--font-body);
  }

  :global(:root[data-theme="light"]) {
    --bg-deep: #f0f2f5;
    --bg-color: #f7f8fa;
    --bg-surface: rgba(255, 255, 255, 0.85);
    --bg-elevated: rgba(255, 255, 255, 0.95);
    --text-color: #334155;
    --text-muted: #94a3b8;
    --text-bright: #0f172a;
    --primary-color: #0891b2;
    --secondary-color: #ffffff;
    --accent-color: #7c3aed;
    --accent-pink: #ec4899;
    --border-color: rgba(0, 0, 0, 0.06);
    --border-active: rgba(8, 145, 178, 0.3);
    --canvas-edge: rgba(100, 116, 139, 0.3);
    --header-bg: rgba(255, 255, 255, 0.75);
    --input-bg: rgba(241, 245, 249, 0.8);
    --node-bg: rgba(255, 255, 255, 0.9);
    --node-shadow: drop-shadow(0 2px 8px rgba(0,0,0,0.08));
    --text-shadow: none;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: var(--bg-deep);
    color: var(--text-color);
    overflow: hidden;
    user-select: none;
    transition: background-color 0.4s ease, color 0.4s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(167, 139, 250, 0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(244, 114, 182, 0.02) 0%, transparent 50%);
  }

  /* ─── FLOATING TOOLBAR ─── */
  .toolbar {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-elevated);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 14px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(148, 163, 184, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
    animation: toolbar-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes toolbar-enter {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .toolbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px 2px 4px;
  }

  .toolbar-logo {
    width: 28px;
    height: 28px;
    border-radius: 7px;
  }

  .toolbar-title {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .title-text {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text-bright);
  }

  .title-sub {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    letter-spacing: 0.04em;
    margin-top: 2px;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color);
    margin: 0 4px;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }

  .tool-btn:hover {
    color: var(--text-bright);
    background: rgba(6, 182, 212, 0.08);
    border-color: var(--border-active);
  }

  .tool-btn:active {
    transform: scale(0.94);
  }

  .zoom-group {
    gap: 0;
  }

  .zoom-label {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    min-width: 40px;
    text-align: center;
    letter-spacing: -0.02em;
  }

  .palette-trigger {
    width: auto;
    padding: 0 8px;
  }

  .palette-dots {
    display: flex;
    gap: 3px;
    align-items: center;
  }

  .palette-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: transform 0.15s;
  }

  .palette-trigger:hover .palette-dot {
    transform: scale(1.15);
  }

  .constellation-btn {
    color: var(--accent-pink);
  }

  .constellation-btn:hover {
    background: rgba(244, 114, 182, 0.1);
    border-color: rgba(244, 114, 182, 0.25);
  }

  .constellation-btn.active {
    color: var(--accent-pink);
    background: rgba(244, 114, 182, 0.12);
    border-color: rgba(244, 114, 182, 0.3);
    box-shadow: 0 0 12px rgba(244, 114, 182, 0.15);
    animation: btn-glow 2s ease-in-out infinite;
  }

  @keyframes btn-glow {
    0%, 100% { box-shadow: 0 0 8px rgba(244, 114, 182, 0.1); }
    50% { box-shadow: 0 0 16px rgba(244, 114, 182, 0.25); }
  }

  .theme-btn {
    color: var(--accent-color);
  }

  .theme-btn:hover {
    background: rgba(167, 139, 250, 0.1);
    border-color: rgba(167, 139, 250, 0.25);
  }

  /* ─── PALETTE DROPDOWN ─── */
  .palette-button-wrapper {
    position: relative;
  }

  .palette-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: -20px;
    background: var(--bg-elevated);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.04);
    z-index: 200;
    min-width: 220px;
    overflow: hidden;
    animation: dropdown-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes dropdown-enter {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .palette-dd-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
  }

  .palette-dd-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .palette-dd-count {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
  }

  .palette-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.12s;
  }

  .palette-option:last-child {
    border-bottom: none;
  }

  .palette-option:hover {
    background: rgba(6, 182, 212, 0.06);
  }

  .palette-option.active {
    background: rgba(6, 182, 212, 0.1);
  }

  .palette-option.active .palette-name {
    color: var(--primary-color);
  }

  .palette-name {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    min-width: 55px;
    text-transform: lowercase;
  }

  .palette-bar {
    display: flex;
    flex: 1;
    height: 14px;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-segment {
    flex: 1;
    transition: filter 0.15s;
  }

  .palette-option:hover .bar-segment {
    filter: brightness(1.15);
  }

  /* ─── CANVAS ─── */
  .canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.04) 1px, transparent 0);
    background-size: 40px 40px;
  }

  .canvas-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    pointer-events: none;
    animation: hint-pulse 3s ease-in-out infinite;
  }

  .hint-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed rgba(148, 163, 184, 0.15);
    border-radius: 50%;
    font-size: 24px;
    color: var(--text-muted);
    font-weight: 300;
  }

  .canvas-hint span:last-child {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  @keyframes hint-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  /* ─── STATS PANEL ─── */
  .stats-wrapper {
    position: fixed;
    bottom: 16px;
    left: 16px;
    z-index: 100;
  }

  .stats-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--bg-elevated);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 10px;
    color: var(--text-muted);
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  .stats-trigger:hover, .stats-trigger.stats-open {
    color: var(--primary-color);
    border-color: var(--border-active);
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.1);
  }

  .stats-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    padding: 1px 6px;
    background: rgba(6, 182, 212, 0.1);
    border-radius: 6px;
    color: var(--primary-color);
  }

  .stats-panel {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    background: var(--bg-elevated);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 14px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
    min-width: 260px;
    overflow: hidden;
    animation: dropdown-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 10px;
    background: var(--bg-elevated);
    gap: 2px;
  }

  .stat-num {
    font-family: var(--font-mono);
    font-size: 20px;
    font-weight: 500;
    color: var(--text-bright);
    letter-spacing: -0.03em;
  }

  .stat-lbl {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    font-weight: 500;
  }

  .stats-rank {
    padding: 12px 14px;
  }

  .rank-title {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .rank-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
  }

  .rank-pos {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    width: 14px;
    text-align: right;
  }

  .rank-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
    flex: 1;
  }

  .rank-score {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    color: var(--primary-color);
  }

  .rank-detail {
    font-size: 9px;
    color: var(--text-muted);
    margin-left: 4px;
    font-weight: 400;
  }

  /* ─── MUSIC PICKER ─── */
  .music-btn {
    color: var(--text-muted);
  }

  .track-picker-wrapper {
    position: relative;
  }

  .track-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: -10px;
    background: var(--bg-elevated);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
    z-index: 200;
    min-width: 240px;
    overflow: hidden;
    animation: dropdown-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .track-dd-header {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
  }

  .track-dd-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .track-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.12s;
  }

  .track-option:last-of-type {
    border-bottom: none;
  }

  .track-option:hover {
    background: rgba(6, 182, 212, 0.06);
  }

  .track-option.active {
    background: rgba(6, 182, 212, 0.1);
  }

  .track-option.active .track-name {
    color: var(--primary-color);
  }

  .track-name {
    font-size: 12px;
    font-weight: 500;
  }

  .track-author {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
  }

  .track-credit {
    padding: 8px 14px;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    text-align: center;
    border-top: 1px solid var(--border-color);
  }

  /* ─── HELP BUTTON ─── */
  .help-btn {
    color: var(--text-muted);
  }

  .help-btn:hover {
    color: var(--primary-color);
  }

  /* ─── HELP / CREDITS DIALOG ─── */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: overlay-enter 0.2s ease both;
  }

  @keyframes overlay-enter {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .dialog {
    background: var(--bg-elevated);
    backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
    width: 420px;
    max-height: 80vh;
    overflow-y: auto;
    animation: dropdown-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .dialog-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dialog-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .dialog-title {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-bright);
    letter-spacing: -0.02em;
  }

  .dialog-version {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  .dialog-close {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    transition: color 0.15s, background 0.15s;
  }

  .dialog-close:hover {
    color: var(--text-bright);
    background: rgba(148, 163, 184, 0.08);
  }

  .dialog-body {
    padding: 16px 20px;
  }

  .dialog-section {
    margin-bottom: 18px;
  }

  .dialog-section:last-child {
    margin-bottom: 0;
  }

  .dialog-section-title {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--primary-color);
    margin-bottom: 10px;
  }

  .help-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    align-items: center;
  }

  .help-grid kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 7px;
    background: rgba(148, 163, 184, 0.06);
    border: 1px solid var(--border-color);
    border-radius: 5px;
    color: var(--text-bright);
    white-space: nowrap;
  }

  .help-grid span {
    font-size: 12px;
    color: var(--text-color);
  }

  .feature-list {
    margin: 0;
    padding: 0 0 0 16px;
    list-style: none;
  }

  .feature-list li {
    font-size: 12px;
    color: var(--text-color);
    padding: 3px 0;
    position: relative;
  }

  .feature-list li::before {
    content: '';
    position: absolute;
    left: -12px;
    top: 10px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--primary-color);
    opacity: 0.6;
  }

  .credit-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .credit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: rgba(148, 163, 184, 0.03);
    border-radius: 6px;
  }

  .credit-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
  }

  .credit-author {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
  }

  .credit-source {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    text-align: center;
    margin-top: 4px;
  }

  .about-text {
    margin: 0;
    font-size: 12px;
    color: var(--text-color);
    line-height: 1.6;
  }

  .demo-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    background: rgba(6, 182, 212, 0.08);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 8px;
    color: var(--primary-color);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .demo-btn:hover {
    background: rgba(6, 182, 212, 0.14);
    border-color: rgba(6, 182, 212, 0.35);
    box-shadow: 0 0 16px rgba(6, 182, 212, 0.1);
  }

  .demo-btn:active {
    transform: scale(0.98);
  }

  /* ─── SCROLLBAR ─── */
  :global(::-webkit-scrollbar) {
    width: 5px;
  }
  :global(::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: var(--border-color);
    border-radius: 3px;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(6, 182, 212, 0.3);
  }
</style>
