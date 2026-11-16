# INKLING — Paint your path home

[![make.fun best-game-01](https://img.shields.io/badge/make.fun-best--game--01-2de2ff)](https://make.fun/c/best-game-01)

You are Pip, a small ink drop on dark paper. Paint platforms with the mouse
to reach the exit portal. Paint is the whole game: every stroke costs ink,
every stroke dries and crumbles, and every stroke is a choice.

## How to play

- **Move:** A / D or ← →
- **Jump:** W / ↑ / Space
- **Paint:** hold the mouse and drag — a stroke becomes a solid platform while wet
- **Brush:** 1 cyan · 2 AMBER (bouncy) · 3 VIOLET (dries slow, 14 s)
- **R** restart level · **P** pause · **M** mute

Painting consumes ink. Collect ink orbs to refill. Eraser blobs patrol and
eat your paint on touch. Spikes pop you — some patrol the floor. Falling off
the page costs a life (3 per level). Wind shoves you, gusts breathe, bounce
pads launch you, moving platforms carry you, paper blocks crumble under your
feet, and some portals stay locked until you find their golden keys.

20 hand-designed levels in 3 chapters — **The Paper Sea**, **The Dry Wind**,
**Home** — each with its own palette and mood, each introducing one new idea,
ending in "Home": three keys, one tired bottle. Press 1 / 2 / 3 on the title
screen to start at a chapter.

Scoring: time against par, orbs and keys collected, and ink left over —
up to 3 stars per level. Your best total time is saved on your machine.

## Screens

Title (goal, controls, chapters, best time) · play (HUD: chapter, ink meter
in the brush colour, keys, orbs, timer, lives) · level intro card · level
complete (time, orbs, keys, ink bonus, score, stars) · game over (retry the
level) · victory (all 20 levels, total time, stars, final score, restart).

## Tech

Vanilla JavaScript + Canvas 2D. No libraries, no network, no audio files —
every sound is synthesized with WebAudio. Static files under `game/`.

Play it locally:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are real renders of the game in headless Chrome, driven by the
autopilot in `game/src/shots.js` (`?shot=start|play|complete|victory`).
The victory shot is a real full playthrough of all 20 levels.

## License

MIT — see [LICENSE](LICENSE).
