import { writable } from 'svelte/store';

export const popupState = writable({
  type: null, // 'ADD_NODE' | 'ADD_RELATION' | null
  x: 0,
  y: 0,
  sourceNodeId: null,
});

export const selectedNodeId = writable(null);
