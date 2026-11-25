# Dapur Kilat — Warung Masak Cepat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Fanyway/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Fanyway/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast 2D cooking game set in a small Indonesian street-food stall. You are
the cook: take orders from the ticket board, grab ingredients from the
counters, chop and fry them at the stations, assemble each dish on the
plating counter, and serve it through the window before its timer runs out.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there. Click a
  station to walk to it and use it.
- **Interact:** E or Space (or click a station).
  - Counters on the left wall give you ingredients (up to 3 in hand).
  - Ayam and sawi must be chopped on the talenan; mie and telur must be
    cooked in the wajan. Nasi, kecap and kuah are ready as-is.
  - On the meja saji, place 3 processed ingredients to assemble a dish.
    Wrong mixes are not a dish — take the ingredients back and try again.
  - Carry the finished plate to the jendela saji to serve.
  - The trash bin clears your hands.
- **Score:** every served dish pays its price plus a speed bonus; serving
  fast in a row builds a combo (x2, x3…). A wrong dish costs 50 points and
  an expired ticket breaks your combo.
- **Shift:** 3 minutes. After 90 seconds it is rush hour — orders arrive
  faster and their timers get shorter.

## Recipes

| Dish | Needs |
| --- | --- |
| Nasi Goreng | nasi + telur goreng + kecap |
| Mie Ayam | mie rebus + ayam cincang + sawi potong |
| Soto Ayam | kuah + ayam cincang + telur goreng |
| Nasi Ayam Kecap | nasi + ayam cincang + kecap |
| Mie Goreng | mie rebus + telur goreng + kecap |
| Soto Mie | kuah + mie rebus + sawi potong |

## Run it

Serve `game/` with any static server and open `game/index.html`:

```sh
cd game
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a desktop browser. The game is fully
offline: all art is drawn in code on the canvas, all sounds are made with
WebAudio oscillators, and it loads nothing from the network.

## Controls

- **W A S D / arrows** — walk
- **E / Space / click** — pick up, chop, cook, plate, serve
- **P** — pause
- **M** — mute
- **R** — restart the shift

## Files

- `game/index.html` — page shell and canvas
- `game/style.css` — page chrome
- `game/app.js` — boot, game loop, input, shift state, screenshot scenes
- `game/kitchen.js` — the cook, stations and interactions
- `game/orders.js` — order tickets, timers, rush, scoring
- `game/recipes.js` — ingredients and dishes
- `game/render.js` — all canvas drawing
- `game/audio.js` — WebAudio sounds
- `main.ts` — hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json`
