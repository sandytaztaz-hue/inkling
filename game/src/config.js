// INKLING — shared tuning and palette. One place holds every number the
// rest of the game balances against, so tuning never hides inside a system.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PHYSICS = {
  gravity: 2100,
  moveSpeed: 300,
  moveAccel: 2600,
  airAccel: 1700,
  jumpSpeed: 760,
  coyoteTime: 0.11,
  jumpBuffer: 0.12,
  maxFall: 980,
  bounceSpeed: 1150,
};

export const INK = {
  max: 100,
  costPerPixel: 0.055,
  orbRefill: 34,
  startPerLevel: 100,
};

// Brush colours: each one paints a different kind of world. Cyan is the
// plain road; amber bounces Pip back up; violet dries slowly, for long
// crossings. Cost and dry time are part of the choice, not decoration.
export const PAINT_COLORS = {
  cyan: { color: '#2de2ff', dark: '#0e9fc4', cost: 0.055, drySeconds: 7, bounce: false, label: 'CYAN' },
  amber: { color: '#ffb02e', dark: '#b97a00', cost: 0.07, drySeconds: 7, bounce: true, label: 'AMBER bounce' },
  violet: { color: '#b46bff', dark: '#7a3fd1', cost: 0.08, drySeconds: 14, bounce: false, label: 'VIOLET slow-dry' },
};

export const BRUSH_KEYS = ['cyan', 'amber', 'violet'];

export const PAINT = {
  drySeconds: 7,
  crackAt: 4,
  strokeWidth: 14,
  minPointGap: 7,
};

// Dark paper, bright paint. Cyan is the player's ink; magenta and yellow are
// accents for orbs, portals and danger so the scene reads at a glance.
export const COLORS = {
  paper: '#14101c',
  paperLight: '#1d1729',
  paperLine: '#241d33',
  ink: '#2de2ff',
  inkDark: '#0e9fc4',
  magenta: '#ff4fd8',
  yellow: '#ffd23e',
  paperWhite: '#f4efe6',
  danger: '#ff4d5e',
  eraser: '#b8a7ff',
  platform: '#3a2f52',
  platformTop: '#57447e',
  portal: '#37ffa4',
  textDim: '#9d94b5',
  // Chapter 4, "The Last Page": dawn gold — warm paper, golden light,
  // lanterns and drifting motes, so the finale reads bright and dense.
  dawnPaper: '#241a08',
  dawnLight: '#f2c14e',
  dawnGold: '#ffd23e',
  dawnDeep: '#8a5c00',
  fountain: '#ffd23e',
  king: '#b8a7ff',
  kingCrown: '#ffd23e',
};

export const LIVES_PER_LEVEL = 3;
export const LEVEL_COUNT = 27;

// Chapter 4 tuning: fountains pour ink back at 25 per second; the King
// chases at 150 (Pip runs at 300, so he can always be outrun); golden
// rain platforms stay solid 5 s, then dry away for 3 s.
export const FOUNTAIN_REFILL = 25;
export const KING_CHASE_SPEED = 150;
export const RAIN_SOLID_SECONDS = 5;

// The dawn-gold palette of Chapter 4, "The Last Page": warm paper,
// golden light and lanterns, so the finale reads bright and dense.
export const DAWN = {
  paper: '#241a08',
  paperLight: '#2e2110',
  lantern: '#ffcf4d',
  mote: '#ffd23e',
};
