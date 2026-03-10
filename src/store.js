import { writable } from 'svelte/store';
import { currentCmap, setCmap } from './colormap-store.js';

// Demo data: "Launching a Startup" — a common challenge where connections reveal priorities
const demoData = {
  nodes: [
    { id: 'n_idea', x: 400, y: 100, label: 'Business Idea', description: 'Core concept validation' },
    { id: 'n_market', x: 200, y: 220, label: 'Market Research', description: 'Who are the customers?' },
    { id: 'n_mvp', x: 600, y: 220, label: 'MVP', description: 'Minimum viable product' },
    { id: 'n_funding', x: 400, y: 350, label: 'Funding', description: 'How to finance the venture' },
    { id: 'n_team', x: 150, y: 400, label: 'Team', description: 'Co-founders and early hires' },
    { id: 'n_legal', x: 650, y: 400, label: 'Legal', description: 'Registration, IP, contracts' },
    { id: 'n_pitch', x: 400, y: 500, label: 'Pitch Deck', description: 'Investor presentation' },
    { id: 'n_investors', x: 200, y: 600, label: 'Investors', description: 'Angels, VCs, grants' },
    { id: 'n_bootstrap', x: 600, y: 600, label: 'Bootstrapping', description: 'Self-funding, revenue first' },
    { id: 'n_marketing', x: 50, y: 550, label: 'Marketing', description: 'Brand, channels, growth' },
    { id: 'n_customers', x: 50, y: 280, label: 'Customers', description: 'Early adopters and feedback' },
    { id: 'n_pricing', x: 350, y: 680, label: 'Pricing', description: 'Revenue model and pricing strategy' },
    { id: 'n_competition', x: 0, y: 130, label: 'Competition', description: 'Competitor analysis' },
    { id: 'n_tech', x: 750, y: 250, label: 'Tech Stack', description: 'Tools, frameworks, infrastructure' },
    { id: 'n_launch', x: 400, y: 800, label: 'Launch', description: 'Go to market' },
    { id: 'n_feedback', x: 200, y: 800, label: 'User Feedback', description: 'Iterate based on real usage' },
    { id: 'n_growth', x: 600, y: 800, label: 'Growth', description: 'Scale users and revenue' },
    { id: 'n_burnout', x: 750, y: 550, label: 'Burnout', description: 'Mental health and pace' },
    { id: 'n_mentor', x: 850, y: 400, label: 'Mentors', description: 'Advisors and network' },
    { id: 'n_pivot', x: 100, y: 750, label: 'Pivot', description: 'Change direction if needed' },
  ],
  edges: [
    // Idea connects broadly
    { id: 'e1', sourceId: 'n_idea', targetId: 'n_market', label: 'validate', description: '' },
    { id: 'e2', sourceId: 'n_idea', targetId: 'n_mvp', label: 'build', description: '' },
    { id: 'e3', sourceId: 'n_idea', targetId: 'n_competition', label: 'differentiate', description: '' },
    // Market research connections
    { id: 'e4', sourceId: 'n_market', targetId: 'n_customers', label: 'find', description: '' },
    { id: 'e5', sourceId: 'n_market', targetId: 'n_pricing', label: 'inform', description: '' },
    { id: 'e6', sourceId: 'n_competition', targetId: 'n_market', label: 'shapes', description: '' },
    // MVP hub
    { id: 'e7', sourceId: 'n_mvp', targetId: 'n_tech', label: 'requires', description: '' },
    { id: 'e8', sourceId: 'n_mvp', targetId: 'n_funding', label: 'needs', description: '' },
    { id: 'e9', sourceId: 'n_mvp', targetId: 'n_team', label: 'needs', description: '' },
    { id: 'e10', sourceId: 'n_customers', targetId: 'n_mvp', label: 'test', description: '' },
    // Funding hub (will be high-degree)
    { id: 'e11', sourceId: 'n_funding', targetId: 'n_pitch', label: 'prepare', description: '' },
    { id: 'e12', sourceId: 'n_funding', targetId: 'n_team', label: 'pay', description: '' },
    { id: 'e13', sourceId: 'n_funding', targetId: 'n_legal', label: 'requires', description: '' },
    { id: 'e14', sourceId: 'n_pitch', targetId: 'n_investors', label: 'attract', description: '' },
    { id: 'e15', sourceId: 'n_investors', targetId: 'n_funding', label: 'provide', description: '' },
    { id: 'e16', sourceId: 'n_bootstrap', targetId: 'n_funding', label: 'alternative', description: '' },
    // Team connections
    { id: 'e17', sourceId: 'n_team', targetId: 'n_burnout', label: 'risk', description: '' },
    { id: 'e18', sourceId: 'n_mentor', targetId: 'n_team', label: 'guides', description: '' },
    { id: 'e19', sourceId: 'n_mentor', targetId: 'n_legal', label: 'advises', description: '' },
    // Marketing & growth
    { id: 'e20', sourceId: 'n_marketing', targetId: 'n_customers', label: 'acquire', description: '' },
    { id: 'e21', sourceId: 'n_marketing', targetId: 'n_launch', label: 'drives', description: '' },
    { id: 'e22', sourceId: 'n_pricing', targetId: 'n_bootstrap', label: 'enables', description: '' },
    { id: 'e23', sourceId: 'n_pricing', targetId: 'n_marketing', label: 'shapes', description: '' },
    // Launch & post-launch
    { id: 'e24', sourceId: 'n_mvp', targetId: 'n_launch', label: 'leads to', description: '' },
    { id: 'e25', sourceId: 'n_launch', targetId: 'n_feedback', label: 'generates', description: '' },
    { id: 'e26', sourceId: 'n_launch', targetId: 'n_growth', label: 'starts', description: '' },
    { id: 'e27', sourceId: 'n_feedback', targetId: 'n_pivot', label: 'may cause', description: '' },
    { id: 'e28', sourceId: 'n_pivot', targetId: 'n_idea', label: 'redefine', description: '' },
    { id: 'e29', sourceId: 'n_growth', targetId: 'n_funding', label: 'needs more', description: '' },
    { id: 'e30', sourceId: 'n_burnout', targetId: 'n_pivot', label: 'can force', description: '' },
    // Legal ties
    { id: 'e31', sourceId: 'n_legal', targetId: 'n_launch', label: 'clears', description: '' },
    { id: 'e32', sourceId: 'n_investors', targetId: 'n_legal', label: 'requires', description: '' },
  ],
  palette: 'neon'
};

