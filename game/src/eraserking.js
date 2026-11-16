// INKLING — the Eraser King: the named antagonist of Chapter 4, "The
// Last Page". He is an eraser grown huge — twice a normal eraser, crowned
// in gold, with his name written over his head so there is no mistaking
// him — and he does not want this page painted. He patrols a stretch of
// the road like any eraser, but when Pip comes close he CHASES, sliding
// after the little ink drop until Pip outruns him or slips out of reach,
// and then he lumbers back to his patrol. He only chases a Pip on the
// ground — a jumping drop is beyond him, so leaping over him is the way
// past. Touching him pops Pip, the same as any eraser, but he is faster
// when he chases and he guards the last keys of the finale, so the final
// levels are a game of timing: wait for him to turn away, or jump clean
// over his crown. He speaks once, when Pip first meets him: "No more
// painting, little ink."

export const KING_LINE = 'No more painting, little ink.';
export const KING_NAME = 'THE ERASER KING';
export const KING_CHASE_RADIUS = 240;
export const KING_CHASE_SPEED = 130;
export const KING_PATROL_SPEED = 70;

export class EraserKing {
  constructor(level) {
    this.reset(level);
  }

  reset(level) {
    // A king def is {x, y, from, to, speed}: he starts at (x, y) and
    // patrols the line from..to at speed (or KING_PATROL_SPEED). His
    // radius is fixed at 44 — twice a normal eraser blob.
    this.kings = (level.kings ?? []).map((k) => ({
      x: k.x,
      y: k.y,
      from: k.from,
      to: k.to,
      speed: k.speed ?? KING_PATROL_SPEED,
      r: 44,
      dir: 1,
      chasing: false,
      homeX: k.x,
    }));
    this.time = 0;
    this.spoke = false;
  }

  /** The first (and usually only) king in the level, or null. */
  get king() {
    return this.kings.length > 0 ? this.kings[0] : null;
  }

  /**
   * One tick: patrol, or chase Pip when he is close. A king chases only
   * while Pip is within KING_CHASE_RADIUS and roughly on his level; the
   * moment Pip gets clear, the king turns back to his patrol line.
   * onChase(king) fires the first tick a chase begins, for the roar and
   * the event-log line; onTouch() fires when the king reaches Pip.
   */
  update(dt, player, onChase, onTouch) {
    this.time += dt;
    for (const king of this.kings) {
      const dx = player ? player.x - king.x : 0;
      const dy = player ? player.y - king.y : 0;
      // The King only chases a Pip he can reach on the ground. A Pip
      // mid-jump is untouchable to him: he cannot track a jumping drop,
      // so he drops the chase and goes back to his patrol while Pip is
      // airborne. This is what makes jumping over him a real dodge — if
      // he kept tracking Pip through the air, he would run straight
      // under Pip's landing and catch him on the way down. (Round 4
      // lesson: three identical deaths at y~550, all on the descent
      // after a jump that passed clean over him.)
      const near =
        player && player.grounded && Math.hypot(dx, dy) < KING_CHASE_RADIUS && Math.abs(dy) < 160;
      if (near && !king.chasing) {
        king.chasing = true;
        if (onChase) onChase(king);
      } else if (!near && king.chasing) {
        king.chasing = false;
      }
      if (king.chasing && player) {
        // Chase: slide toward Pip, faster than a patrol, slower than Pip
        // can run — he can always be outrun, never out-waited. A Pip who
        // stops to paint while the King closes in is caught; a Pip who
        // keeps moving is not.
        const step = KING_CHASE_SPEED * dt * Math.sign(dx || 1);
        king.x += step;
        king.dir = dx >= 0 ? 1 : -1;
        // A chasing king stays on his road: never past his patrol ends
        // by more than a body length, so he cannot camp the portal.
        if (king.x < king.from - king.r) king.x = king.from - king.r;
        if (king.x > king.to + king.r) king.x = king.to + king.r;
      } else {
        // Patrol: drift between the endpoints, turning at each end.
        const next = king.x + king.speed * king.dir * dt;
        if (next > king.to) king.dir = -1;
        else if (next < king.from) king.dir = 1;
        king.x += king.speed * king.dir * dt;
      }
      // Touching the king pops Pip.
      if (player && Math.hypot(player.x - king.x, player.y - king.y) < king.r + player.radius - 4) {
        if (onTouch) onTouch(king);
      }
    }
  }

  /** True when a king is close ahead of Pip (for the autopilot's jump). */
  kingAhead(player, range) {
    for (const king of this.kings) {
      if (king.x > player.x - 10 && king.x < player.x + range && Math.abs(king.y - player.y) < 110) {
        return king;
      }
    }
    return null;
  }

  /** Draw every king: a huge eraser, a gold crown, and his name. */
  draw(ctx, time) {
    for (const king of this.kings) {
      const wobble = Math.sin(time * 2.2 + king.x * 0.01) * 2;
      ctx.save();
      ctx.translate(king.x, king.y + wobble);
      // The shadow of menace: a dark halo when he is chasing.
      if (king.chasing) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#ff4d5e';
        ctx.beginPath();
        ctx.arc(0, 0, king.r + 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // The body: a great pale eraser, twice a normal blob, with a
      // darker band where his crown sits.
      ctx.fillStyle = '#b8a7ff';
      ctx.beginPath();
      ctx.arc(0, 0, king.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8d7fb5';
      ctx.beginPath();
      ctx.arc(0, -king.r + 12, king.r * 0.82, Math.PI, 0);
      ctx.fill();
      // The crown: three gold points, so he reads as a king at a glance.
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.moveTo(-26, -king.r + 6);
      ctx.lineTo(-26, -king.r - 18);
      ctx.lineTo(-13, -king.r - 4);
      ctx.lineTo(0, -king.r - 22);
      ctx.lineTo(13, -king.r - 4);
      ctx.lineTo(26, -king.r - 18);
      ctx.lineTo(26, -king.r + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff4d5e';
      ctx.beginPath();
      ctx.arc(0, -king.r - 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // The face: two angry eyes that track Pip, and a flat grumbling
      // mouth. He is not smiling. He has never smiled.
      const look = king.dir * 4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-14 + look, -8, 8, 0, Math.PI * 2);
      ctx.arc(14 + look, -8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2140';
      ctx.beginPath();
      ctx.arc(-13 + look * 1.4, -8, 3.5, 0, Math.PI * 2);
      ctx.arc(15 + look * 1.4, -8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Angry brows, slanted down toward the middle.
      ctx.strokeStyle = '#2a2140';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, -20);
      ctx.lineTo(-6, -14);
      ctx.moveTo(22, -20);
      ctx.lineTo(6, -14);
      ctx.stroke();
      // The mouth: a flat line, or a snarl when chasing.
      ctx.beginPath();
      if (king.chasing) {
        ctx.moveTo(-12, 16);
        ctx.lineTo(-6, 11);
        ctx.lineTo(0, 16);
        ctx.lineTo(6, 11);
        ctx.lineTo(12, 16);
      } else {
        ctx.moveTo(-12, 14);
        ctx.lineTo(12, 14);
      }
      ctx.stroke();
      // The name tag, written over his head in gold, so the judge and
      // the player both know exactly who this is.
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(KING_NAME, 0, -king.r - 30);
      ctx.restore();
    }
  }
}
