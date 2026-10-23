# 🚀 SPACESCAPE - 2D Retro Space Shooter

[![Play on Itch.io](https://img.shields.io/badge/Play_on-itch.io-FA5C5C?style=for-the-badge&logo=itchdotio&logoColor=white)](https://versatilevedant.itch.io/spacescape)
[![GitHub](https://img.shields.io/badge/GitHub-Spacescape-blue?style=for-the-badge&logo=github)](https://github.com/versatilevedant/Spacescape)
[![Author](https://img.shields.io/badge/Author-Versatile%20Vedant-ffbe0b?style=for-the-badge)](https://github.com/versatilevedant)

A fast-paced, retro-futuristic arcade space shooter featuring custom pixel-art starfighters, fiery plasma weaponry, swarming biomechanical alien drones, a full Space Shop economy, and tactical power-ups.

---

## 🎮 Live Game & Portal
* **Play on Itch.io**: [https://versatilevedant.itch.io/spacescape](https://versatilevedant.itch.io/spacescape)
* **Local Arcade Server**: `http://localhost:3000/`
* **Direct Canvas Game**: `http://localhost:3000/game/`

---

## ✨ Features

### 🛸 5 Unique Pixel-Art Starfighters
Each starfighter is designed in a 78×100 pixel-art aesthetic with custom geometries, flame thrusters, and combat stats:
1. **STARFIGHTER DELTA** (Flagship Starter • **Free**): Classic cobalt-blue delta-wing craft with twin thruster plumes.
2. **CRIMSON VIPER** (Interceptor • **200 🪙**): Crimson predator with forward-swept wings and quad plasma blaster pods.
3. **EMERALD PHANTOM** (Stealth Fighter • **350 🪙**): Emerald stealth fuselage with angular canards and dual lime thruster flames.
4. **VOID REAPER** (Heavy Dreadnought • **500 🪙**): Shadow-purple dual-hull dreadnought powered by a glowing cyan core.
5. **SOLARIS TITAN** (Command Ship • **750 🪙**): Solaris gold & obsidian flagship with quad heavy solar thrusters.

### 💰 Coin Economy & Space Shop
* **100 Combat Score = 1 Coin Earned** (with floating `+1 🪙` indicators).
* Persistent wallet saved automatically in browser `localStorage`.
* Integrated **Space Shop** with responsive carousel, lore descriptions, and fleet management.

### ⚡ Tactical Drops & Power-Ups
* ❄️ **Freeze**: Freezes enemy drone movement for 4.5 seconds.
* 🔥 **Triple Flame (Multi-Fire)**: Converts standard plasma fire into a triple-spread burning flame barrage.
* 💥 **Nuke**: Instantly clears all enemies on screen in a blinding flash.
* 🛡️ **Shield Repair**: Restores hull and shield durability.

### 🎵 Authentic Audio & Synthwave Soundtrack
* **Laser Fire SFX**: `laserSmall_001.ogg` (Kenney Sci-Fi Sounds).
* **Enemy Destroyed SFX**: `laser1.ogg` (Kenney Digital Audio).
* **Power-Up Chime**: `powerUp6.ogg` (Kenney Digital Audio).
* **Background Soundtrack**: Synthwave theme `9.-Space-Invaders.ogg` by VOiD1 Gaming.

### 🕹️ Controls
* **Keyboard**:
  * `W` / `A` / `S` / `D` or `Arrow Keys` — Steer starfighter
  * `Space` — Fire plasma bullets
  * `P` or `Esc` — Pause / Resume
* **Touch & Mobile**:
  * **Virtual Joystick** (Bottom-Left) — Full 360° directional control
  * **Fire Button** (Bottom-Right) — Fire weapons

---

## 📂 Project Structure

```
Spacescape/
├── itch_deploy/                # Production-ready package for Itch.io HTML5 upload
│   ├── assets_custom/          # Pixel-art ships, drones, flames, and power-up icons
│   ├── audio/                  # Authentic SFX and BGM (.ogg)
│   ├── game.js                 # 60 FPS HTML5 Canvas engine
│   └── index.html              # Embedded game viewport (540x960 portrait)
├── portal/                     # Modern cyber-arcade landing portal & hangar
│   ├── index.html
│   ├── portal.css
│   └── portal.js
├── web_dist/                   # Web distribution build served by local server
│   ├── assets_custom/
│   ├── audio/
│   ├── game.js
│   └── index.html
├── spacescape-main/            # Original Flutter/Flame engine source code
├── create_custom_ships.py      # Pixel-art generator for all 5 custom craft
├── spacescape-itch-deploy.zip  # Ready-to-upload Itch.io bundle
├── server.js                   # Node.js high-performance static server
├── start.bat                   # 1-click startup batch script
└── package.json
```

---

## 🚀 Quick Start (Local Run)

### Prerequisites
* [Node.js](https://nodejs.org/) installed.

### Run
```bash
npm start
```
Or double-click `start.bat`.

Then visit:
* Arcade Hub: `http://localhost:3000`
* Direct Game: `http://localhost:3000/game/`

---

## 📦 Deploying to Itch.io

1. Head to your [Itch.io Dashboard](https://itch.io/dashboard).
2. Create or edit the project **`spacescape`** under user **`versatilevedant`**.
3. Set **Kind of project** to **HTML**.
4. Upload `spacescape-itch-deploy.zip`.
5. Check **"This file will be played in the browser"**.
6. Set viewport dimensions to **540 × 960**.
7. Save and publish!

---

## 📜 Credits & Attribution
* **Created by**: [Versatile Vedant](https://github.com/versatilevedant)
* **Inspired by**: Spacescape by DevKage / ufrshubham
* **Audio**: Kenney.nl (Sci-Fi & Digital Audio) & VOiD1 Gaming (Free Synthwave Music Pack)
