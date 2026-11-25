// Ember & Thyme — Rush Hour Kitchen
// render.js — one job: everything you see. The kitchen, the food, the chef,
// the order board, the timer and the title/end screens, all drawn on canvas.

import { VIEW_W, VIEW_H, TOPBAR_H, PALETTE, SHIFT_SECONDS } from './config.js';
import { INGREDIENTS, RECIPES, itemLabel, plateCouldStillMatch } from './data.js';
import { STATIONS, DECOR, stationById, nearestStation } from './world.js';
import { drawParticles } from './particles.js';
import { isRushHour } from './orders.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function textOutline(ctx, str, x, y, size, color, outline, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------------------
// Food icons: every ingredient, drawn so it reads at 20 px and at 60 px.
// ---------------------------------------------------------------------------

export function drawItemIcon(ctx, item, x, y, size) {
  if (!item) return;
  if (item.id === 'plate') {
    drawPlate(ctx, item, x, y, size);
    return;
  }
  const def = INGREDIENTS[item.id];
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (item.state === 'burnt') {
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3826';
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.08, s * 0.16, 0, Math.PI * 2);
    ctx.arc(s * 0.14, s * 0.1, s * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  switch (item.id) {
    case 'tomato': {
      if (item.state === 'soup') {
        // A little bowl of steaming soup.
        ctx.fillStyle = '#7a4a22';
        ctx.beginPath();
        ctx.arc(0, s * 0.08, s * 0.42, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#e0523d';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.02, s * 0.4, s * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff8a7a';
        ctx.beginPath();
        ctx.ellipse(-s * 0.1, -s * 0.02, s * 0.12, s * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      if (item.state === 'chopped') {
        ctx.fillStyle = '#e0523d';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.arc(i * s * 0.26, (i % 2) * s * 0.1, s * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ff8a7a';
        ctx.beginPath();
        ctx.arc(-s * 0.26, 0, s * 0.07, 0, Math.PI * 2);
        ctx.arc(s * 0.26, s * 0.1, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      ctx.fillStyle = def.rawColor;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.leaf;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.28);
      ctx.lineTo(s * 0.16, -s * 0.08);
      ctx.lineTo(-s * 0.16, -s * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.1, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lettuce': {
      if (item.state === 'chopped') {
        ctx.strokeStyle = '#7cc24f';
        ctx.lineWidth = s * 0.09;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const yy = -s * 0.24 + i * s * 0.13;
          ctx.beginPath();
          ctx.moveTo(-s * 0.3, yy);
          ctx.lineTo(s * 0.3, yy + s * 0.05);
          ctx.stroke();
        }
        break;
      }
      ctx.fillStyle = def.rawDark;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.rawColor;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = def.leaf;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'onion': {
      if (item.state === 'chopped') {
        ctx.strokeStyle = '#e8dcf2';
        ctx.lineWidth = s * 0.08;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, s * (0.14 + i * 0.11), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = def.rawColor;
        ctx.lineWidth = s * 0.05;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      ctx.fillStyle = def.rawColor;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.leaf;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.rawDark;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.11, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'patty': {
      const cooked = item.state === 'cooked';
      ctx.fillStyle = cooked ? '#6e3b1e' : def.rawColor;
      rr(ctx, -s * 0.42, -s * 0.26, s * 0.84, s * 0.52, s * 0.2);
      ctx.fill();
      if (cooked) {
        ctx.strokeStyle = '#3d1f0e';
        ctx.lineWidth = s * 0.06;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * s * 0.2 - s * 0.1, -s * 0.22);
          ctx.lineTo(i * s * 0.2 + s * 0.1, s * 0.22);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(-s * 0.18, -s * 0.08, s * 0.07, 0, Math.PI * 2);
        ctx.arc(s * 0.12, s * 0.08, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'bun': {
      ctx.fillStyle = def.rawDark;
      rr(ctx, -s * 0.42, -s * 0.1, s * 0.84, s * 0.34, s * 0.14);
      ctx.fill();
      ctx.fillStyle = def.rawColor;
      ctx.beginPath();
      ctx.arc(0, -s * 0.06, s * 0.42, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff3cf';
      for (const [dx, dy] of [[-0.2, -0.28], [0.05, -0.36], [0.24, -0.22]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.045, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'pasta': {
      if (item.state === 'cooked') {
        ctx.fillStyle = '#f2c94c';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.06, s * 0.42, s * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e0523d';
        for (const [dx, dy] of [[-0.16, -0.02], [0.1, 0.08], [0.22, -0.06]]) {
          ctx.beginPath();
          ctx.arc(dx * s, dy * s, s * 0.07, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      ctx.strokeStyle = def.rawColor;
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, s * (0.16 + i * 0.11), 0.3, Math.PI * 2 - 0.3);
        ctx.stroke();
      }
      break;
    }
    case 'fish': {
      const cooked = item.state === 'cooked';
      ctx.fillStyle = cooked ? '#d89a4a' : def.rawColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.4, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, 0);
      ctx.lineTo(-s * 0.58, -s * 0.2);
      ctx.lineTo(-s * 0.58, s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cooked ? '#8a5a1e' : def.rawDark;
      ctx.beginPath();
      ctx.arc(s * 0.2, -s * 0.03, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
      if (cooked) {
        ctx.strokeStyle = '#8a5a1e';
        ctx.lineWidth = s * 0.05;
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, -s * 0.14);
        ctx.lineTo(s * 0.05, s * 0.14);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// A plate with its components arranged on top.
export function drawPlate(ctx, plate, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.1, s * 0.46, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.46, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plateRim;
  ctx.lineWidth = 2;
  ctx.stroke();
  const comps = plate.components || [];
  const spots = [[-0.18, -0.04], [0.18, -0.04], [0, 0.08]];
  comps.forEach((comp, i) => {
    const [dx, dy] = spots[i % spots.length];
    drawItemIcon(ctx, comp, dx * s, dy * s, s * 0.52);
  });
  ctx.restore();
}

// A tiny ingredient chip used inside order tickets.
function drawMiniIcon(ctx, item, x, y, size) {
  drawItemIcon(ctx, item, x, y, size);
}

// ---------------------------------------------------------------------------
// The kitchen floor and stations.
// ---------------------------------------------------------------------------

function drawFloor(ctx, time) {
  // Checkerboard tile floor.
  const tile = 64;
  for (let ty = 0; ty < 12; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * tile, TOPBAR_H + ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  for (let tx = 0; tx <= 20; tx++) {
    ctx.beginPath();
    ctx.moveTo(tx * tile, TOPBAR_H);
    ctx.lineTo(tx * tile, VIEW_H);
    ctx.stroke();
  }
  for (let ty = 0; ty <= 12; ty++) {
    ctx.beginPath();
    ctx.moveTo(0, TOPBAR_H + ty * tile);
    ctx.lineTo(VIEW_W, TOPBAR_H + ty * tile);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Rug in the middle of the room.
  const rug = DECOR.rug;
  ctx.fillStyle = '#a34a3a';
  rr(ctx, rug.x, rug.y, rug.w, rug.h, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8c07a';
  ctx.lineWidth = 3;
  rr(ctx, rug.x + 12, rug.y + 12, rug.w - 24, rug.h - 24, 12);
  ctx.stroke();
  ctx.fillStyle = '#c96f5a';
  ctx.beginPath();
  ctx.ellipse(rug.x + rug.w / 2, rug.y + rug.h / 2, 52, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // A smaller runner rug near the pantry, same weave, cooler tone.
  const rug2 = DECOR.rug2;
  ctx.fillStyle = '#3f6a5e';
  rr(ctx, rug2.x, rug2.y, rug2.w, rug2.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#e8c07a';
  ctx.lineWidth = 2;
  rr(ctx, rug2.x + 9, rug2.y + 9, rug2.w - 18, rug2.h - 18, 9);
  ctx.stroke();

  // Potted plant, bottom left.
  ctx.fillStyle = '#5da24a';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.45;
    ctx.beginPath();
    ctx.ellipse(
      DECOR.plant.x + Math.cos(a) * 16, DECOR.plant.y - 18 + Math.sin(a) * 10,
      9, 18, a + Math.PI / 2, 0, Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = '#b5651d';
  rr(ctx, DECOR.plant.x - 18, DECOR.plant.y - 4, 36, 26, 5);
  ctx.fill();
}

function drawCounterBase(ctx, rect, topColor = PALETTE.counterTop) {
  ctx.fillStyle = PALETTE.counterSide;
  rr(ctx, rect.x, rect.y + 6, rect.w, rect.h, 8);
  ctx.fill();
  ctx.fillStyle = topColor;
  rr(ctx, rect.x, rect.y, rect.w, rect.h - 6, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.counterEdge;
  ctx.lineWidth = 2;
  rr(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 10, 6);
  ctx.stroke();
}

function drawStation(ctx, game, station, time) {
  const r = station.rect;
  const near = game.nearest === station;
  if (near) {
    // Pulsing gold outline on the station the chef can use.
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 6);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    rr(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 10);
    ctx.stroke();
    ctx.restore();
  }
  switch (station.kind) {
    case 'bin': {
      drawCounterBase(ctx, r, '#7a4a22');
      const def = INGREDIENTS[station.ingredient];
      drawItemIcon(ctx, { id: station.ingredient, state: 'raw' }, r.x + r.w / 2, r.y + 24, 30);
      text(ctx, def.bin, r.x + r.w / 2, r.y + r.h - 10, 12, PALETTE.cream);
      break;
    }
    case 'chop': {
      drawCounterBase(ctx, r, PALETTE.board);
      // The board itself.
      ctx.fillStyle = PALETTE.boardDark;
      rr(ctx, r.x + 18, r.y + 12, r.w - 36, r.h - 24, 6);
      ctx.fill();
      const board = game.chopBoard;
      if (board.item) {
        drawItemIcon(ctx, board.item, r.x + r.w / 2, r.y + r.h / 2 - 2, 44);
        if (board.item.state === 'raw') {
          // Chop progress pips.
          for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < board.chops ? PALETTE.green : 'rgba(43,26,14,0.3)';
            ctx.beginPath();
            ctx.arc(r.x + r.w / 2 - 18 + i * 18, r.y + r.h - 10, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        text(ctx, 'CHOP', r.x + r.w / 2, r.y + r.h / 2, 15, '#8a6a42');
      }
      break;
    }
    case 'stove': {
      ctx.fillStyle = PALETTE.stove;
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#20242a';
      ctx.lineWidth = 2;
      rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 6);
      ctx.stroke();
      for (const burner of game.burners) {
        const b = station.burners.find((bb) => bb.x === burner.x && bb.y === burner.y);
        const bx = b ? b.x : burner.x;
        const by = b ? b.y : burner.y;
        ctx.fillStyle = PALETTE.burner;
        ctx.beginPath();
        ctx.arc(bx, by, 26, 0, Math.PI * 2);
        ctx.fill();
        if (burner.item) {
          const total = burner.total || 1;
          const frac = Math.min(1, burner.t / total);
          const burnt = burner.t >= total + 5;
          // Flame ring while cooking.
          if (burner.t < total) {
            ctx.save();
            ctx.globalAlpha = 0.75 + 0.25 * Math.sin(time * 10 + bx);
            ctx.strokeStyle = PALETTE.flame;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(bx, by, 28 + Math.sin(time * 9 + bx) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          drawItemIcon(ctx, burner.item, bx, by - 2, 40);
          // Progress ring.
          ctx.strokeStyle = burnt ? PALETTE.red : (frac >= 1 ? PALETTE.green : PALETTE.gold);
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(bx, by, 30, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
          // A small badge when the food is done (green tick) or burnt (red cross).
          if (frac >= 1) {
            ctx.fillStyle = burnt ? PALETTE.red : PALETTE.green;
            ctx.beginPath();
            ctx.arc(bx + 22, by - 22, 10, 0, Math.PI * 2);
            ctx.fill();
            text(ctx, burnt ? '✕' : '✓', bx + 22, by - 21, 12, '#ffffff');
          }
        } else {
          ctx.strokeStyle = '#565e68';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bx, by, 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    case 'plating': {
      drawCounterBase(ctx, r, '#e8d9b0');
      if (game.plating.plate) {
        const ok = plateCouldStillMatch(game.plating.plate);
        drawPlate(ctx, game.plating.plate, r.x + r.w / 2, r.y + r.h / 2 + 2, 74);
        if (game.plating.plate.components.length > 0) {
          // Green tick when the plate can still become a real recipe,
          // red cross when it cannot — glanceable from across the kitchen.
          ctx.fillStyle = ok ? PALETTE.green : PALETTE.red;
          ctx.beginPath();
          ctx.arc(r.x + r.w - 16, r.y + 16, 10, 0, Math.PI * 2);
          ctx.fill();
          text(ctx, ok ? '✓' : '✕', r.x + r.w - 16, r.y + 17, 12, '#ffffff');
        }
      } else {
        text(ctx, 'PLATE HERE', r.x + r.w / 2, r.y + r.h / 2, 14, '#8a6a42');
      }
      break;
    }
    case 'plates': {
      drawCounterBase(ctx, r, PALETTE.steel);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = PALETTE.plate;
        ctx.beginPath();
        ctx.ellipse(r.x + r.w / 2, r.y + 18 + i * 7, 30, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.plateRim;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      text(ctx, 'PLATES', r.x + r.w / 2, r.y + r.h - 8, 11, PALETTE.ink);
      break;
    }
    case 'serve': {
      // Service window: warm lit pass with a bell.
      ctx.fillStyle = '#3d2a18';
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.serve;
      rr(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 16, 6);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(r.x + 34, r.y + r.h / 2 - 4, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(r.x + 22, r.y + r.h / 2 - 4, 24, 4);
      text(ctx, 'SERVE', r.x + r.w / 2 + 14, r.y + 26, 22, '#7a4a22');
      text(ctx, 'ring the bell, hero', r.x + r.w / 2 + 14, r.y + 48, 10, '#a3804a');
      break;
    }
    case 'trash': {
      ctx.fillStyle = PALETTE.trash;
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#3f4a34';
      ctx.lineWidth = 2;
      rr(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 6);
      ctx.stroke();
      ctx.fillStyle = '#dfe8d2';
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + 26, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.trash;
      ctx.fillRect(r.x + r.w / 2 - 12, r.y + 20, 24, 6);
      text(ctx, 'TRASH', r.x + r.w / 2, r.y + r.h - 10, 12, '#dfe8d2');
      break;
    }
    default:
      break;
  }
  // Station label under the counter.
  if (station.kind !== 'bin') {
    text(ctx, station.label.toUpperCase(), r.x + r.w / 2, r.y + r.h + 14, 11, 'rgba(255,246,224,0.75)');
  }
}

// ---------------------------------------------------------------------------
// The chef.
// ---------------------------------------------------------------------------

function drawChef(ctx, game, time) {
  const chef = game.chef;
  const bob = chef.moving ? Math.sin(chef.bob) * 3 : Math.sin(time * 2) * 1;
  const x = chef.x;
  const y = chef.y + bob * 0.4;

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 22, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet.
  const step = chef.moving ? Math.sin(chef.bob) * 6 : 0;
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.ellipse(x - 9, chef.y + 18 + step * 0.4, 7, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 9, chef.y + 18 - step * 0.4, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: shirt + apron.
  ctx.fillStyle = '#e0523d';
  rr(ctx, x - 17, y - 8, 34, 30, 12);
  ctx.fill();
  ctx.fillStyle = '#fbf7ee';
  rr(ctx, x - 13, y - 4, 26, 24, 8);
  ctx.fill();
  ctx.fillStyle = '#e0523d';
  ctx.fillRect(x - 13, y + 8, 26, 4);

  // Arms.
  ctx.strokeStyle = '#e0523d';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const reach = chef.carrying ? -6 : 0;
  ctx.beginPath();
  ctx.moveTo(x - 15, y + 2);
  ctx.lineTo(x - 22, y + 14 + reach);
  ctx.moveTo(x + 15, y + 2);
  ctx.lineTo(x + 22, y + 14 + reach);
  ctx.stroke();

  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(x, y - 20, 14, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look where the chef walks.
  const ex = chef.dirX * 3;
  const ey = chef.dirY * 2;
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.arc(x - 5 + ex, y - 21 + ey, 2, 0, Math.PI * 2);
  ctx.arc(x + 5 + ex, y - 21 + ey, 2, 0, Math.PI * 2);
  ctx.fill();

  // Toque.
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 13, y - 40, 26, 12, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 9, y - 40, 7, 0, Math.PI * 2);
  ctx.arc(x, y - 43, 8, 0, Math.PI * 2);
  ctx.arc(x + 9, y - 40, 7, 0, Math.PI * 2);
  ctx.fill();

  // Carried item floats above the toque.
  if (chef.carrying) {
    const cy = y - 58 + Math.sin(time * 3) * 2;
    drawItemIcon(ctx, chef.carrying, x, cy, 44);
  }
}

// ---------------------------------------------------------------------------
// Order board, HUD, hints.
// ---------------------------------------------------------------------------

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawOrderTicket(ctx, order, x, y, w, h, time) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = order.patience < 18;
  const shake = urgent ? Math.sin(time * 18) * 2 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = urgent && Math.sin(time * 8) > 0 ? '#ffe3de' : PALETTE.orderTicket;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.red : PALETTE.orderTicketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();

  text(ctx, order.recipe.name, x + 10, y + 13, 14, PALETTE.ink, 'left');
  text(ctx, `$${order.recipe.price}`, x + w - 8, y + 13, 14, '#7a4a22', 'right');
  // Component icons.
  let cx = x + 16;
  for (const key of order.recipe.components) {
    const [id, state] = key.split(':');
    drawItemIcon(ctx, { id, state }, cx, y + 36, 26);
    cx += 30;
  }
  // Patience bar.
  const barX = x + 10;
  const barY = y + h - 12;
  const barW = w - 20;
  ctx.fillStyle = 'rgba(43,26,14,0.2)';
  rr(ctx, barX, barY, barW, 7, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
  if (frac > 0) {
    rr(ctx, barX, barY, barW * frac, 7, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawTopBar(ctx, game, time) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, VIEW_W, TOPBAR_H);
  ctx.fillStyle = PALETTE.wallEdge;
  ctx.fillRect(0, TOPBAR_H - 4, VIEW_W, 4);

  // Logo.
  text(ctx, 'EMBER & THYME', 16, 26, 21, PALETTE.gold, 'left');
  text(ctx, 'RUSH HOUR KITCHEN', 16, 52, 12, 'rgba(255,246,224,0.7)', 'left');

  // Order tickets.
  const ticketW = 208;
  const gap = 10;
  const startX = 236;
  game.board.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, startX + i * (ticketW + gap), 8, ticketW, 68, time);
  });
  if (game.board.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,246,224,0.55)';
    ctx.font = `italic 14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('No orders yet — take a breath, chef.', startX + 6, 42);
  }

  // Timer, coins, combo, stars — right side.
  const rush = isRushHour(game.shiftLeft);
  const tx = 920;
  text(ctx, fmtTime(game.shiftLeft), tx, 24, 30, rush ? '#ff6a55' : PALETTE.cream, 'left');
  if (rush) {
    ctx.save();
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 6);
    text(ctx, 'RUSH HOUR', tx + 92, 26, 14, '#ff6a55', 'left');
    ctx.restore();
  }
  const progW = 130;
  ctx.fillStyle = 'rgba(255,246,224,0.2)';
  rr(ctx, tx, 44, progW, 8, 4);
  ctx.fill();
  ctx.fillStyle = rush ? '#ff6a55' : PALETTE.gold;
  rr(ctx, tx, 44, progW * Math.max(0, game.shiftLeft / SHIFT_SECONDS), 8, 4);
  ctx.fill();
  text(ctx, 'SHIFT', tx + progW + 10, 48, 11, 'rgba(255,246,224,0.7)', 'left');

  text(ctx, `$${game.coins}`, VIEW_W - 16, 24, 26, PALETTE.gold, 'right');
  text(ctx, game.combo >= 2 ? `COMBO x${game.combo}` : 'no combo yet', VIEW_W - 16, 52, 12, game.combo >= 2 ? '#ffd23e' : 'rgba(255,246,224,0.55)', 'right');

  // Stars (reputation): one lost per timed-out order.
  for (let i = 0; i < 3; i++) {
    const sx = tx + i * 26;
    ctx.fillStyle = i < game.stars ? PALETTE.gold : 'rgba(255,246,224,0.2)';
    drawStar(ctx, sx, 68, 9);
  }
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHint(ctx, game) {
  if (!game.nearest || game.state !== 'playing') return;
  const s = game.nearest;
  const label = s.kind === 'bin'
    ? `Take ${INGREDIENTS[s.ingredient].name}`
    : s.label;
  const pill = `${label}  ·  ${s.hint}`;
  ctx.font = `bold 15px ${FONT}`;
  const w = ctx.measureText(pill).width + 28;
  const x = (VIEW_W - w) / 2;
  const y = VIEW_H - 44;
  ctx.fillStyle = 'rgba(28, 17, 8, 0.88)';
  rr(ctx, x, y, w, 32, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, 32, 16);
  ctx.stroke();
  text(ctx, pill, VIEW_W / 2, y + 17, 15, PALETTE.cream);
}

// ---------------------------------------------------------------------------
// Title and end screens.
// ---------------------------------------------------------------------------

function drawTitle(ctx, game, time) {
  ctx.fillStyle = 'rgba(20, 12, 5, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const bobY = Math.sin(time * 1.6) * 6;
  textOutline(ctx, 'EMBER & THYME', VIEW_W / 2, 128 + bobY, 64, PALETTE.gold, 'rgba(43,26,14,0.95)');
  text(ctx, 'R U S H   H O U R   K I T C H E N', VIEW_W / 2, 176 + bobY, 20, PALETTE.cream);
  text(ctx, 'One chef. One rush. Three stars on the line.', VIEW_W / 2, 210 + bobY, 16, 'rgba(255,246,224,0.8)');

  // How to play panel.
  const px = 290;
  const py = 250;
  const pw = 700;
  const ph = 330;
  ctx.fillStyle = 'rgba(255,248,226,0.96)';
  rr(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.orderTicketEdge;
  ctx.lineWidth = 2;
  rr(ctx, px, py, pw, ph, 14);
  ctx.stroke();
  text(ctx, 'HOW TO PLAY', VIEW_W / 2, py + 26, 18, '#7a4a22');
  const lines = [
    ['Move', 'WASD / arrows — or click the floor to walk there'],
    ['Use a station', 'E or Space — or click the station itself'],
    ['Cook', 'Pantry → chop veg → fry on the stove → plate it → serve!'],
    ['Serve', 'Match the ticket on the order board before its bar runs out'],
    ['Careful', 'Food burns if you leave it. Burnt food goes in the trash.'],
    ['Stars', 'A timed-out order costs a star. Lose all three and the shift ends.'],
  ];
  lines.forEach(([head, body], i) => {
    const y = py + 58 + i * 30;
    text(ctx, head, px + 24, y, 14, '#7a4a22', 'left');
    text(ctx, body, px + 170, y, 14, PALETTE.ink, 'left', 'normal');
  });
  // Recipe strip, two rows so every dish fits inside the panel.
  text(ctx, 'ON THE MENU:', px + 24, py + 252, 13, '#7a4a22', 'left');
  const menuX = px + 150;
  RECIPES.slice(0, 3).forEach((recipe, i) => {
    text(ctx, `${recipe.name} $${recipe.price}`, menuX + i * 180, py + 252, 13, PALETTE.ink, 'left', 'normal');
  });
  RECIPES.slice(3).forEach((recipe, i) => {
    text(ctx, `${recipe.name} $${recipe.price}`, menuX + i * 180, py + 280, 13, PALETTE.ink, 'left', 'normal');
  });

  const blink = Math.sin(time * 4) > -0.2;
  if (blink) {
    textOutline(ctx, 'CLICK OR PRESS ENTER TO START', VIEW_W / 2, 606, 24, '#ffffff', 'rgba(43,26,14,0.9)');
  }
  text(ctx, 'M: mute music   ·   Best shift this session: ' + (game.bestCoins > 0 ? `$${game.bestCoins}` : '—'), VIEW_W / 2, 648, 14, 'rgba(255,246,224,0.7)');
}

function gradeFor(coins) {
  if (coins >= 140) return 'S';
  if (coins >= 100) return 'A';
  if (coins >= 60) return 'B';
  return 'C';
}

function drawGameOver(ctx, game, time) {
  ctx.fillStyle = 'rgba(20, 12, 5, 0.86)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const title = game.stars <= 0 ? 'THE KITCHEN CLOSED EARLY…' : 'SHIFT OVER!';
  textOutline(ctx, title, VIEW_W / 2, 130, 52, PALETTE.gold, 'rgba(43,26,14,0.95)');

  const grade = gradeFor(game.coins);
  text(ctx, `GRADE ${grade}`, VIEW_W / 2, 196, 30, grade === 'S' ? '#ffd23e' : PALETTE.cream);
  const rows = [
    ['Coins earned', `$${game.coins}`],
    ['Dishes served', `${game.served}`],
    ['Orders lost', `${game.failed}`],
    ['Best combo', `x${game.bestCombo}`],
    ['Stars left', `${'★'.repeat(game.stars)}${'☆'.repeat(3 - game.stars)}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 250 + i * 42;
    text(ctx, label, VIEW_W / 2 - 130, y, 20, 'rgba(255,246,224,0.85)', 'left', 'normal');
    text(ctx, value, VIEW_W / 2 + 130, y, 20, PALETTE.gold, 'right');
  });
  const msg = grade === 'S'
    ? 'A flawless service. The regulars are already queuing for tomorrow.'
    : grade === 'A'
      ? 'A cracking shift — the pass barely kept up with you.'
      : grade === 'B'
        ? 'A solid shift. A little more hustle and the S grade is yours.'
        : 'The kitchen survived. Barely. One more shift?';
  text(ctx, msg, VIEW_W / 2, 480, 17, PALETTE.cream, 'center', 'normal');
  const blink = Math.sin(time * 4) > -0.2;
  if (blink) {
    textOutline(ctx, 'PRESS R OR CLICK TO COOK AGAIN', VIEW_W / 2, 548, 24, '#ffffff', 'rgba(43,26,14,0.9)');
  }
}

// ---------------------------------------------------------------------------
// The frame.
// ---------------------------------------------------------------------------

export function drawGame(ctx, game, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, time);
  for (const station of STATIONS) drawStation(ctx, game, station, time);
  if (game.state !== 'title') {
    drawChef(ctx, game, time);
  }
  drawParticles(ctx, game.particles);
  drawTopBar(ctx, game, time);
  drawHint(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game, time);
  if (game.state === 'over') drawGameOver(ctx, game, time);
}
