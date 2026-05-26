// ===================================================
// OVO_GAME.JS — Real Top-Down 1v1 Basketball Game
// WASD/Arrows = move · Click or Space = shoot
// ===================================================

const OVOG = {
  canvas: null, ctx: null, animId: null, active: false,
  // Scores
  playerScore: 0, aiScore: 0, maxScore: 7,
  // Possession
  hasBall: 'player',   // 'player' | 'ai' | 'loose'
  phase: 'playing',    // 'playing' | 'scored' | 'gameover'
  lastScorer: null,
  // Player position
  px: 0, py: 0, speed: 3.8,
  // AI position
  ax: 0, ay: 0, aiSpeed: 3.2,
  aiShootTimer: 0,
  aiShootCooldown: 90,
  // Ball (when loose)
  bx: 0, by: 0,
  // Shot in air
  inAir: false,
  airX: 0, airY: 0, airTX: 0, airTY: 0,
  airT: 0, airDur: 50, airZ: 0,
  shotMade: false, shotBy: 'player', is3pt: false,
  // Power charge
  charging: false, power: 0, powerOptimal: 50,
  // Keys
  keys: {},
  // Refs
  myPlayer: null, aiPlayer: null,
  // Hoop
  hoopX: 0, hoopY: 0, hoopR: 20,
  // Court dims
  W: 0, H: 0,
  // Visual
  flashTimer: 0, flashColor: '',
  scorePopups: [],
};

// ── Init ──────────────────────────────────────────
function startOVOGame() {
  OVOG.canvas = document.getElementById('ovoGameCanvas');
  if (!OVOG.canvas) return;
  OVOG.ctx = OVOG.canvas.getContext('2d');
  OVOG.active = true;

  OVOG.myPlayer = window.getActivePlayer?.() || PLAYER_DB[0];
  const notOwned = PLAYER_DB.filter(p => !PS.collection.includes(p.id) && p.ovr < 95);
  OVOG.aiPlayer = notOwned[Math.floor(Math.random() * notOwned.length)] || PLAYER_DB[8];

  // Speed from SPD stat
  const mySPD = window.getEffectiveStat?.(OVOG.myPlayer.id, 'spd') ?? OVOG.myPlayer.stats.spd;
  const aiSPD = OVOG.aiPlayer.stats.spd;
  OVOG.speed = 2.2 + (mySPD / 99) * 2.4;
  OVOG.aiSpeed = 1.8 + (aiSPD / 99) * 2.0;

  window.addEventListener('keydown', ovoKeyDown);
  window.addEventListener('keyup', ovoKeyUp);
  OVOG.canvas.addEventListener('mousedown', ovoMouseDown);
  window.addEventListener('resize', ovoResize);
  ovoResize();
  ovoReset(true);
}

function ovoResize() {
  if (!OVOG.canvas) return;
  const w = OVOG.canvas.offsetWidth  || OVOG.canvas.parentElement?.offsetWidth  || 600;
  const h = OVOG.canvas.offsetHeight || OVOG.canvas.parentElement?.offsetHeight || 480;
  OVOG.canvas.width  = w;
  OVOG.canvas.height = h;
  OVOG.W = w;
  OVOG.H = h;
  OVOG.hoopX = w / 2;
  OVOG.hoopY = h * 0.13;
}

function ovoReset(newGame) {
  if (newGame) { OVOG.playerScore = 0; OVOG.aiScore = 0; }
  OVOG.phase = 'playing';
  OVOG.flashTimer = 0;
  OVOG.inAir = false;
  OVOG.charging = false; OVOG.power = 0;
  OVOG.aiShootTimer = 0;
  OVOG.scorePopups = [];

  const W = OVOG.W, H = OVOG.H;
  // Player spawns bottom
  OVOG.px = W * 0.5; OVOG.py = H * 0.78;
  // AI spawns mid
  OVOG.ax = W * 0.5; OVOG.ay = H * 0.38;

  OVOG.hasBall = newGame ? 'player' : (OVOG.lastScorer === 'player' ? 'ai' : 'player');
  OVOG.bx = OVOG.px; OVOG.by = OVOG.py;

  cancelAnimationFrame(OVOG.animId);
  OVOG.animId = requestAnimationFrame(ovoLoop);
  renderOVOGameUI();
}

