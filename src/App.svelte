<script>
  import GraphCanvas from './lib/GraphCanvas.svelte';
  import Popups from './lib/Popups.svelte';
</script>

<main class="app-container">
  <header class="app-header">
    <h1>Graph Plotter Node Relation</h1>
    <p>Double-click to create a node. Click an existing node to select it, or drag to move.</p>
  </header>
  
  <div class="canvas-wrapper">
    <GraphCanvas />
  </div>

  <Popups />
</main>

<style>
  :global(:root) {
    --bg-color: #0f172a;
    --text-color: #f8fafc;
    --primary-color: #3b82f6;
    --secondary-color: #1e293b;
    --accent-color: #8b5cf6;
    --danger-color: #ef4444;
    --node-bg: rgba(30, 41, 59, 0.9);
    --border-color: rgba(255, 255, 255, 0.1);
    font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    overflow: hidden;
    user-select: none;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  .app-header {
    padding: 1rem 2rem;
    background-color: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    z-index: 10;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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

  .canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
</style>
