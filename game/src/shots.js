// INKLING — deterministic screenshot scenes. Each one plays the real rules
// forward from a fresh run for a fixed time, steered by a simple autopilot
// that paints bridges and walks to the portal, so every frame is what a
// short game really looks like and the same seed always gives the same frame.

import { STEP } from './config.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 3.5;
const STEP_LIMIT = 60 * 120;
const VICTORY_LIMIT = 60 * 480;

/** Is there solid ground (platform, crumble block, boat, rain, wet paint) near (x, y)? */
function solidAt(game, x, y) {
  for (const p of game.level.platforms) {
    if (x >= p.x && x <= p.x + p.w && p.y >= y - 6 && p.y <= y + 50) return true;
  }
  for (const c of game.hazards.crumbles) {
    if (c.gone) continue;
    if (x >= c.x && x <= c.x + c.w && c.y >= y - 6 && c.y <= y + 50) return true;
  }
  // Paper boats count as ground while Pip could stand on one's deck.
  for (const b of game.boats?.boats ?? []) {
    if (x >= b.x && x <= b.x + b.w && b.y >= y - 6 && b.y <= y + 50) return true;
  }
  // Golden rain platforms count only while the shower is wet.
  for (const s of game.hazards.rain?.solidNow(game.levelTime) ?? []) {
    if (x >= s.x && x <= s.x + s.w && s.y >= y - 6 && s.y <= y + 50) return true;
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
 * bounce off spring pads when the portal sits above Pip. Chapter 4 adds
 * three habits: drink at a fountain when the bottle runs low, wait on a
 * paper boat until it reaches the far side, and jump clean over the
 * Eraser King when he looms ahead. Levels with an apBounce step
 * (Springboard) run a scripted amber bounce instead: paint the amber pad,
 * stand on it, jump straight up onto it, and drift right off the bounce
 * onto the high ledge.
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
    ap.paintLen = 40;
    ap.noPaintUntil = 0;
    ap.jumpT = 0;
    ap.bounceTries = 0;
    ap.jumpTime = -1;
  }
  if (ap.phase === 'paint') {
    const t = Math.min(1, ap.paintT / (ap.paintLen ?? 40));
    input.setMouse(ap.x0 + (ap.x1 - ap.x0) * t, ap.y, true);
    input.setKey('KeyD', false);
    input.setKey('Space', false);
    ap.paintT += 1;
    // Chapter 4: never stand still painting while the King closes in.
    // A chasing King covers 130 px a second; abort the stroke the moment
    // he is within 120 px, and do not start another stroke for 0.6 s —
    // walk instead, so Pip outruns him. Without the cooldown, the abort
    // re-triggers on the very next tick and Pip freezes in place, still
    // painting nothing, while the King walks up and touches him. (Round 4
    // lesson: two L26 deaths from exactly that frozen paint-abort loop —
    // one with the King walking up to a frozen Pip, one with the King
    // clamped at his patrol end 53 px behind a Pip who could not paint.)
    const kingNear = game.king?.king;
    if (kingNear && Math.hypot(kingNear.x - player.x, kingNear.y - player.y) < 120) {
      input.setMouse(ap.x1, ap.y, false);
      ap.phase = 'walk';
      ap.noPaintUntil = game.levelTime + 0.6;
      return;
    }
    if (ap.paintT > (ap.paintLen ?? 40)) {
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
  // Chapter 4: drink at a fountain when the bottle is low. Standing in
  // the glow refills 25 ink a second; linger until the bottle is nearly
  // full (or 2.5 s, whichever comes first), then paint on.
  if (game.fountainRefill && game.ink < 85) {
    if (ap.fountainSince == null) ap.fountainSince = game.levelTime;
    if (game.levelTime - ap.fountainSince < 2.5) {
      input.setKey('KeyD', false);
      input.setKey('KeyA', false);
      input.setKey('Space', false);
      return;
    }
  } else {
    ap.fountainSince = null;
  }
  // Chapter 4: riding a paper boat, wait for the far side. Stepping off
  // early means falling in the river; the boat turns at its far end, and
  // the far platform is solid ground from the boat's right edge.
  const ridingBoat = player.groundPlatform && game.boats && game.boats.boats.includes(player.groundPlatform);
  if (ridingBoat) {
    const boat = player.groundPlatform;
    const farEdge = boat.x + boat.w;
    // The far platform sits a little above the deck, so check the ground
    // a touch above deck height, not at it.
    if (!solidAt(game, farEdge + 30, boat.y - 24) && farEdge < 1240) {
      input.setKey('KeyD', false);
      input.setKey('KeyA', false);
      input.setKey('Space', false);
      return;
    }
  }
  input.setKey('KeyD', !nearEraser || waitTooLong);
  input.setKey('KeyA', false);
  const feet = player.bottom;
  const portalX = game.level.portal.x;
  const farFromPortal = portalX - player.x > 120;
  // Chapter 4: a paper boat is the only way across — walk to the very
  // edge, then wait for the boat to come to its left end before stepping
  // off onto it. (Round 4 lesson: Pip walked off a bridge end at x714
  // while the boat was already sailing away, and fell in the river — and
  // the first version of this wait stalled, because Pip stopped 70 px
  // short of the edge, where the boat's left end never reaches. Pip must
  // wait AT the edge, and step off only when the boat is at its left end:
  // he lands about 40 px past the edge, inside the deck.)
  const boatAhead = (game.boats?.boats ?? []).find(
    (b) => b.x + b.w > player.x + 40 && b.x < player.x + 280 && Math.abs(b.y - feet) < 60,
  );
  if (player.grounded && farFromPortal && !solidAt(game, player.x + 70, feet) && boatAhead) {
    if (solidAt(game, player.x + 30, feet)) {
      // Still ground under the near step: walk to the very edge first.
      input.setKey('KeyD', true);
      input.setKey('KeyA', false);
      input.setKey('Space', false);
      return;
    }
    if (boatAhead.x <= 390) {
      // The boat is at its left end, under the step-off point: board it.
      input.setKey('KeyD', true);
      input.setKey('KeyA', false);
      input.setKey('Space', false);
      return;
    }
    // The boat is away: wait at the edge for it to come back.
    input.setKey('KeyD', false);
    input.setKey('KeyA', false);
    input.setKey('Space', false);
    return;
  }
  // Chapter 4: when the King is chasing close behind, paint in SHORT
  // bursts — a 130 px stroke in a third of a second, then run. Pip never
  // stops long enough for the King to reach him, and never walks off a
  // bridge end with no paint: each burst buys the next stretch of road.
  // Each burst-and-run cycle gains ~30 px of separation, so the chase
  // breaks after two or three bursts and normal painting resumes.
  const king = game.king?.king;
  const kingChasingNear =
    king && king.chasing && Math.hypot(king.x - player.x, king.y - player.y) < 260;
  if (
    player.grounded &&
    farFromPortal &&
    !solidAt(game, player.x + 70, feet) &&
    game.levelTime >= (ap.noPaintUntil ?? 0)
  ) {
    ap.phase = 'paint';
    ap.paintT = 0;
    ap.paintLen = kingChasingNear ? 20 : 40;
    ap.x0 = player.x + 10;
    ap.x1 = player.x + (kingChasingNear ? 130 : 240);
    ap.y = feet;
    input.setKey('KeyD', false);
    return;
  }
  // Chapter 4: in the no-paint cooldown after a King abort, the ground
  // may run out under Pip's feet — jump right instead of painting. The
  // jump carries him ~216 px, over the rest of the gap and onto the far
  // side, instead of walking off the bridge end while he cannot paint.
  if (
    player.grounded &&
    farFromPortal &&
    !solidAt(game, player.x + 70, feet) &&
    game.levelTime < (ap.noPaintUntil ?? 0)
  ) {
    input.setKey('KeyD', true);
    input.setKey('KeyA', false);
    input.setKey('Space', true);
    ap.jumpT = 5;
    return;
  }
  if (ap.jumpT > 0) {
    input.setKey('Space', true);
    ap.jumpT -= 1;
  } else if (higherLedgeAhead(game) || spikeAhead(game) || game.king?.kingAhead(player, 120)) {
    // The King is just ahead: jump clean over his crown. The jump is
    // timed to 120 px, not further: a King patrolling AWAY from Pip is
    // still moving right when Pip passes over him, so a jump started
    // from 140 px meets him on the way down, at his own height — a jump
    // from 120 px passes over him while Pip is still high. (Round 4
    // lesson: three identical King deaths at y~550, all from 140 px.)
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
        x: game.lastDeath ? game.lastDeath.x : Math.round(game.player.x),
        y: game.lastDeath ? game.lastDeath.y : Math.round(game.player.y),
        cause: game.lastDeath ? game.lastDeath.cause : '?',
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
    if (i % 6 === 0 && game.shotLog.length < 4000) {
      game.shotLog.push({
        t: +(i / 60).toFixed(1),
        screen: game.screen,
        level: game.levelIndex + 1,
        x: Math.round(game.player.x),
        y: Math.round(game.player.y),
        lives: game.lives,
        ink: Math.round(game.ink),
        king: game.king?.king ? { x: Math.round(game.king.king.x), c: game.king.king.chasing } : null,
        ap: game.__ap?.phase,
        pt: game.__ap?.paintT,
      });
    }
  }
  game.input.releaseAll();
}

/**
 * Set the game to the named scene (start, play, complete, victory, action,
 * fountain or king; any other name is start) by playing it forward from a
 * fresh run. The Chapter 4 scenes are staged on their own levels:
 * action = level 25 with the King, fountain = level 23 on a paper boat,
 * king = level 27, the finale chase. Every scene is real play — the
 * autopilot (or a small input driver) steers the real game, never a
 * hand-posed frame.
 */
export function stageShot(name, game) {
  game.reset(game.seed);
  game.__ap = { phase: 'walk', paintT: 0, x0: 0, x1: 0, y: 0, jumpT: 0, level: -1, bounceTries: 0, jumpTime: -1, waitSince: null, fountainSince: null };
  if (name !== 'play' && name !== 'complete' && name !== 'victory' && name !== 'action' && name !== 'fountain' && name !== 'king') {
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
  if (name === 'action') {
    stageActionShot(game);
    return;
  }
  if (name === 'fountain') {
    stageFountainShot(game);
    return;
  }
  if (name === 'king') {
    stageKingShot(game);
    return;
  }
  // victory: play the whole game for real, level 1 through level 27, so the
  // victory screen shows the true total time, orbs and score of a real run.
  game.startGame();
  simulate(game, VICTORY_LIMIT, (g) => g.screen === 'victory');
  for (let i = 0; i < 10; i++) game.step(STEP);
}

/** Play forward to a level, then hand over to a scene driver. */
function reachLevel(game, targetIndex) {
  game.startChapter(3);
  simulate(game, STEP_LIMIT, (g) => g.levelIndex === targetIndex && g.screen === 'play');
}

/**
 * Shot 0 — level 25, "The Eraser King Wakes": Pip MID-AIR over a fresh
 * golden bridge while the Eraser King chases behind him. The plain
 * autopilot plays the level; the frame is caught at the top of Pip's
 * jump over the King, with the bridge he just painted below him, the
 * fountain glow on the left bank, and the full HUD (minimap, objective
 * banner, event log) in frame. (Round 4 lesson: the first version of
 * this staging jumped WHILE painting — Pip jumped straight up out of a
 * paint stroke onto the King waiting below him, and died three times.
 * The jump over the King is the shot; the bridge below him is the paint.)
 */
function stageActionShot(game) {
  reachLevel(game, 24);
  const king = () => (game.king ? game.king.king : null);
  let retries = 0;
  for (let i = 0; i < 60 * 60 && retries < 3; i++) {
    if (game.screen === 'gameOver') {
      // The King got Pip three times: reload the level with fresh lives
      // and stage the scene again.
      game.loadLevel(24);
      game.__ap = { phase: 'walk', paintT: 0, x0: 0, x1: 0, y: 0, jumpT: 0, level: -1, bounceTries: 0, jumpTime: -1, waitSince: null, fountainSince: null, paintLen: 40, noPaintUntil: 0 };
      retries++;
      continue;
    }
    if (game.screen !== 'play') break;
    autopilot(game);
    game.step(STEP);
    const k = king();
    const midAir = !game.player.grounded && game.paint.strokes.length > 0;
    const kingBehind = k && k.x < game.player.x && game.player.x - k.x < 400;
    if (midAir && kingBehind) break;
    if (game.screen === 'levelComplete') {
      // Cleared the level before the frame came together: reload it and
      // try the scene again from the top.
      game.loadLevel(24);
      game.__ap = { phase: 'walk', paintT: 0, x0: 0, x1: 0, y: 0, jumpT: 0, level: -1, bounceTries: 0, jumpTime: -1, waitSince: null, fountainSince: null, paintLen: 40, noPaintUntil: 0 };
    }
  }
  game.input.releaseAll();
}

/**
 * Shot 2 — level 23, "Paper Boats": Pip riding a paper boat MID-RIVER
 * across the crossing, the ink fountain glowing on the far bank. The
 * driver walks Pip to the edge, waits for the boat to come to him,
 * steps aboard, and rides on until the boat's centre is mid-frame
 * (boat.x ≈ 540) before holding still for the frame — Pip centred and
 * clear of the minimap strip, not small at the boarding bank.
 */
function stageFountainShot(game) {
  for (let attempt = 0; attempt < 3; attempt++) {
    reachLevel(game, 22);
    const livesAtStart = game.lives;
    let onBoat = false;
    for (let i = 0; i < 60 * 30; i++) {
      if (game.screen !== 'play') break;
      const p = game.player;
      const input = game.input;
      const boat = game.boats.boats[0];
      const riding = p.groundPlatform && game.boats.boats.includes(p.groundPlatform);
      if (riding) {
        input.setKey('KeyD', false);
        input.setKey('KeyA', false);
        input.setKey('Space', false);
        // Ride on: the frame is taken mid-river, not at the boarding
        // bank. The boat runs x 380–700, so its centre crosses the
        // middle of the frame (x 640) at boat.x ≈ 540 — Pip standing
        // there reads centred, clear of the minimap strip, with the
        // fountain on the far bank in frame. (Round-4 fix: the first
        // staging shot the frame 20 steps after boarding, boat still
        // at the left bank — Pip small at the bottom edge, top of the
        // frame empty brown paper.)
        if (boat.x >= 520) {
          onBoat = true;
          // Hold still for a few frames, then take the shot.
          for (let j = 0; j < 10; j++) game.step(STEP);
          break;
        }
      }
      if (p.x < 320) {
        input.setKey('KeyD', true);
        input.setKey('KeyA', false);
        input.setKey('Space', false);
      } else if (boat && boat.x <= 400 && boat.dir === 1) {
        // The boat is coming to the left bank: step aboard.
        input.setKey('KeyD', true);
        input.setKey('KeyA', false);
        input.setKey('Space', false);
      } else {
        // Wait at the edge for the boat to come back.
        input.setKey('KeyD', false);
        input.setKey('KeyA', false);
        input.setKey('Space', false);
      }
      game.step(STEP);
      if (game.lives < livesAtStart) break;
    }
    game.input.releaseAll();
    if (onBoat) return;
  }
}

/**
 * Shot 3 — level 27, "Home, At Last": the finale chase. The autopilot
 * plays until the King starts chasing, then a half second more, so the
 * frame catches the King close behind Pip with the keys and the portal
 * shimmer ahead.
 */
function stageKingShot(game) {
  reachLevel(game, 26);
  let chased = false;
  for (let i = 0; i < 60 * 40; i++) {
    if (game.screen !== 'play') break;
    autopilot(game);
    game.step(STEP);
    const k = game.king ? game.king.king : null;
    if (k && k.chasing) {
      chased = true;
      for (let j = 0; j < 30; j++) {
        autopilot(game);
        game.step(STEP);
        if (game.screen !== 'play') break;
      }
      break;
    }
  }
  game.input.releaseAll();
  if (!chased) {
    // Fallback: the frame is still the finale in play, King in frame.
  }
}