function stopOVOGame() {
  OVOG.active = false;
  cancelAnimationFrame(OVOG.animId);
  window.removeEventListener('keydown', ovoKeyDown);
  window.removeEventListener('keyup', ovoKeyUp);
  if (OVOG.canvas) OVOG.canvas.removeEventListener('mousedown', ovoMouseDown);
  window.removeEventListener('resize', ovoResize);
}
window.stopOVOGame = stopOVOGame;
window.startOVOGame = startOVOGame;

window.pauseOVOGame = function() {
  OVOG.active = false;
  cancelAnimationFrame(OVOG.animId);
};

window.resumeOVOGame = function() {
  if (!OVOG.active) {
    OVOG.active = true;
    OVOG.animId = requestAnimationFrame(ovoLoop);
  }
};

// ── Input ─────────────────────────────────────────
function ovoKeyDown(e) {
  if (!OVOG.active) return;
  OVOG.keys[e.code] = true;
  if ((e.code === 'Space') && OVOG.phase === 'playing' && !OVOG.inAir) {
    e.preventDefault();
    if (OVOG.hasBall === 'player') {
      if (!OVOG.charging) OVOG.charging = true;
    }
  }
}
function ovoKeyUp(e) {
  OVOG.keys[e.code] = false;
  if (e.code === 'Space' && OVOG.charging) {
    OVOG.charging = false;
    ovoPlayerShoot();
  }
}
function ovoMouseDown(e) {
  if (!OVOG.active || OVOG.phase !== 'playing') return;
  if (OVOG.hasBall === 'player' && !OVOG.inAir) {
    if (!OVOG.charging) { OVOG.charging = true; }
  }
}
document.addEventListener('mouseup', () => {
  if (OVOG.active && OVOG.charging) { OVOG.charging = false; ovoPlayerShoot(); }
});

// ── Shooting ──────────────────────────────────────
function ovoPlayerShoot() {
  if (OVOG.hasBall !== 'player' || OVOG.inAir || OVOG.phase !== 'playing') return;
  const dx = OVOG.hoopX - OVOG.px, dy = OVOG.hoopY - OVOG.py;
  const dist = Math.hypot(dx, dy);
  const is3 = dist > OVOG.H * 0.42;
  const mySHT = window.getEffectiveStat?.(OVOG.myPlayer?.id, 'sht') ?? OVOG.myPlayer?.stats?.sht ?? 75;
  const aiDEF = OVOG.aiPlayer?.stats?.def ?? 75;

  // Power accuracy: optimal power depends on distance
  const optimal = Math.min(90, 30 + (dist / OVOG.H) * 80);
  const powerErr = Math.abs(OVOG.power - optimal) / 100;
  const powerMult = Math.max(0.4, 1 - powerErr * 1.2);

  // Distance penalty
  const distMult = Math.max(0.35, 1 - (dist / (OVOG.H * 0.85)) * 0.55);

  // AI proximity penalty (tight defense)
  const aiDist = Math.hypot(OVOG.ax - OVOG.px, OVOG.ay - OVOG.py);
  const contestPenalty = aiDist < 55 ? 0.75 : 1;

  const base = is3 ? 0.42 : 0.70;
  const chance = base * powerMult * distMult * (mySHT / 80) * (80 / aiDEF) * contestPenalty;

  OVOG.shotMade = Math.random() < Math.min(0.88, chance);
  OVOG.is3pt    = is3;
  OVOG.shotBy   = 'player';
  launchBall(OVOG.px, OVOG.py);
}

