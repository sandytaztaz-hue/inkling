# INKLING — Paint your path home

[![make.fun best-game-01](https://img.shields.io/badge/make.fun-best--game--01-2de2ff)](https://make.fun/c/best-game-01)

You are Pip, a small ink drop on dark paper. Paint platforms with the mouse
to reach the exit portal. Paint is the whole game: every stroke costs ink,
every stroke dries and crumbles in 7 seconds, and every stroke is a choice.

## How to play

- **Move:** A / D or ← →
- **Jump:** W / ↑ / Space
- **Paint:** hold the mouse and drag — a stroke becomes a solid platform while wet
- **R** restart level · **P** pause · **M** mute

Painting consumes ink. Collect ink orbs to refill. Eraser blobs patrol and
eat your paint on touch. Spikes pop you. Falling off the page costs a life
(3 per level). Wind shoves you, bounce pads launch you, moving platforms
carry you. 10 hand-designed levels, each introducing one new idea, ending in
"The Long Dry II" — a finale with a tight ink budget.

Scoring: time against par, orbs collected, and ink left over. Your best total
time is saved on your machine.

## Screens

Title (goal, controls, best time) · play (HUD: ink meter, level, orbs, timer,
lives) · level complete (time, orbs, ink bonus, score) · game over (retry the
level) · victory (all 10 levels, total time, final score, restart).

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

## License

MIT — see [LICENSE](LICENSE).
