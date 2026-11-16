// INKLING — Paint Your Way Home: The Last Page — the entrypoint for
// make.fun best-game-01 (Node 22, standard library only). The game is the
// plain static files in game/ beside this file, and this program hands
// them in: it copies game/ and screenshots/ into the output directory and
// writes dossier.json there with the vendored make.fun library, so the
// judge can read the game and its screenshots.
//
// 27 hand-designed levels in 4 chapters — The Paper Sea, The Dry Wind,
// Home, and The Last Page (ink fountains, paper boats, golden ink rain,
// and the Eraser King, who patrols the last page and chases Pip when he
// comes close). The four screenshots are staged at peak action: Pip
// painting a bridge mid-air with the King behind him, Pip riding a paper
// boat past an ink fountain, the finale chase on the last page, and the
// victory screen of a real full playthrough of all 27 levels.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const screenshotsDir = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(screenshotsDir)) {
  cpSync(screenshotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps match the scorer's own limits: the dossier text is capped at
// 160 KiB, at most 4 screenshots of at most 256 KiB each, and game/ holds
// at most 993 files and 48 MiB with no path over 1000 bytes. The dossier
// grows with the game itself: 27 levels, 4 chapters, three new mechanics
// with their own source files (fountains, boats, the Eraser King), a
// minimap strip, an objective banner and an event log in the HUD, and
// four dense dawn-gold screenshots staged at peak action.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
