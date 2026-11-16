// INKLING — ink fountains: glowing pools of golden ink that refill Pip's
// bottle while he stands in them. Chapter 4, "The Last Page", is a long
// dry crossing, so fountains are the checkpoints: each one is a small
// mercy — stand in the glow, watch the bottle fill, and paint on. A
// fountain never runs dry, but it only fills a Pip who stops to drink;
// walking straight past it earns nothing. Droplets rise out of the pool
// and burst into sparkles, and every refill tick plays a soft chime.

export const FOUNTAIN_REFILL_PER_SECOND = 25;
export const FOUNTAIN_TICK_SECONDS = 0.5;

export class FountainPools {
  constructor(level) {
    this.reset(level);
  }

  reset(level) {
    // A fountain def is {x, y, w, h}: x/y is the top-left of the glow
    // zone, w/h its size. Pip refills while his centre is inside it.
    this.pools = (level.fountains ?? []).map((f) => ({
      x: f.x,
      y: f.y,
      w: f.w,
      h: f.h,
      phase: f.x * 0.013 + f.y * 0.007,
      tickAt: 0,
      dropletAt: 0,
    }));
    this.time = 0;
    // True while Pip is drinking this tick; the HUD and the autopilot
    // read it to show the refill and to know when to linger.
    this.refilling = false;
    this.activePool = null;
  }

  /** The pool Pip is standing in right now, or null. */
  poolAt(x, y) {
    for (const pool of this.pools) {
      if (x >= pool.x && x <= pool.x + pool.w && y >= pool.y && y <= pool.y + pool.h) {
        return pool;
      }
    }
    return null;
  }

  /**
   * One tick: if Pip stands in a pool, pour ink back into his bottle.
   * Returns the ink gained this tick (0 when Pip is not drinking).
   * onTick(pool) fires every half second of drinking, for the chime and
   * the "INK +25" event line; onDroplet(x, y) fires for each golden
   * droplet that rises out of the pool, for the sparkle particles.
   */
  update(dt, player, ink, maxInk, onTick, onDroplet) {
    this.time += dt;
    this.refilling = false;
    this.activePool = null;
    if (!player) return 0;
    const pool = this.poolAt(player.x, player.y);
    if (!pool) return 0;
    if (ink >= maxInk) return 0;
    this.refilling = true;
    this.activePool = pool;
    const gained = Math.min(FOUNTAIN_REFILL_PER_SECOND * dt, maxInk - ink);
    // Droplets: one rises out of the pool roughly every 0.18 s while
    // Pip drinks, drifting up and bursting gold. The sideways position
    // is derived from the pool phase and the clock, never Math.random(),
    // so a run stays deterministic frame for frame.
    pool.dropletAt += dt;
    if (pool.dropletAt >= 0.18) {
      pool.dropletAt = 0;
      if (onDroplet) {
        const spread = Math.max(pool.w - 24, 8);
        const dx = pool.x + 12 + (((pool.phase * 977 + this.time * 13) % 1) * spread);
        onDroplet(dx, pool.y + pool.h - 6);
      }
    }
    // The chime tick: every half second of drinking, a soft note and a
    // line in the event log, so the refill reads on screen and in sound.
    pool.tickAt += dt;
    if (pool.tickAt >= FOUNTAIN_TICK_SECONDS) {
      pool.tickAt = 0;
      if (onTick) onTick(pool);
    }
    return gained;
  }

  /** Draw every pool: a glowing golden basin with a rising shimmer. */
  draw(ctx, time) {
    for (const pool of this.pools) {
      const cx = pool.x + pool.w / 2;
      const glow = 0.5 + 0.3 * Math.sin(time * 2.4 + pool.phase);
      ctx.save();
      // The glow halo, warm gold, breathing slowly.
      ctx.globalAlpha = 0.16 * glow;
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.ellipse(cx, pool.y + pool.h - 8, pool.w * 0.72, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      // The basin: a shallow golden bowl with a bright rim.
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#8a5c00';
      ctx.beginPath();
      ctx.ellipse(cx, pool.y + pool.h - 6, pool.w / 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.ellipse(cx, pool.y + pool.h - 8, pool.w / 2 - 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // The ink surface: a bright line that shimmers as droplets rise.
      ctx.fillStyle = '#fff3c4';
      ctx.globalAlpha = 0.65 + 0.3 * Math.sin(time * 5 + pool.phase);
      ctx.beginPath();
      ctx.ellipse(cx, pool.y + pool.h - 9, pool.w / 2 - 14, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rising droplets, three per pool, looping upward out of the ink.
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 3; i++) {
        const rise = ((time * 0.45 + i / 3 + pool.phase) % 1) * 44;
        const dx = cx + Math.sin(pool.phase * 3 + i * 2.1) * (pool.w / 4);
        ctx.beginPath();
        ctx.arc(dx, pool.y + pool.h - 12 - rise, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // The label, so the pool reads as a fountain at a glance.
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('INK FOUNTAIN', cx, pool.y - 8);
      ctx.restore();
    }
  }
}
