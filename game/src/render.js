// INKLING — all drawing. Dark paper with a faint grain and ruled lines,
// bright paint, and Pip the ink drop with eyes that look where he moves.

import { COLORS, VIEW } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.shake = 0;
    this.time = 0;
    this.grain = null;
  }

  addShake(amount) {
    this.shake = Math.max(this.shake, amount);
  }

  makeGrain(rng) {
    const off = document.createElement('canvas');
    off.width = 256;
    off.height = 256;
    const octx = off.getContext('2d');
    const img = octx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 200 + Math.floor(rng() * 55);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    octx.putImageData(img, 0, 0);
    this.grain = off;
  }

  drawBackground(ctx, level) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Faint ruled paper lines.
    ctx.strokeStyle = COLORS.paperLine;
    ctx.lineWidth = 1;
    for (let y = 90; y < VIEW.height; y += 90) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.width, y);
      ctx.stroke();
    }
    // Grain.
    if (this.grain) {
      const pattern = ctx.createPattern(this.grain, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    // Wind zones read as drifting air: pale streaks.
    for (const zone of level.wind) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#bfe8ff';
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#bfe8ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const y = zone.y + 40 + i * 70 + Math.sin(this.time * 2 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(zone.x + 20, y);
        ctx.lineTo(zone.x + zone.w - 20, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawPlatforms(ctx, level) {
    for (const p of level.platforms) {
      ctx.fillStyle = COLORS.platform;
      roundRect(ctx, p.x, p.y, p.w, p.h, 8);
      ctx.fill();
      ctx.fillStyle = COLORS.platformTop;
      ctx.fillRect(p.x + 4, p.y, p.w - 8, 8);
      // Torn paper edge: little notches along the top.
      ctx.fillStyle = COLORS.paperWhite;
      ctx.globalAlpha = 0.25;
      for (let x = p.x + 12; x < p.x + p.w - 12; x += 46) {
        ctx.fillRect(x, p.y + 2, 14, 3);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawMovers(ctx, hazards) {
    for (const m of hazards.movers) {
      ctx.fillStyle = COLORS.magenta;
      roundRect(ctx, m.x, m.y, m.w, m.h, 9);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(m.x + 10, m.y + 4, m.w - 20, 4);
      ctx.globalAlpha = 1;
    }
  }

  drawBouncePads(ctx, level) {
    for (const pad of level.bouncePads) {
      ctx.fillStyle = COLORS.yellow;
      roundRect(ctx, pad.x, pad.y, pad.w, pad.h, 8);
      ctx.fill();
      ctx.fillStyle = '#7a5b00';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOING', pad.x + pad.w / 2, pad.y - 8);
    }
  }

  drawSpikes(ctx, level) {
    for (const s of level.spikes) {
      ctx.fillStyle = COLORS.danger;
      const count = Math.max(2, Math.floor(s.w / 22));
      for (let i = 0; i < count; i++) {
        const x0 = s.x + (i * s.w) / count;
        const x1 = s.x + ((i + 1) * s.w) / count;
        ctx.beginPath();
        ctx.moveTo(x0, s.y);
        ctx.lineTo((x0 + x1) / 2, s.y - 26);
        ctx.lineTo(x1, s.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  drawOrbs(ctx, orbs, taken) {
    orbs.forEach((orb, i) => {
      if (taken[i]) return;
      const pulse = 1 + Math.sin(this.time * 4 + i) * 0.12;
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7cc';
      ctx.beginPath();
      ctx.arc(-3, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.yellow;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  drawPortal(ctx, portal) {
    const pulse = 1 + Math.sin(this.time * 3) * 0.06;
    const cx = portal.x + 27;
    const cy = portal.y + 39;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = COLORS.portal;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.portal;
    ctx.globalAlpha = 0.25 + Math.sin(this.time * 3) * 0.08;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#eafff5';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', 0, 4);
    ctx.restore();
  }

  drawErasers(ctx, hazards) {
    for (const e of hazards.erasers) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = COLORS.eraser;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#efe9ff';
      ctx.beginPath();
      ctx.arc(-7, -6, 5, 0, Math.PI * 2);
      ctx.arc(7, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2140';
      ctx.beginPath();
      ctx.arc(-6, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(8, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a2140';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 6, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(ctx, player) {
    const squash = player.squash || 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(1 + squash * 0.6, 1 - squash);
    // Ink-drop body: a teardrop with a wobbly tail.
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(0, -player.radius - 8);
    ctx.quadraticCurveTo(player.radius * 0.9, -player.radius * 0.4, player.radius, 2);
    ctx.quadraticCurveTo(player.radius * 0.8, player.radius * 0.9, 0, player.radius);
    ctx.quadraticCurveTo(-player.radius * 0.8, player.radius * 0.9, -player.radius, 2);
    ctx.quadraticCurveTo(-player.radius * 0.9, -player.radius * 0.4, 0, -player.radius - 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(-6, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eyes look where Pip moves.
    const lookX = player.facing * 3;
    const lookY = player.vy < -100 ? -3 : player.vy > 100 ? 3 : 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5 + lookX, -2 + lookY, 4.5, 0, Math.PI * 2);
    ctx.arc(6 + lookX, -2 + lookY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10222e';
    ctx.beginPath();
    ctx.arc(-5 + lookX * 1.6, -2 + lookY, 2.2, 0, Math.PI * 2);
    ctx.arc(6 + lookX * 1.6, -2 + lookY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMouseBrush(ctx, input, ink) {
    if (ink <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(input.mouseX, input.mouseY, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(input.mouseX, input.mouseY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Render one play frame (world only; HUD and screens live in hud.js). */
  render(game) {
    const ctx = this.ctx;
    this.time += 1 / 60;
    ctx.save();
    if (this.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.86;
    } else {
      this.shake = 0;
    }
    this.drawBackground(ctx, game.level);
    this.drawPlatforms(ctx, game.level);
    this.drawMovers(ctx, game.hazards);
    this.drawBouncePads(ctx, game.level);
    this.drawSpikes(ctx, game.level);
    game.paint.draw(ctx);
    this.drawOrbs(ctx, game.level.orbs, game.orbsTaken);
    this.drawPortal(ctx, game.level.portal);
    this.drawErasers(ctx, game.hazards);
    game.particles.draw(ctx);
    this.drawPlayer(ctx, game.player);
    if (game.screen === 'play') this.drawMouseBrush(ctx, game.input, game.ink);
    ctx.restore();
  }
}