function ovoAIShoot() {
  if (OVOG.hasBall !== 'ai' || OVOG.inAir) return;
  const dx = OVOG.hoopX - OVOG.ax, dy = OVOG.hoopY - OVOG.ay;
  const dist = Math.hypot(dx, dy);
  const is3 = dist > OVOG.H * 0.42;
  const aiSHT = OVOG.aiPlayer?.stats?.sht ?? 75;
  const myDEF = window.getEffectiveStat?.(OVOG.myPlayer?.id, 'def') ?? OVOG.myPlayer?.stats?.def ?? 75;

  const pDist = Math.hypot(OVOG.px - OVOG.ax, OVOG.py - OVOG.ay);
  const contestP = pDist < 50 ? 0.78 : 1;
  const distMult = Math.max(0.35, 1 - (dist / (OVOG.H * 0.85)) * 0.55);
  const base = is3 ? 0.38 : 0.66;
  const chance = base * distMult * (aiSHT / 80) * (80 / myDEF) * contestP;

  OVOG.shotMade = Math.random() < Math.min(0.84, chance);
  OVOG.is3pt    = is3;
  OVOG.shotBy   = 'ai';
  launchBall(OVOG.ax, OVOG.ay);
}

function launchBall(fromX, fromY) {
  OVOG.hasBall = null;
  OVOG.inAir = true;
  OVOG.airX = fromX; OVOG.airY = fromY; OVOG.airT = 0;
  const miss = !OVOG.shotMade;
  const scatter = miss ? (Math.random() - 0.5) * 60 : 0;
  OVOG.airTX = OVOG.hoopX + scatter;
  OVOG.airTY = OVOG.hoopY + (miss ? (Math.random() - 0.5) * 30 : 0);
  const dist = Math.hypot(OVOG.airTX - OVOG.airX, OVOG.airTY - OVOG.airY);
  OVOG.airDur = Math.round(30 + dist / 6);
  OVOG.charging = false; OVOG.power = 0;
}

// ── Game loop ─────────────────────────────────────
function ovoLoop() {
  if (!OVOG.active) return;
  updateOVOG();
  drawOVOG();
  OVOG.animId = requestAnimationFrame(ovoLoop);
}

function updateOVOG() {
  if (OVOG.phase !== 'playing') return;
  const W = OVOG.W, H = OVOG.H;

  // ── Player movement ──
  let mx = 0, my = 0;
  if (OVOG.keys['KeyW'] || OVOG.keys['ArrowUp'])    my -= 1;
  if (OVOG.keys['KeyS'] || OVOG.keys['ArrowDown'])   my += 1;
  if (OVOG.keys['KeyA'] || OVOG.keys['ArrowLeft'])   mx -= 1;
  if (OVOG.keys['KeyD'] || OVOG.keys['ArrowRight'])  mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my);
    OVOG.px += (mx / len) * OVOG.speed;
    OVOG.py += (my / len) * OVOG.speed;
  }
  OVOG.px = Math.max(22, Math.min(W - 22, OVOG.px));
  OVOG.py = Math.max(H * 0.09, Math.min(H - 22, OVOG.py));

  // ── Charge bar ──
  if (OVOG.charging && OVOG.hasBall === 'player') {
    OVOG.power = Math.min(100, OVOG.power + 2.2);
    if (OVOG.power >= 100) { OVOG.charging = false; ovoPlayerShoot(); }
  }

  // ── Ball follows holder ──
  if (OVOG.hasBall === 'player') { OVOG.bx = OVOG.px + 18; OVOG.by = OVOG.py - 4; }
  if (OVOG.hasBall === 'ai')     { OVOG.bx = OVOG.ax - 18; OVOG.by = OVOG.ay - 4; }

  // ── Ball in air ──
  if (OVOG.inAir) {
    OVOG.airT++;
    if (OVOG.airT >= OVOG.airDur) {
      OVOG.inAir = false;
      OVOG.bx = OVOG.airTX; OVOG.by = OVOG.airTY;
      if (OVOG.shotMade) {
        ovoScore();
      } else {
        // Rebound: closer player wins
        const myD = Math.hypot(OVOG.px - OVOG.hoopX, OVOG.py - OVOG.hoopY);
        const aiD = Math.hypot(OVOG.ax - OVOG.hoopX, OVOG.ay - OVOG.hoopY);
        OVOG.hasBall = (myD < aiD + 40) ? 'player' : 'ai';
      }
    }
  }

  // ── AI ──
  updateOVOAI();

  // ── Steal check ──
  if (!OVOG.inAir && OVOG.hasBall === 'player') {
    const d = Math.hypot(OVOG.ax - OVOG.px, OVOG.ay - OVOG.py);
    if (d < 32 && Math.random() < 0.012) {
      OVOG.hasBall = 'ai';
      addOVOPopup(OVOG.ax, OVOG.ay, 'STEAL! 🤚', '#ff4444');
    }
  }

  // ── Flash timer ──
  if (OVOG.flashTimer > 0) OVOG.flashTimer--;

  // ── Score popups ──
  OVOG.scorePopups = OVOG.scorePopups.filter(p => { p.t--; p.y -= 0.7; return p.t > 0; });
}

