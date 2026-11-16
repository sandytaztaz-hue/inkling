// INKLING — the HUD and every menu screen. Text is big and high-contrast
// so each screen reads at a glance, even shrunk into a contact sheet.

import { COLORS, VIEW, INK, LEVEL_COUNT, PAINT_COLORS } from './config.js';
import { CHAPTERS, CHAPTER_STARTS } from './levels.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10, 7, 18, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function title(ctx, text, y, size, color) {
  ctx.fillStyle = color ?? COLORS.paperWhite;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW.width / 2, y);
}

// A dark backing plate behind a centred HUD line, so gold text reads
// cleanly over ANY backdrop. Chapter 4's hanging lanterns sit exactly on
// the hint/objective rows (lantern centres y ~96, glow r 44) and their
// glow used to wash the words out mid-line; the plate is measured from
// the text itself, so it fits every line and never covers more of the
// scene than the words need. The scene itself is untouched — no global
// brightening, so the cyan bridge keeps its colour.
function backedText(ctx, text, y, size, color) {
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width;
  const padX = 14;
  const padY = 7;
  ctx.fillStyle = 'rgba(10, 7, 18, 0.78)';
  ctx.fillRect(VIEW.width / 2 - w / 2 - padX, y - size - padY, w + padX * 2, size + padY * 2);
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW.width / 2, y);
}

