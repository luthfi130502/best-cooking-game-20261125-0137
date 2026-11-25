// Ember & Thyme — Rush Hour Kitchen
// particles.js — one job: juice. Steam, chop bits, sparkles and the
// floating "+$12" texts that make an action feel answered at once.

export function createParticles() {
  return { list: [], floaters: [] };
}

export function spawnSteam(p, x, y, n = 1) {
  for (let i = 0; i < n; i++) {
    p.list.push({
      kind: 'steam', x: x + (Math.random() - 0.5) * 18, y: y - 6,
      vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 14,
      life: 0.9 + Math.random() * 0.5, maxLife: 1.4,
      size: 5 + Math.random() * 6,
    });
  }
}

export function spawnChopBits(p, x, y, color) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    p.list.push({
      kind: 'bit', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      life: 0.5 + Math.random() * 0.3, maxLife: 0.8,
      size: 2.5 + Math.random() * 3.5, color,
    });
  }
}

export function spawnSparkle(p, x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 30 + Math.random() * 110;
    p.list.push({
      kind: 'spark', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.6 + Math.random() * 0.4, maxLife: 1.0,
      size: 2 + Math.random() * 3, color: '#ffd23e',
    });
  }
}

export function spawnPuff(p, x, y, color = '#8d97a3') {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 20 + Math.random() * 50;
    p.list.push({
      kind: 'puff', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.4 + Math.random() * 0.3, maxLife: 0.7,
      size: 4 + Math.random() * 5, color,
    });
  }
}

export function addFloater(p, x, y, text, color = '#ffc53d') {
  p.floaters.push({ x, y, text, color, life: 1.4, maxLife: 1.4 });
}

export function updateParticles(p, dt) {
  for (const pt of p.list) {
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    if (pt.kind === 'bit') pt.vy += 260 * dt; // bits fall
    if (pt.kind === 'steam') {
      pt.size += 14 * dt;
      pt.vx *= (1 - dt);
    }
  }
  p.list = p.list.filter((pt) => pt.life > 0);
  for (const f of p.floaters) {
    f.life -= dt;
    f.y -= 34 * dt;
  }
  p.floaters = p.floaters.filter((f) => f.life > 0);
}

export function drawParticles(ctx, p) {
  for (const pt of p.list) {
    const a = Math.max(0, pt.life / pt.maxLife);
    if (pt.kind === 'steam') {
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.kind === 'bit') {
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    } else if (pt.kind === 'spark') {
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = a * 0.7;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const f of p.floaters) {
    const a = Math.max(0, Math.min(1, f.life / 0.6));
    ctx.globalAlpha = a;
    ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(43, 26, 14, 0.9)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