function updateOVOAI() {
  if (OVOG.inAir) return;
  const H = OVOG.H, W = OVOG.W;

  if (OVOG.hasBall === 'ai') {
    // Attack: move toward optimal shooting position
    const dx = OVOG.hoopX - OVOG.ax, dy = OVOG.hoopY - OVOG.ay;
    const dist = Math.hypot(dx, dy);
    const targetDist = H * 0.27;

    if (dist > targetDist + 15) {
      // Approach hoop, avoid player
      const spd = OVOG.aiSpeed;
      OVOG.ax += (dx / dist) * spd;
      OVOG.ay += (dy / dist) * spd;
      // Slight dodge if player is blocking
      const pd = Math.hypot(OVOG.ax - OVOG.px, OVOG.ay - OVOG.py);
      if (pd < 40) {
        const perpX = -(OVOG.py - OVOG.ay) / pd;
        OVOG.ax += perpX * 2.5;
      }
    } else {
      // In range — shoot based on timer
      OVOG.aiShootTimer++;
      const cooldown = OVOG.aiShootCooldown;
      if (OVOG.aiShootTimer >= cooldown) {
        OVOG.aiShootTimer = 0;
        OVOG.aiShootCooldown = 60 + Math.floor(Math.random() * 60);
        ovoAIShoot();
      }
    }
  } else if (OVOG.hasBall === 'player') {
    // Defend: position between player and hoop
    const guardX = OVOG.px * 0.35 + OVOG.hoopX * 0.65;
    const guardY = OVOG.py * 0.35 + OVOG.hoopY * 0.65;
    const dx = guardX - OVOG.ax, dy = guardY - OVOG.ay;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      const spd = OVOG.aiSpeed * 0.95;
      OVOG.ax += (dx / d) * spd;
      OVOG.ay += (dy / d) * spd;
    }
  }

  OVOG.ax = Math.max(22, Math.min(W - 22, OVOG.ax));
  OVOG.ay = Math.max(H * 0.09, Math.min(H - 22, OVOG.ay));
}

