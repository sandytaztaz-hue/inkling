// INKLING — paint strokes: the world the player draws. A stroke is a chain
// of points that is solid while wet, then dries, cracks and crumbles away,
// so every bridge is a clock as well as a road. Each stroke carries its
// brush colour: cyan is the plain road, amber bounces Pip back up, violet
// dries slowly for long crossings.

import { PAINT, PAINT_COLORS } from './config.js';

export class PaintManager {
  constructor() {
    this.strokes = [];
    this.current = null;
    this.onCrumble = null;
    this.onErase = null;
  }

  reset() {
    this.strokes = [];
    this.current = null;
  }

  beginStroke(x, y, colorName) {
    const def = PAINT_COLORS[colorName] ?? PAINT_COLORS.cyan;
    this.current = {
      points: [{ x, y }],
      age: 0,
      colorName,
      color: def.color,
      dark: def.dark,
      cost: def.cost,
      drySeconds: def.drySeconds,
    };
    this.strokes.push(this.current);
  }

  /** Add a point to the open stroke. Returns ink spent for the segment. */
  extendStroke(x, y) {
    if (!this.current) return 0;
    const pts = this.current.points;
    const last = pts[pts.length - 1];
    const dist = Math.hypot(x - last.x, y - last.y);
    if (dist < PAINT.minPointGap) return 0;
    pts.push({ x, y });
    return dist * this.current.cost;
  }

  endStroke() {
    if (this.current && this.current.points.length < 2) {
      this.strokes.splice(this.strokes.indexOf(this.current), 1);
    }
    this.current = null;
  }

  /**
   * The ground under x, between the player's old and new feet. Returns
   * {y, stroke} for the highest paint found, or null. The stroke matters:
   * amber paint bounces Pip instead of holding him.
   */
  supportY(x, prevBottom, newBottom) {
    let best = null;
    for (const stroke of this.strokes) {
      if (stroke.points.length < 2) continue;
      for (const p of stroke.points) {
        if (Math.abs(p.x - x) > 13) continue;
        if (p.y < prevBottom - 6 || p.y > newBottom + 4) continue;
        if (best === null || p.y < best.y) best = { y: p.y, stroke };
      }
    }
    return best;
  }

  /** True when any wet paint lies within radius r of (x, y). */
  touches(x, y, r) {
    for (const stroke of this.strokes) {
      for (const p of stroke.points) {
        if (Math.hypot(p.x - x, p.y - y) < r) return true;
      }
    }
    return false;
  }

  /** Erase every paint point within radius r. Returns points removed. */
  eraseAt(x, y, r) {
    let removed = 0;
    for (const stroke of this.strokes) {
      const kept = [];
      for (const p of stroke.points) {
        if (Math.hypot(p.x - x, p.y - y) < r) removed++;
        else kept.push(p);
      }
      stroke.points = kept;
    }
    this.strokes = this.strokes.filter((s) => s.points.length >= 2);
    if (removed > 0 && this.onErase) this.onErase(x, y);
    return removed;
  }

  update(dt) {
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const stroke = this.strokes[i];
      stroke.age += dt;
      if (stroke.age >= stroke.drySeconds) {
        if (this.onCrumble) this.onCrumble(stroke);
        this.strokes.splice(i, 1);
      }
    }
  }

  /** Dryness 0 (fresh) to 1 (about to crumble). */
  dryness(stroke) {
    return Math.min(1, stroke.age / stroke.drySeconds);
  }

  draw(ctx) {
    for (const stroke of this.strokes) {
      const dry = this.dryness(stroke);
      const alpha = 1 - dry * 0.55;
      const pts = stroke.points;
      if (pts.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Wobbly hand-drawn edge: a darker under-stroke, then the bright core.
      ctx.strokeStyle = stroke.dark;
      ctx.lineWidth = PAINT.strokeWidth + 3;
      this.tracePath(ctx, pts);
      ctx.stroke();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = PAINT.strokeWidth;
      this.tracePath(ctx, pts);
      ctx.stroke();
      // Amber paint reads as springy: little chevrons along the stroke.
      if (stroke.colorName === 'amber') {
        ctx.strokeStyle = '#fff3d6';
        ctx.lineWidth = 2;
        for (let i = 4; i < pts.length - 2; i += 8) {
          const p = pts[i];
          ctx.beginPath();
          ctx.moveTo(p.x - 5, p.y + 4);
          ctx.lineTo(p.x, p.y - 5);
          ctx.lineTo(p.x + 5, p.y + 4);
          ctx.stroke();
        }
      }
      // Drying cracks: short dark ticks across the stroke once it ages.
      if (dry > PAINT.crackAt / PAINT.drySeconds) {
        ctx.strokeStyle = '#0b2430';
        ctx.lineWidth = 2;
        for (let i = 2; i < pts.length - 2; i += 4) {
          const p = pts[i];
          ctx.beginPath();
          ctx.moveTo(p.x - 5, p.y - 6);
          ctx.lineTo(p.x + 5, p.y + 6);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  tracePath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      // Skip a jump over an erased gap so the stroke does not bridge it.
      const prev = pts[i - 1];
      if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) > 40) {
        ctx.moveTo(pts[i].x, pts[i].y);
      } else {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
    }
  }
}
