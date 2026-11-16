// INKLING — all drawing. Dark paper with a faint grain and ruled lines,
// drifting ink motes and paper scraps, bright paint, and Pip the ink drop
// with eyes that look where he moves. Each chapter tints the whole page
// its own colour, so the journey home reads at a glance.

import { COLORS, VIEW } from './config.js';
import { CHAPTERS } from './levels.js';

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
    this.motes = [];
    this.scraps = [];
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
    // Ambient drift: ink motes and torn paper scraps that float across the
    // page forever, seeded so the same seed paints the same scene.
    this.motes = [];
    for (let i = 0; i < 42; i++) {
      this.motes.push({
        x: rng() * VIEW.width,
        y: rng() * VIEW.height,
        r: 1 + rng() * 2.4,
        phase: rng() * Math.PI * 2,
        speed: 6 + rng() * 14,
        alpha: 0.1 + rng() * 0.22,
      });
    }
    this.scraps = [];
    for (let i = 0; i < 7; i++) {
      this.scraps.push({
        x: rng() * VIEW.width,
        y: rng() * VIEW.height,
        w: 26 + rng() * 40,
        h: 16 + rng() * 22,
        rot: (rng() - 0.5) * 0.9,
        phase: rng() * Math.PI * 2,
        speed: 4 + rng() * 8,
      });
    }
  }

  chapter(level) {
    return CHAPTERS[level.chapter ?? 0] ?? CHAPTERS[0];
  }

  drawBackground(ctx, level) {
    const ch = this.chapter(level);
    ctx.fillStyle = ch.paper;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Faint ruled paper lines.
    ctx.strokeStyle = ch.paperLine;
    ctx.lineWidth = 1;
    for (let y = 90; y < VIEW.height; y += 90) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.width, y);
      ctx.stroke();
    }
    // Drifting paper scraps, pale and slow.
    ctx.save();
    for (const s of this.scraps) {
      const x = (s.x + Math.sin(this.time * 0.1 + s.phase) * 26 + VIEW.width) % VIEW.width;
      const y = (s.y + this.time * s.speed * 0.2) % (VIEW.height + 60) - 30;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.rot + Math.sin(this.time * 0.15 + s.phase) * 0.08);
      ctx.fillStyle = COLORS.paperWhite;
      ctx.globalAlpha = 0.045;
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }
    ctx.restore();
    // Drifting ink motes in the chapter's accent colour.
    ctx.save();
    ctx.fillStyle = ch.accent;
    for (const m of this.motes) {
      const x = (m.x + this.time * m.speed + Math.sin(this.time * 0.4 + m.phase) * 18 + VIEW.width) % VIEW.width;
      const y = (m.y + Math.sin(this.time * 0.3 + m.phase) * 14 + VIEW.height) % VIEW.height;
      ctx.globalAlpha = m.alpha * (0.7 + 0.3 * Math.sin(this.time * 0.8 + m.phase));
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Chapter 4, "The Last Page", is dawn gold: a low gold sun rises
    // over the page, warm lanterns hang from the top edge and extra
    // golden motes drift through the light, so the finale reads bright
    // and dense instead of dark and empty.
    if ((level.chapter ?? 0) === 3) {
      ctx.save();
      const sun = ctx.createRadialGradient(1080, 100, 10, 1080, 100, 190);
      sun.addColorStop(0, 'rgba(255, 214, 90, 0.55)');
      sun.addColorStop(0.45, 'rgba(255, 196, 70, 0.22)');
      sun.addColorStop(1, 'rgba(255, 196, 70, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(880, -20, 400, 320);
      ctx.fillStyle = '#ffd65a';
      ctx.beginPath();
      ctx.arc(1080, 100, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(1080, 100, 36, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const lx = 140 + i * 250;
        const sway = Math.sin(this.time * 0.7 + i * 1.3) * 6;
        const ly = 96 + Math.sin(this.time * 0.5 + i) * 4;
        ctx.strokeStyle = '#8a5c00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 56);
        ctx.lineTo(lx + sway, ly - 14);
        ctx.stroke();
        ctx.fillStyle = '#ffcf4d';
        ctx.beginPath();
        ctx.arc(lx + sway, ly, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.arc(lx + sway, ly, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#ffd23e';
        ctx.beginPath();
        ctx.arc(lx + sway, ly, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Extra golden motes, denser than the chapter-neutral drift.
      ctx.fillStyle = '#ffd23e';
      for (let i = 0; i < 26; i++) {
        const mx = (i * 173 + this.time * (8 + i * 0.7)) % VIEW.width;
        const my = (i * 97 + Math.sin(this.time * 0.6 + i * 1.9) * 22 + VIEW.height) % VIEW.height;
        ctx.globalAlpha = 0.12 + 0.1 * Math.sin(this.time * 1.4 + i);
        ctx.beginPath();
        ctx.arc(mx, my, 1.6 + (i % 3) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
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
      const drift = zone.gust ? this.time * 40 : 0;
      for (let i = 0; i < 4; i++) {
        const y = zone.y + 40 + i * 70 + Math.sin(this.time * 2 + i) * 8;
        const x0 = zone.x + 20 + ((drift + i * 37) % 60) - 30;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(Math.min(zone.x + zone.w - 20, x0 + 120), y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawPlatforms(ctx, level) {
    const ch = this.chapter(level);
    for (const p of level.platforms) {
      ctx.fillStyle = ch.platform;
      roundRect(ctx, p.x, p.y, p.w, p.h, 8);
      ctx.fill();
      ctx.fillStyle = ch.platformTop;
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

  drawCrumbles(ctx, hazards) {
    for (const c of hazards.crumbles) {
      if (c.gone) continue;
      // The block cracks more as its clock runs down.
      const crack = c.touched ? Math.min(1, c.t / 1.2) : 0;
      ctx.save();
      ctx.globalAlpha = 1 - crack * 0.35;
      ctx.fillStyle = '#8d7fb5';
      roundRect(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.fill();
      ctx.fillStyle = '#b3a6d6';
      ctx.fillRect(c.x + 4, c.y, c.w - 8, 6);
      if (crack > 0) {
        ctx.strokeStyle = '#241d33';
        ctx.lineWidth = 2;
        const n = 1 + Math.floor(crack * 4);
        for (let i = 0; i < n; i++) {
          const x = c.x + ((i + 0.5) * c.w) / n;
          ctx.beginPath();
          ctx.moveTo(x - 6, c.y + 4);
          ctx.lineTo(x + 4, c.y + 12);
          ctx.lineTo(x - 3, c.y + c.h - 4);
          ctx.stroke();
        }
      }
      ctx.restore();
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

  drawSpikes(ctx, hazards) {
    for (const s of hazards.spikes) {
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

  drawKeys(ctx, keys, taken) {
    keys.forEach((key, i) => {
      if (taken[i]) return;
      const bob = Math.sin(this.time * 3 + i * 1.7) * 5;
      const pulse = 1 + Math.sin(this.time * 4 + i) * 0.1;
      ctx.save();
      ctx.translate(key.x, key.y + bob);
      ctx.scale(pulse, pulse);
      ctx.rotate(Math.sin(this.time * 2 + i) * 0.15);
      ctx.strokeStyle = COLORS.yellow;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      // Bow.
      ctx.beginPath();
      ctx.arc(-8, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      // Stem and teeth.
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 0);
      ctx.moveTo(14, 0);
      ctx.lineTo(14, 7);
      ctx.moveTo(20, 0);
      ctx.lineTo(20, 7);
      ctx.stroke();
      ctx.fillStyle = '#fff7cc';
      ctx.beginPath();
      ctx.arc(-8, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawPortal(ctx, portal, locked, keysLeft) {
    const pulse = 1 + Math.sin(this.time * 3) * 0.06;
    const cx = portal.x + 27;
    const cy = portal.y + 39;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    if (locked) {
      // A shut door: grey ring, padlock, and how many keys are still out.
      ctx.strokeStyle = '#8d84a3';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#8d84a3';
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(-7, -4, 14, 12);
      ctx.strokeStyle = COLORS.yellow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -6, 6, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#eafff5';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`LOCKED ${keysLeft}`, 0, 52);
    } else {
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
    }
    ctx.restore();
  }

  /** Draw the golden rain: falling drops, and the temporary platforms. */
  drawRain(ctx, game) {
    const rain = game.hazards ? game.hazards.rain : null;
    if (!rain || rain.showers.length === 0) return;
    const levelTime = game.levelTime;
    for (const s of rain.showers) {
      // Falling golden drops inside the shower's column, always.
      ctx.save();
      ctx.strokeStyle = '#ffd23e';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const dx = s.x + ((i * 37 + s.x) % s.w);
        const fall = ((this.time * 260 + i * 53) % 320);
        const y0 = s.y - 300 + fall;
        if (y0 < s.y - 4) {
          ctx.beginPath();
          ctx.moveTo(dx, y0);
          ctx.lineTo(dx, y0 + 14);
          ctx.stroke();
        }
      }
      ctx.restore();
      // The platform itself, only while the shower is wet — fading and
      // cracking as it dries, so its 5-second life reads on screen.
      const wet = rain.wetness(s, levelTime);
      if (wet <= 0) continue;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * wet;
      ctx.fillStyle = '#ffcf4d';
      roundRect(ctx, s.x, s.y, s.w, s.h, 8);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(s.x + 4, s.y, s.w - 8, 5);
      ctx.fillStyle = '#8a5c00';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.9 * wet;
      ctx.fillText('INK RAIN', s.x + s.w / 2, s.y - 8);
      ctx.restore();
    }
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

  drawMouseBrush(ctx, input, ink, brushColor) {
    if (ink <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(input.mouseX, input.mouseY, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = brushColor;
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
    this.drawCrumbles(ctx, game.hazards);
    this.drawMovers(ctx, game.hazards);
    this.drawBouncePads(ctx, game.level);
    this.drawSpikes(ctx, game.hazards);
    game.paint.draw(ctx);
    this.drawOrbs(ctx, game.level.orbs, game.orbsTaken);
    this.drawKeys(ctx, game.level.keys, game.keysTaken);
    this.drawPortal(ctx, game.level.portal, game.portalLocked(), game.keysLeft());
    this.drawErasers(ctx, game.hazards);
    if (game.fountains) game.fountains.draw(ctx, this.time);
    if (game.boats) game.boats.draw(ctx, this.time);
    if (game.king) game.king.draw(ctx, this.time);
    this.drawRain(ctx, game);
    game.particles.draw(ctx);
    this.drawPlayer(ctx, game.player);
    if (game.screen === 'play') this.drawMouseBrush(ctx, game.input, game.ink, game.brushColor());
    ctx.restore();
  }
}