function ovoScore() {
  const pts = OVOG.is3pt ? 3 : 2;
  OVOG.lastScorer = OVOG.shotBy;
  const sx = OVOG.shotBy === 'player' ? OVOG.px : OVOG.ax;
  const sy = OVOG.shotBy === 'player' ? OVOG.py : OVOG.ay;

  if (OVOG.shotBy === 'player') {
    OVOG.playerScore += pts;
    addOVOPopup(OVOG.hoopX, OVOG.hoopY - 30, `+${pts} 🏀${OVOG.is3pt?' THREE!':''}`, '#ffd700');
  } else {
    OVOG.aiScore += pts;
    addOVOPopup(OVOG.hoopX, OVOG.hoopY - 30, `AI +${pts}${OVOG.is3pt?' 3PT!':''}`, '#ff4444');
  }

  OVOG.flashTimer = 20;
  OVOG.flashColor = OVOG.shotBy === 'player' ? 'rgba(255,215,0,0.18)' : 'rgba(255,40,40,0.12)';
  OVOG.phase = 'scored';

  setTimeout(() => {
    if (OVOG.playerScore >= OVOG.maxScore) { endOVOGame('player'); return; }
    if (OVOG.aiScore >= OVOG.maxScore)     { endOVOGame('ai');     return; }
    OVOG.phase = 'playing';
    ovoReset(false);
  }, 1100);
}

function endOVOGame(winner) {
  OVOG.phase = 'gameover';
  if (winner === 'player') {
    window.addCoins?.(3000);
    updateCoinsDisplay();
    window.trackDailyProgress?.('ovoWins', 1);
  }
  renderOVOGameUI();
}

function addOVOPopup(x, y, text, color) {
  OVOG.scorePopups.push({ x, y, text, color, t: 80 });
}

