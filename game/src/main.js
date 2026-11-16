// INKLING — the game itself: screens, rules, scoring and the main loop.
// One step advances exactly one fixed tick; the loop, the autopilot and the
// screenshot stager all drive the same step().

import { VIEW, STEP, INK, LIVES_PER_LEVEL, LEVEL_COUNT, COLORS, PAINT_COLORS, BRUSH_KEYS } from './config.js';
import { LEVELS, CHAPTERS, CHAPTER_STARTS, totalPar } from './levels.js';
import { makeRng } from './random.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Particles } from './particles.js';
import { PaintManager } from './paint.js';
import { Player } from './player.js';
import { Hazards } from './enemies.js';
import { FountainPools } from './fountains.js';
import { PaperBoats } from './boats.js';
import { EraserKing, KING_LINE } from './eraserking.js';
import { Renderer } from './render.js';
import { Hud, formatTime } from './hud.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'inkling-best-total';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.seed = 1;
    this.rng = makeRng(this.seed);
    this.input = new Input();
    this.input.attach(canvas);
    this.sounds = new SoundBank();
    this.particles = new Particles();
    this.paint = new PaintManager();
    this.player = new Player();
    this.renderer = new Renderer(canvas);
    this.renderer.makeGrain(this.rng);
    this.hud = new Hud();
    this.screen = 'title';
    this.titleTime = 0;
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.player.reset(this.level.start.x, this.level.start.y);
    this.hazards = new Hazards(this.level);
    this.loadSystems();
    this.ink = INK.max;
    this.brush = 'cyan';
    this.lives = LIVES_PER_LEVEL;
    this.deaths = 0;
    this.eventLog = [];
    this.fountainRefill = false;
    this.orbsTaken = [];
    this.orbsGot = 0;
    this.keysTaken = [];
    this.keysGot = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.totalOrbsPossible = LEVELS.reduce((n, l) => n + l.orbs.length, 0);
    this.totalStars = 0;
    this.parTotal = totalPar();
    this.lastLevelScore = 0;
    this.lastInkBonus = 0;
    this.lastStars = 0;
    this.bestTotal = this.loadBest();
    this.newBest = false;
    this.invulnerable = 0;
    this.paintSoundAt = 0;
    this.lastBounceAt = -1;
    this.paint.onCrumble = (stroke) => {
      const mid = stroke.points[Math.floor(stroke.points.length / 2)];
      if (mid) this.particles.dust(mid.x, mid.y, COLORS.inkDark);
      this.sounds.crumble();
    };
    this.paint.onErase = (x, y) => {
      this.particles.dust(x, y, '#b8a7ff');
      this.sounds.erase();
    };
    this.input.onKeyDown = (code) => this.handleKey(code);
    this.input.onClick = () => this.handleClick();
  }

  loadBest() {
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }

  saveBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(Math.floor(this.totalTime)));
    } catch {
      // Private mode or no storage: the run still counts on screen.
    }
  }

  /** Build the Chapter 4 systems for the current level (fountains, boats, King). */
  loadSystems() {
    this.fountains = new FountainPools(this.level);
    this.boats = new PaperBoats(this.level);
    this.king = new EraserKing(this.level);
    // The player rides boats through hazards, so it can see them.
    this.hazards.boats = this.boats;
  }

  /** One line in the HUD event log, stamped on the title clock. */
  logEvent(text, color) {
    this.eventLog.push({ text, color: color ?? COLORS.yellow, at: this.titleTime });
    if (this.eventLog.length > 12) this.eventLog.shift();
  }

  brushColor() {
    return PAINT_COLORS[this.brush].color;
  }

  portalLocked() {
    return this.keysGot < this.level.keys.length;
  }

  keysLeft() {
    return this.level.keys.length - this.keysGot;
  }

  reset(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.screen = 'title';
    this.titleTime = 0;
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.hazards = new Hazards(this.level);
    this.loadSystems();
    this.ink = INK.max;
    this.brush = 'cyan';
    this.lives = LIVES_PER_LEVEL;
    this.deaths = 0;
    this.eventLog = [];
    this.fountainRefill = false;
    this.orbsTaken = [];
    this.orbsGot = 0;
    this.keysTaken = [];
    this.keysGot = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.totalStars = 0;
    this.newBest = false;
    this.invulnerable = 0;
    this.lastBounceAt = -1;
    this.paint.reset();
    this.particles.clear();
    this.player.reset(this.level.start.x, this.level.start.y);
    this.input.releaseAll();
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.hazards = new Hazards(this.level);
    this.loadSystems();
    this.ink = this.level.ink;
    this.brush = this.level.paintColor ?? 'cyan';
    this.lives = LIVES_PER_LEVEL;
    this.fountainRefill = false;
    if (this.level.kingLine) {
      this.logEvent(`THE ERASER KING: “${KING_LINE}”`, COLORS.eraser);
    }
    this.orbsTaken = this.level.orbs.map(() => false);
    this.orbsGot = 0;
    this.keysTaken = this.level.keys.map(() => false);
    this.keysGot = 0;
    this.levelTime = 0;
    this.invulnerable = 0;
    this.lastBounceAt = -1;
    this.paint.reset();
    this.particles.clear();
    this.player.reset(this.level.start.x, this.level.start.y);
  }

  startGame() {
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.totalStars = 0;
    this.newBest = false;
    this.deaths = 0;
    this.eventLog = [];
    this.loadLevel(0);
    this.screen = 'play';
    this.sounds.ensure();
  }

  /** Start a run at a chapter's first level (title screen keys 1/2/3/4). */
  startChapter(chapter) {
    const at = CHAPTER_STARTS[chapter] ?? 0;
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.totalStars = 0;
    this.newBest = false;
    this.deaths = 0;
    this.eventLog = [];
    this.loadLevel(at);
    this.screen = 'play';
    this.sounds.ensure();
  }

  handleKey(code) {
    this.sounds.ensure();
    if (code === 'KeyM') {
      this.sounds.toggleMute();
      return;
    }
    if (this.screen === 'title') {
      if (code === 'Digit1' || code === 'Numpad1') this.startChapter(0);
      else if (code === 'Digit2' || code === 'Numpad2') this.startChapter(1);
      else if (code === 'Digit3' || code === 'Numpad3') this.startChapter(2);
      else if (code === 'Digit4' || code === 'Numpad4') this.startChapter(3);
      else if (code === 'Enter' || code === 'Space') this.startGame();
      return;
    }
    if (this.screen === 'levelComplete') {
      if (code === 'Enter' || code === 'Space') this.nextLevel();
      return;
    }
    if (this.screen === 'gameOver') {
      if (code === 'KeyR' || code === 'Enter' || code === 'Space') {
        this.loadLevel(this.levelIndex);
        this.screen = 'play';
      }
      return;
    }
    if (this.screen === 'victory') {
      if (code === 'KeyR' || code === 'Enter' || code === 'Space') this.startGame();
      return;
    }
    if (this.screen === 'paused') {
      if (code === 'KeyP' || code === 'Escape' || code === 'Enter') this.screen = 'play';
      if (code === 'KeyR') {
        this.loadLevel(this.levelIndex);
        this.screen = 'play';
      }
      return;
    }
    if (this.screen === 'play') {
      if (code === 'KeyP' || code === 'Escape') this.screen = 'paused';
      if (code === 'KeyR') this.loadLevel(this.levelIndex);
      // Brush colours: 1 cyan, 2 amber (bouncy), 3 violet (slow-dry).
      const brushIndex = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
      if (brushIndex >= 0) {
        this.brush = BRUSH_KEYS[brushIndex];
        this.sounds.orb();
      }
    }
  }

  handleClick() {
    this.sounds.ensure();
    if (this.screen === 'title') this.startGame();
    else if (this.screen === 'levelComplete') this.nextLevel();
    else if (this.screen === 'gameOver') {
      this.loadLevel(this.levelIndex);
      this.screen = 'play';
    } else if (this.screen === 'victory') this.startGame();
    else if (this.screen === 'paused') this.screen = 'play';
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVEL_COUNT) {
      this.finishGame();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.screen = 'play';
  }

  finishGame() {
    this.screen = 'victory';
    this.newBest = this.bestTotal === null || this.totalTime < this.bestTotal;
    if (this.newBest) {
      this.bestTotal = this.totalTime;
      this.saveBest();
    }
    this.sounds.win();
  }

  completeLevel() {
    const timeBonus = Math.max(0, Math.round((this.level.par - this.levelTime) * 20));
    this.lastInkBonus = Math.ceil(this.ink) * 2;
    this.lastLevelScore =
      500 + this.orbsGot * 150 + this.keysGot * 100 + timeBonus + this.lastInkBonus;
    this.lastStars =
      (this.levelTime <= this.level.par ? 1 : 0) +
      (this.orbsGot === this.level.orbs.length ? 1 : 0) +
      (this.ink >= 30 ? 1 : 0);
    this.totalScore += this.lastLevelScore;
    this.totalStars += this.lastStars;
    this.totalTime += this.levelTime;
    this.totalOrbs += this.orbsGot;
    this.logEvent(`LEVEL CLEAR — ${'★'.repeat(this.lastStars)}${'☆'.repeat(3 - this.lastStars)}`, COLORS.portal);
    this.screen = 'levelComplete';
    this.sounds.levelClear();
    const portal = this.level.portal;
    this.particles.sparkle(portal.x + 27, portal.y + 39, COLORS.portal);
  }

  die(cause) {
    if (this.invulnerable > 0 || this.screen !== 'play') return;
    // Remember where Pip died, before the respawn moves him.
    this.lastDeath = { x: Math.round(this.player.x), y: Math.round(this.player.y), cause };
    this.lives -= 1;
    this.deaths += 1;
    this.logEvent(
      cause === 'king' ? 'The Eraser King got Pip!' : cause === 'fell' ? 'Pip fell off the page!' : 'Pip popped!',
      COLORS.danger,
    );
    this.sounds.hurt();
    this.renderer.addShake(14);
    this.particles.burst(this.player.x, this.player.y, COLORS.ink, 30);
    this.paint.reset();
    if (this.lives <= 0) {
      this.screen = 'gameOver';
      this.sounds.gameOver();
      return;
    }
    this.player.reset(this.level.start.x, this.level.start.y);
    this.ink = this.level.ink;
    this.invulnerable = 1.2;
    this.player.blink = 1.2;
  }

  collectOrbs() {
    this.level.orbs.forEach((orb, i) => {
      if (this.orbsTaken[i]) return;
      if (Math.hypot(this.player.x - orb.x, this.player.y - orb.y) < 44) {
        this.orbsTaken[i] = true;
        this.orbsGot += 1;
        this.ink = Math.min(INK.max, this.ink + INK.orbRefill);
        this.sounds.orb();
        this.particles.sparkle(orb.x, orb.y, '#ffd23e');
      }
    });
  }

  collectKeys() {
    this.level.keys.forEach((key, i) => {
      if (this.keysTaken[i]) return;
      if (Math.hypot(this.player.x - key.x, this.player.y - key.y) < 48) {
        this.keysTaken[i] = true;
        this.keysGot += 1;
        this.sounds.key();
        this.particles.sparkle(key.x, key.y, '#ffd23e');
        this.logEvent(`Key ${this.keysGot}/${this.level.keys.length}!`, COLORS.yellow);
        if (!this.portalLocked()) {
          this.sounds.unlock();
          this.logEvent('The portal is OPEN!', COLORS.portal);
          const portal = this.level.portal;
          this.particles.sparkle(portal.x + 27, portal.y + 39, COLORS.portal);
        }
      }
    });
  }

  inPortal() {
    if (this.portalLocked()) return false;
    const portal = this.level.portal;
    const cx = portal.x + 27;
    const cy = portal.y + 39;
    return Math.abs(this.player.x - cx) < 36 && Math.abs(this.player.y - cy) < 52;
  }

  /** One fixed tick of the game. */
  step(dt) {
    this.titleTime += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.screen === 'title') {
      this.particles.update(dt);
      return;
    }
    if (this.screen !== 'play') {
      this.particles.update(dt);
      return;
    }
    this.levelTime += dt;
    // Painting: hold the mouse and drag to lay down a wet stroke.
    if (this.input.mouseDown && this.ink > 0) {
      if (!this.paint.current) {
        this.paint.beginStroke(this.input.mouseX, this.input.mouseY, this.brush);
      } else {
        const spent = this.paint.extendStroke(this.input.mouseX, this.input.mouseY);
        this.ink = Math.max(0, this.ink - spent);
        if (spent > 0) {
          this.particles.splat(this.input.mouseX, this.input.mouseY, this.brushColor());
          if (this.levelTime - this.paintSoundAt > 0.12) {
            this.paintSoundAt = this.levelTime;
            this.sounds.paint();
          }
        }
        if (this.ink <= 0) this.paint.endStroke();
      }
    } else if (this.paint.current) {
      this.paint.endStroke();
    }
    const result = this.player.update(dt, this.input, this.level, this.paint, this.hazards);
    if (result === 'jumped') this.sounds.jump();
    if (result === 'bounced') {
      this.lastBounceAt = this.levelTime;
      this.sounds.bounce();
      this.particles.splat(this.player.x, this.player.bottom, '#ffd23e');
    }
    if (result === 'fell') {
      this.die('fell');
      return;
    }
    // Paper boats drift along their path, carrying Pip with them.
    this.boats.update(dt);
    // The Eraser King patrols — and chases Pip when he comes close.
    this.king.update(
      dt,
      this.player,
      () => {
        this.sounds.kingRoar();
        this.logEvent('THE ERASER KING IS CHASING!', COLORS.danger);
      },
      () => this.die('king'),
    );
    // Ink fountains pour ink back into Pip's bottle while he stands in one.
    const gained = this.fountains.update(
      dt,
      this.player,
      this.ink,
      INK.max,
      () => {
        this.sounds.fountain();
        this.logEvent('Fountain refilled ink', COLORS.yellow);
      },
      (x, y) => this.particles.sparkle(x, y, '#ffd23e'),
    );
    this.fountainRefill = this.fountains.refilling;
    if (gained > 0) this.ink = Math.min(INK.max, this.ink + gained);
    this.hazards.update(
      dt,
      this.player,
      this.paint,
      () => {},
      () => this.die('hazard'),
      (x, y) => {
        this.particles.dust(x, y, '#8d7fb5');
        this.sounds.crumble();
      },
    );
    this.paint.update(dt);
    this.collectOrbs();
    this.collectKeys();
    this.particles.update(dt);
    if (this.screen === 'play' && this.inPortal()) this.completeLevel();
  }

  draw() {
    const ctx = this.renderer.ctx;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    if (this.screen === 'title') {
      this.renderer.render(this);
      this.hud.drawTitle(ctx, this);
      return;
    }
    this.renderer.render(this);
    this.hud.drawBar(ctx, this);
    this.hud.drawIntro(ctx, this);
    if (this.screen === 'levelComplete') this.hud.drawLevelComplete(ctx, this);
    else if (this.screen === 'gameOver') this.hud.drawGameOver(ctx, this);
    else if (this.screen === 'victory') this.hud.drawVictory(ctx, this);
    else if (this.screen === 'paused') this.hud.drawPaused(ctx, this);
  }

  run() {
    let last = performance.now();
    let accumulator = 0;
    const frame = (now) => {
      const elapsed = Math.min(0.1, (now - last) / 1000);
      last = now;
      accumulator += elapsed;
      while (accumulator >= STEP) {
        this.step(STEP);
        accumulator -= STEP;
      }
      this.draw();
      this.input.endFrame();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') ?? 1) || 1;
  const shot = params.get('shot');
  const game = new Game(canvas);
  game.seed = seed;
  window.__game = game;
  window.__shotReady = false;
  if (shot) {
    stageShot(shot, game);
    game.draw();
    window.__shotReady = true;
  } else {
    game.run();
  }
}

boot();
