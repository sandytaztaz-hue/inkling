// INKLING — deterministic screenshot scenes. Each one plays the real rules
// forward from a fresh run for a fixed time, steered by a simple autopilot
// that paints bridges and walks to the portal, so every frame is what a
// short game really looks like and the same seed always gives the same frame.

import { STEP } from './config.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 3.5;
const STEP_LIMIT = 60 * 120;
const VICTORY_LIMIT = 60 * 480;

/** Is there solid ground (platform, crumble block or wet paint) near (x, y)? */
function solidAt(game, x, y) {
  for (const p of game.level.platforms) {
    if (x >= p.x && x <= p.x + p.w && p.y >= y - 6 && p.y <= y + 50) return true;
  }
  for (const c of game.hazards.crumbles) {
    if (c.gone) continue;
    if (x >= c.x && x <= c.x + c.w && c.y >= y - 6 && c.y <= y + 50) return true;
  }
  for (const stroke of game.paint.strokes) {
    for (const pt of stroke.points) {
      if (Math.abs(pt.x - x) < 14 && Math.abs(pt.y - y) < 24) return true;
    }
  }
  return false;
}

/** Is a higher platform's left edge just ahead of Pip? */
function higherLedgeAhead(game) {
  const p = game.player;
  if (!p.grounded) return false;
  for (const plat of game.level.platforms) {
    if (plat.y < p.bottom - 8 && plat.y > p.bottom - 160) {
      if (plat.x > p.x - 10 && plat.x < p.x + 70) return true;
    }
  }
  return false;
}

/** Is a spike's left edge just ahead of Pip's feet? */
function spikeAhead(game) {
  const p = game.player;
  if (!p.grounded) return false;
  for (const s of game.hazards.spikes) {
    if (s.x > p.x - 10 && s.x < p.x + 70 && Math.abs(s.y - p.bottom) < 30) return true;
  }
  return false;
}

/**
 * Steer like a careful player: paint a bridge whenever the ground runs out
 * ahead, walk right, hop up ledges and over spikes, wait out erasers, and
 * bounce off spring pads when the portal sits above Pip. Levels with an
 * apBounce step (Springboard) run a scripted amber bounce instead: paint
 * the amber pad, stand on it, jump straight up onto it, and drift right
 * off the bounce onto the high ledge.
 */
