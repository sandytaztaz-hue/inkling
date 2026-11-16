// INKLING — the twenty hand-designed levels, in three chapters of Pip's
// journey home. Each level introduces a single new idea and fits on one
// page (1280x720), so the whole level reads at a glance.
// Platforms are {x, y, w, h}; orbs are {x, y}; spikes are {x, y, w} sitting
// on a platform top (a spike may patrol {from, to, speed} along x);
// erasers patrol a line; movers slide between two points; wind zones push
// Pip (gust zones breathe, their push rising and falling); keys unlock the
// portal; crumbles are paper blocks that fall apart 1.2s after Pip stands
// on them; paintColor sets the brush the level starts with; apBounce is
// the autopilot's scripted amber-bounce step for Springboard (level 17).

export const CHAPTERS = [
  {
    name: 'The Paper Sea',
    tag: 'CHAPTER 1 — THE PAPER SEA',
    story: 'Pip wakes on dark paper. Home is across the page.',
    paper: '#14101c',
    paperLight: '#1d1729',
    paperLine: '#241d33',
    platform: '#3a2f52',
    platformTop: '#57447e',
    accent: '#2de2ff',
  },
  {
    name: 'The Dry Wind',
    tag: 'CHAPTER 2 — THE DRY WIND',
    story: 'The wind dries the ink fast here. Paint quick, walk quicker.',
    paper: '#1c1410',
    paperLight: '#261b12',
    paperLine: '#33241a',
    platform: '#4a3524',
    platformTop: '#6b4c33',
    accent: '#ffb02e',
  },
  {
    name: 'Home',
    tag: 'CHAPTER 3 — HOME',
    story: 'The last page. Every drop of ink counts now.',
    paper: '#0e1a16',
    paperLight: '#122620',
    paperLine: '#1a332b',
    platform: '#24473a',
    platformTop: '#376654',
    accent: '#37ffa4',
  },
  {
    name: 'The Last Page',
    tag: 'CHAPTER 4 — THE LAST PAGE',
    story: 'The last page is folding. Paint home before the ink runs out — Pip.',
    paper: '#3d2c11',
    paperLight: '#4a3717',
    paperLine: '#5d4722',
    platform: '#6b4c22',
    platformTop: '#a37c33',
    accent: '#ffd23e',
  },
];

/** First level index of each chapter (for the title screen's 1/2/3/4 jump). */
export const CHAPTER_STARTS = [0, 7, 13, 20];

function level(def) {
  return {
    name: def.name,
    hint: def.hint,
    chapter: def.chapter,
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
    keys: def.keys ?? [],
    crumbles: def.crumbles ?? [],
    paintColor: def.paintColor ?? 'cyan',
    apBounce: def.apBounce ?? null,
    // Chapter 4: ink fountains refill Pip's bottle, paper boats ferry
    // him across gaps, the Eraser King patrols and chases, and golden
    // rain paints temporary platforms that dry in 5 seconds.
    fountains: def.fountains ?? [],
    boats: def.boats ?? [],
    kings: def.kings ?? [],
    rain: def.rain ?? [],
    kingLine: def.kingLine ?? null,
  };
}

