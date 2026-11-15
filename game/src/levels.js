// INKLING — the ten hand-designed levels. Each one introduces a single new
// idea and fits on one page (1280x720), so the whole level reads at a glance.
// Platforms are {x, y, w, h}; orbs are {x, y}; spikes are {x, y, w} sitting
// on a platform top; erasers patrol a line; movers slide between two points.

function level(def) {
  return {
    name: def.name,
    hint: def.hint,
    ink: def.ink ?? 100,
    par: def.par ?? 30,
    start: def.start,
    portal: def.portal,
    platforms: def.platforms ?? [],
    orbs: def.orbs ?? [],
    spikes: def.spikes ?? [],
    erasers: def.erasers ?? [],
    movers: def.movers ?? [],
    wind: def.wind ?? [],
    bouncePads: def.bouncePads ?? [],
  };
}

export const LEVELS = [
  level({
    name: 'First Stroke',
    hint: 'Drag the mouse to PAINT a bridge across the gap, then walk to the portal.',
    par: 20,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 520, h: 80 },
      { x: 720, y: 640, w: 560, h: 80 },
    ],
    orbs: [{ x: 620, y: 560 }],
  }),
  level({
    name: 'Mind the Gap',
    hint: 'Paint between the ledges. Ink orbs refill your bottle.',
    par: 25,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 420, y: 560, w: 180, h: 28 },
      { x: 760, y: 640, w: 520, h: 80 },
    ],
    orbs: [
      { x: 510, y: 480 },
      { x: 880, y: 560 },
    ],
  }),
  level({
    name: 'The Long Dry',
    hint: 'Paint dries and crumbles in 7 seconds. Cross before it falls!',
    par: 25,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 360, h: 80 },
      { x: 920, y: 640, w: 360, h: 80 },
    ],
    orbs: [{ x: 640, y: 540 }],
  }),
  level({
    name: 'Erasers',
    hint: 'Eraser blobs eat your paint on touch. Paint behind them, not through them.',
    par: 30,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 420, h: 80 },
      { x: 860, y: 640, w: 420, h: 80 },
    ],
    orbs: [{ x: 640, y: 520 }],
    erasers: [{ x: 640, y: 556, axis: 'x', from: 430, to: 850, speed: 110, r: 22 }],
  }),
  level({
    name: 'Moving Day',
    hint: 'Ride the moving platform — and paint from it when it stops short.',
    par: 30,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 360, h: 80 },
      { x: 900, y: 640, w: 380, h: 80 },
    ],
    orbs: [{ x: 640, y: 500 }],
    movers: [{ x: 380, y: 600, w: 130, h: 22, axis: 'x', from: 380, to: 760, speed: 95 }],
  }),
  level({
    name: 'Windy Page',
    hint: 'The wind shoves you back. Paint low and walk steady through it.',
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 460, h: 80 },
      { x: 820, y: 640, w: 460, h: 80 },
    ],
    orbs: [{ x: 640, y: 540 }],
    wind: [{ x: 480, y: 300, w: 320, h: 340, push: -240 }],
  }),
  level({
    name: 'Springs',
    hint: 'Bounce pads are ink springs. Bounce up, paint the high road.',
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 302 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 340, y: 380, w: 340, h: 28 },
      { x: 760, y: 380, w: 520, h: 28 },
      { x: 0, y: 640, w: 1280, h: 80 },
    ],
    orbs: [{ x: 530, y: 300 }],
    bouncePads: [{ x: 260, y: 624, w: 100, h: 16 }],
  }),
  level({
    name: 'Spike Garden',
    hint: 'Spikes bite. Paint a bridge over them — or jump them one by one.',
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [{ x: 0, y: 640, w: 1280, h: 80 }],
    orbs: [{ x: 640, y: 520 }],
    spikes: [
      { x: 400, y: 640, w: 90 },
      { x: 700, y: 640, w: 90 },
    ],
  }),
  level({
    name: 'Everything at Once',
    hint: 'Wind, an eraser and a moving ledge. Spend ink like it matters — it does.',
    par: 45,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 320, h: 80 },
      { x: 960, y: 640, w: 320, h: 80 },
    ],
    orbs: [
      { x: 500, y: 500 },
      { x: 800, y: 500 },
    ],
    erasers: [{ x: 640, y: 580, axis: 'x', from: 360, to: 920, speed: 130, r: 22 }],
    movers: [{ x: 420, y: 600, w: 120, h: 22, axis: 'x', from: 420, to: 820, speed: 110 }],
    wind: [{ x: 480, y: 320, w: 320, h: 320, push: -180 }],
  }),
  level({
    name: 'The Long Dry II',
    hint: 'Ink is short: 45 to start. Paint only what you need — the orbs are your lifeline.',
    ink: 45,
    par: 50,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 260, h: 80 },
      { x: 380, y: 600, w: 160, h: 28 },
      { x: 660, y: 560, w: 160, h: 28 },
      { x: 980, y: 640, w: 300, h: 80 },
    ],
    orbs: [
      { x: 460, y: 520 },
      { x: 740, y: 480 },
    ],
  }),
];

/** Total par time across all levels, for the victory screen. */
export function totalPar() {
  return LEVELS.reduce((sum, level) => sum + level.par, 0);
}
