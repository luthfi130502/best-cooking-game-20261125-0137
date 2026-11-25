// Ember & Thyme — Rush Hour Kitchen
// main.js — one job: run the game. The frame loop, the title / playing /
// over state machine, and the wiring between input, chef, orders and render.

import { VIEW_W, VIEW_H, SHIFT_SECONDS, MAX_STARS, INTERACT_RANGE } from './config.js';
import { createInput } from './input.js';
import { createChef, updateChef, updateCooking, interact, clickToWalk } from './chef.js';
import { createOrderBoard, updateOrders, isRushHour } from './orders.js';
import { createParticles, updateParticles, addFloater } from './particles.js';
import { drawGame } from './render.js';
import { stationById, nearestStation } from './world.js';
import { applyScene } from './demo.js';
import { unlockAudio, startMusic, stopMusic, setMuted, isMuted, sfx } from './audio.js';

// A small seeded RNG so a scene is the same every time it is staged.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
const rng = mulberry32(scene ? 1337 : (Date.now() % 2147483647));

function newGame() {
  const game = {
    state: 'title',
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    stars: MAX_STARS,
    bestCoins: 0,
    chef: createChef(),
    chopBoard: { item: null, chops: 0 },
    burners: stationById('stove').burners.map((b) => ({
      x: b.x, y: b.y, item: null, t: 0, total: 0, result: null,
      announced: false, burntAnnounced: false,
    })),
    plating: { plate: null },
    board: createOrderBoard(rng),
    particles: createParticles(),
    nearest: null,
  };
  return game;
}

let game = newGame();
let bestCoins = 0;
applyScene(game, scene);

// Surface any runtime error in the document title so a headless check
// can see it without a console.
window.addEventListener('error', (event) => {
  document.title = `GAME ERROR: ${event.message}`;
});

function startShift() {
  const keepBest = bestCoins;
  game = newGame();
  game.bestCoins = keepBest;
  game.state = 'playing';
  unlockAudio();
  startMusic();
  sfx.click();
}

function endShift() {
  game.state = 'over';
  bestCoins = Math.max(bestCoins, game.coins);
  game.bestCoins = bestCoins;
  stopMusic();
}

function update(dt) {
  game.time += dt;
  if (game.state === 'playing') {
    game.shiftLeft -= dt;
    updateChef(game, input, dt);
    updateCooking(game, dt);
    updateParticles(game.particles, dt);
    game.nearest = nearestStation(game.chef.x, game.chef.y, INTERACT_RANGE);

    const { events } = updateOrders(game.board, dt, game.shiftLeft);
    for (const event of events) {
      if (event === 'order-in') sfx.orderIn();
      if (event === 'rush') {
        sfx.rush();
        addFloater(game.particles, VIEW_W / 2, 170, 'RUSH HOUR!', '#ff6a55');
      }
      if (event === 'timeout') {
        game.failed += 1;
        game.stars -= 1;
        game.combo = 0;
        sfx.timeout();
        addFloater(game.particles, VIEW_W / 2, 170, 'Order timed out — a star is lost!', '#ff8a7a');
      }
    }

    if (game.shiftLeft <= 0 || game.stars <= 0) {
      game.shiftLeft = Math.max(0, game.shiftLeft);
      endShift();
    }
  } else {
    updateParticles(game.particles, dt);
  }
}

function handleInput() {
  if (input.takePressed('m')) {
    setMuted(!isMuted());
  }
  if (game.state === 'title') {
    if (input.takePressed('enter') || input.takeClick()) startShift();
    input.clearPressed();
    return;
  }
  if (game.state === 'over') {
    if (input.takePressed('r') || input.takeClick()) startShift();
    input.clearPressed();
    return;
  }
  // Playing.
  if (input.takePressed('e') || input.takePressed(' ')) interact(game);
  if (input.takePressed('enter')) {
    // Enter also works as interact, for players who prefer it.
    interact(game);
  }
  if (input.takeClick()) {
    unlockAudio();
    clickToWalk(game, input.mouseX, input.mouseY);
  }
  input.clearPressed();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleInput();
  update(dt);
  drawGame(ctx, game, game.time);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
