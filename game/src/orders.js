// Ember & Thyme — Rush Hour Kitchen
// orders.js — one job: the order board. Spawning tickets, draining
// patience, and paying out when a dish is served.

import {
  FIRST_ORDER_AT, SPAWN_EVERY, RUSH_SPAWN_EVERY, RUSH_LAST_SECONDS,
  ORDER_PATIENCE, RUSH_PATIENCE, MAX_ORDERS, TIP_MAX, COMBO_BONUS_PER_LEVEL,
} from './config.js';
import { randomRecipe } from './data.js';

export function createOrderBoard(rng) {
  return {
    rng,
    orders: [], // { id, recipe, patience, maxPatience }
    nextId: 1,
    spawnIn: FIRST_ORDER_AT,
    rushAnnounced: false,
  };
}

export function isRushHour(shiftLeft) {
  return shiftLeft <= RUSH_LAST_SECONDS;
}

// Advance the board one frame. Returns events: 'order-in', 'timeout', 'rush'.
export function updateOrders(board, dt, shiftLeft) {
  const events = [];
  const rush = isRushHour(shiftLeft);
  if (rush && !board.rushAnnounced) {
    board.rushAnnounced = true;
    events.push('rush');
  }

  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_ORDERS) {
    const patience = rush ? RUSH_PATIENCE : ORDER_PATIENCE;
    board.orders.push({
      id: board.nextId++,
      recipe: randomRecipe(board.rng),
      patience,
      maxPatience: patience,
    });
    board.spawnIn = rush ? RUSH_SPAWN_EVERY : SPAWN_EVERY;
    events.push('order-in');
  } else if (board.spawnIn <= 0) {
    board.spawnIn = 2; // board full: check again shortly
  }

  for (const order of board.orders) {
    order.patience -= dt;
  }
  const timedOut = board.orders.filter((o) => o.patience <= 0);
  if (timedOut.length > 0) {
    board.orders = board.orders.filter((o) => o.patience > 0);
    events.push('timeout');
  }
  return { events, timedOut };
}

// Pay for a served order. Returns { earned, tip, combo }.
export function servePayout(order, combo) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(frac * TIP_MAX);
  const comboBonus = combo * COMBO_BONUS_PER_LEVEL;
  const earned = order.recipe.price + tip + comboBonus;
  return { earned, tip, comboBonus };
}

export function removeOrder(board, orderId) {
  board.orders = board.orders.filter((o) => o.id !== orderId);
}
