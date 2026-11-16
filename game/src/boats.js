// INKLING — paper boats: folded-paper ferries that drift along a set
// path across a gap, carrying Pip with them. A boat is a moving platform
// with a paper soul: it slides between its two endpoints, turns around
// without stopping, and bobs gently as it goes, its little sail catching
// the dawn light. Pip rides it like any moving platform — step on, ride,
// step off at the far side — and a painted bridge can meet a boat
// mid-path, so the player's own ink and the river's boats work together.
// Boats never sink and never hurry: their speed is slow enough that a
// patient Pip always makes the crossing, and a hurried one learns to wait
// for the far end before stepping off.

export class PaperBoats {
  constructor(level) {
    this.reset(level);
  }

  reset(level) {
    // A boat def is {x, y, w, h, axis, from, to, speed}: the boat starts
    // at (x, y) and slides along one axis between from and to, turning
    // at each end. w is the deck length Pip stands on.
    this.boats = (level.boats ?? []).map((b) => ({
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      axis: b.axis ?? 'x',
      from: b.from,
      to: b.to,
      speed: b.speed ?? 60,
      dir: 1,
      dx: 0,
      dy: 0,
      bobPhase: b.x * 0.021 + b.y * 0.011,
    }));
    this.time = 0;
  }

  /** Step every boat along its path and report how far it moved. */
  update(dt) {
    this.time += dt;
    for (const boat of this.boats) {
      boat.dx = 0;
      boat.dy = 0;
      const pos = boat.axis === 'x' ? boat.x : boat.y;
      const next = pos + boat.speed * boat.dir * dt;
      if (next > boat.to) boat.dir = -1;
      else if (next < boat.from) boat.dir = 1;
      const step = boat.speed * boat.dir * dt;
      if (boat.axis === 'x') {
        boat.x += step;
        boat.dx = step;
      } else {
        boat.y += step;
        boat.dy = step;
      }
    }
  }

  /** True when a point is standing on a boat's deck (for the autopilot). */
  boatAt(x, y) {
    for (const boat of this.boats) {
      if (x >= boat.x && x <= boat.x + boat.w && boat.y >= y - 6 && boat.y <= y + 50) {
        return boat;
      }
    }
    return null;
  }

  /** Draw every boat: a folded hull, a sail, and a wake of gold. */
  draw(ctx, time) {
    for (const boat of this.boats) {
      const bob = Math.sin(time * 1.6 + boat.bobPhase) * 3;
      const cx = boat.x + boat.w / 2;
      ctx.save();
      ctx.translate(0, bob);
      // The wake: a soft golden shimmer trailing behind the hull.
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.ellipse(cx, boat.y + boat.h + 4, boat.w * 0.6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // The hull: a folded-paper boat, cream white with a gold trim,
      // pointed at both ends like the boats children fold from a page.
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f4efe6';
      ctx.beginPath();
      ctx.moveTo(boat.x, boat.y + 4);
      ctx.lineTo(boat.x + 14, boat.y + boat.h);
      ctx.lineTo(boat.x + boat.w - 14, boat.y + boat.h);
      ctx.lineTo(boat.x + boat.w, boat.y + 4);
      ctx.lineTo(boat.x + boat.w - 18, boat.y + 10);
      ctx.lineTo(boat.x + 18, boat.y + 10);
      ctx.closePath();
      ctx.fill();
      // The fold lines down the hull, so it reads as folded paper.
      ctx.strokeStyle = '#c9bfa5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, boat.y + 10);
      ctx.lineTo(cx, boat.y + boat.h - 2);
      ctx.stroke();
      // The deck: a flat gold strip Pip stands on.
      ctx.fillStyle = '#ffd23e';
      ctx.fillRect(boat.x + 8, boat.y, boat.w - 16, 5);
      // The sail: a small dawn-gold triangle on a mast at the centre.
      ctx.fillStyle = '#8a5c00';
      ctx.fillRect(cx - 1.5, boat.y - 34, 3, 36);
      ctx.fillStyle = '#ffcf4d';
      ctx.beginPath();
      ctx.moveTo(cx + 2, boat.y - 34);
      ctx.lineTo(cx + 2, boat.y - 6);
      ctx.lineTo(cx + 26, boat.y - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.moveTo(cx - 2, boat.y - 30);
      ctx.lineTo(cx - 2, boat.y - 8);
      ctx.lineTo(cx - 18, boat.y - 8);
      ctx.closePath();
      ctx.fill();
      // The name, painted on the sail's shadow: every boat is a ferry.
      ctx.fillStyle = '#8a5c00';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAPER BOAT', cx, boat.y - 42);
      ctx.restore();
    }
  }
}
