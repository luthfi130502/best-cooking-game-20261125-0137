// Ember & Thyme — Rush Hour Kitchen
// chef.js — one job: the chef. Moving around the kitchen, carrying one
// thing at a time, and every interaction with a station.

import {
  CHEF_SPEED, CHEF_RADIUS, INTERACT_RANGE, CHOPS_NEEDED,
  BURN_AFTER_SECONDS, VIEW_W, VIEW_H,
} from './config.js';
import {
  INGREDIENTS, SOUP_FROM, SOUP_COOK_TIME, makeItem, itemLabel,
  matchRecipe, itemKey,
} from './data.js';
import {
  STATIONS, stationById, collidesWithStation, nearestStation,
  approachPoint, stationCenter, clampToFloor,
} from './world.js';
import { sfx } from './audio.js';
import {
  spawnSteam, spawnChopBits, spawnSparkle, spawnPuff, addFloater,
} from './particles.js';
import { servePayout, removeOrder } from './orders.js';

export function createChef() {
  return {
    x: 640, y: 500, dirX: 0, dirY: 1,
    carrying: null, // an item, or a plate { id: 'plate', components: [] }
    moveTarget: null, // { x, y } from a mouse click
    targetStation: null, // station to use when the click-walk arrives
    bob: 0, moving: false,
  };
}

function cookTimeFor(item) {
  if (item.state === 'chopped' && item.id === SOUP_FROM) return SOUP_COOK_TIME;
  const def = INGREDIENTS[item.id];
  return def && def.cookable ? def.cookTime : 0;
}

function cookResultFor(item) {
  if (item.state === 'chopped' && item.id === SOUP_FROM) return 'soup';
  const def = INGREDIENTS[item.id];
  return def && def.cookable ? def.cookResult : null;
}

function canCook(item) {
  if (!item || item.id === 'plate') return false;
  if (item.state === 'raw') return !!INGREDIENTS[item.id].cookable;
  if (item.state === 'chopped' && item.id === SOUP_FROM) return true;
  return false;
}

export function updateChef(game, input, dt) {
  const chef = game.chef;
  let mx = 0;
  let my = 0;
  if (input.isDown('w', 'arrowup')) my -= 1;
  if (input.isDown('s', 'arrowdown')) my += 1;
  if (input.isDown('a', 'arrowleft')) mx -= 1;
  if (input.isDown('d', 'arrowright')) mx += 1;

  if (mx !== 0 || my !== 0) {
    // Keyboard steering cancels any click-to-walk.
    chef.moveTarget = null;
    chef.targetStation = null;
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
  } else if (chef.moveTarget) {
    const dx = chef.moveTarget.x - chef.x;
    const dy = chef.moveTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      chef.moveTarget = null;
      if (chef.targetStation) {
        const station = chef.targetStation;
        chef.targetStation = null;
        interactWith(game, station);
      }
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }

  chef.moving = mx !== 0 || my !== 0;
  if (chef.moving) {
    chef.dirX = mx;
    chef.dirY = my;
    chef.bob += dt * 11;
    const step = CHEF_SPEED * dt;
    const nx = chef.x + mx * step;
    if (!collidesWithStation(nx, chef.y, CHEF_RADIUS)) chef.x = nx;
    const ny = chef.y + my * step;
    if (!collidesWithStation(chef.x, ny, CHEF_RADIUS)) chef.y = ny;
    const clamped = clampToFloor(chef.x, chef.y, CHEF_RADIUS);
    chef.x = clamped.x;
    chef.y = clamped.y;
  }
}

// A mouse click on the floor walks there; a click on a station walks to it
// and uses it on arrival.
export function clickToWalk(game, x, y) {
  const chef = game.chef;
  const station = STATIONS.find((s) => (
    x >= s.rect.x && x <= s.rect.x + s.rect.w &&
    y >= s.rect.y && y <= s.rect.y + s.rect.h
  ));
  if (station) {
    chef.moveTarget = approachPoint(station);
    chef.targetStation = station;
  } else {
    const clamped = clampToFloor(x, y, CHEF_RADIUS);
    chef.moveTarget = clamped;
    chef.targetStation = null;
  }
}

export function interact(game) {
  const chef = game.chef;
  const station = nearestStation(chef.x, chef.y, INTERACT_RANGE);
  if (!station) return;
  interactWith(game, station);
}