function autopilot(game) {
  const player = game.player;
  const input = game.input;
  const ap = game.__ap ?? (game.__ap = { phase: 'walk', paintT: 0, x0: 0, x1: 0, y: 0, jumpT: 0, level: -1, bounceTries: 0, jumpTime: -1, waitSince: null });
  game.__ap = ap;
  // A new level resets the autopilot's phase machine.
  if (ap.level !== game.levelIndex) {
    ap.level = game.levelIndex;
    ap.phase = 'walk';
    ap.paintT = 0;
    ap.jumpT = 0;
    ap.bounceTries = 0;
    ap.jumpTime = -1;
  }
  if (ap.phase === 'paint') {
    const t = Math.min(1, ap.paintT / 40);
    input.setMouse(ap.x0 + (ap.x1 - ap.x0) * t, ap.y, true);
    input.setKey('KeyD', false);
    input.setKey('Space', false);
    ap.paintT += 1;
    if (ap.paintT > 40) {
      input.setMouse(ap.x1, ap.y, false);
      ap.phase = 'walk';
    }
    return;
  }
  // --- scripted amber bounce (Springboard) ---
  const bounce = game.level.apBounce;
  if (bounce && ap.phase !== 'bounced') {
    if (ap.phase === 'walk' || ap.phase === 'bounceWalk') {
      // Walk right until the paint zone, then paint the amber pad.
      if (player.x < bounce.paintX0 - 30) {
        input.setKey('KeyD', true);
        input.setKey('KeyA', false);
        input.setKey('Space', false);
        return;
      }
      ap.phase = 'bouncePaint';
      ap.paintT = 0;
      return;
    }
    if (ap.phase === 'bouncePaint') {
      const t = Math.min(1, ap.paintT / 40);
      input.setMouse(bounce.paintX0 + (bounce.paintX1 - bounce.paintX0) * t, bounce.paintY, true);
      input.setKey('KeyD', false);
      input.setKey('Space', false);
      ap.paintT += 1;
      if (ap.paintT > 40) {
        input.setMouse(bounce.paintX1, bounce.paintY, false);
        ap.phase = 'bounceAim';
      }
      return;
    }
    if (ap.phase === 'bounceAim') {
      // Walk to the jump spot and come to a full stop first, so the jump
      // goes straight up and lands back on the amber pad.
      if (Math.abs(player.x - bounce.jumpX) > 12) {
        input.setKey('KeyD', player.x < bounce.jumpX);
        input.setKey('KeyA', player.x > bounce.jumpX);
        input.setKey('Space', false);
        return;
      }
      if (Math.abs(player.vx) > 20) {
        input.setKey('KeyD', false);
        input.setKey('KeyA', false);
        input.setKey('Space', false);
        return;
      }
      input.setKey('Space', true);
      ap.jumpTime = game.levelTime;
      ap.phase = 'bounceWait';
      return;
    }
    if (ap.phase === 'bounceWait') {
      input.setKey('KeyD', false);
      input.setKey('KeyA', false);
      // Release jump now: if Space stays held, Pip re-jumps the instant he
      // lands and never touches the amber pad.
      input.setKey('Space', false);
      // The bounce fired: drift right off it toward the high ledge.
      if (game.lastBounceAt > ap.jumpTime) {
        ap.phase = 'bounceDrift';
        return;
      }
      // Landed back without bouncing (missed the pad): retry.
      if (player.grounded && game.levelTime - ap.jumpTime > 1) {
        ap.bounceTries += 1;
        if (ap.bounceTries >= 5) {
          ap.phase = 'walkFree';
          return;
        }
        ap.phase = 'bounceAim';
      }
      return;
    }
    if (ap.phase === 'bounceDrift') {
      input.setKey('KeyD', true);
      input.setKey('KeyA', false);
      input.setKey('Space', false);
      // Landed on (or past) the high ledge: back to normal play.
      if (player.grounded && player.x > bounce.ledgeX) {
        ap.phase = 'bounced';
        return;
      }
      // Bounced short and landed back on the ground: retry the jump.
      if (player.grounded && player.x < bounce.ledgeX - 40 && game.levelTime - ap.jumpTime > 2.5) {
        ap.bounceTries += 1;
        if (ap.bounceTries >= 5) {
          ap.phase = 'walkFree';
          return;
        }
        ap.phase = 'bounceAim';
      }
      return;
    }
  }
  // The portal sits above Pip and a spring pad is in the level: bounce up.
  const portal = game.level.portal;
  const portalAbove = portal.y + 39 < player.y - 120;
  if (portalAbove && game.level.bouncePads.length > 0) {
    const pad = game.level.bouncePads[0];
    const padCx = pad.x + pad.w / 2;
    if (player.grounded && Math.abs(player.x - padCx) > 20) {
      input.setKey('KeyD', player.x < padCx);
      input.setKey('KeyA', player.x > padCx);
      input.setKey('Space', false);
      return;
    }
    if (!player.grounded) {
      // Airborne off the spring: drift right toward the high ledges.
      input.setKey('KeyD', true);
      input.setKey('KeyA', false);
      input.setKey('Space', false);
      return;
    }
  }
  // Walk phase. Wait out any eraser that drifts close to Pip — but never
  // forever: after 2.5s of waiting, walk anyway (a camping eraser must not
  // deadlock the run; the worst case is a lost life and a retry).
  const nearEraser = game.hazards.erasers.some(
    (e) => Math.hypot(e.x - player.x, e.y - player.y) < 130,
  );
  if (nearEraser) {
    if (ap.waitSince == null) ap.waitSince = game.levelTime;
  } else {
    ap.waitSince = null;
  }
  const waitTooLong = ap.waitSince != null && game.levelTime - ap.waitSince > 2.5;
  input.setKey('KeyD', !nearEraser || waitTooLong);
  input.setKey('KeyA', false);
  const feet = player.bottom;
  const portalX = game.level.portal.x;
  const farFromPortal = portalX - player.x > 120;
  if (player.grounded && farFromPortal && !solidAt(game, player.x + 70, feet)) {
    ap.phase = 'paint';
    ap.paintT = 0;
    ap.x0 = player.x + 10;
    ap.x1 = player.x + 240;
    ap.y = feet;
    input.setKey('KeyD', false);
    return;
  }
  if (ap.jumpT > 0) {
    input.setKey('Space', true);
    ap.jumpT -= 1;
  } else if (higherLedgeAhead(game) || spikeAhead(game)) {
    input.setKey('Space', true);
    ap.jumpT = 5;
  } else {
    input.setKey('Space', false);
  }
}

