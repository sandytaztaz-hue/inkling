// INKLING — Pip, the little ink drop. Runs, jumps and lands on static
// platforms, moving platforms, crumble blocks and the paint the player
// draws. Landing hard on amber paint bounces him back up, harder the
// harder he fell. Falling off the page costs a life.

import { PHYSICS, VIEW } from './config.js';

function clampBounce(vy) {
  return -Math.max(500, Math.min(1150, vy * 1.4));
}

export class Player {
  constructor() {
    this.reset(80, 560);
    this.radius = 16;
    this.facing = 1;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.grounded = false;
    this.groundPlatform = null;
    this.squash = 0;
    this.blink = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.groundPlatform = null;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.squash = 0;
    this.blink = 0;
  }

  get bottom() {
    return this.y + this.radius;
  }

  /** Move and collide. Returns 'fell' when Pip drops off the page. */
  update(dt, input, level, paint, hazards) {
    const left = input.moveLeft();
    const right = input.moveRight();
    const target = (right ? 1 : 0) - (left ? 1 : 0);
    if (target !== 0) this.facing = target;
    const accel = this.grounded ? PHYSICS.moveAccel : PHYSICS.airAccel;
    this.vx += target * accel * dt;
    const maxSpeed = PHYSICS.moveSpeed;
    if (this.vx > maxSpeed) this.vx = maxSpeed;
    if (this.vx < -maxSpeed) this.vx = -maxSpeed;
    if (target === 0 && this.grounded) {
      this.vx *= Math.max(0, 1 - 12 * dt);
      if (Math.abs(this.vx) < 8) this.vx = 0;
    }
    // Wind zones push Pip sideways while inside one.
    if (hazards.windPush !== 0) this.vx += hazards.windPush * dt;

    if (input.jumpHeld()) this.jumpBuffer = PHYSICS.jumpBuffer;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.grounded) this.coyote = PHYSICS.coyoteTime;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -PHYSICS.jumpSpeed;
      this.grounded = false;
      this.groundPlatform = null;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.squash = -0.25;
      return 'jumped';
    }

    const prevBottom = this.bottom;
    this.vy = Math.min(PHYSICS.maxFall, this.vy + PHYSICS.gravity * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep Pip inside the page horizontally.
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = Math.max(0, this.vx);
    }
    if (this.x > VIEW.width - this.radius) {
      this.x = VIEW.width - this.radius;
      this.vx = Math.min(0, this.vx);
    }

    this.grounded = false;
    this.groundPlatform = null;
    if (this.vy >= 0) {
      const newBottom = this.bottom;
      // Static platforms.
      for (const p of level.platforms) {
        if (this.x + this.radius * 0.7 > p.x && this.x - this.radius * 0.7 < p.x + p.w) {
          if (prevBottom <= p.y + 4 && newBottom >= p.y) {
            this.landOn(p.y, null);
          }
        }
      }
      // Crumble blocks: solid until they fall apart.
      for (const c of hazards.crumbles) {
        if (c.gone) continue;
        if (this.x + this.radius * 0.7 > c.x && this.x - this.radius * 0.7 < c.x + c.w) {
          if (prevBottom <= c.y + 4 && newBottom >= c.y) {
            this.landOn(c.y, c);
          }
        }
      }
      // Moving platforms.
      for (const p of hazards.movers) {
        if (this.x + this.radius * 0.7 > p.x && this.x - this.radius * 0.7 < p.x + p.w) {
          if (prevBottom <= p.y + 4 && newBottom >= p.y) {
            this.landOn(p.y, p);
          }
        }
      }
      // Paint strokes. Amber paint bounces a falling Pip back up.
      if (!this.grounded) {
        const hit = paint.supportY(this.x, prevBottom, newBottom);
        if (hit !== null) {
          if (hit.stroke.colorName === 'amber' && this.vy > 150) {
            this.vy = clampBounce(this.vy);
            this.grounded = false;
            this.squash = -0.3;
            return 'bounced';
          }
          this.landOn(hit.y, null);
        }
      }
    }
    // Riding a moving platform carries Pip along with it.
    if (this.groundPlatform) {
      this.x += this.groundPlatform.dx ?? 0;
      this.y += this.groundPlatform.dy ?? 0;
    }
    // Bounce pads.
    for (const pad of level.bouncePads) {
      if (
        this.bottom >= pad.y - 2 &&
        this.bottom <= pad.y + 18 &&
        this.x > pad.x &&
        this.x < pad.x + pad.w &&
        this.vy >= 0
      ) {
        this.vy = -PHYSICS.bounceSpeed;
        this.grounded = false;
        this.squash = -0.3;
        return 'bounced';
      }
    }
    this.squash *= Math.max(0, 1 - 8 * dt);
    this.blink = Math.max(0, this.blink - dt);
    if (this.y - this.radius > VIEW.height + 60) return 'fell';
    return null;
  }

  landOn(y, platform) {
    this.y = y - this.radius;
    this.vy = 0;
    this.grounded = true;
    this.groundPlatform = platform;
    this.squash = 0.22;
  }
}