function interactWith(game, station) {
  const chef = game.chef;
  switch (station.kind) {
    case 'bin': {
      if (chef.carrying) return;
      chef.carrying = makeItem(station.ingredient, 'raw');
      sfx.pickup();
      break;
    }
    case 'plates': {
      if (chef.carrying) return;
      chef.carrying = { id: 'plate', components: [] };
      sfx.pickup();
      break;
    }
    case 'chop': {
      const board = game.chopBoard;
      if (!board.item && chef.carrying && chef.carrying.id !== 'plate'
          && chef.carrying.state === 'raw' && INGREDIENTS[chef.carrying.id].choppable) {
        board.item = chef.carrying;
        board.chops = 0;
        chef.carrying = null;
        sfx.drop();
      } else if (board.item && board.item.state === 'raw') {
        board.chops += 1;
        const c = stationCenter(station);
        spawnChopBits(game.particles, c.x, c.y + 6, INGREDIENTS[board.item.id].rawColor);
        if (board.chops >= CHOPS_NEEDED) {
          board.item.state = 'chopped';
          sfx.chopDone();
          addFloater(game.particles, c.x, c.y - 24, 'Chopped!', '#8fd06a');
        } else {
          sfx.chop();
        }
      } else if (board.item && board.item.state === 'chopped' && !chef.carrying) {
        chef.carrying = board.item;
        board.item = null;
        board.chops = 0;
        sfx.pickup();
      }
      break;
    }
    case 'stove': {
      // Use whichever burner the chef is closest to.
      let burner = null;
      let best = Infinity;
      for (const b of game.burners) {
        const d = Math.hypot(chef.x - b.x, chef.y - b.y);
        if (d < best) { best = d; burner = b; }
      }
      if (!burner) break;
      if (!burner.item && chef.carrying && canCook(chef.carrying)) {
        burner.item = chef.carrying;
        burner.t = 0;
        // Freeze the cook time and result at placement: once the food
        // changes state (raw -> cooked, chopped -> soup) the helpers
        // below would answer differently.
        burner.total = cookTimeFor(chef.carrying);
        burner.result = cookResultFor(chef.carrying);
        burner.announced = false;
        burner.burntAnnounced = false;
        chef.carrying = null;
        sfx.sizzle();
      } else if (burner.item && !chef.carrying) {
        if (burner.t >= burner.total) {
          if (burner.t >= burner.total + BURN_AFTER_SECONDS) {
            burner.item.state = 'burnt';
          } else {
            burner.item.state = burner.result;
          }
          chef.carrying = burner.item;
          burner.item = null;
          burner.t = 0;
          sfx.pickup();
        }
      }
      break;
    }
    case 'plating': {
      const counter = game.plating;
      if (chef.carrying && chef.carrying.id === 'plate' && !counter.plate) {
        counter.plate = chef.carrying;
        chef.carrying = null;
        sfx.drop();
      } else if (counter.plate && chef.carrying && chef.carrying.id !== 'plate'
          && counter.plate.components.length < 3) {
        counter.plate.components.push(chef.carrying);
        chef.carrying = null;
        sfx.drop();
      } else if (!chef.carrying && counter.plate) {
        chef.carrying = counter.plate;
        counter.plate = null;
        sfx.pickup();
      }
      break;
    }
    case 'serve': {
      if (!chef.carrying || chef.carrying.id !== 'plate') break;
      const plate = chef.carrying;
      const recipe = matchRecipe(plate);
      const c = stationCenter(station);
      if (!recipe) {
        game.combo = 0;
        sfx.wrong();
        addFloater(game.particles, c.x, c.y + 60, 'No order wants this dish!', '#ff8a7a');
        break;
      }
      const order = game.board.orders.find((o) => o.recipe.id === recipe.id);
      if (!order) {
        game.combo = 0;
        sfx.wrong();
        addFloater(game.particles, c.x, c.y + 60, `No one ordered ${recipe.name}!`, '#ff8a7a');
        break;
      }
      game.combo += 1;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      const pay = servePayout(order, game.combo - 1);
      game.coins += pay.earned;
      game.served += 1;
      removeOrder(game.board, order.id);
      chef.carrying = null;
      spawnSparkle(game.particles, c.x, c.y + 30, 16);
      addFloater(game.particles, c.x, c.y + 60, `+$${pay.earned}`, '#ffc53d');
      if (game.combo >= 2) {
        addFloater(game.particles, c.x, c.y + 88, `Combo x${game.combo}!`, '#ffd23e');
      }
      sfx.serve();
      sfx.coin();
      break;
    }
    case 'trash': {
      if (!chef.carrying) break;
      const c = stationCenter(station);
      spawnPuff(game.particles, c.x, c.y, '#5c6650');
      chef.carrying = null;
      sfx.drop();
      break;
    }
    default:
      break;
  }
}

// Advance both burners: cooking progress, steam, done/burnt announcements.
export function updateCooking(game, dt) {
  for (const burner of game.burners) {
    if (!burner.item) continue;
    burner.t += dt;
    const total = burner.total;
    if (burner.t < total) {
      if (Math.random() < dt * 6) spawnSteam(game.particles, burner.x, burner.y - 8, 1);
    } else if (!burner.announced) {
      burner.announced = true;
      burner.item.state = burner.result;
      spawnSparkle(game.particles, burner.x, burner.y - 10, 6);
      sfx.cooked();
    } else if (burner.t >= total + BURN_AFTER_SECONDS && !burner.burntAnnounced) {
      burner.burntAnnounced = true;
      sfx.burnt();
      addFloater(game.particles, burner.x, burner.y - 34, 'Burnt!', '#ff8a7a');
    }
  }
}
