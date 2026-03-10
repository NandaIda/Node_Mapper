import { writable } from 'svelte/store';

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

export const addNode = (x, y, label, description = '', color = '#3b82f6') => {
  const newId = generateId();
  nodes.update(ns => [...ns, { id: newId, x, y, label, description, color }]);
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
  let currentNodes, currentEdges;
  nodes.subscribe(n => currentNodes = n)();
  edges.subscribe(e => currentEdges = e)();
  
  const data = {
    nodes: currentNodes,
    edges: currentEdges
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
