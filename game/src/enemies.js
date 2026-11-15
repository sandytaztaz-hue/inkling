// INKLING — hazards and movers: eraser blobs that patrol and eat paint,
// sliding platforms, wind zones and spikes. Each one is a small state
// machine updated once per step and drawn by render.js.

export class Hazards {
  constructor(level) {
    this.reset(level);
  }

  reset(level) {
    this.erasers = (level.erasers ?? []).map((e) => ({
      x: e.x,
      y: e.y,
      axis: e.axis,
      from: e.from,
      to: e.to,
      speed: e.speed,
      r: e.r,
      dir: 1,
    }));
    this.movers = (level.movers ?? []).map((m) => ({
      x: m.x,
      y: m.y,
      w: m.w,
      h: m.h,
      axis: m.axis,
      from: m.from,
      to: m.to,
      speed: m.speed,
      dir: 1,
      dx: 0,
      dy: 0,
    }));
    this.wind = level.wind ?? [];
    this.spikes = level.spikes ?? [];
    this.windPush = 0;
  }

  update(dt, player, paint, onErase, onHurt) {
    // Moving platforms slide between their endpoints and report their delta.
    for (const m of this.movers) {
      m.dx = 0;
      m.dy = 0;
      const pos = m.axis === 'x' ? m.x : m.y;
      const next = pos + m.speed * m.dir * dt;
      if (next > m.to) {
        m.dir = -1;
      } else if (next < m.from) {
        m.dir = 1;
      }
      const step = m.speed * m.dir * dt;
      if (m.axis === 'x') {
        m.x += step;
        m.dx = step;
      } else {
        m.y += step;
        m.dy = step;
      }
    }
    // Erasers patrol and eat any paint they touch.
    for (const e of this.erasers) {
      const pos = e.axis === 'x' ? e.x : e.y;
      const next = pos + e.speed * e.dir * dt;
      if (next > e.to) e.dir = -1;
      else if (next < e.from) e.dir = 1;
      if (e.axis === 'x') e.x += e.speed * e.dir * dt;
      else e.y += e.speed * e.dir * dt;
      if (paint.touches(e.x, e.y, e.r + 8)) {
        paint.eraseAt(e.x, e.y, e.r + 10);
        onErase(e.x, e.y);
      }
      // Touching an eraser pops Pip.
      if (player && Math.hypot(player.x - e.x, player.y - e.y) < e.r + player.radius - 4) {
        onHurt('eraser');
      }
    }
    // Wind: push Pip while the drop is inside a wind zone.
    this.windPush = 0;
    if (player) {
      for (const zone of this.wind) {
        if (
          player.x > zone.x &&
          player.x < zone.x + zone.w &&
          player.y > zone.y &&
          player.y < zone.y + zone.h
        ) {
          this.windPush = zone.push;
        }
      }
    }
    // Spikes: touching one pops Pip.
    if (player) {
      for (const s of this.spikes) {
        if (
          player.x + player.radius * 0.6 > s.x &&
          player.x - player.radius * 0.6 < s.x + s.w &&
          player.bottom > s.y - 14 &&
          player.y < s.y + 10
        ) {
          onHurt('spikes');
        }
      }
    }
  }
}