/** Step the game forward with the autopilot steering, up to `limit` steps. */
function simulate(game, limit, stopWhen) {
  game.shotLog = [];
  let prevLives = game.lives;
  for (let i = 0; i < limit; i++) {
    if (stopWhen && stopWhen(game)) break;
    if (game.screen === 'levelComplete') {
      // Record the honest per-level result before moving on.
      game.shotLog.push({
        event: 'clear',
        level: game.levelIndex + 1,
        name: game.level.name,
        time: +game.levelTime.toFixed(2),
        orbs: `${game.orbsGot}/${game.level.orbs.length}`,
        keys: `${game.keysGot}/${game.level.keys.length}`,
        ink: Math.ceil(game.ink),
        score: game.lastLevelScore,
        stars: game.lastStars,
      });
      game.nextLevel();
    }
    if (game.screen === 'play') autopilot(game);
    game.step(STEP);
    if (game.lives < prevLives) {
      game.shotLog.push({
        event: 'death',
        level: game.levelIndex + 1,
        lives: game.lives,
        x: Math.round(game.player.x),
        y: Math.round(game.player.y),
      });
    }
    prevLives = game.lives;
    if (game.screen === 'gameOver') {
      game.shotLog.push({ event: 'gameOver', level: game.levelIndex + 1 });
      break;
    }
    if (game.screen === 'victory') {
      game.shotLog.push({
        event: 'victory',
        totalTime: +game.totalTime.toFixed(2),
        totalScore: game.totalScore,
        totalOrbs: `${game.totalOrbs}/${game.totalOrbsPossible}`,
        totalStars: game.totalStars,
      });
      break;
    }
    if (i % 120 === 0 && game.shotLog.length < 900) {
      game.shotLog.push({
        t: +(i / 60).toFixed(1),
        screen: game.screen,
        level: game.levelIndex + 1,
        x: Math.round(game.player.x),
        y: Math.round(game.player.y),
        lives: game.lives,
        ink: Math.round(game.ink),
      });
    }
  }
  game.input.releaseAll();
}

/**
 * Set the game to the named scene (start, play, complete or victory; any
 * other name is start) by playing it forward from a fresh run.
 */
export function stageShot(name, game) {
  game.reset(game.seed);
  game.__ap = { phase: 'walk', paintT: 0, x0: 0, x1: 0, y: 0, jumpT: 0, level: -1, bounceTries: 0, jumpTime: -1, waitSince: null };
  if (name !== 'play' && name !== 'complete' && name !== 'victory') {
    for (let i = 0; i < START_SECONDS / STEP; i++) game.step(STEP);
    return;
  }
  game.startGame();
  if (name === 'play') {
    simulate(game, PLAY_SECONDS / STEP, null);
    return;
  }
  if (name === 'complete') {
    simulate(game, STEP_LIMIT, (g) => g.screen === 'levelComplete');
    for (let i = 0; i < 10; i++) game.step(STEP);
    return;
  }
  // victory: play the whole game for real, level 1 through level 20, so the
  // victory screen shows the true total time, orbs and score of a real run.
  game.startGame();
  simulate(game, VICTORY_LIMIT, (g) => g.screen === 'victory');
  for (let i = 0; i < 10; i++) game.step(STEP);
}
