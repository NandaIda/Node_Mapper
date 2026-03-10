import { writable } from 'svelte/store';

export const popupState = writable({
  type: null, // 'ADD_NODE' | 'ADD_RELATION' | 'EDIT_NODE' | 'EDIT_RELATION' | null
  x: 0,
  y: 0,
  sourceNodeId: null,
  editTargetId: null // Used for EDIT_NODE and EDIT_RELATION
});

export const selectedNodeId = writable(null);
export const selectedEdgeId = writable(null);
