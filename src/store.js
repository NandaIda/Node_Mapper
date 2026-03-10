import { writable } from 'svelte/store';

export const nodes = writable([]);
export const edges = writable([]);

// Generate a simple unique ID
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const addNode = (x, y, label, color = '#3b82f6') => {
  nodes.update(ns => [...ns, { id: generateId(), x, y, label, color }]);
};

export const updateNodePosition = (id, x, y) => {
  nodes.update(ns => ns.map(n => n.id === id ? { ...n, x, y } : n));
};

export const addEdge = (sourceId, targetId, label = '') => {
  // Avoid duplicate edges in same direction
  let duplicate = false;
  edges.update(es => {
    if (es.some(e => e.sourceId === sourceId && e.targetId === targetId)) {
      duplicate = true;
      return es;
    }
    return [...es, { id: generateId(), sourceId, targetId, label }];
  });
  return !duplicate;
};

export const removeEdge = (id) => {
  edges.update(es => es.filter(e => e.id !== id));
};

export const removeNode = (id) => {
  nodes.update(ns => ns.filter(n => n.id !== id));
  // Remove associated edges
  edges.update(es => es.filter(e => e.sourceId !== id && e.targetId !== id));
};