function line(ctx, text, y, size, color) {
  ctx.fillStyle = color ?? COLORS.textDim;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW.width / 2, y);
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export class Hud {
  drawBar(ctx, game) {
    // Top strip: chapter + level, ink meter in the brush colour, keys,
    // orbs, timer, lives.
    ctx.fillStyle = 'rgba(10, 7, 18, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, 56);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    const ch = CHAPTERS[game.level.chapter ?? 0];
    ctx.fillText(`CH${(game.level.chapter ?? 0) + 1} · LV ${game.levelIndex + 1}/${LEVEL_COUNT} — ${game.level.name}`, 18, 35);
    // Ink meter, coloured by the brush in hand.
    const barX = 470;
    const barW = 250;
    ctx.fillStyle = '#0b2430';
    ctx.fillRect(barX, 18, barW, 20);
    const frac = Math.max(0, game.ink / INK.max);
    ctx.fillStyle = game.ink < 20 ? COLORS.danger : game.brushColor();
    ctx.fillRect(barX, 18, barW * frac, 20);
    ctx.strokeStyle = COLORS.paperWhite;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, 18, barW, 20);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('INK', barX - 44, 34);
    ctx.fillText(`${Math.ceil(game.ink)}`, barX + barW + 10, 34);
    // Brush dot + short colour name, right of the ink number.
    ctx.textAlign = 'left';
    ctx.fillStyle = game.brushColor();
    ctx.beginPath();
    ctx.arc(772, 28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(game.brush.toUpperCase(), 786, 34);
    ctx.textAlign = 'right';
    if (game.level.keys.length > 0) {
      ctx.fillStyle = COLORS.yellow;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🔑 ${game.keysGot}/${game.level.keys.length}`, 900, 35);
    }
    ctx.fillStyle = COLORS.yellow;
    ctx.fillText(`● ${game.orbsGot}/${game.level.orbs.length}`, 990, 35);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.fillText(`⏱ ${formatTime(game.levelTime)}`, 1090, 35);
    // Deaths this run: the King and the spikes both cost Pip dearly.
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`☠ ${game.deaths ?? 0}`, 1160, 35);
    ctx.fillStyle = COLORS.ink;
    let livesText = '';
    for (let i = 0; i < game.lives; i++) livesText += '● ';
    ctx.fillText(livesText.trim(), 1262, 35);
    // Minimap strip: the whole level at a glance — platforms, portal,
    // keys, fountains, boats, the King, and Pip himself.
    this.drawMinimap(ctx, game);
    // Objective banner: what Pip has to do on this level, right under
    // the bar, so the goal reads even on a still screenshot.
    if (game.screen === 'play') {
      const keysLeft = game.keysLeft();
      const objective =
        keysLeft > 0
          ? (game.level.chapter === 3 ? 'PAINT THE LAST PAGE — ' : 'FIND THE KEYS — ') +
            `${keysLeft} KEY${keysLeft > 1 ? 'S' : ''} LEFT`
          : 'REACH THE EXIT PORTAL';
      backedText(ctx, objective, 120, 17, (game.level.chapter ?? 0) === 3 ? COLORS.yellow : COLORS.paperWhite);
    }
    // Event log: the last two things that happened, bottom-left.
    this.drawEventLog(ctx, game);
    // Hint line for the first seconds of a level — on a backing plate,
    // so the lantern row never eats the words.
    if (game.levelTime < 6 && game.screen === 'play') {
      backedText(ctx, game.level.hint, 92, 19, COLORS.yellow);
    }
    // Low-ink warning.
    if (game.ink < 20 && game.screen === 'play') {
      backedText(ctx, 'LOW INK — grab an orb!', 118, 19, COLORS.danger);
    }
  }

  /** The minimap strip: the whole level, scaled, along the bottom. */
  drawMinimap(ctx, game) {
    const mx = 440;
    const my = 690;
    const mw = 400;
    const mh = 22;
    const sx = (x) => mx + (x / VIEW.width) * mw;
    const sy = (y) => my + (y / VIEW.height) * mh;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 7, 18, 0.66)';
    ctx.fillRect(mx - 8, my - 4, mw + 16, mh + 8);
    ctx.strokeStyle = 'rgba(244, 239, 230, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 8, my - 4, mw + 16, mh + 8);
    // Platforms and crumble blocks.
    ctx.fillStyle = 'rgba(244, 239, 230, 0.55)';
    for (const p of game.level.platforms) ctx.fillRect(sx(p.x), sy(p.y), Math.max(2, (p.w / VIEW.width) * mw), 3);
    if (game.hazards) {
      for (const c of game.hazards.crumbles) {
        if (!c.gone) ctx.fillRect(sx(c.x), sy(c.y), Math.max(2, (c.w / VIEW.width) * mw), 3);
      }
    }
    // Fountains (gold squares), boats (gold ticks), rain (gold dashes).
    ctx.fillStyle = COLORS.yellow;
    if (game.fountains) {
      for (const f of game.fountains.pools) ctx.fillRect(sx(f.x), sy(f.y) - 2, 5, 5);
    }
    if (game.boats) {
      for (const b of game.boats.boats) ctx.fillRect(sx(b.x), sy(b.y) - 2, Math.max(4, (b.w / VIEW.width) * mw), 3);
    }
    // Keys still out, as gold diamonds.
    game.level.keys.forEach((key, i) => {
      if (game.keysTaken[i]) return;
      ctx.save();
      ctx.translate(sx(key.x), sy(key.y));
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    });
    // The portal: a green ring.
    const portal = game.level.portal;
    ctx.strokeStyle = COLORS.portal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx(portal.x + 27), sy(portal.y + 39), 5, 0, Math.PI * 2);
    ctx.stroke();
    // The Eraser King: a purple square with a gold crown dot.
    if (game.king) {
      for (const k of game.king.kings) {
        ctx.fillStyle = COLORS.eraser;
        ctx.fillRect(sx(k.x) - 4, sy(k.y) - 4, 8, 8);
        ctx.fillStyle = COLORS.yellow;
        ctx.fillRect(sx(k.x) - 2, sy(k.y) - 7, 4, 3);
      }
    }
    // Pip: a bright cyan dot, always visible.
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(sx(game.player.x), sy(game.player.y), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MAP', mx - 8, my - 10);
    ctx.restore();
  }

  /** The event log: the last two things that happened, bottom-left. */
  drawEventLog(ctx, game) {
    const log = game.eventLog ?? [];
    if (log.length === 0) return;
    ctx.save();
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    const recent = log.slice(-2);
    recent.forEach((entry, i) => {
      const age = (game.titleTime ?? 0) - entry.at;
      if (age > 5) return;
      ctx.globalAlpha = Math.max(0.25, 1 - age / 5);
      ctx.fillStyle = entry.color ?? COLORS.yellow;
      ctx.fillText(entry.text, 18, 664 + i * 22);
    });
    ctx.restore();
  }

  /** Chapter + level name card shown on entry to a level. */
  drawIntro(ctx, game) {
    if (game.levelTime >= 2.5 || game.screen !== 'play') return;
    const ch = CHAPTERS[game.level.chapter ?? 0];
    const firstOfChapter = game.levelIndex === CHAPTER_STARTS[game.level.chapter ?? 0];
    const fade = game.levelTime < 0.3 ? game.levelTime / 0.3 : game.levelTime > 2.0 ? (2.5 - game.levelTime) / 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, fade));
    ctx.fillStyle = 'rgba(10, 7, 18, 0.66)';
    ctx.fillRect(0, 210, VIEW.width, firstOfChapter ? 150 : 110);
    ctx.fillStyle = ch.accent;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.tag, VIEW.width / 2, 252);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = `bold ${firstOfChapter ? 44 : 38}px sans-serif`;
    ctx.fillText(`${game.levelIndex + 1}. ${game.level.name}`, VIEW.width / 2, 300);
    if (firstOfChapter) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '22px sans-serif';
      ctx.fillText(ch.story, VIEW.width / 2, 338);
    }
    // The Eraser King speaks when Pip first meets him (level 25).
    if (game.level.kingLine) {
      ctx.fillStyle = COLORS.eraser;
      ctx.font = 'italic bold 22px sans-serif';
      ctx.fillText(`“${game.level.kingLine}” — THE ERASER KING`, VIEW.width / 2, 338);
    }
    ctx.restore();
  }

  drawTitle(ctx, game) {
    ctx.fillStyle = 'rgba(12, 8, 20, 0.74)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // A painted demo bridge across the title in all three brush colours,
    // so the paint verb — and the colours — read instantly.
    const segments = [
      { x0: 180, x1: 480, color: COLORS.ink },
      { x0: 480, x1: 800, color: PAINT_COLORS.amber.color },
      { x0: 800, x1: 1100, color: PAINT_COLORS.violet.color },
    ];
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.lineCap = 'round';
    for (const s of segments) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(s.x0, 662);
      ctx.quadraticCurveTo((s.x0 + s.x1) / 2, 642, s.x1, 662);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(250, 631, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(242, 623, 7, 0, Math.PI * 2);
    ctx.arc(260, 623, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10222e';
    ctx.beginPath();
    ctx.arc(243, 623, 3.5, 0, Math.PI * 2);
    ctx.arc(261, 623, 3.5, 0, Math.PI * 2);
    ctx.fill();

    title(ctx, 'INKLING', 168, 92, COLORS.ink);
    line(ctx, 'PAINT YOUR WAY HOME: THE LAST PAGE', 206, 26, COLORS.yellow);
    line(ctx, 'PAINT the path. Mind your ink.', 238, 28, COLORS.paperWhite);
    line(ctx, 'You are Pip, a little ink drop on dark paper. Paint platforms with the mouse', 272, 20);
    line(ctx, 'to reach the green EXIT portal. Paint dries and crumbles — amber bounces, violet lasts.', 296, 20);
    // The four chapters, with a key to jump straight to one.
    line(ctx, '1 · THE PAPER SEA — first strokes, wind and springs', 330, 20, CHAPTERS[0].accent);
    line(ctx, '2 · THE DRY WIND — keys, colours, thin ice', 354, 20, CHAPTERS[1].accent);
    line(ctx, '3 · HOME — everything at once, then home', 378, 20, CHAPTERS[2].accent);
    line(ctx, '4 · THE LAST PAGE — fountains, paper boats, THE ERASER KING', 402, 20, CHAPTERS[3].accent);
    line(ctx, '27 levels · 4 chapters · 3 lives each', 428, 20, COLORS.paperWhite);
    panel(ctx, 340, 452, 600, 118);
    line(ctx, 'MOVE  A / D  or  ← →        JUMP  W / ↑ / SPACE', 486, 20, COLORS.paperWhite);
    line(ctx, 'PAINT  hold mouse and drag        R restart    P pause    M mute', 516, 20, COLORS.paperWhite);
    line(ctx, 'BRUSH  1 cyan · 2 AMBER bounce · 3 VIOLET slow-dry', 546, 20, COLORS.yellow);
    const best = game.bestTotal;
    line(ctx, best ? `BEST TOTAL TIME: ${formatTime(best)}` : 'No run finished yet — be the first to paint home.', 600, 20, COLORS.paperWhite);
    line(ctx, 'Press 1 / 2 / 3 / 4 to start at a chapter — or CLICK / ENTER for level 1.', 630, 20, COLORS.ink);
    const blink = Math.floor(game.titleTime * 2) % 2 === 0;
    if (blink) line(ctx, '— CLICK or press ENTER to play —', 690, 26, COLORS.ink);
  }

  drawLevelComplete(ctx, game) {
    ctx.fillStyle = 'rgba(12, 8, 20, 0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(ctx, 340, 140, 600, 400);
    title(ctx, 'LEVEL CLEAR!', 220, 58, COLORS.portal);
    line(ctx, `${game.level.name}  —  Level ${game.levelIndex + 1} of ${LEVEL_COUNT}`, 290, 24, COLORS.paperWhite);
    line(ctx, `Time: ${formatTime(game.levelTime)}   (par ${formatTime(game.level.par)})`, 350, 24);
    line(ctx, `Orbs: ${game.orbsGot}/${game.level.orbs.length}`, 390, 24);
    if (game.level.keys.length > 0) {
      line(ctx, `Keys: ${game.keysGot}/${game.level.keys.length}`, 424, 24);
    }
    line(ctx, `Ink left: ${Math.ceil(game.ink)}  —  bonus +${game.lastInkBonus}`, 458, 24);
    line(ctx, `Deaths this run: ${game.deaths ?? 0}`, 484, 24, COLORS.danger);
    line(ctx, `Level score: ${game.lastLevelScore}      Total: ${game.totalScore}`, 498, 24, COLORS.yellow);
    const stars = '★'.repeat(game.lastStars) + '☆'.repeat(3 - game.lastStars);
    line(ctx, stars, 540, 34, COLORS.yellow);
    const blink = Math.floor(game.titleTime * 2) % 2 === 0;
    if (blink) line(ctx, '— ENTER or CLICK for the next level —', 592, 24, COLORS.ink);
  }

  drawGameOver(ctx, game) {
    ctx.fillStyle = 'rgba(20, 4, 8, 0.7)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(ctx, 340, 170, 600, 340);
    title(ctx, 'PIP POPPED!', 250, 58, COLORS.danger);
    line(ctx, `Out of lives on Level ${game.levelIndex + 1} — ${game.level.name}`, 320, 24, COLORS.paperWhite);
    line(ctx, `Score so far: ${game.totalScore}`, 370, 24);
    line(ctx, 'The paint dries. The page waits. Try again.', 410, 22);
    const blink = Math.floor(game.titleTime * 2) % 2 === 0;
    if (blink) line(ctx, '— Press R or CLICK to retry the level —', 480, 24, COLORS.ink);
  }

  drawVictory(ctx, game) {
    ctx.fillStyle = 'rgba(8, 18, 12, 0.66)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(ctx, 290, 110, 700, 470);
    title(ctx, 'YOU PAINTED HOME!', 190, 56, COLORS.portal);
    line(ctx, `All ${LEVEL_COUNT} levels cleared. Pip made it off the page.`, 250, 24, COLORS.paperWhite);
    line(ctx, `Total time: ${formatTime(game.totalTime)}   (par ${formatTime(game.parTotal)})`, 310, 26);
    line(ctx, `Orbs collected: ${game.totalOrbs}/${game.totalOrbsPossible}`, 355, 24);
    line(ctx, `Stars: ${game.totalStars}/${LEVEL_COUNT * 3}  ★`, 395, 24, COLORS.yellow);
    line(ctx, `FINAL SCORE: ${game.totalScore}`, 440, 30, COLORS.yellow);
    // Pip's farewell note to the player — the last page, signed.
    line(ctx, '“Dear painter — you carried me home, one stroke at a time.”', 478, 20, COLORS.paperWhite);
    line(ctx, '“The King can erase the road, but never the hand that paints it. — Pip”', 504, 20, COLORS.textDim);
    if (game.newBest) line(ctx, '★ NEW BEST TOTAL TIME! ★', 532, 26, COLORS.yellow);
    else line(ctx, `Best total time: ${formatTime(game.bestTotal)}`, 532, 24);
    const blink = Math.floor(game.titleTime * 2) % 2 === 0;
    if (blink) line(ctx, '— Press R or CLICK to paint it all again —', 566, 24, COLORS.ink);
  }

  drawPaused(ctx, game) {
    ctx.fillStyle = 'rgba(10, 7, 18, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    title(ctx, 'PAUSED', 300, 64, COLORS.paperWhite);
    line(ctx, 'P — resume      R — restart level      M — mute', 370, 24);
  }
}
