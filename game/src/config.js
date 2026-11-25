// Ember & Thyme — Rush Hour Kitchen
// config.js — one job: every tunable number and colour in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TOPBAR_H = 84; // order board strip at the top

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const MAX_STARS = 3;

export const CHEF_SPEED = 265; // px per second
export const CHEF_RADIUS = 24;
export const INTERACT_RANGE = 78; // how close the chef must stand to use a station

export const CHOPS_NEEDED = 3; // E-presses to finish chopping
export const BURN_AFTER_SECONDS = 5; // cooked food burns this long after done

// Order pacing: first order, then one every SPAWN_EVERY seconds; rush hour
// in the last RUSH_LAST_SECONDS of the shift spawns faster and patience drops.
export const FIRST_ORDER_AT = 2;
export const SPAWN_EVERY = 17;
export const RUSH_SPAWN_EVERY = 11;
export const RUSH_LAST_SECONDS = 45;
export const ORDER_PATIENCE = 82;
export const RUSH_PATIENCE = 64;

// Scoring.
export const TIP_MAX = 6; // bonus for serving with patience left
export const COMBO_BONUS_PER_LEVEL = 1;

export const PALETTE = {
  wall: '#4a2f1d',
  wallEdge: '#33200f',
  floorA: '#c98f4e',
  floorB: '#bd8143',
  floorLine: '#a86f36',
  counterTop: '#8a5a2e',
  counterSide: '#6e4520',
  counterEdge: '#e8c07a',
  steel: '#b9c2cc',
  steelDark: '#8d97a3',
  board: '#e9d3a3',
  boardDark: '#cbb27e',
  stove: '#3a3f46',
  burner: '#22262b',
  flame: '#ff9d2e',
  flameCore: '#ffd23e',
  serve: '#f2e7c9',
  trash: '#5c6650',
  plate: '#fbf7ee',
  plateRim: '#d8cdb4',
  ink: '#2b1a0e',
  cream: '#fff6e0',
  gold: '#ffc53d',
  red: '#e0523d',
  green: '#5da24a',
  orderTicket: '#fff8e2',
  orderTicketEdge: '#d9c48a',
  hudBg: 'rgba(28, 17, 8, 0.88)',
};

export const KEY_LABELS = {
  up: 'W / ↑', down: 'S / ↓', left: 'A / ←', right: 'D / →',
  interact: 'E / Space', mute: 'M', restart: 'R',
};
