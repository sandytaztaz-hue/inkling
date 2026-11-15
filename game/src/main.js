// INKLING — the game itself: screens, rules, scoring and the main loop.
// One step advances exactly one fixed tick; the loop, the autopilot and the
// screenshot stager all drive the same step().

import { VIEW, STEP, INK, LIVES_PER_LEVEL, LEVEL_COUNT, COLORS } from './config.js';
import { LEVELS, totalPar } from './levels.js';
import { makeRng } from './random.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Particles } from './particles.js';
import { PaintManager } from './paint.js';
import { Player } from './player.js';
import { Hazards } from './enemies.js';
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
    this.ink = INK.max;
    this.lives = LIVES_PER_LEVEL;
    this.orbsTaken = [];
    this.orbsGot = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.totalOrbsPossible = LEVELS.reduce((n, l) => n + l.orbs.length, 0);
    this.parTotal = totalPar();
    this.lastLevelScore = 0;
    this.lastInkBonus = 0;
    this.bestTotal = this.loadBest();
    this.newBest = false;
    this.invulnerable = 0;
    this.paintSoundAt = 0;
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

  reset(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.screen = 'title';
    this.titleTime = 0;
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.hazards = new Hazards(this.level);
    this.ink = INK.max;
    this.lives = LIVES_PER_LEVEL;
    this.orbsTaken = [];
    this.orbsGot = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.newBest = false;
    this.invulnerable = 0;
    this.paint.reset();
    this.particles.clear();
    this.player.reset(this.level.start.x, this.level.start.y);
    this.input.releaseAll();
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.hazards = new Hazards(this.level);
    this.ink = this.level.ink;
    this.lives = LIVES_PER_LEVEL;
    this.orbsTaken = this.level.orbs.map(() => false);
    this.orbsGot = 0;
    this.levelTime = 0;
    this.invulnerable = 0;
    this.paint.reset();
    this.particles.clear();
    this.player.reset(this.level.start.x, this.level.start.y);
  }

  startGame() {
    this.totalTime = 0;
    this.totalScore = 0;
    this.totalOrbs = 0;
    this.newBest = false;
    this.loadLevel(0);
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
      if (code === 'Enter' || code === 'Space') this.startGame();
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
    this.lastLevelScore = 500 + this.orbsGot * 150 + timeBonus + this.lastInkBonus;
    this.totalScore += this.lastLevelScore;
    this.totalTime += this.levelTime;
    this.totalOrbs += this.orbsGot;
    this.screen = 'levelComplete';
    this.sounds.levelClear();
    const portal = this.level.portal;
    this.particles.sparkle(portal.x + 27, portal.y + 39, COLORS.portal);
  }

  die(cause) {
    if (this.invulnerable > 0 || this.screen !== 'play') return;
    this.lives -= 1;
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
      if (Math.hypot(this.player.x - orb.x, this.player.y - orb.y) < 32) {
        this.orbsTaken[i] = true;
        this.orbsGot += 1;
        this.ink = Math.min(INK.max, this.ink + INK.orbRefill);
        this.sounds.orb();
        this.particles.sparkle(orb.x, orb.y, '#ffd23e');
      }
    });
  }

  inPortal() {
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
        this.paint.beginStroke(this.input.mouseX, this.input.mouseY);
      } else {
        const spent = this.paint.extendStroke(this.input.mouseX, this.input.mouseY);
        this.ink = Math.max(0, this.ink - spent);
        if (spent > 0) {
          this.particles.splat(this.input.mouseX, this.input.mouseY, COLORS.ink);
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
      this.sounds.bounce();
      this.particles.splat(this.player.x, this.player.bottom, '#ffd23e');
    }
    if (result === 'fell') {
      this.die('fell');
      return;
    }
    this.hazards.update(dt, this.player, this.paint, () => {}, () => this.die('hazard'));
    this.paint.update(dt);
    this.collectOrbs();
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
