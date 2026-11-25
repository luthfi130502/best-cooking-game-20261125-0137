// Ember & Thyme — Rush Hour Kitchen
// world.js — one job: the kitchen itself. Where every station sits,
// which walls are solid, and which station the chef is standing next to.

import { INGREDIENTS } from './data.js';

export const STATIONS = [];

// Top counter row, just under the order board.
STATIONS.push({
  id: 'chop', kind: 'chop', label: 'Chopping Board',
  hint: 'E: chop · place raw veg',
  rect: { x: 130, y: 92, w: 180, h: 64 },
});
STATIONS.push({
  id: 'stove', kind: 'stove', label: 'Stove',
  hint: 'E: cook · take when done',
  rect: { x: 330, y: 92, w: 230, h: 64 },
  burners: [
    { x: 392, y: 124, r: 26 },
    { x: 498, y: 124, r: 26 },
  ],
});
STATIONS.push({
  id: 'plating', kind: 'plating', label: 'Plating Counter',
  hint: 'E: place plate · add food',
  rect: { x: 580, y: 92, w: 250, h: 64 },
});
STATIONS.push({
  id: 'plates', kind: 'plates', label: 'Clean Plates',
  hint: 'E: take a plate',
  rect: { x: 850, y: 92, w: 110, h: 64 },
});
STATIONS.push({
  id: 'serve', kind: 'serve', label: 'Service Window',
  hint: 'E: serve the dish!',
  rect: { x: 980, y: 92, w: 292, h: 64 },
});

// Pantry bins down the left wall, one per ingredient.
const PANTRY_IDS = ['tomato', 'lettuce', 'onion', 'patty', 'bun', 'pasta', 'fish'];
PANTRY_IDS.forEach((id, i) => {
  STATIONS.push({
    id: `bin-${id}`, kind: 'bin', ingredient: id,
    label: INGREDIENTS[id].bin,
    hint: 'E: take',
    rect: { x: 8, y: 172 + i * 70, w: 92, h: 62 },
  });
});

// Trash bin, bottom right.
STATIONS.push({
  id: 'trash', kind: 'trash', label: 'Trash',
  hint: 'E: throw away',
  rect: { x: 1180, y: 624, w: 92, h: 72 },
});

// Decor that never collides: rugs, a potted plant, a wall clock.
export const DECOR = {
  rug: { x: 470, y: 380, w: 340, h: 190 },
  rug2: { x: 150, y: 600, w: 250, h: 84 },
  plant: { x: 30, y: 648, r: 26 },
  clock: { x: 640, y: 30 },
};

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

function rectsOverlapCircle(rect, x, y, r) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

export function collidesWithStation(x, y, r) {
  for (const s of STATIONS) {
    if (rectsOverlapCircle(s.rect, x, y, r)) return s;
  }
  return null;
}

export function stationCenter(station) {
  return {
    x: station.rect.x + station.rect.w / 2,
    y: station.rect.y + station.rect.h / 2,
  };
}

// The nearest station whose edge the chef can reach, or null.
export function nearestStation(x, y, range) {
  let best = null;
  let bestDist = Infinity;
  for (const s of STATIONS) {
    const cx = Math.max(s.rect.x, Math.min(x, s.rect.x + s.rect.w));
    const cy = Math.max(s.rect.y, Math.min(y, s.rect.y + s.rect.h));
    const d = Math.hypot(x - cx, y - cy);
    if (d < range && d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

// A point on the floor next to a station, for click-to-walk targets.
export function approachPoint(station) {
  const c = stationCenter(station);
  // Stand below the station (or to its right for left-wall bins).
  if (station.kind === 'bin') return { x: station.rect.x + station.rect.w + 44, y: c.y };
  if (station.id === 'trash') return { x: station.rect.x - 40, y: c.y };
  return { x: c.x, y: station.rect.y + station.rect.h + 44 };
}

export function stationAtPoint(x, y) {
  return STATIONS.find((s) => (
    x >= s.rect.x && x <= s.rect.x + s.rect.w &&
    y >= s.rect.y && y <= s.rect.y + s.rect.h
  )) || null;
}

// Clamp a point inside the walkable kitchen floor.
export function clampToFloor(x, y, r) {
  const minX = 8 + r;
  const maxX = 1272 - r;
  const minY = 92 + 64 + 6 + r; // below the top counter row
  const maxY = 712 - r;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}
