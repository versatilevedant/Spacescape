// Spacescape - Arcade Space Shooter with Space Shop & Power-ups
// Created for Versatile Vedant (https://versatilevedant.itch.io/spacescape)

class SpacescapeEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution (standard portrait arcade shooter)
    this.width = 540;
    this.height = 960;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Persistent Economy & Storage
    this.coins = parseInt(localStorage.getItem('spacescape_coins') || '50', 10);
    this.highScore = parseInt(localStorage.getItem('spacescape_highscore') || '0', 10);
    this.ownedShips = JSON.parse(localStorage.getItem('spacescape_owned_ships') || '["delta"]');
    this.equippedShipId = localStorage.getItem('spacescape_equipped_ship') || 'delta';

    // Game state: 'MENU', 'SHOP', 'SETTINGS', 'PLAYING', 'GAMEOVER', 'PAUSED'
    this.state = 'MENU';
    this.score = 0;
    this.coinsEarnedThisRun = 0;
    this.wave = 1;

    // 5 Unique Aircraft Designs (All custom pixel art matching Delta Starfighter style)
    this.ships = {
      delta: {
        id: 'delta',
        name: 'STARFIGHTER DELTA',
        cost: 0,
        speed: 380,
        dpsMultiplier: 1.0,
        multiShotBonus: 0,
        spriteKey: 'player',
        desc: 'Cobalt-blue classic delta starfighter with twin thruster plumes.'
      },
      viper: {
        id: 'viper',
        name: 'CRIMSON VIPER',
        cost: 200,
        speed: 420,
        dpsMultiplier: 1.25,
        multiShotBonus: 0,
        spriteKey: 'viper',
        desc: 'Crimson predator with forward-swept wings and plasma blaster pods.'
      },
      phantom: {
        id: 'phantom',
        name: 'EMERALD PHANTOM',
        cost: 350,
        speed: 440,
        dpsMultiplier: 1.5,
        multiShotBonus: 1,
        spriteKey: 'phantom',
        desc: 'Emerald stealth fighter with angular canards and twin lime flames.'
      },
      reaper: {
        id: 'reaper',
        name: 'VOID REAPER',
        cost: 500,
        speed: 460,
        dpsMultiplier: 1.8,
        multiShotBonus: 1,
        spriteKey: 'reaper',
        desc: 'Shadow-purple dual-hull dreadnought with cyan plasma core.'
      },
      titan: {
        id: 'titan',
        name: 'SOLARIS TITAN',
        cost: 750,
        speed: 500,
        dpsMultiplier: 2.2,
        multiShotBonus: 2,
        spriteKey: 'titan',
        desc: 'Majestic gold & obsidian flagship with quad heavy solar thrusters.'
      }
    };

    // Shop selection index
    this.shopShipList = ['delta', 'viper', 'phantom', 'reaper', 'titan'];
    this.shopIndex = 0;
    this.shopMessage = '';
    this.shopMessageTimer = 0;

    // Assets
    this.images = {};
    this.imagesLoaded = false;
    this.flameFrame = 0;
    this.flameTimer = 0;

    // Audio Context
    this.audioCtx = null;
    this.soundEnabled = true;

    // Entities
    this.player = null;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.stars = [];
    this.powerups = [];
    this.floatingTexts = [];

    // Active Powerup Timers (Freeze, Multi-Fire)
    this.freezeTimer = 0;
    this.multiFireTimer = 0;

    // Controls: KEYBOARD & JOYSTICK ONLY (No mouse drag!)
    this.keys = {};
    this.isFiring = false;
    this.lastShotTime = 0;
    this.shootInterval = 135;

    // Virtual Joystick on Bottom-Left
    this.joystick = {
      baseX: 110,
      baseY: this.height - 130,
      baseRadius: 75,
      knobX: 110,
      knobY: this.height - 130,
      knobRadius: 36,
      active: false,
      pointerId: null,
      dirX: 0,
      dirY: 0
    };

    // Virtual Fire Button on Bottom-Right
    this.fireBtn = {
      x: this.width - 95,
      y: this.height - 130,
      radius: 55,
      pressed: false,
      pointerId: null
    };

    // Spawning
    this.lastSpawnTime = 0;
    this.spawnInterval = 1350;
    this.lastPowerupSpawn = 0;
    this.powerupInterval = 9000;

    this.initStars();
    this.initAudio();
    this.initInput();
    this.loadAssets(() => {
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    });
  }

  saveEconomy() {
    localStorage.setItem('spacescape_coins', this.coins.toString());
    localStorage.setItem('spacescape_owned_ships', JSON.stringify(this.ownedShips));
    localStorage.setItem('spacescape_equipped_ship', this.equippedShipId);
  }

  initAudio() {
    this.audioBuffers = {};
    this.audioElements = {};
    this.bgm = null;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      this.audioCtx = null;
    }

    // Authentic sound effects from https://github.com/ufrshubham/spacescape:
    // - laserSmall_001.ogg (Bullet shooting)
    // - laser1.ogg (Enemy destroyed / hit)
    // - powerUp6.ogg (Power-up collection & UI feedback)
    const soundFiles = {
      laser: './audio/laserSmall_001.ogg',
      explosion: './audio/laser1.ogg',
      powerup: './audio/powerUp6.ogg'
    };

    for (const [key, url] of Object.entries(soundFiles)) {
      if (this.audioCtx) {
        fetch(url)
          .then(resp => {
            if (!resp.ok) throw new Error('Failed to load: ' + url);
            return resp.arrayBuffer();
          })
          .then(buf => this.audioCtx.decodeAudioData(buf))
          .then(decoded => {
            this.audioBuffers[key] = decoded;
          })
          .catch(() => {
            try {
              this.audioElements[key] = new Audio(url);
            } catch (err) {}
          });
      } else {
        try {
          this.audioElements[key] = new Audio(url);
        } catch (err) {}
      }
    }

    // Background synthwave music from VOiD1 Gaming (9. Space Invaders)
    try {
      this.bgm = new Audio('./audio/9.-Space-Invaders.ogg');
      this.bgm.loop = true;
      this.bgm.volume = 0.32;
    } catch (e) {}
  }

  ensureAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSound(key, volume = 0.5, pitchRate = 1.0) {
    if (!this.soundEnabled) return;
    this.ensureAudio();

    if (this.audioCtx && this.audioBuffers[key]) {
      try {
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.audioBuffers[key];
        source.playbackRate.value = pitchRate;
        const gain = this.audioCtx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(this.audioCtx.destination);
        source.start(0);
        return;
      } catch (e) {}
    }

    // Fallback using Audio clone
    const soundFiles = {
      laser: './audio/laserSmall_001.ogg',
      explosion: './audio/laser1.ogg',
      powerup: './audio/powerUp6.ogg'
    };
    if (soundFiles[key]) {
      try {
        const a = new Audio(soundFiles[key]);
        a.volume = volume;
        a.play().catch(() => {});
      } catch (e) {}
    }
  }

  playLaserSound() {
    // laserSmall_001.ogg from Kenney Sci-Fi Sounds (as in original repo player.dart)
    this.playSound('laser', 0.42);
  }

  playExplosionSound() {
    // laser1.ogg from Kenney Digital Audio (as in original repo enemy.dart)
    this.playSound('explosion', 0.55);
  }

  playHitSound() {
    // Slightly higher pitched laser1.ogg feedback for player hull hit
    this.playSound('explosion', 0.32, 1.35);
  }

  playPowerupSound() {
    // powerUp6.ogg from Kenney Digital Audio (as in original repo power_ups.dart)
    this.playSound('powerup', 0.65);
  }

  playBgm() {
    if (!this.soundEnabled || !this.bgm) return;
    this.ensureAudio();
    try {
      this.bgm.currentTime = 0;
      this.bgm.play().catch(() => {});
    } catch (e) {}
  }

  resumeBgm() {
    if (!this.soundEnabled || !this.bgm) return;
    this.ensureAudio();
    try {
      this.bgm.play().catch(() => {});
    } catch (e) {}
  }

  pauseBgm() {
    if (this.bgm) {
      try {
        this.bgm.pause();
      } catch (e) {}
    }
  }

  stopBgm() {
    if (this.bgm) {
      try {
        this.bgm.pause();
        this.bgm.currentTime = 0;
      } catch (e) {}
    }
  }

  loadAssets(callback) {
    const assetList = {
      player: './assets_custom/player.png',
      viper: './assets_custom/ship_viper.png',
      phantom: './assets_custom/ship_phantom.png',
      reaper: './assets_custom/ship_reaper.png',
      titan: './assets_custom/ship_titan.png',
      enemy: './assets_custom/enemy.png',
      flame1: './assets_custom/flame_1.png',
      flame2: './assets_custom/flame_2.png',
      flame3: './assets_custom/flame_3.png',
      nuke: './assets_custom/nuke.png',
      freeze: './assets_custom/freeze.png',
      multiFire: './assets_custom/multi_fire.png',
      repair: './assets_custom/icon_plusSmall.png'
    };

    let remaining = Object.keys(assetList).length;
    for (const [key, src] of Object.entries(assetList)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.images[key] = img;
        remaining--;
        if (remaining === 0) {
          this.imagesLoaded = true;
          if (callback) callback();
        }
      };
      img.onerror = () => {
        console.warn('Asset fallback for:', src);
        remaining--;
        if (remaining === 0 && callback) callback();
      };
    }
  }

  initStars() {
    this.stars = [];
    const starCount = 140;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() < 0.65 ? 1 : (Math.random() < 0.88 ? 1.5 : 2),
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.008 + Math.random() * 0.02
      });
    }
  }

  initPlayer() {
    const craft = this.ships[this.equippedShipId] || this.ships.delta;
    this.player = {
      x: this.width / 2,
      y: this.height * 0.72,
      w: 78,
      h: 100,
      speed: craft.speed,
      dps: craft.dpsMultiplier,
      multiShot: craft.multiShotBonus,
      health: 100,
      maxHealth: 100,
      invulnerable: 0,
      thrusterFlicker: 0,
      craft: craft
    };
  }

  startMission() {
    this.score = 0;
    this.coinsEarnedThisRun = 0;
    this.wave = 1;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.floatingTexts = [];
    this.freezeTimer = 0;
    this.multiFireTimer = 0;
    this.lastSpawnTime = performance.now();
    this.initPlayer();
    // Do not place enemies at a fixed position on screen!
    // Spawn initial enemies above the top border so they fly downward into the screen naturally.
    this.spawnEnemy(-50);
    this.spawnEnemy(-160);
    this.state = 'PLAYING';
    this.playBgm();
  }

  getCanvasPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
    return currentY;
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.ensureAudio();
      this.keys[e.code] = true;

      if (this.state === 'MENU') {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.startMission();
        }
      } else if (this.state === 'PLAYING') {
        if (e.code === 'KeyP' || e.code === 'Escape') {
          this.state = 'PAUSED';
          this.pauseBgm();
        }
      } else if (this.state === 'PAUSED') {
        if (e.code === 'KeyP' || e.code === 'Escape') {
          this.state = 'PLAYING';
          this.resumeBgm();
        }
      } else if (this.state === 'GAMEOVER') {
        if (e.code === 'Space' || e.code === 'KeyR') {
          this.startMission();
        } else if (e.code === 'Escape') {
          this.state = 'MENU';
          this.stopBgm();
        }
      } else if (this.state === 'SHOP' || this.state === 'SETTINGS') {
        if (e.code === 'Escape') {
          this.state = 'MENU';
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    const handlePointerDown = (id, x, y) => {
      this.ensureAudio();

      // UI Clicking in MENU
      if (this.state === 'MENU') {
        const btnW = 340;
        const btnH = 50;
        const btnX = (this.width - btnW) / 2;

        if (x >= btnX && x <= btnX + btnW && y >= 530 && y <= 530 + btnH) {
          this.startMission();
          return;
        }
        if (x >= btnX && x <= btnX + btnW && y >= 595 && y <= 595 + btnH) {
          this.state = 'SHOP';
          return;
        }
        if (x >= btnX && x <= btnX + btnW && y >= 660 && y <= 660 + btnH) {
          this.state = 'SETTINGS';
          return;
        }
        return;
      }

      // UI Clicking in SHOP
      if (this.state === 'SHOP') {
        // Back button (top left)
        if (x >= 20 && x <= 130 && y >= 25 && y <= 70) {
          this.state = 'MENU';
          return;
        }
        // Prev button (‹)
        if (x >= 15 && x <= 65 && y >= 340 && y <= 410) {
          this.shopIndex = (this.shopIndex - 1 + this.shopShipList.length) % this.shopShipList.length;
          return;
        }
        // Next button (›)
        if (x >= this.width - 65 && x <= this.width - 15 && y >= 340 && y <= 410) {
          this.shopIndex = (this.shopIndex + 1) % this.shopShipList.length;
          return;
        }
        // Buy / Equip button (Centered below card)
        const btnW = 320;
        const btnH = 52;
        const btnX = (this.width - btnW) / 2;
        const btnY = 650;
        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
          const shipId = this.shopShipList[this.shopIndex];
          const ship = this.ships[shipId];
          const isOwned = this.ownedShips.includes(shipId);

          if (isOwned) {
            this.equippedShipId = shipId;
            this.saveEconomy();
            this.shopMessage = 'EQUIPPED SUCCESSFUL!';
            this.shopMessageTimer = 2.0;
            this.playPowerupSound();
          } else {
            if (this.coins >= ship.cost) {
              this.coins -= ship.cost;
              this.ownedShips.push(shipId);
              this.equippedShipId = shipId;
              this.saveEconomy();
              this.shopMessage = 'PURCHASED & EQUIPPED!';
              this.shopMessageTimer = 2.5;
              this.playPowerupSound();
            } else {
              this.shopMessage = `NEED ${ship.cost - this.coins} MORE COINS! (100 SCORE = 1 COIN)`;
              this.shopMessageTimer = 2.5;
            }
          }
          return;
        }
        return;
      }

      // UI Clicking in SETTINGS
      if (this.state === 'SETTINGS') {
        const btnW = 320;
        const btnH = 48;
        const btnX = (this.width - btnW) / 2;
        if (x >= btnX && x <= btnX + btnW && y >= 320 && y <= 320 + btnH) {
          this.soundEnabled = !this.soundEnabled;
          if (!this.soundEnabled) {
            this.pauseBgm();
          }
          return;
        }
        if (x >= btnX && x <= btnX + btnW && y >= 390 && y <= 390 + btnH) {
          this.coins += 100;
          this.saveEconomy();
          this.playPowerupSound();
          return;
        }
        if (x >= btnX && x <= btnX + btnW && y >= 460 && y <= 460 + btnH) {
          this.state = 'MENU';
          this.stopBgm();
          return;
        }
        return;
      }

      // UI Clicking in GAMEOVER
      if (this.state === 'GAMEOVER') {
        const btnW = 280;
        const btnH = 46;
        const btnX = (this.width - btnW) / 2;
        if (x >= btnX && x <= btnX + btnW && y >= 560 && y <= 560 + btnH) {
          this.startMission();
          return;
        }
        if (x >= btnX && x <= btnX + btnW && y >= 620 && y <= 620 + btnH) {
          this.state = 'MENU';
          this.stopBgm();
          return;
        }
        return;
      }

      // UI Clicking in PAUSED
      if (this.state === 'PAUSED') {
        const btnW = 240;
        const btnH = 45;
        const btnX = (this.width - btnW) / 2;
        if (x >= btnX && x <= btnX + btnW && y >= 460 && y <= 460 + btnH) {
          this.state = 'PLAYING';
          this.resumeBgm();
          return;
        }
        if (x >= btnX && x <= btnX + btnW && y >= 520 && y <= 520 + btnH) {
          this.state = 'MENU';
          this.stopBgm();
          return;
        }
        return;
      }

      // In PLAYING: Virtual Controls
      if (this.state === 'PLAYING') {
        // Pause Button top right
        if (x >= this.width - 60 && x <= this.width - 15 && y >= 15 && y <= 60) {
          this.state = 'PAUSED';
          this.pauseBgm();
          return;
        }

        // Joystick (bottom-left)
        const distJoy = Math.hypot(x - this.joystick.baseX, y - this.joystick.baseY);
        if (distJoy < this.joystick.baseRadius * 1.5 && !this.joystick.active) {
          this.joystick.active = true;
          this.joystick.pointerId = id;
          this.updateJoystick(x, y);
          return;
        }

        // Fire Button (bottom-right)
        const distFire = Math.hypot(x - this.fireBtn.x, y - this.fireBtn.y);
        if (distFire < this.fireBtn.radius * 1.3) {
          this.fireBtn.pressed = true;
          this.fireBtn.pointerId = id;
          this.isFiring = true;
          return;
        }
      }
    };

    const handlePointerMove = (id, x, y) => {
      if (this.joystick.active && this.joystick.pointerId === id) {
        this.updateJoystick(x, y);
      }
    };

    const handlePointerUp = (id) => {
      if (this.joystick.active && this.joystick.pointerId === id) {
        this.joystick.active = false;
        this.joystick.pointerId = null;
        this.joystick.knobX = this.joystick.baseX;
        this.joystick.knobY = this.joystick.baseY;
        this.joystick.dirX = 0;
        this.joystick.dirY = 0;
      }
      if (this.fireBtn.pointerId === id) {
        this.fireBtn.pressed = false;
        this.fireBtn.pointerId = null;
        this.isFiring = false;
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = this.getCanvasPos(e.clientX, e.clientY);
      handlePointerDown('mouse', pos.x, pos.y);
    });

    window.addEventListener('mousemove', (e) => {
      const pos = this.getCanvasPos(e.clientX, e.clientY);
      handlePointerMove('mouse', pos.x, pos.y);
    });

    window.addEventListener('mouseup', () => {
      handlePointerUp('mouse');
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        handlePointerDown(t.identifier, pos.x, pos.y);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        handlePointerMove(t.identifier, pos.x, pos.y);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        handlePointerUp(t.identifier);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        handlePointerUp(t.identifier);
      }
    }, { passive: false });
  }

  updateJoystick(x, y) {
    const dx = x - this.joystick.baseX;
    const dy = y - this.joystick.baseY;
    const dist = Math.hypot(dx, dy);
    const maxDist = this.joystick.baseRadius - 15;

    if (dist <= maxDist) {
      this.joystick.knobX = x;
      this.joystick.knobY = y;
      this.joystick.dirX = dist > 5 ? dx / maxDist : 0;
      this.joystick.dirY = dist > 5 ? dy / maxDist : 0;
    } else {
      const angle = Math.atan2(dy, dx);
      this.joystick.knobX = this.joystick.baseX + Math.cos(angle) * maxDist;
      this.joystick.knobY = this.joystick.baseY + Math.sin(angle) * maxDist;
      this.joystick.dirX = Math.cos(angle);
      this.joystick.dirY = Math.sin(angle);
    }
  }

  shoot() {
    if (!this.player) return;
    const now = performance.now();
    if (now - this.lastShotTime < this.shootInterval) return;
    this.lastShotTime = now;

    const bulletW = 25;
    const bulletH = 47;
    const damage = 15 * this.player.dps;

    // Center bullet
    this.bullets.push({
      x: this.player.x - bulletW / 2,
      y: this.player.y - this.player.h / 2 - 12,
      w: bulletW,
      h: bulletH,
      vx: 0,
      vy: -560,
      damage: damage
    });

    // Multi-fire (Active powerup or Ship tier bonus)
    const isMulti = this.multiFireTimer > 0 || this.player.multiShot > 0;
    if (isMulti) {
      this.bullets.push({
        x: this.player.x - bulletW / 2 - 20,
        y: this.player.y - this.player.h / 2,
        w: bulletW * 0.9,
        h: bulletH * 0.9,
        vx: -90,
        vy: -550,
        damage: damage * 0.85
      });
      this.bullets.push({
        x: this.player.x - bulletW / 2 + 20,
        y: this.player.y - this.player.h / 2,
        w: bulletW * 0.9,
        h: bulletH * 0.9,
        vx: 90,
        vy: -550,
        damage: damage * 0.85
      });
    }

    this.playLaserSound();

    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 6,
        y: this.player.y - this.player.h / 2 - 4,
        vx: (Math.random() - 0.5) * 40,
        vy: -110 - Math.random() * 70,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.4 ? '#ffbe0b' : '#ff4500',
        life: 0.12,
        maxLife: 0.12
      });
    }
  }

  spawnEnemy(forcedY = null) {
    const w = 42;
    const h = 45;
    const x = 30 + Math.random() * (this.width - w - 60);
    const speed = 130 + Math.random() * 50 + (this.wave * 7);
    const hasHMove = Math.random() > 0.45;
    const vx = hasHMove ? (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 45) : 0;

    this.enemies.push({
      x: x,
      y: forcedY !== null ? forcedY : -h,
      w: w,
      h: h,
      vx: vx,
      vy: speed,
      speed: speed,
      health: 20 + Math.floor(this.wave * 5),
      maxHealth: 20 + Math.floor(this.wave * 5),
      time: 0,
      hitFlash: 0
    });
  }

  checkEnemySpawn() {
    const now = performance.now();
    if (now - this.lastSpawnTime < this.spawnInterval) return;
    this.lastSpawnTime = now;
    this.spawnEnemy();
  }

  spawnPowerup() {
    const now = performance.now();
    if (now - this.lastPowerupSpawn < this.powerupInterval) return;
    this.lastPowerupSpawn = now;

    const types = ['nuke', 'freeze', 'multiFire', 'repair'];
    const selected = types[Math.floor(Math.random() * types.length)];
    const w = 40;
    const h = 40;
    const x = 50 + Math.random() * (this.width - 100);

    this.powerups.push({
      type: selected,
      x: x,
      y: -h,
      w: w,
      h: h,
      speed: 95,
      pulse: 0
    });
  }

  activatePowerup(type) {
    this.playPowerupSound();
    if (type === 'nuke') {
      for (const e of this.enemies) {
        this.createExplosion(e.x + e.w / 2, e.y + e.h / 2);
        this.addScore(100);
      }
      this.enemies = [];
      this.addFloatingText('NUKE CLEAR!', this.width / 2, this.height / 2, '#ffbe0b');
    } else if (type === 'freeze') {
      this.freezeTimer = 4.5;
      this.addFloatingText('ENEMY FREEZE!', this.player.x, this.player.y - 40, '#00f3ff');
    } else if (type === 'multiFire') {
      this.multiFireTimer = 6.0;
      this.addFloatingText('TRIPLE FLAME!', this.player.x, this.player.y - 40, '#ff4500');
    } else if (type === 'repair') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
      this.addFloatingText('+35 SHIELD REPAIR', this.player.x, this.player.y - 40, '#38ef7d');
    }
  }

  addScore(pts) {
    this.score += pts;
    const earnedCoin = Math.floor(pts / 100);
    if (earnedCoin > 0) {
      this.coins += earnedCoin;
      this.coinsEarnedThisRun += earnedCoin;
      this.saveEconomy();
    }
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('spacescape_highscore', this.highScore.toString());
    }
  }

  addFloatingText(txt, x, y, color = '#ffbe0b') {
    this.floatingTexts.push({
      text: txt,
      x: x,
      y: y,
      color: color,
      life: 1.2,
      maxLife: 1.2
    });
  }

  createExplosion(x, y, isPlayer = false) {
    const count = isPlayer ? 45 : 24;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 240;
      const colorChoices = isPlayer 
        ? ['#00f3ff', '#ffbe0b', '#ff3860', '#ffffff'] 
        : ['#9b59b6', '#8e44ad', '#ff4500', '#ffbe0b', '#e74c3c'];
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color: color,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7
      });
    }
    this.playExplosionSound();
  }

  update(dt) {
    if (this.shopMessageTimer > 0) {
      this.shopMessageTimer -= dt;
      if (this.shopMessageTimer <= 0) this.shopMessage = '';
    }

    for (const star of this.stars) {
      star.y += star.speed * dt * 60;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed = -star.twinkleSpeed;
    }

    if (this.state !== 'PLAYING') return;

    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.multiFireTimer > 0) this.multiFireTimer -= dt;

    this.flameTimer += dt;
    if (this.flameTimer > 0.08) {
      this.flameTimer = 0;
      this.flameFrame = (this.flameFrame + 1) % 3;
    }

    if (this.player) {
      if (this.player.invulnerable > 0) {
        this.player.invulnerable -= dt;
      }

      let moveX = 0;
      let moveY = 0;

      if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;
      if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= 1;
      if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += 1;

      if (this.joystick.active) {
        moveX += this.joystick.dirX;
        moveY += this.joystick.dirY;
      }

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        const normX = len > 1 ? moveX / len : moveX;
        const normY = len > 1 ? moveY / len : moveY;
        this.player.x += normX * this.player.speed * dt;
        this.player.y += normY * this.player.speed * dt;
      }

      const halfW = this.player.w / 2;
      const halfH = this.player.h / 2;
      this.player.x = Math.max(halfW, Math.min(this.width - halfW, this.player.x));
      this.player.y = Math.max(halfH, Math.min(this.height - halfH, this.player.y));

      this.player.thrusterFlicker += dt * 30;
      if (Math.random() < 0.85) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 8,
          y: this.player.y + halfH - 4,
          vx: (Math.random() - 0.5) * 25,
          vy: 110 + Math.random() * 70,
          size: 2 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#ffe600' : '#ff4500',
          life: 0.22,
          maxLife: 0.22
        });
      }

      if (this.keys['Space'] || this.isFiring) {
        this.shoot();
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += (b.vx || 0) * dt;
      b.y += (b.vy || -560) * dt;

      if (Math.random() < 0.3) {
        this.particles.push({
          x: b.x + b.w / 2,
          y: b.y + b.h - 2,
          vx: 0,
          vy: 20 + Math.random() * 15,
          size: 2,
          color: Math.random() > 0.5 ? '#ffe600' : '#ff4500',
          life: 0.16,
          maxLife: 0.16
        });
      }

      if (b.y + b.h < 0 || b.x < -20 || b.x > this.width + 20) {
        this.bullets.splice(i, 1);
      }
    }

    this.checkEnemySpawn();
    const speedMultiplier = this.freezeTimer > 0 ? 0.35 : 1.0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.time += dt * speedMultiplier;

      if (e.hitFlash > 0) e.hitFlash -= dt;

      // Continuously stream downward through space
      e.y += e.vy * speedMultiplier * dt;
      if (e.vx) {
        e.x += e.vx * speedMultiplier * dt;
        // Bounce horizontally off side walls like spacescape enemy.dart
        if (e.x < 15) {
          e.x = 15;
          e.vx = Math.abs(e.vx);
        } else if (e.x + e.w > this.width - 15) {
          e.x = this.width - e.w - 15;
          e.vx = -Math.abs(e.vx);
        }
      }

      let enemyDestroyed = false;
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (
          b.x < e.x + e.w &&
          b.x + b.w > e.x &&
          b.y < e.y + e.h &&
          b.y + b.h > e.y
        ) {
          this.bullets.splice(j, 1);
          e.health -= b.damage;
          e.hitFlash = 0.08;
          this.playHitSound();

          for (let k = 0; k < 3; k++) {
            this.particles.push({
              x: b.x + b.w / 2,
              y: b.y,
              vx: (Math.random() - 0.5) * 100,
              vy: -50 - Math.random() * 60,
              size: 2 + Math.random() * 2,
              color: '#ffe600',
              life: 0.14,
              maxLife: 0.14
            });
          }

          if (e.health <= 0) {
            this.createExplosion(e.x + e.w / 2, e.y + e.h / 2);
            this.enemies.splice(i, 1);
            enemyDestroyed = true;
            this.addScore(100);
            this.addFloatingText('+1 🪙', e.x + e.w / 2, e.y, '#ffd700');
            break;
          }
        }
      }

      if (enemyDestroyed) continue;

      if (this.player && this.player.invulnerable <= 0) {
        const px = this.player.x - this.player.w / 2;
        const py = this.player.y - this.player.h / 2;
        if (
          px < e.x + e.w - 6 &&
          px + this.player.w > e.x + 6 &&
          py < e.y + e.h - 6 &&
          py + this.player.h > e.y + 6
        ) {
          this.createExplosion(e.x + e.w / 2, e.y + e.h / 2);
          this.enemies.splice(i, 1);
          this.player.health -= 25;
          this.player.invulnerable = 1.0;
          if (this.player.health <= 0) {
            this.createExplosion(this.player.x, this.player.y, true);
            this.state = 'GAMEOVER';
            this.pauseBgm();
          }
          continue;
        }
      }

      if (e.y > this.height + 60) {
        this.enemies.splice(i, 1);
      }
    }

    this.spawnPowerup();
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.speed * dt;
      p.pulse += dt * 4;

      if (this.player) {
        const px = this.player.x - this.player.w / 2;
        const py = this.player.y - this.player.h / 2;
        if (
          px < p.x + p.w &&
          px + this.player.w > p.x &&
          py < p.y + p.h &&
          py + this.player.h > p.y
        ) {
          this.activatePowerup(p.type);
          this.powerups.splice(i, 1);
          continue;
        }
      }

      if (p.y > this.height + 40) {
        this.powerups.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (const star of this.stars) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha))})`;
      this.ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    }

    if (this.state === 'MENU') {
      this.drawMenu();
    } else if (this.state === 'SHOP') {
      this.drawShop();
    } else if (this.state === 'SETTINGS') {
      this.drawSettings();
    } else {
      this.drawGameplay();
    }
  }

  drawMenu() {
    this.ctx.save();

    // Top-Right Coin Bank
    this.ctx.font = '16px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#ffbe0b';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`🪙 ${this.coins} COINS`, this.width - 20, 42);

    // Title: SPACESCAPE exactly like screenshot
    this.ctx.textAlign = 'center';
    this.ctx.font = '48px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 5;
    this.ctx.strokeText('SPACESCAPE', this.width / 2, 420);
    this.ctx.fillText('SPACESCAPE', this.width / 2, 420);

    // Blue Menu Buttons (PLAY, SPACE SHOP, SETTINGS)
    const buttons = [
      { text: 'PLAY', y: 530 },
      { text: 'SPACE SHOP', y: 595 },
      { text: 'SETTINGS', y: 660 }
    ];

    const btnW = 340;
    const btnH = 50;
    const btnX = (this.width - btnW) / 2;

    for (const btn of buttons) {
      this.ctx.fillStyle = '#0d8bf2';
      this.ctx.fillRect(btnX, btn.y, btnW, btnH);
      this.ctx.strokeStyle = '#38b6ff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(btnX, btn.y, btnW, btnH);
      this.ctx.font = '20px "Bungee", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(btn.text, this.width / 2, btn.y + 34);
    }

    this.ctx.font = '12px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#7a8ba9';
    this.ctx.fillText('PRESS SPACE OR CLICK PLAY TO START', this.width / 2, 850);
    this.ctx.fillText('100 SCORE = 1 COIN • UPGRADE FLEET IN SPACE SHOP', this.width / 2, 875);

    this.ctx.restore();
  }

  drawShop() {
    this.ctx.save();

    // Header Back Button
    this.ctx.fillStyle = '#0d8bf2';
    this.ctx.fillRect(20, 25, 110, 40);
    this.ctx.strokeStyle = '#38b6ff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(20, 25, 110, 40);
    this.ctx.font = '15px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('← BACK', 75, 51);

    // Title & Coin Bank
    this.ctx.font = '28px "Bungee", sans-serif';
    this.ctx.fillText('SPACE SHOP', this.width / 2, 52);
    this.ctx.font = '16px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#ffbe0b';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`🪙 ${this.coins} COINS`, this.width - 20, 52);

    const shipId = this.shopShipList[this.shopIndex];
    const ship = this.ships[shipId];
    const isOwned = this.ownedShips.includes(shipId);
    const isEquipped = this.equippedShipId === shipId;

    // Carousel Navigation Arrows (‹ and ›)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.fillRect(15, 340, 50, 70);
    this.ctx.fillRect(this.width - 65, 340, 50, 70);
    this.ctx.strokeStyle = '#38b6ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(15, 340, 50, 70);
    this.ctx.strokeRect(this.width - 65, 340, 50, 70);
    this.ctx.font = '36px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('‹', 40, 388);
    this.ctx.fillText('›', this.width - 40, 388);

    // Main Showcase Card Box (Large width: 390px, height: 490px - Fits EVERYTHING cleanly!)
    const cardW = 390;
    const cardH = 490;
    const cardX = (this.width - cardW) / 2; // 75
    const cardY = 130;

    this.ctx.fillStyle = 'rgba(10, 18, 36, 0.85)';
    this.ctx.fillRect(cardX, cardY, cardW, cardH);
    this.ctx.strokeStyle = isEquipped ? '#00f3ff' : 'rgba(56, 182, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Ship Sprite (Rendered with pixel precision)
    const shipImg = this.images[ship.spriteKey] || this.images.player;
    if (shipImg) {
      const drawW = 90;
      const drawH = 115;
      this.ctx.drawImage(shipImg, (this.width - drawW) / 2, cardY + 25, drawW, drawH);
    }

    // Ship Name
    this.ctx.font = '22px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(ship.name, this.width / 2, cardY + 180);

    // Velocity & Firepower Stats (Formatted cleanly inside card)
    this.ctx.font = '13px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText(`VELOCITY: ${ship.speed} KM/S   •   FIREPOWER: ×${ship.dpsMultiplier}`, this.width / 2, cardY + 215);

    // Description text (Wrapped with max width 350px so it NEVER overflows!)
    this.ctx.font = '12px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#a0b2ce';
    const lastDescY = this.drawWrappedText(this.ctx, ship.desc, this.width / 2, cardY + 248, 350, 18);

    // Cost / Ownership Status (Clean colored text inside card)
    this.ctx.font = '16px "Bungee", sans-serif';
    if (isEquipped) {
      this.ctx.fillStyle = '#38ef7d';
      this.ctx.fillText('STATUS: EQUIPPED IN HANGAR', this.width / 2, cardY + 315);
    } else if (isOwned) {
      this.ctx.fillStyle = '#ffbe0b';
      this.ctx.fillText('STATUS: UNLOCKED & READY', this.width / 2, cardY + 315);
    } else {
      this.ctx.fillStyle = '#ff3860';
      this.ctx.fillText(`COST: ${ship.cost} COINS`, this.width / 2, cardY + 315);
    }

    // Mini Feature Pills inside card
    this.ctx.font = '11px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#7a8ba9';
    this.ctx.fillText(`100 SCORE IN COMBAT = 1 COIN EARNED`, this.width / 2, cardY + 360);
    this.ctx.fillText(`AIRCRAFT MODEL ${this.shopIndex + 1} OF 5`, this.width / 2, cardY + 382);

    // Carousel Pagination Dots inside card
    for (let i = 0; i < this.shopShipList.length; i++) {
      const dotX = this.width / 2 + (i - 2) * 22;
      this.ctx.beginPath();
      this.ctx.arc(dotX, cardY + 440, i === this.shopIndex ? 6 : 3, 0, Math.PI * 2);
      this.ctx.fillStyle = i === this.shopIndex ? '#00f3ff' : 'rgba(255,255,255,0.25)';
      this.ctx.fill();
    }

    // Prominent Buy / Equip Action Button (Placed neatly at y: 650)
    const btnW = 320;
    const btnH = 52;
    const btnX = (this.width - btnW) / 2;
    const btnY = 650;

    let btnColor = '#0d8bf2';
    let btnText = 'EQUIP SHIP';
    if (isEquipped) {
      btnColor = '#27ae60';
      btnText = 'ACTIVE CRAFT';
    } else if (isOwned) {
      btnColor = '#0d8bf2';
      btnText = 'EQUIP SHIP';
    } else {
      btnColor = this.coins >= ship.cost ? '#f39c12' : '#57606f';
      btnText = `BUY CRAFT (${ship.cost} 🪙)`;
    }

    this.ctx.fillStyle = btnColor;
    this.ctx.fillRect(btnX, btnY, btnW, btnH);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(btnX, btnY, btnW, btnH);
    this.ctx.font = '18px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(btnText, this.width / 2, btnY + 35);

    // Feedback Toast (insufficient coins, etc.)
    if (this.shopMessage) {
      this.ctx.font = '14px "Orbitron", sans-serif';
      this.ctx.fillStyle = '#ffbe0b';
      this.ctx.fillText(this.shopMessage, this.width / 2, 735);
    }

    this.ctx.restore();
  }

  drawSettings() {
    this.ctx.save();
    this.ctx.textAlign = 'center';

    this.ctx.font = '32px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('SETTINGS', this.width / 2, 220);

    const btnW = 320;
    const btnH = 48;
    const btnX = (this.width - btnW) / 2;

    this.ctx.fillStyle = '#0d8bf2';
    this.ctx.fillRect(btnX, 320, btnW, btnH);
    this.ctx.font = '16px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`SOUND FX: ${this.soundEnabled ? 'ON' : 'MUTED'}`, this.width / 2, 352);

    this.ctx.fillStyle = '#f39c12';
    this.ctx.fillRect(btnX, 390, btnW, btnH);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('CLAIM +100 TEST COINS', this.width / 2, 422);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(btnX, 460, btnW, btnH);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('BACK TO MENU', this.width / 2, 492);

    this.ctx.restore();
  }

  drawGameplay() {
    const flameImg = this.flameFrame === 0 
      ? this.images.flame1 
      : (this.flameFrame === 1 ? this.images.flame2 : this.images.flame3);

    for (const b of this.bullets) {
      if (flameImg) {
        this.ctx.drawImage(flameImg, Math.floor(b.x), Math.floor(b.y), b.w, b.h);
      } else {
        this.ctx.fillStyle = '#ffbe0b';
        this.ctx.fillRect(b.x, b.y, b.w, b.h);
      }
    }

    for (const p of this.powerups) {
      this.ctx.save();
      const pImg = this.images[p.type];
      const scale = 1 + Math.sin(p.pulse) * 0.08;
      const pw = p.w * scale;
      const ph = p.h * scale;
      const px = p.x - (pw - p.w) / 2;
      const py = p.y - (ph - p.h) / 2;

      this.ctx.beginPath();
      this.ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 24 * scale, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
      this.ctx.fill();

      if (pImg) {
        this.ctx.drawImage(pImg, px, py, pw, ph);
      } else {
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.fillRect(px, py, pw, ph);
      }
      this.ctx.restore();
    }

    for (const e of this.enemies) {
      this.ctx.save();
      if (this.freezeTimer > 0) {
        this.ctx.filter = 'hue-rotate(180deg) brightness(1.4)';
      } else if (e.hitFlash > 0) {
        this.ctx.filter = 'brightness(2.5)';
      }
      if (this.images.enemy) {
        this.ctx.drawImage(this.images.enemy, Math.floor(e.x), Math.floor(e.y), e.w, e.h);
      } else {
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.fillRect(e.x, e.y, e.w, e.h);
      }
      this.ctx.restore();
    }

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    this.ctx.globalAlpha = 1.0;

    for (const ft of this.floatingTexts) {
      this.ctx.save();
      this.ctx.font = 'bold 16px "Orbitron", sans-serif';
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }

    if (this.player && this.state !== 'GAMEOVER') {
      this.ctx.save();
      if (this.player.invulnerable > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
        this.ctx.globalAlpha = 0.5;
      }

      const px = Math.floor(this.player.x - this.player.w / 2);
      const py = Math.floor(this.player.y - this.player.h / 2);

      const shipImg = this.images[this.player.craft.spriteKey] || this.images.player;
      if (shipImg) {
        this.ctx.drawImage(shipImg, px, py, this.player.w, this.player.h);
      } else {
        this.ctx.fillStyle = '#3b5dc9';
        this.ctx.fillRect(px, py, this.player.w, this.player.h);
      }

      this.ctx.restore();
    }

    this.drawVirtualControls();
    this.drawHUD();

    if (this.state === 'GAMEOVER') {
      this.drawGameOver();
    } else if (this.state === 'PAUSED') {
      this.drawPaused();
    }
  }

  drawVirtualControls() {
    this.ctx.save();

    // 1. Joystick Base (Bottom-Left)
    this.ctx.beginPath();
    this.ctx.arc(this.joystick.baseX, this.joystick.baseY, this.joystick.baseRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.fill();

    // 2. Joystick Inner Knob (Green)
    this.ctx.beginPath();
    this.ctx.arc(this.joystick.knobX, this.joystick.knobY, this.joystick.knobRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.joystick.active ? 'rgba(56, 142, 60, 0.85)' : 'rgba(38, 75, 48, 0.65)';
    this.ctx.fill();

    // 3. Fire Button (Bottom-Right, Red)
    this.ctx.beginPath();
    this.ctx.arc(this.fireBtn.x, this.fireBtn.y, this.fireBtn.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.fireBtn.pressed ? 'rgba(215, 38, 56, 0.85)' : 'rgba(120, 30, 30, 0.6)';
    this.ctx.fill();

    this.ctx.restore();
  }

  drawHUD() {
    this.ctx.save();

    this.ctx.font = '16px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 34);

    this.ctx.font = '14px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#ffbe0b';
    this.ctx.fillText(`🪙 ${this.coins} COINS`, 20, 56);

    if (this.freezeTimer > 0) {
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.fillText(`FREEZE: ${this.freezeTimer.toFixed(1)}s`, 20, 80);
    } else if (this.multiFireTimer > 0) {
      this.ctx.fillStyle = '#ff4500';
      this.ctx.fillText(`TRIPLE FLAME: ${this.multiFireTimer.toFixed(1)}s`, 20, 80);
    }

    if (this.player) {
      const barW = 110;
      const barH = 10;
      const barX = this.width - barW - 60;
      const barY = 24;

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.fillRect(barX, barY, barW, barH);

      const healthPct = Math.max(0, this.player.health / this.player.maxHealth);
      const healthColor = healthPct > 0.5 ? '#38ef7d' : (healthPct > 0.25 ? '#ffbe0b' : '#ff3860');
      this.ctx.fillStyle = healthColor;
      this.ctx.fillRect(barX, barY, barW * healthPct, barH);

      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(barX, barY, barW, barH);

      this.ctx.font = '10px "Orbitron", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('SHIELD', barX, barY - 5);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.fillRect(this.width - 50, 18, 32, 32);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(this.width - 43, 24, 6, 20);
      this.ctx.fillRect(this.width - 33, 24, 6, 20);
    }

    this.ctx.restore();
  }

  drawGameOver() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = '36px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ff3860';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION FAILED', this.width / 2, 380);

    this.ctx.font = '18px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, 430);

    this.ctx.fillStyle = '#ffbe0b';
    this.ctx.fillText(`+${this.coinsEarnedThisRun} COINS EARNED (100 SCORE = 1 COIN)`, this.width / 2, 465);
    this.ctx.fillText(`TOTAL BANK: ${this.coins} COINS`, this.width / 2, 495);

    const btnW = 280;
    const btnH = 46;
    const btnX = (this.width - btnW) / 2;

    this.ctx.fillStyle = '#0d8bf2';
    this.ctx.fillRect(btnX, 560, btnW, btnH);
    this.ctx.font = '18px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('RETRY MISSION', this.width / 2, 592);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(btnX, 620, btnW, btnH);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('RETURN TO MENU', this.width / 2, 652);

    this.ctx.restore();
  }

  drawPaused() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = '36px "Bungee", sans-serif';
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION PAUSED', this.width / 2, 380);

    const btnW = 240;
    const btnH = 45;
    const btnX = (this.width - btnW) / 2;

    this.ctx.fillStyle = '#0d8bf2';
    this.ctx.fillRect(btnX, 460, btnW, btnH);
    this.ctx.font = '18px "Bungee", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('RESUME', this.width / 2, 490);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(btnX, 520, btnW, btnH);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('MAIN MENU', this.width / 2, 550);

    this.ctx.restore();
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.spacescape = new SpacescapeEngine('gameCanvas');
});
