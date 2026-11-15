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
};

export const LIVES_PER_LEVEL = 3;
export const LEVEL_COUNT = 10;
