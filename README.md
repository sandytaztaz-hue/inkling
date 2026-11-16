# INKLING — Paint Your Way Home: The Last Page

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

27 hand-designed levels in 4 chapters — **The Paper Sea**, **The Dry Wind**,
**Home**, **The Last Page** — each with its own palette and mood, each
introducing one new idea, ending in "Home, At Last": three keys, one tired
bottle, and the Eraser King guarding the road home. Press 1 / 2 / 3 / 4 on
the title screen to start at a chapter.

Chapter 4, **The Last Page**, is dawn gold: the last page is folding, and
Pip must paint home before the ink runs out. Ink fountains glow along the
road and refill the bottle (+25 ink a second) to any Pip who stops to
drink. Paper boats drift across the rivers — step on, ride, step off at
the far side. Golden rain paints temporary platforms that dry in 5
seconds. And the Eraser King — a huge crowned eraser, twice a normal
blob — patrols the last page and CHASES Pip when he comes close. "No more
painting, little ink."

Scoring: time against par, orbs and keys collected, and ink left over —
up to 3 stars per level. Your best total time is saved on your machine.

## Screens

Title (goal, controls, chapters, best time) · play (HUD: chapter, ink meter
in the brush colour, keys, orbs, timer, lives, deaths, minimap strip,
objective banner, event log) · level intro card (the Eraser King speaks on
first meeting) · level complete (time, orbs, keys, ink bonus, score, stars,
deaths) · game over (retry the level) · victory (all 27 levels, total time,
stars, final score, Pip's farewell note, restart).

## Tech

Vanilla JavaScript + Canvas 2D. No libraries, no network, no audio files —
every sound is synthesized with WebAudio. Static files under `game/`.

Play it locally:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are real renders of the game in headless Chrome, driven by the
autopilot in `game/src/shots.js` (`?shot=action|fountain|king|victory`).
The victory shot is a real full playthrough of all 27 levels; the action
shot catches Pip painting a bridge mid-air on level 25 with the Eraser
King chasing behind him.

## License

MIT — see [LICENSE](LICENSE).