// ── Draw ──────────────────────────────────────────
function drawOVOG() {
  const ctx = OVOG.ctx;
  const W = OVOG.W, H = OVOG.H;
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  // ── Floor ──
  const floorGrad = ctx.createLinearGradient(0, 0, W, H);
  floorGrad.addColorStop(0, '#5a2d0c');
  floorGrad.addColorStop(1, '#7a3d14');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, W, H);

  // Wood planks
  ctx.strokeStyle = 'rgba(80,30,5,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 22) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
  }

  // ── Court lines ──
  ctx.strokeStyle = 'rgba(255,230,160,0.55)';
  ctx.lineWidth = 3;
  const cm = 18;
  ctx.strokeRect(cm, cm, W - cm * 2, H - cm * 2);

  // Half court
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(cm, H * 0.52); ctx.lineTo(W - cm, H * 0.52);
  ctx.stroke();
  ctx.setLineDash([]);

  const hX = OVOG.hoopX, hY = OVOG.hoopY;

  // 3-point arc
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,230,160,0.5)';
  ctx.beginPath();
  ctx.arc(hX, hY, H * 0.42, 0.12, Math.PI - 0.12);
  ctx.stroke();

  // Paint
  const pW = W * 0.28, pH = H * 0.34;
  const pX = hX - pW / 2, pY = hY - 10;
  ctx.strokeStyle = 'rgba(255,230,160,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pX, pY, pW, pH);

  // Free-throw line + circle
  const ftY = pY + pH * 0.72;
  ctx.beginPath(); ctx.moveTo(pX, ftY); ctx.lineTo(pX + pW, ftY); ctx.stroke();
  ctx.beginPath(); ctx.arc(hX, ftY, pW / 2, 0, Math.PI * 2); ctx.stroke();

  // Restricted area
  ctx.strokeStyle = 'rgba(255,230,160,0.25)';
  ctx.beginPath(); ctx.arc(hX, hY + OVOG.hoopR, OVOG.hoopR * 1.8, 0, Math.PI * 2); ctx.stroke();

  // ── Hoop ──
  // Backboard
  ctx.strokeStyle = 'rgba(210,230,255,0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(hX - 36, hY - 26); ctx.lineTo(hX + 36, hY - 26); ctx.stroke();
  ctx.strokeStyle = 'rgba(210,230,255,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(hX - 14, hY - 25, 28, 18);

  // Rim
  ctx.strokeStyle = '#ff4400';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(hX, hY, OVOG.hoopR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,68,0,0.12)';
  ctx.beginPath(); ctx.arc(hX, hY, OVOG.hoopR, 0, Math.PI * 2); ctx.fill();

  // ── Flash ──
  if (OVOG.flashTimer > 0) {
    ctx.fillStyle = OVOG.flashColor;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Ball ──
  if (!OVOG.inAir) {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏀', OVOG.bx, OVOG.by + 8);
  } else {
    const t = OVOG.airT / OVOG.airDur;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const bx = OVOG.airX + (OVOG.airTX - OVOG.airX) * ease;
    const by = OVOG.airY + (OVOG.airTY - OVOG.airY) * ease;
    const arc = H * 0.22 * Math.sin(Math.PI * t);
    const sz = 18 + arc / 12;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(bx, by + 4, sz * 0.6, sz * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = `${Math.round(sz * 2.2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🏀', bx, by - arc + sz * 0.6);
  }

  // ── Players ──
  drawOVOGPlayer(OVOG.px, OVOG.py, '#1D428A', '#ff8c00', 'YOU', OVOG.hasBall === 'player',
    OVOG.myPlayer ? (OVOG.myPlayer.name.split('.')[0].slice(0, 5)) : 'YOU');
  drawOVOGPlayer(OVOG.ax, OVOG.ay, '#6B0E0E', '#ff4444', 'AI', OVOG.hasBall === 'ai',
    OVOG.aiPlayer ? (OVOG.aiPlayer.name.split('.')[0].slice(0, 5)) : 'AI');

  // ── Shot power arc ──
  if (OVOG.charging && OVOG.hasBall === 'player') {
    const ang = Math.atan2(hY - OVOG.py, hX - OVOG.px);
    const hue = Math.round(120 - OVOG.power * 1.2);
    ctx.strokeStyle = `hsla(${hue},100%,55%,0.9)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(OVOG.px, OVOG.py, 26 + OVOG.power * 0.18, ang - 0.55, ang + 0.55);
    ctx.stroke();
    // Power bar above player
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(OVOG.px - 28, OVOG.py - 38, 56, 9);
    ctx.fillStyle = `hsl(${hue},100%,50%)`;
    ctx.fillRect(OVOG.px - 28, OVOG.py - 38, (OVOG.power / 100) * 56, 9);
    // Aim line
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    const aim = 80 + OVOG.power * 0.5;
    ctx.beginPath();
    ctx.moveTo(OVOG.px, OVOG.py);
    ctx.lineTo(OVOG.px + Math.cos(ang) * aim, OVOG.py + Math.sin(ang) * aim);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Score popups ──
  OVOG.scorePopups.forEach(p => {
    ctx.globalAlpha = Math.min(1, p.t / 30);
    ctx.fillStyle = p.color;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  });

  // ── Scored overlay ──
  if (OVOG.phase === 'scored') {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = OVOG.lastScorer === 'player' ? '#ffd700' : '#ff6666';
    ctx.font = `bold ${Math.max(28, Math.floor(W / 11))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(OVOG.lastScorer === 'player' ? (OVOG.is3pt ? '🔥 THREE!' : '🏀 BASKET!') : '😤 AI SCORES', W / 2, H / 2);
  }

  // ── Game over overlay ──
  if (OVOG.phase === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    const win = OVOG.playerScore > OVOG.aiScore;
    ctx.fillStyle = win ? '#ffd700' : '#ff5555';
    ctx.font = `bold ${Math.max(28, Math.floor(W / 9))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(win ? '🏆 YOU WIN!' : '😢 AI WINS', W / 2, H / 2 - 24);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(18, Math.floor(W / 14))}px sans-serif`;
    ctx.fillText(`${OVOG.playerScore} — ${OVOG.aiScore}`, W / 2, H / 2 + 24);
  }

  // ── HUD ──
  drawOVOGHUD(ctx, W, H);
}

function drawOVOGPlayer(x, y, bodyColor, borderColor, label, hasBall, name) {
  const ctx = OVOG.ctx;
  const r = 17;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y + r - 2, r * 0.8, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = hasBall ? 3.5 : 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

  // Jersey lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 5, y - r + 4); ctx.lineTo(x - 5, y + r - 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5, y - r + 4); ctx.lineTo(x + 5, y + r - 6); ctx.stroke();

  // Name
  ctx.fillStyle = '#fff';
  ctx.font = `bold 9px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 3);

  // Possession dot
  if (hasBall) {
    ctx.fillStyle = borderColor;
    ctx.beginPath(); ctx.arc(x, y - r - 6, 4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawOVOGHUD(ctx, W, H) {
  // Scoreboard
  const bW = 190, bH = 52, bX = W / 2 - bW / 2, bY = 6;
  ctx.fillStyle = 'rgba(6,5,14,0.82)';
  ctx.fillRect(bX, bY, bW, bH);
  ctx.strokeStyle = 'rgba(255,140,0,0.45)'; ctx.lineWidth = 1;
  ctx.strokeRect(bX, bY, bW, bH);

  ctx.fillStyle = '#ff8c00'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('YOU', bX + bW * 0.29, bY + 15);
  ctx.fillStyle = '#ff6666';
  ctx.fillText('AI', bX + bW * 0.71, bY + 15);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif';
  ctx.fillText(OVOG.playerScore, bX + bW * 0.29, bY + 46);
  ctx.fillText(OVOG.aiScore, bX + bW * 0.71, bY + 46);
  ctx.fillStyle = '#444'; ctx.font = 'bold 22px sans-serif';
  ctx.fillText('–', bX + bW * 0.5, bY + 46);

  // First-to label
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`FIRST TO ${OVOG.maxScore}`, W / 2, bY + bH + 9);

  // Player/AI OVR
  const margin = 18;
  const myOVR = OVOG.myPlayer?.ovr ?? '?';
  const aiOVR = OVOG.aiPlayer?.ovr ?? '?';
  ctx.fillStyle = '#ff8c00'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`YOU · ${myOVR} OVR`, margin + 4, margin + 14);
  ctx.fillStyle = '#ff6666'; ctx.textAlign = 'right';
  ctx.fillText(`${aiOVR} OVR · AI`, W - margin - 4, margin + 14);

  // Controls
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('WASD/Arrows = Move · Hold SPACE or Click = Charge shot · Release = Shoot', W / 2, H - 6);
}

function renderOVOGameUI() {
  const el = document.getElementById('ovoGameControls');
  if (!el) return;
  if (OVOG.phase === 'gameover') {
    const win = OVOG.playerScore > OVOG.aiScore;
    el.innerHTML = `
    <div class="ovo-result ${win ? 'ovo-win' : 'ovo-lose'}">
      <div class="ovo-result-score">Final: YOU ${OVOG.playerScore} — ${OVOG.aiScore} AI</div>
      ${win ? '<div class="ovo-reward">🪙 +3,000 coins earned!</div>' : '<div style="color:#888;font-size:12px">Train your player and come back stronger!</div>'}
      <div class="ovo-result-btns">
        <button class="btn btn-primary" onclick="ovoReset(true)" style="min-width:0;padding:10px 24px;font-size:13px">PLAY AGAIN</button>
        <button class="btn btn-secondary" onclick="stopOVOGame();showScreen('splash')" style="min-width:0;padding:10px 24px;font-size:13px">MAIN MENU</button>
      </div>
    </div>`;
  } else {
    const mp = OVOG.myPlayer, ap = OVOG.aiPlayer;
    el.innerHTML = `
    <div class="ovo-hud-bar">
      <div class="ovo-player-tag" style="color:#ff8c00">
        ${mp ? `${mp.name} · ${mp.ovr} OVR` : 'YOU'}
      </div>
      <div class="ovo-keys-hint">WASD/↑↓←→ Move &nbsp;|&nbsp; Hold <kbd>SPACE</kbd> to charge, release to shoot</div>
      <div class="ovo-player-tag" style="color:#ff6666">
        ${ap ? `${ap.name} · ${ap.ovr} OVR` : 'AI'}
      </div>
    </div>`;
  }
}