// Retrieve stored data if available
const storedNodes = typeof localStorage !== 'undefined' ? localStorage.getItem('graph-nodes') : null;
const storedEdges = typeof localStorage !== 'undefined' ? localStorage.getItem('graph-edges') : null;

export const nodes = writable(storedNodes ? JSON.parse(storedNodes) : []);
export const edges = writable(storedEdges ? JSON.parse(storedEdges) : []);

// Subscribe to changes and auto-save
nodes.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('graph-nodes', JSON.stringify(value));
  }
});

edges.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('graph-edges', JSON.stringify(value));
  }
});

// Generate a simple unique ID
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const addNode = (x, y, label, description = '') => {
  const newId = generateId();
  nodes.update(ns => [...ns, { id: newId, x, y, label, description }]);
  return newId;
};

export const updateNode = (id, updates) => {
  nodes.update(ns => ns.map(n => n.id === id ? { ...n, ...updates } : n));
};

export const updateNodePosition = (id, x, y) => {
  nodes.update(ns => ns.map(n => n.id === id ? { ...n, x, y } : n));
};

export const addEdge = (sourceId, targetId, label = '', description = '') => {
  // Avoid duplicate edges in same direction
  let duplicate = false;
  edges.update(es => {
    if (es.some(e => e.sourceId === sourceId && e.targetId === targetId)) {
      duplicate = true;
      return es;
    }
    return [...es, { id: generateId(), sourceId, targetId, label, description }];
  });
  return !duplicate;
};

export const updateEdge = (id, updates) => {
  edges.update(es => es.map(e => e.id === id ? { ...e, ...updates } : e));
};

export const removeEdge = (id) => {
  edges.update(es => es.filter(e => e.id !== id));
};

export const removeNode = (id) => {
  nodes.update(ns => ns.filter(n => n.id !== id));
  // Remove associated edges
  edges.update(es => es.filter(e => e.sourceId !== id && e.targetId !== id));
};

export const exportData = () => {
  let currentNodes, currentEdges, cmapName;
  nodes.subscribe(n => currentNodes = n)();
  edges.subscribe(e => currentEdges = e)();
  currentCmap.subscribe(c => cmapName = c)();

  const data = {
    nodes: currentNodes,
    edges: currentEdges,
    palette: cmapName
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `graph-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target.result;
        if (typeof result !== 'string') {
          throw new Error('Expected file content to be text');
        }
        const data = JSON.parse(result);
        if (data.nodes && Array.isArray(data.nodes)) {
          nodes.set(data.nodes);
        }
        if (data.edges && Array.isArray(data.edges)) {
          edges.set(data.edges);
        }
        if (data.palette) {
          setCmap(data.palette);
        }
        resolve(true);
      } catch (err) {
        console.error('Failed to parse graph data', err);
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const loadDemoData = () => {
  nodes.set(demoData.nodes);
  edges.set(demoData.edges);
  if (demoData.palette) {
    setCmap(demoData.palette);
  }
};