export const LEVELS = [
  // ---- Chapter 1: The Paper Sea ----
  level({
    name: 'First Stroke',
    hint: 'Drag the mouse to PAINT a bridge across the gap, then walk to the portal.',
    chapter: 0,
    par: 20,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 520, h: 80 },
      { x: 720, y: 640, w: 560, h: 80 },
    ],
    orbs: [{ x: 620, y: 600 }],
  }),
  level({
    name: 'Mind the Gap',
    hint: 'Paint between the ledges. Ink orbs refill your bottle.',
    chapter: 0,
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
      { x: 880, y: 600 },
    ],
  }),
  level({
    name: 'The Long Dry',
    hint: 'Paint dries and crumbles in 7 seconds. Cross before it falls!',
    chapter: 0,
    par: 25,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 360, h: 80 },
      { x: 920, y: 640, w: 360, h: 80 },
    ],
    orbs: [{ x: 640, y: 600 }],
  }),
  level({
    name: 'Erasers',
    hint: 'Eraser blobs eat your paint on touch. Paint behind them, not through them.',
    chapter: 0,
    par: 30,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 420, h: 80 },
      { x: 860, y: 640, w: 420, h: 80 },
    ],
    orbs: [{ x: 640, y: 600 }],
    erasers: [{ x: 640, y: 556, axis: 'x', from: 430, to: 850, speed: 110, r: 22 }],
  }),
  level({
    name: 'Moving Day',
    hint: 'Ride the moving platform — and paint from it when it stops short.',
    chapter: 0,
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
    chapter: 0,
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 460, h: 80 },
      { x: 820, y: 640, w: 460, h: 80 },
    ],
    orbs: [{ x: 640, y: 600 }],
    wind: [{ x: 480, y: 300, w: 320, h: 340, push: -240 }],
  }),
  level({
    name: 'Springs',
    hint: 'Bounce pads are ink springs. Bounce up, paint the high road.',
    chapter: 0,
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

  // ---- Chapter 2: The Dry Wind ----
  level({
    name: 'Spike Garden',
    hint: 'Spikes bite. Paint a bridge over them — or jump them one by one.',
    chapter: 1,
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [{ x: 0, y: 640, w: 1280, h: 80 }],
    orbs: [{ x: 640, y: 600 }],
    spikes: [
      { x: 400, y: 640, w: 90 },
      { x: 700, y: 640, w: 90 },
    ],
  }),
  level({
    name: 'Amber Ink',
    hint: 'AMBER paint bounces! This road is amber — hop the high ledge, then the high road home.',
    chapter: 1,
    par: 35,
    paintColor: 'amber',
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 442 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 520, y: 520, w: 240, h: 28 },
      { x: 900, y: 520, w: 380, h: 28 },
    ],
    orbs: [
      { x: 640, y: 480 },
      { x: 1050, y: 480 },
    ],
  }),
  level({
    name: 'The Locked Door',
    hint: 'The portal is LOCKED. Grab the golden key first — it hangs on the way.',
    chapter: 1,
    par: 30,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 420, h: 80 },
      { x: 860, y: 640, w: 420, h: 80 },
    ],
    orbs: [
      { x: 200, y: 600 },
      { x: 1050, y: 600 },
    ],
    keys: [{ x: 640, y: 600 }],
  }),
  level({
    name: 'The Long Crossing',
    hint: 'VIOLET paint dries SLOW — 14 seconds. Press 3, paint one long bridge, no rush.',
    chapter: 1,
    par: 35,
    paintColor: 'violet',
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 980, y: 640, w: 300, h: 80 },
    ],
    orbs: [
      { x: 640, y: 600 },
      { x: 1120, y: 600 },
    ],
  }),
  level({
    name: 'Thin Ice',
    hint: 'These paper blocks crumble 1 second after you stand on them. Keep moving!',
    chapter: 1,
    par: 30,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 260, h: 80 },
      { x: 1020, y: 640, w: 260, h: 80 },
    ],
    crumbles: [
      { x: 300, y: 640, w: 140, h: 24 },
      { x: 480, y: 640, w: 140, h: 24 },
      { x: 660, y: 640, w: 140, h: 24 },
      { x: 840, y: 640, w: 140, h: 24 },
    ],
    orbs: [
      { x: 550, y: 600 },
      { x: 900, y: 600 },
    ],
  }),
  level({
    name: 'Everything at Once',
    hint: 'Wind, an eraser and a moving ledge. Spend ink like it matters — it does.',
    chapter: 1,
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

  // ---- Chapter 3: Home ----
  level({
    name: 'The Patrol',
    hint: 'Spikes that walk the floor. Jump them as they turn away.',
    chapter: 2,
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [{ x: 0, y: 640, w: 1280, h: 80 }],
    orbs: [
      { x: 640, y: 600 },
      { x: 1100, y: 600 },
    ],
    spikes: [
      { x: 400, y: 640, w: 90, patrol: { from: 300, to: 700, speed: 70 } },
      { x: 850, y: 640, w: 90, patrol: { from: 800, to: 1100, speed: 90 } },
    ],
  }),
  level({
    name: 'Gale',
    hint: 'The gusts breathe — strong, then weak. Cross on the weak breath.',
    chapter: 2,
    par: 35,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 460, h: 80 },
      { x: 820, y: 640, w: 460, h: 80 },
    ],
    orbs: [{ x: 640, y: 600 }],
    wind: [{ x: 480, y: 300, w: 320, h: 340, push: -240, gust: true }],
  }),
  level({
    name: 'Two Keys',
    hint: 'Two keys, one door, one eraser in between. The keys hang on the bridge line.',
    chapter: 2,
    par: 40,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 360, h: 80 },
      { x: 920, y: 640, w: 360, h: 80 },
    ],
    orbs: [
      { x: 200, y: 600 },
      { x: 1100, y: 600 },
    ],
    keys: [
      { x: 500, y: 600 },
      { x: 780, y: 600 },
    ],
    erasers: [{ x: 640, y: 570, axis: 'x', from: 480, to: 800, speed: 110, r: 22 }],
  }),
  level({
    name: 'Springboard',
    hint: 'Paint AMBER on the flat, jump straight up onto it — and BOING, over the high ledge!',
    chapter: 2,
    par: 40,
    paintColor: 'amber',
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 342 },
    platforms: [
      { x: 0, y: 640, w: 360, h: 80 },
      { x: 620, y: 420, w: 660, h: 28 },
    ],
    orbs: [
      { x: 460, y: 560 },
      { x: 900, y: 380 },
    ],
    // Autopilot: paint amber 380–540 at y 640, stand at 460, jump straight
    // up onto it, bounce over the ledge (top 420), land past x 620.
    apBounce: { paintX0: 380, paintX1: 540, paintY: 640, jumpX: 460, ledgeX: 620 },
  }),
  level({
    name: 'The Long Dry II',
    hint: 'Ink is short: 45 to start. Paint only what you need — the orbs are your lifeline.',
    chapter: 2,
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
  level({
    name: 'The Gauntlet',
    hint: 'Thin ice, a walking spike and a breathing gale. One steady run.',
    chapter: 2,
    par: 45,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 980, y: 640, w: 300, h: 80 },
    ],
    crumbles: [
      { x: 340, y: 640, w: 150, h: 24 },
      { x: 520, y: 640, w: 150, h: 24 },
      { x: 700, y: 640, w: 150, h: 24 },
    ],
    spikes: [{ x: 1000, y: 640, w: 80, patrol: { from: 1000, to: 1100, speed: 80 } }],
    wind: [{ x: 340, y: 300, w: 510, h: 340, push: -180, gust: true }],
    orbs: [
      { x: 600, y: 600 },
      { x: 1150, y: 600 },
    ],
  }),
  level({
    name: 'Home',
    hint: 'Home, at last. Three keys, one tired bottle — paint only what you need.',
    chapter: 2,
    ink: 50,
    par: 60,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 522 },
    platforms: [
      { x: 0, y: 640, w: 200, h: 80 },
      { x: 360, y: 600, w: 140, h: 28 },
      { x: 620, y: 560, w: 150, h: 28 },
      { x: 900, y: 600, w: 140, h: 28 },
      { x: 1120, y: 600, w: 160, h: 120 },
    ],
    orbs: [
      { x: 150, y: 584 },
      { x: 560, y: 584 },
      { x: 1160, y: 584 },
    ],
    keys: [
      { x: 280, y: 584 },
      { x: 800, y: 584 },
      { x: 1060, y: 584 },
    ],
    erasers: [{ x: 680, y: 420, axis: 'x', from: 560, to: 820, speed: 100, r: 22 }],
  }),

  // ---- Chapter 4: The Last Page (dawn gold) ----
  level({
    name: 'First Light',
    hint: 'Dawn gold on the last page. Drink at the INK FOUNTAIN — it refills your bottle.',
    chapter: 3,
    par: 30,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 520, h: 80 },
      { x: 720, y: 640, w: 560, h: 80 },
    ],
    orbs: [{ x: 620, y: 600 }],
    fountains: [{ x: 300, y: 570, w: 110, h: 70 }],
  }),
  level({
    name: 'The Fountain Road',
    hint: 'A long dry crossing — ink starts at 60. Drink at every fountain on the road.',
    chapter: 3,
    ink: 60,
    par: 45,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 560, y: 640, w: 160, h: 80 },
      { x: 980, y: 640, w: 300, h: 80 },
    ],
    orbs: [
      { x: 640, y: 600 },
      { x: 880, y: 600 },
    ],
    fountains: [
      { x: 120, y: 570, w: 110, h: 70 },
      { x: 580, y: 570, w: 110, h: 70 },
    ],
  }),
  level({
    name: 'Paper Boats',
    hint: 'Ride the PAPER BOAT across — step on, wait for the far side, step off. Paint can meet it mid-river.',
    chapter: 3,
    par: 40,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 360, h: 80 },
      { x: 900, y: 640, w: 380, h: 80 },
    ],
    orbs: [{ x: 640, y: 610 }],
    boats: [{ x: 380, y: 660, w: 200, h: 22, axis: 'x', from: 380, to: 700, speed: 90 }],
    fountains: [{ x: 1020, y: 570, w: 110, h: 70 }],
  }),
  level({
    name: 'The Ink Rain',
    hint: 'Golden rain paints platforms that dry in 5 seconds — or paint your own bridge and ignore the weather.',
    chapter: 3,
    ink: 80,
    par: 40,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 340, h: 80 },
      { x: 940, y: 640, w: 340, h: 80 },
    ],
    orbs: [
      { x: 470, y: 590 },
      { x: 730, y: 590 },
    ],
    // Rain platforms cycle: solid 5 s, gone 3 s, offset by half a cycle.
    rain: [
      { x: 380, y: 600, w: 170, h: 18, period: 8, on: 5, offset: 0 },
      { x: 640, y: 600, w: 170, h: 18, period: 8, on: 5, offset: 4 },
    ],
  }),
  level({
    name: 'The Eraser King Wakes',
    hint: 'THE ERASER KING patrols the road — and CHASES when you come close. Jump clean over his crown.',
    chapter: 3,
    par: 40,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 420, h: 80 },
      { x: 860, y: 640, w: 420, h: 80 },
    ],
    orbs: [{ x: 1050, y: 600 }],
    keys: [{ x: 640, y: 600 }],
    kings: [{ x: 640, y: 580, from: 480, to: 820, speed: 70 }],
    kingLine: 'No more painting, little ink.',
    fountains: [{ x: 120, y: 570, w: 110, h: 70 }],
  }),
  level({
    name: 'The Folding Page',
    hint: 'Thin ice, a paper boat below, a fountain behind you — and the King patrolling the middle.',
    chapter: 3,
    par: 50,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 562 },
    platforms: [
      { x: 0, y: 640, w: 300, h: 80 },
      { x: 980, y: 640, w: 300, h: 80 },
    ],
    crumbles: [
      { x: 340, y: 640, w: 140, h: 24 },
      { x: 520, y: 640, w: 140, h: 24 },
      { x: 700, y: 640, w: 140, h: 24 },
    ],
    orbs: [
      { x: 550, y: 600 },
      { x: 900, y: 600 },
    ],
    kings: [{ x: 640, y: 580, from: 480, to: 800, speed: 70 }],
    fountains: [{ x: 120, y: 570, w: 110, h: 70 }],
  }),
  level({
    name: 'Home, At Last',
    hint: 'The King guards the final keys. Three keys, one tired bottle — paint only what you need.',
    chapter: 3,
    ink: 60,
    par: 60,
    start: { x: 80, y: 600 },
    portal: { x: 1170, y: 522 },
    // The finale road runs flat at y640 so Pip walks it, and the King
    // stands ON the road on the long middle platform — the only jump on
    // this level is the jump OVER the King himself, on solid ground, and
    // the last step up to the portal. (Round 4 lesson: the first finale
    // made Pip jump between stepping stones right through the King's
    // patrol band at y520 — he overshot the stones and met the King
    // mid-arc, three deaths in a row.)
    platforms: [
      { x: 0, y: 640, w: 200, h: 80 },
      { x: 340, y: 640, w: 240, h: 80 },
      { x: 620, y: 640, w: 240, h: 80 },
      { x: 900, y: 640, w: 140, h: 80 },
      { x: 1120, y: 600, w: 160, h: 120 },
    ],
    orbs: [
      { x: 150, y: 584 },
      { x: 560, y: 584 },
      { x: 1160, y: 520 },
    ],
    keys: [
      { x: 280, y: 584 },
      { x: 800, y: 584 },
      { x: 1060, y: 584 },
    ],
    kings: [{ x: 680, y: 640, from: 620, to: 860, speed: 80 }],
    fountains: [{ x: 60, y: 570, w: 110, h: 70 }],
  }),
];

/** Total par time across all levels, for the victory screen. */
export function totalPar() {
  return LEVELS.reduce((sum, level) => sum + level.par, 0);
}
