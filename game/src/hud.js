// INKLING — the HUD and every menu screen. Text is big and high-contrast
// so each screen reads at a glance, even shrunk into a contact sheet.

import { COLORS, VIEW, INK } from './config.js';

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
    // Top strip: ink meter, level, orbs, timer, lives.
    ctx.fillStyle = 'rgba(10, 7, 18, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, 56);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${game.levelIndex + 1}/10 — ${game.level.name}`, 18, 35);
    // Ink meter.
    const barX = 430;
    const barW = 300;
    ctx.fillStyle = '#0b2430';
    ctx.fillRect(barX, 18, barW, 20);
    const frac = Math.max(0, game.ink / INK.max);
    ctx.fillStyle = game.ink < 20 ? COLORS.danger : COLORS.ink;
    ctx.fillRect(barX, 18, barW * frac, 20);
    ctx.strokeStyle = COLORS.paperWhite;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, 18, barW, 20);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('INK', barX - 44, 34);
    ctx.fillText(`${Math.ceil(game.ink)}`, barX + barW + 10, 34);
    // Orbs, timer, lives.
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.yellow;
    ctx.fillText(`● ${game.orbsGot}/${game.level.orbs.length}`, 830, 35);
    ctx.fillStyle = COLORS.paperWhite;
    ctx.fillText(`⏱ ${formatTime(game.levelTime)}`, 960, 35);
    ctx.fillStyle = COLORS.ink;
    let livesText = '';
    for (let i = 0; i < game.lives; i++) livesText += '● ';
    ctx.fillText(livesText.trim(), 1262, 35);
    // Hint line for the first seconds of a level.
    if (game.levelTime < 6 && game.screen === 'play') {
      ctx.fillStyle = COLORS.yellow;
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(game.level.hint, VIEW.width / 2, 92);
    }
    // Low-ink warning.
    if (game.ink < 20 && game.screen === 'play') {
      ctx.fillStyle = COLORS.danger;
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOW INK — grab an orb!', VIEW.width / 2, 118);
    }
  }

  drawTitle(ctx, game) {
    ctx.fillStyle = 'rgba(12, 8, 20, 0.74)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // A painted demo bridge across the title, so the idea reads instantly.
    // Pip stands on its left end, clear of the centred text lines.
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(180, 600);
    ctx.quadraticCurveTo(480, 575, 640, 600);
    ctx.quadraticCurveTo(840, 625, 1100, 590);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(250, 569, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(242, 561, 7, 0, Math.PI * 2);
    ctx.arc(260, 561, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10222e';
    ctx.beginPath();
    ctx.arc(243, 561, 3.5, 0, Math.PI * 2);
    ctx.arc(261, 561, 3.5, 0, Math.PI * 2);
    ctx.fill();

    title(ctx, 'INKLING', 190, 96, COLORS.ink);
    line(ctx, 'PAINT the path. Mind your ink.', 240, 30, COLORS.paperWhite);
    line(ctx, 'You are Pip, a little ink drop on dark paper. Paint platforms with the mouse', 300, 22);
    line(ctx, 'to reach the green EXIT portal. Paint dries and crumbles in 7 seconds.', 330, 22);
    line(ctx, 'Erasers eat paint. Spikes pop you. 10 levels. 3 lives each.', 360, 22);
    panel(ctx, 340, 400, 600, 130);
    line(ctx, 'MOVE  A / D  or  ← →        JUMP  W / ↑ / SPACE', 440, 21, COLORS.paperWhite);
    line(ctx, 'PAINT  hold mouse and drag        R restart    P pause    M mute', 472, 21, COLORS.paperWhite);
    line(ctx, 'Ink orbs refill your bottle — every stroke is a choice.', 504, 21, COLORS.yellow);
    const best = game.bestTotal;
    line(ctx, best ? `BEST TOTAL TIME: ${formatTime(best)}` : 'No run finished yet — be the first to paint home.', 570, 22, COLORS.paperWhite);
    const blink = Math.floor(game.titleTime * 2) % 2 === 0;
    if (blink) line(ctx, '— CLICK or press ENTER to play —', 662, 26, COLORS.ink);
  }

  drawLevelComplete(ctx, game) {
    ctx.fillStyle = 'rgba(12, 8, 20, 0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(ctx, 340, 150, 600, 380);
    title(ctx, 'LEVEL CLEAR!', 230, 58, COLORS.portal);
    line(ctx, `${game.level.name}  —  Level ${game.levelIndex + 1} of 10`, 300, 24, COLORS.paperWhite);
    line(ctx, `Time: ${formatTime(game.levelTime)}   (par ${formatTime(game.level.par)})`, 360, 24);
    line(ctx, `Orbs: ${game.orbsGot}/${game.level.orbs.length}`, 400, 24);
    line(ctx, `Ink left: ${Math.ceil(game.ink)}  —  bonus +${game.lastInkBonus}`, 440, 24);
    line(ctx, `Level score: ${game.lastLevelScore}      Total: ${game.totalScore}`, 480, 24, COLORS.yellow);
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
    panel(ctx, 290, 120, 700, 440);
    title(ctx, 'YOU PAINTED HOME!', 200, 56, COLORS.portal);
    line(ctx, 'All 10 levels cleared. Pip made it off the page.', 260, 24, COLORS.paperWhite);
    line(ctx, `Total time: ${formatTime(game.totalTime)}   (par ${formatTime(game.parTotal)})`, 320, 26);
    line(ctx, `Orbs collected: ${game.totalOrbs}/${game.totalOrbsPossible}`, 365, 24);
    line(ctx, `FINAL SCORE: ${game.totalScore}`, 415, 30, COLORS.yellow);
    if (game.newBest) line(ctx, '★ NEW BEST TOTAL TIME! ★', 460, 26, COLORS.yellow);
    else line(ctx, `Best total time: ${formatTime(game.bestTotal)}`, 460, 24);
    const blink = Math.floor(game.titleTime * 2) % 2 === 0;
    if (blink) line(ctx, '— Press R or CLICK to paint it all again —', 520, 24, COLORS.ink);
  }

  drawPaused(ctx, game) {
    ctx.fillStyle = 'rgba(10, 7, 18, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    title(ctx, 'PAUSED', 300, 64, COLORS.paperWhite);
    line(ctx, 'P — resume      R — restart level      M — mute', 370, 24);
  }
}
