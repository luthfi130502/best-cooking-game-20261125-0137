// Ember & Thyme — Rush Hour Kitchen
// demo.js — one job: stage a scene for screenshots. A `?scene=` URL
// parameter pre-seeds a real game state (orders on the board, a dish
// mid-assembly, food on the stove) so the screenshots are honest renders
// of the game itself, just at a chosen moment. No other code path uses it.

import { RECIPES, makeItem } from './data.js';

function orderFor(recipeId, patience, maxPatience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id: Math.floor(Math.random() * 1000) + 1, recipe, patience, maxPatience };
}

export function applyScene(game, scene) {
  if (!scene) return;
  if (scene === 'play') {
    // Mid-shift: three tickets, a burger mid-assembly on the plating
    // counter, a patty on the stove, a chopped tomato on the board,
    // and the chef carrying chopped lettuce toward the plate.
    game.state = 'playing';
    game.shiftLeft = 135;
    game.coins = 34;
    game.combo = 2;
    game.bestCombo = 3;
    game.served = 4;
    game.board.orders = [
      orderFor('salad', 55, 82),
      orderFor('burger', 40, 82),
      orderFor('pasta', 20, 82),
    ];
    game.board.spawnIn = 9;
    game.chopBoard.item = makeItem('tomato', 'chopped');
    game.chopBoard.chops = 3;
    const [b1, b2] = game.burners;
    b1.item = makeItem('patty', 'raw');
    b1.t = 4;
    b1.total = 6;
    b1.result = 'cooked';
    b2.item = makeItem('fish', 'cooked');
    b2.t = 7;
    b2.total = 7;
    b2.result = 'cooked';
    b2.announced = true;
    game.plating.plate = {
      id: 'plate',
      components: [makeItem('bun', 'raw'), makeItem('patty', 'cooked')],
    };
    game.chef.x = 700;
    game.chef.y = 300;
    game.chef.dirX = 0;
    game.chef.dirY = -1;
    game.chef.carrying = makeItem('lettuce', 'chopped');
  } else if (scene === 'rush') {
    // Final seconds: rush hour, tickets nearly out of patience, the chef
    // rushing a finished salad to the service window.
    game.state = 'playing';
    game.shiftLeft = 28;
    game.coins = 96;
    game.combo = 4;
    game.bestCombo = 4;
    game.served = 8;
    game.failed = 1;
    game.stars = 2;
    game.board.orders = [
      orderFor('salad', 12, 64),
      orderFor('fish', 22, 64),
      orderFor('soup', 44, 64),
    ];
    game.board.spawnIn = 4;
    game.board.rushAnnounced = true;
    const [b1, b2] = game.burners;
    b1.item = makeItem('patty', 'burnt');
    b1.t = 12;
    b1.total = 6;
    b1.result = 'cooked';
    b1.announced = true;
    b1.burntAnnounced = true;
    game.chopBoard.item = makeItem('onion', 'chopped');
    game.chopBoard.chops = 3;
    game.plating.plate = null;
    game.chef.x = 1050;
    game.chef.y = 260;
    game.chef.dirX = 1;
    game.chef.dirY = -1;
    game.chef.carrying = {
      id: 'plate',
      components: [makeItem('lettuce', 'chopped'), makeItem('tomato', 'chopped')],
    };
  } else if (scene === 'end') {
    // The shift is over: the results screen over a busy kitchen.
    game.state = 'over';
    game.shiftLeft = 0;
    game.coins = 128;
    game.served = 9;
    game.failed = 1;
    game.bestCombo = 4;
    game.stars = 2;
    game.board.orders = [orderFor('burger', 30, 82)];
  }
  // 'start' (or anything else) leaves the title screen as it is.
}
