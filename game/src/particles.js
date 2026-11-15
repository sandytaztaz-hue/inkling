// INKLING — particles: paint splats, orb sparkles, crumbling dust, ink
// bursts on death. Every effect is a short-lived coloured dot with velocity.

export class Particles {
  constructor() {
    this.list = [];
  }

  spawn(x, y, options) {
    const count = options.count ?? 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (options.speed ?? 120) * (0.4 + Math.random() * 0.8);
      this.list.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (options.vx ?? 0),
        vy: Math.sin(angle) * speed + (options.vy ?? 0),
        life: options.life ?? 0.6,
        maxLife: options.life ?? 0.6,
        size: (options.size ?? 4) * (0.6 + Math.random() * 0.8),
        color: options.color ?? '#2de2ff',
        gravity: options.gravity ?? 300,
      });
    }
  }

  splat(x, y, color) {
    this.spawn(x, y, { count: 3, speed: 60, life: 0.4, size: 3, color, gravity: 120 });
  }

  burst(x, y, color, count) {
    this.spawn(x, y, { count: count ?? 26, speed: 260, life: 0.8, size: 5, color });
  }

  sparkle(x, y, color) {
    this.spawn(x, y, { count: 12, speed: 90, life: 0.7, size: 3, color, gravity: -40 });
  }

  dust(x, y, color) {
    this.spawn(x, y, { count: 8, speed: 50, life: 0.9, size: 4, color, gravity: 60 });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.list.length = 0;
  }
}
