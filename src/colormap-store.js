import { writable } from 'svelte/store';

// Colormap definitions - each cmap has at least 6 base colors
const colormaps = {
  default: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
  ocean: ['#006994', '#0a8fc7', '#2ab0da', '#4dc9e8', '#7dd7f0', '#a8e5f8'],
  warm: ['#dc2626', '#f97316', '#fbbf24', '#fcd34d', '#fde047', '#fef08a'],
  pastel: ['#fda4af', '#fbcfe8', '#f5d4e6', '#d8b4fe', '#c4b5fd', '#a5f3fc'],
  neon: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5']
};

// Retrieve stored cmap preference if available
const storedCmap = typeof localStorage !== 'undefined' ? localStorage.getItem('selected-colormap') : null;

// Writable stores
export const currentCmap = writable(storedCmap || 'default');
export const colorRange = writable(5);

// Subscribe to cmap changes and persist to localStorage
currentCmap.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('selected-colormap', value);
  }
});

// Helper function to interpolate colors in HSL space
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    case b:
      h = (r - g) / d + 4;
      break;
  }
  h /= 6;

  return { h, s, l };
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;

  let r, g, b;
  if (h < 1 / 6) {
    r = c; g = x; b = 0;
  } else if (h < 2 / 6) {
    r = x; g = c; b = 0;
  } else if (h < 3 / 6) {
    r = 0; g = c; b = x;
  } else if (h < 4 / 6) {
    r = 0; g = x; b = c;
  } else if (h < 5 / 6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val) => Math.round((val + m) * 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Get swatch color for a specific palette by name (for palette preview)
export function getSwatchColor(cmapName, index) {
  const cmap = colormaps[cmapName] || colormaps.default;
  return cmap[Math.min(index, cmap.length - 1)];
}

// Get a color for a node based on its degree (number of connections)
// Pass cmapName explicitly so Svelte reactivity works via $currentCmap
export function getNodeColorByDegree(degree, maxDegree, cmapName) {
  const cmap = colormaps[cmapName] || colormaps.default;

  if (maxDegree === 0) return cmap[0];

  // Normalize degree to [0, 1]
  const t = degree / maxDegree;

  // Map t across the full colormap range
  const position = t * (cmap.length - 1);
  const lowerIdx = Math.floor(position);
  const upperIdx = Math.ceil(position);
  const fraction = position - lowerIdx;

  const lowerColor = cmap[lowerIdx];
  const upperColor = cmap[Math.min(upperIdx, cmap.length - 1)];

  if (lowerIdx === upperIdx || fraction === 0) {
    return lowerColor;
  }

  const hsl1 = hexToHsl(lowerColor);
  const hsl2 = hexToHsl(upperColor);

  const h = hsl1.h + (hsl2.h - hsl1.h) * fraction;
  const s = hsl1.s + (hsl2.s - hsl1.s) * fraction;
  const l = hsl1.l + (hsl2.l - hsl1.l) * fraction;

  return hslToHex(h, s, l);
}

// Set the current colormap
export function setCmap(name) {
  if (colormaps[name]) {
    currentCmap.set(name);
  }
}

// Get list of available colormaps
export function getAvailableCmaps() {
  return Object.keys(colormaps);
}
