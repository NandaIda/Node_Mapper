import { writable, derived } from 'svelte/store';

export const popupState = writable({
  type: null, // 'ADD_NODE' | 'ADD_RELATION' | 'EDIT_NODE' | 'EDIT_RELATION' | null
  x: 0,
  y: 0,
  sourceNodeId: null,
  editTargetId: null,
  startMode: null
});

// Store for multiple active note windows
// Each entry: { nodeId, x, y, width, height, mode, isPinned }
export const activeNotes = writable([]);

export const openNote = (nodeId, x, y, mode = 'preview') => {
  activeNotes.update(notes => {
    // If already open, just bring to front (by moving to end of array) or keep as is
    const existingIndex = notes.findIndex(n => n.nodeId === nodeId);
    if (existingIndex !== -1) {
      const existing = notes[existingIndex];
      const updated = [...notes];
      updated.splice(existingIndex, 1);
      return [...updated, { ...existing, mode }];
    }
    // Add new window
    return [...notes, {
      nodeId,
      x: x || 100,
      y: y || 100,
      width: 320,
      height: 400,
      mode,
      isPinned: false,
      isDirty: false,
      showConfirm: false
    }];
  });
};

export const closeNote = (nodeId) => {
  activeNotes.update(notes => notes.filter(n => n.nodeId !== nodeId));
};

export const updateNoteWindow = (nodeId, updates) => {
  activeNotes.update(notes => notes.map(n => n.nodeId === nodeId ? { ...n, ...updates } : n));
};

export const requestCloseNote = (nodeId) => {
  let note;
  activeNotes.subscribe(notes => {
    note = notes.find(n => n.nodeId === nodeId);
  })();

  if (note && note.isDirty) {
    updateNoteWindow(nodeId, { showConfirm: true });
    return false; // Managed by confirmation
  } else {
    closeNote(nodeId);
    return true; // Successfully closed
  }
};

export const closeUnpinnedNotes = (exceptNodeId = null) => {
  let notesToClose = [];
  activeNotes.subscribe(notes => {
    notesToClose = notes.filter(n => !n.isPinned && n.nodeId !== exceptNodeId);
  })();

  let allClosed = true;
  notesToClose.forEach(n => {
    const closed = requestCloseNote(n.nodeId);
    if (!closed) allClosed = false;
  });
  
  return allClosed;
};

export const selectedNodeId = writable(null);
export const selectedEdgeId = writable(null);
export const hoveredNodeId = writable(null);

// Constellation animation mode
export const isAnimating = writable(false);

// Viewport state for pan/zoom
const storedViewBox = typeof localStorage !== 'undefined' ? localStorage.getItem('viewport-viewBox') : null;
const initialViewBox = storedViewBox ? JSON.parse(storedViewBox) : { x: 0, y: 0, width: 1000, height: 700 };
const storedZoom = typeof localStorage !== 'undefined' ? localStorage.getItem('viewport-zoom') : null;
const initialZoom = storedZoom ? parseFloat(storedZoom) : 1;

export const viewBox = writable(initialViewBox);
export const zoom = writable(initialZoom);

// Persist viewBox and zoom to localStorage
viewBox.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('viewport-viewBox', JSON.stringify(value));
  }
});

zoom.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('viewport-zoom', value.toString());
  }
});

// Helper functions
export const panBy = (dx, dy) => {
  viewBox.update(vb => ({
    ...vb,
    x: vb.x - dx,
    y: vb.y - dy
  }));
};

export const zoomTo = (level, centerX, centerY) => {
  // Clamp zoom between 0.1 and 5
  const clampedLevel = Math.max(0.1, Math.min(5, level));

  viewBox.update(vb => {
    // For zoom controls, we use a reference size
    // Zoom level 1.0 = standard viewport, zooming in = smaller viewBox, zooming out = larger viewBox
    const referenceWidth = 1000;
    const referenceHeight = 700;

    const newWidth = referenceWidth / clampedLevel;
    const newHeight = referenceHeight / clampedLevel;

    // Keep the center point stable
    const offsetX = centerX - vb.x;
    const offsetY = centerY - vb.y;

    const newX = centerX - (offsetX * newWidth) / vb.width;
    const newY = centerY - (offsetY * newHeight) / vb.height;

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    };
  });

  zoom.set(clampedLevel);
};

export const fitToNodes = (nodesArray, svgWidth, svgHeight) => {
  if (nodesArray.length === 0) {
    // Reset to default
    viewBox.set({ x: 0, y: 0, width: svgWidth, height: svgHeight });
    zoom.set(1);
    return;
  }

  const padding = 50;

  // Find bounding box of all nodes
  let minX = nodesArray[0].x;
  let maxX = nodesArray[0].x;
  let minY = nodesArray[0].y;
  let maxY = nodesArray[0].y;

  nodesArray.forEach(node => {
    minX = Math.min(minX, node.x - 24); // node radius is 24
    maxX = Math.max(maxX, node.x + 24);
    minY = Math.min(minY, node.y - 24);
    maxY = Math.max(maxY, node.y + 24);
  });

  // Add padding
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  const boundingWidth = maxX - minX;
  const boundingHeight = maxY - minY;

  // Calculate viewport that fits all nodes while maintaining aspect ratio
  const aspectRatio = svgWidth / svgHeight;
  const boundingAspect = boundingWidth / boundingHeight;

  let viewWidth, viewHeight;

  if (boundingAspect > aspectRatio) {
    // Bounding box is wider than viewport aspect ratio
    viewWidth = boundingWidth;
    viewHeight = boundingWidth / aspectRatio;
  } else {
    // Bounding box is taller than viewport aspect ratio
    viewHeight = boundingHeight;
    viewWidth = boundingHeight * aspectRatio;
  }

  viewBox.set({
    x: minX,
    y: minY,
    width: viewWidth,
    height: viewHeight
  });

  // Calculate zoom level: how much we scaled from the default
  // If everything fits in the default viewBox size, zoom is 1, otherwise it's < 1
  const zoomLevel = Math.max(0.1, Math.min(5, Math.min(svgWidth / viewWidth, svgHeight / viewHeight)));
  zoom.set(zoomLevel);
};
