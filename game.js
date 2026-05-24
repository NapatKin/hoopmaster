// ===== GLOBAL STATE =====
const STATE = {
  mode: 'classic', score: 0, shots: 0, shotsMade: 0,
  streak: 0, bestStreak: 0, lives: 3, timeLeft: 60,
  timerInterval: null, miniGame: null, wind: 0, running: false,
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let HOOP = { x: 0, y: 0, rimW: 60, rimH: 8, backboardW: 10, backboardH: 80 };
let BALL_START = { x: 0, y: 0 };

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  HOOP.x = canvas.width * 0.66;
  HOOP.y = canvas.height * 0.30;
  BALL_START.x = canvas.width * 0.20;
  BALL_START.y = canvas.height * 0.73;
}
window.addEventListener('resize', () => { resizeCanvas(); if (!ball.flying) drawFrame(); });
resizeCanvas();

// ===== PARTICLE SYSTEM =====
const particles = [];

function spawnParticles(x, y, opts) {
  const count = opts.count || 12;
  for (let i = 0; i < count; i++) {
    const spread = opts.spread !== undefined ? opts.spread : Math.PI * 2;
    const baseAngle = opts.baseAngle !== undefined ? opts.baseAngle : 0;
    const angle = baseAngle + (spread / count) * i + (Math.random() - 0.5) * (spread / count);
    const spd = (opts.speed || 4) * (0.5 + Math.random() * 0.8);
    const colors = Array.isArray(opts.color) ? opts.color : [opts.color || '#ff8c00'];
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: opts.life || 55,
      maxLife: opts.life || 55,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: (opts.size || 6) * (0.6 + Math.random() * 0.8),
      gravity: opts.gravity !== undefined ? opts.gravity : 0.18,
      shrink: opts.shrink || 0.96,
      type: opts.type || 'circle',
    });
  }
}

function spawnScoreParticles(x, y, is3pt, isWish) {
  if (isWish) {
    spawnParticles(x, y, { count: 30, speed: 7, life: 70, size: 8, gravity: -0.05, shrink: 0.95,
      color: ['#ffffff', '#e0d0ff', '#c0a0ff', '#a060ff'], type: 'star' });
    spawnParticles(x, y, { count: 20, speed: 5, life: 50, size: 5, gravity: 0.1,
      color: ['#ffffff', '#d0b0ff'] });
  } else if (is3pt) {
    spawnParticles(x, y, { count: 25, speed: 7, life: 65, size: 7, gravity: 0.1, shrink: 0.95,
      color: ['#00d4ff', '#0080ff', '#ffffff', '#40ffff'], type: 'star' });
    spawnParticles(x, y, { count: 18, speed: 4, life: 45, size: 4, gravity: 0.15,
      color: ['#00aaff', '#ffffff'] });
  } else {
    spawnParticles(x, y, { count: 18, speed: 6, life: 55, size: 6, gravity: 0.12, shrink: 0.95,
      color: ['#ff8c00', '#ffcc00', '#ff4500', '#ffffff'] });
    spawnParticles(x, y, { count: 10, speed: 3, life: 40, size: 3, gravity: 0.18,
      color: ['#ff8c00', '#ffcc00'] });
  }
}

function spawnRimSparks(x, y) {
  spawnParticles(x, y, { count: 12, speed: 4, life: 30, size: 3, gravity: 0.3, shrink: 0.92,
    color: ['#ff8800', '#ffcc00', '#ffffff'], type: 'spark' });
}

function spawnMissParticles(x, y) {
  spawnParticles(x, y, { count: 10, speed: 3, life: 35, size: 4, gravity: 0.3,
    color: ['#ff2222', '#aa0000'] });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.size *= p.shrink;
    p.life--;
    if (p.life <= 0 || p.size < 0.3) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.type === 'star') {
      drawStar(p.x, p.y, p.size, p.color);
    } else if (p.type === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawStar(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const b = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(b) * (r * 0.4), y + Math.sin(b) * (r * 0.4));
  }
  ctx.closePath();
  ctx.fill();
}

// ===== SCREEN SHAKE =====
let shake = { x: 0, y: 0, amount: 0 };
function triggerShake(amt) { shake.amount = Math.max(shake.amount, amt); }
function updateShake() {
  if (shake.amount < 0.4) { shake.x = 0; shake.y = 0; shake.amount = 0; return; }
  shake.x = (Math.random() - 0.5) * shake.amount;
  shake.y = (Math.random() - 0.5) * shake.amount;
  shake.amount *= 0.78;
}

// ===== FLASH OVERLAY =====
let flashAlpha = 0;
let flashColor = '#ffffff';
function triggerFlash(color, alpha) { flashColor = color; flashAlpha = alpha; }
function drawFlash() {
  if (flashAlpha <= 0) return;
  ctx.save();
  ctx.fillStyle = flashColor;
  ctx.globalAlpha = flashAlpha;
  ctx.fillRect(-shake.x - 20, -shake.y - 20, canvas.width + 40, canvas.height + 40);
  ctx.restore();
  flashAlpha *= 0.75;
  if (flashAlpha < 0.01) flashAlpha = 0;
}

// ===== BALL =====
const ball = {
  x: 0, y: 0, vx: 0, vy: 0, r: 20,
  flying: false, trail: [], rotation: 0,
  scored: false, touchedRim: false,
};
resetBall();

function resetBall() {
  ball.x = BALL_START.x;
  ball.y = BALL_START.y;
  ball.vx = 0; ball.vy = 0;
  ball.flying = false;
  ball.trail = [];
  ball.rotation = 0;
  ball.scored = false;
  ball.touchedRim = false;
}

// ===== INPUT =====
let mouseDown = false;
let powerInterval = null;
let currentPower = 0;
let aimAngle = 0;

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('touchstart', e => { e.preventDefault(); onPointerDown(e.touches[0]); }, { passive: false });
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('touchmove', e => { e.preventDefault(); onPointerMove(e.touches[0]); }, { passive: false });
canvas.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('touchend', e => { e.preventDefault(); onPointerUp(); }, { passive: false });

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
}

function onPointerDown(e) {
  if (!STATE.running || ball.flying) return;
  mouseDown = true; currentPower = 0;
  const pos = getPos(e);
  aimAngle = Math.atan2(HOOP.y - pos.y, HOOP.x - pos.x);
  document.getElementById('powerMeterContainer').style.display = 'block';
  powerInterval = setInterval(() => {
    currentPower = Math.min(currentPower + 2.2, 100);
    document.getElementById('powerBar').style.width = currentPower + '%';
  }, 28);
}

function onPointerMove(e) {
  if (!mouseDown || ball.flying) return;
  const pos = getPos(e);
  aimAngle = Math.atan2(HOOP.y - pos.y, HOOP.x - pos.x);
}

function onPointerUp() {
  if (!mouseDown) return;
  mouseDown = false;
  clearInterval(powerInterval);
  document.getElementById('powerMeterContainer').style.display = 'none';
  if (currentPower > 0 && STATE.running && !ball.flying) shootBall();
  currentPower = 0;
  document.getElementById('powerBar').style.width = '0%';
}

// ===== PHYSICS =====
const GRAVITY = 0.44;
let animId = null;

function shootBall() {
  const skill = parseInt(document.getElementById('accuracySlider').value);
  // At skill 10 = zero spread. At skill 1 = max spread.
  const maxSpread = skill >= 10 ? 0 : (11 - skill) * 0.055;
  const spread = (Math.random() - 0.5) * maxSpread;
  const speed = 5.5 + currentPower * 0.13;
  ball.vx = Math.cos(aimAngle + spread) * speed + STATE.wind * 0.008;
  ball.vy = Math.sin(aimAngle + spread) * speed;
  ball.flying = true;
  ball.trail = [];
  ball.scored = false;
  ball.touchedRim = false;
  playSound('shoot');
}

function gameLoop() {
  if (!STATE.running) return;
  update();
  drawFrame();
  animId = requestAnimationFrame(gameLoop);
}

function update() {
  updateShake();
  updateParticles();
  if (!ball.flying) return;

  ball.trail.push({ x: ball.x, y: ball.y, age: 0 });
  if (ball.trail.length > 20) ball.trail.shift();
  ball.trail.forEach(t => t.age++);

  ball.x += ball.vx;
  ball.vy += GRAVITY;
  ball.y += ball.vy;
  ball.rotation += ball.vx * 2.8;
  ball.vx += STATE.wind * 0.0005;

  // Spawn fire trail on hot streak
  if (STATE.streak >= 3 && Math.random() < 0.5) {
    particles.push({
      x: ball.x + (Math.random() - 0.5) * 8,
      y: ball.y + (Math.random() - 0.5) * 8,
      vx: -ball.vx * 0.2 + (Math.random() - 0.5) * 1.5,
      vy: -ball.vy * 0.2 - Math.random() * 1.5,
      life: 22, maxLife: 22,
      color: Math.random() < 0.5 ? '#ff6600' : '#ffcc00',
      size: 5 + Math.random() * 4,
      gravity: -0.08, shrink: 0.90, type: 'circle',
    });
  }

  checkScore();
  checkOutOfBounds();
}

function checkScore() {
  if (ball.scored) return;
  const rimLeft  = HOOP.x - HOOP.rimW / 2;
  const rimRight = HOOP.x + HOOP.rimW / 2;
  const rimY = HOOP.y;

  // Clean score through hoop
  if (ball.x > rimLeft + 5 && ball.x < rimRight - 5 &&
      ball.y + ball.r >= rimY - 2 && ball.y - ball.r < rimY + 12 && ball.vy > 0) {
    ball.scored = true;
    doScore();
    return;
  }

  // Rim collisions (left post)
  rimCollide(rimLeft, rimY);
  // Rim collision (right post)
  rimCollide(rimRight, rimY);

  // Backboard
  const bbX = HOOP.x + HOOP.rimW / 2 + 16;
  if (ball.x + ball.r >= bbX - 6 && ball.x + ball.r <= bbX + 10 &&
      ball.y >= HOOP.y - HOOP.backboardH / 2 && ball.y <= HOOP.y + HOOP.backboardH / 2) {
    ball.vx = Math.abs(ball.vx) * -0.5;
    ball.x -= 4;
    ball.touchedRim = true;
    spawnRimSparks(bbX, ball.y);
    playSound('rim');
  }
}

function rimCollide(rx, ry) {
  const dx = ball.x - rx, dy = ball.y - ry;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.r + 6;
  if (dist < minDist) {
    const nx = dx / dist, ny = dy / dist;
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = (ball.vx - 2 * dot * nx) * 0.52;
    ball.vy = (ball.vy - 2 * dot * ny) * 0.52;
    ball.x += nx * (minDist - dist + 1);
    ball.y += ny * (minDist - dist + 1);
    ball.touchedRim = true;
    spawnRimSparks(rx, ry);
    playSound('rim');
  }
}

function checkOutOfBounds() {
  if (ball.scored) {
    setTimeout(() => endShot(true), 650);
    return;
  }
  if (ball.y > canvas.height + 60 || ball.x < -120 || ball.x > canvas.width + 120) {
    endShot(false);
    return;
  }
  if (ball.y + ball.r >= canvas.height - 22) {
    ball.vy *= -0.4;
    ball.vx *= 0.65;
    ball.y = canvas.height - 22 - ball.r;
    if (Math.abs(ball.vy) < 1.5) endShot(false);
  }
}

function doScore() {
  const isWish = !ball.touchedRim;
  const rimLeft = HOOP.x - HOOP.rimW / 2;
  const is3pt = ball.x < canvas.width * 0.38;
  let pts = is3pt ? 3 : 2;
  if (isWish) pts += 1;
  if (STATE.miniGame === 'hotStreak') pts += 2;
  if (STATE.miniGame === 'alleyOop') pts += 3;
  if (STATE.miniGame === 'bankShot') { pts = 5; }

  STATE.streak++;
  if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak;
  if (STATE.streak >= 3) pts += STATE.streak - 2;

  STATE.score += pts;
  STATE.shotsMade++;
  updateSidebar();
  updateStreak();

  // Particles & FX
  spawnScoreParticles(HOOP.x, HOOP.y, is3pt, isWish);
  if (is3pt || isWish) triggerShake(isWish ? 12 : 8);
  if (isWish) triggerFlash('rgba(180,100,255,0.35)', 0.35);
  else if (is3pt) triggerFlash('rgba(0,150,255,0.3)', 0.3);
  else triggerFlash('rgba(255,140,0,0.2)', 0.2);

  playSound('score');
  showFloatingScore('+' + pts + (isWish ? ' ✨' : is3pt ? ' 🎯' : ''), isWish ? '#d090ff' : is3pt ? '#00d4ff' : '#ff8c00');

  if (isWish) showBanner('wishBanner');
  else if (is3pt) showBanner('threePointBanner');
  if (STATE.miniGame === 'bankShot') showBanner('miniGameBanner', '🏦 BANK SHOT! +5 pts!');
  if (STATE.miniGame === 'hotStreak') showBanner('miniGameBanner', '🔥 HOT STREAK! +2 bonus!');
  if (STATE.miniGame === 'alleyOop') showBanner('miniGameBanner', '🚀 ALLEY-OOP! +3 bonus!');

  showCombo();
  STATE.miniGame = null;
}

function endShot(made) {
  if (!ball.flying) return;
  ball.flying = false;
  if (!made) {
    STATE.streak = 0;
    updateStreak();
    spawnMissParticles(ball.x, ball.y);
    showFloatingScore('MISS', '#ff3333');
    playSound('miss');
    if (STATE.mode === 'challenge') {
      STATE.lives = Math.max(0, STATE.lives - 1);
      updateLives();
      if (STATE.lives === 0) { setTimeout(endGame, 400); return; }
    }
  }
  advanceShot(made);
  setTimeout(() => { resetBall(); }, 420);
}

function advanceShot(made) {
  if (STATE.mode === 'classic' || STATE.mode === 'threePoint') {
    STATE.shots++;
    updateShotDots(made);
    const limit = STATE.mode === 'threePoint' ? 25 : 10;
    if (STATE.shots >= limit) { setTimeout(endGame, 750); return; }
  }
  if (STATE.mode === 'challenge') STATE.shots++;
  updateWindRandom();
}

// ===== DRAW =====
function drawFrame() {
  ctx.save();
  ctx.translate(shake.x, shake.y);
  ctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);
  drawBackground();
  drawCourt();
  drawParticles();
  drawHoop();
  drawTrail();
  if (ball.flying || !ball.scored) drawBall();
  drawAimGuide();
  drawFlash();
  ctx.restore();
}

function drawBackground() {
  // Arena sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.65);
  sky.addColorStop(0, '#03020a');
  sky.addColorStop(0.5, '#0a0518');
  sky.addColorStop(1, '#160a00');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.65);

  // Spotlights from ceiling
  drawSpotlight(canvas.width * 0.35, 0, canvas.width * 0.38, canvas.height * 0.7, 'rgba(255,200,100,0.06)');
  drawSpotlight(canvas.width * 0.65, 0, canvas.width * 0.3, canvas.height * 0.75, 'rgba(200,220,255,0.05)');

  // Crowd tier
  drawCrowd();

  // Court floor
  const floorY = canvas.height * 0.62;
  const floor = ctx.createLinearGradient(0, floorY, 0, canvas.height);
  floor.addColorStop(0, '#3d2008');
  floor.addColorStop(0.3, '#2e1a07');
  floor.addColorStop(1, '#1a0c03');
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(80,40,10,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 18) {
    const wave = Math.sin(i * 0.05) * 3;
    ctx.beginPath();
    ctx.moveTo(i, floorY + wave);
    ctx.lineTo(i + 8, canvas.height);
    ctx.stroke();
  }

  // Floor glossy reflection
  const gloss = ctx.createLinearGradient(0, floorY, 0, floorY + 60);
  gloss.addColorStop(0, 'rgba(255,180,80,0.12)');
  gloss.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, floorY, canvas.width, 60);
}

function drawSpotlight(cx, topY, width, height, color) {
  const grad = ctx.createRadialGradient(cx, topY, 0, cx, topY + height * 0.5, width);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx - width / 2, topY + height);
  ctx.lineTo(cx + width / 2, topY + height);
  ctx.closePath();
  ctx.fill();
}

function drawCrowd() {
  const crowdY = canvas.height * 0.28;
  const rows = 3;
  for (let row = 0; row < rows; row++) {
    const y = crowdY + row * 22;
    const brightness = 0.08 - row * 0.025;
    for (let x = 0; x < canvas.width; x += 14 + Math.sin(x) * 2) {
      const h = 18 + Math.sin(x * 0.4 + row) * 6;
      const shade = brightness + Math.random() * 0.03;
      ctx.fillStyle = `rgba(${80 + row * 10},${40 + row * 5},${20},${shade + 0.05})`;
      // Head
      ctx.beginPath();
      ctx.arc(x + 7, y - h + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillRect(x + 3, y - h + 9, 8, h - 9);
    }
  }
  // Crowd glow
  const crowdGlow = ctx.createLinearGradient(0, crowdY - 10, 0, crowdY + 80);
  crowdGlow.addColorStop(0, 'rgba(255,100,0,0.03)');
  crowdGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = crowdGlow;
  ctx.fillRect(0, crowdY - 10, canvas.width, 90);
}

function drawCourt() {
  const floorY = canvas.height * 0.62;
  ctx.strokeStyle = 'rgba(255,200,120,0.25)';
  ctx.lineWidth = 2;

  // 3pt arc
  ctx.beginPath();
  ctx.arc(BALL_START.x - 30, canvas.height + 20, canvas.width * 0.48, -Math.PI * 0.85, -0.12);
  ctx.stroke();

  // Key box
  ctx.strokeStyle = 'rgba(255,200,120,0.18)';
  ctx.lineWidth = 1.5;
  const keyX = canvas.width * 0.08, keyW = canvas.width * 0.48;
  ctx.strokeRect(keyX, floorY, keyW, canvas.height - floorY);

  // Free throw line
  ctx.beginPath();
  ctx.moveTo(keyX, canvas.height * 0.76);
  ctx.lineTo(keyX + keyW, canvas.height * 0.76);
  ctx.stroke();

  // Free throw circle
  ctx.beginPath();
  ctx.arc(keyX + keyW / 2, canvas.height * 0.76, 38, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHoop() {
  const { x, y, rimW, backboardW, backboardH } = HOOP;
  const bbX = x + rimW / 2 + 16;

  // Pole
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(bbX + backboardW / 2, y + backboardH / 2);
  ctx.lineTo(bbX + backboardW / 2, canvas.height);
  ctx.stroke();

  // Backboard glow effect
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(200,220,255,0.3)';

  // Backboard body
  const bbGrad = ctx.createLinearGradient(bbX, 0, bbX + backboardW, 0);
  bbGrad.addColorStop(0, 'rgba(220,235,255,0.95)');
  bbGrad.addColorStop(1, 'rgba(180,200,240,0.85)');
  ctx.fillStyle = bbGrad;
  ctx.fillRect(bbX, y - backboardH / 2, backboardW, backboardH);

  // Backboard border
  ctx.strokeStyle = 'rgba(100,140,200,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bbX, y - backboardH / 2, backboardW, backboardH);

  // Backboard target square (red box)
  ctx.strokeStyle = '#ff2222';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(255,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.strokeRect(bbX + 1, y - 18, backboardW - 2, 36);
  ctx.restore();

  // Support arm
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bbX, y - 4);
  ctx.lineTo(x + rimW / 2, y - 4);
  ctx.stroke();

  // Net
  drawNet(x, y, rimW);

  // RIM — drawn last so it's on top
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = STATE.streak >= 3 ? '#ff4500' : 'rgba(255,80,0,0.5)';
  ctx.strokeStyle = STATE.streak >= 3 ? '#ff6600' : '#ff4500';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - rimW / 2, y);
  ctx.lineTo(x + rimW / 2, y);
  ctx.stroke();

  // Rim end caps (the circular knobs)
  ctx.fillStyle = STATE.streak >= 3 ? '#ff6600' : '#ff4500';
  ctx.beginPath();
  ctx.arc(x - rimW / 2, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + rimW / 2, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNet(x, y, rimW) {
  const segs = 7;
  const netDepth = 42;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2;

  // Vertical lines
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const px = x - rimW / 2 + rimW * t;
    const drift = (t - 0.5) * 12;
    ctx.beginPath();
    ctx.moveTo(px, y + 2);
    ctx.bezierCurveTo(px + drift * 0.3, y + netDepth * 0.4, px + drift * 0.6, y + netDepth * 0.7, x + drift * 0.25, y + netDepth);
    ctx.stroke();
  }
  // Horizontal rows
  for (let j = 1; j <= 4; j++) {
    const ny = y + (netDepth / 5) * j;
    const shrink = rimW * 0.04 * j;
    ctx.beginPath();
    ctx.moveTo(x - rimW / 2 + shrink, ny);
    ctx.lineTo(x + rimW / 2 - shrink, ny);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBall() {
  const { x, y, r, rotation } = ball;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Streak glow ring
  if (STATE.streak >= 3) {
    const glowColors = ['#ff6600', '#ff3300', '#ff0066', '#aa00ff'];
    const gc = glowColors[Math.min(STATE.streak - 3, glowColors.length - 1)];
    ctx.save();
    ctx.shadowBlur = 30 + STATE.streak * 4;
    ctx.shadowColor = gc;
    ctx.strokeStyle = gc;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Ball shadow
  ctx.save();
  ctx.translate(4, 6);
  ctx.scale(1, 0.28);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.restore();

  // Ball body
  const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.08, 0, 0, r);
  grad.addColorStop(0, '#ffaa28');
  grad.addColorStop(0.55, '#e06000');
  grad.addColorStop(1, '#5a2000');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Seams
  ctx.strokeStyle = '#1a0800';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI, false); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.38, -r * 0.85);
  ctx.bezierCurveTo(-r * 0.65, 0, -r * 0.65, 0, -r * 0.38, r * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.38, -r * 0.85);
  ctx.bezierCurveTo(r * 0.65, 0, r * 0.65, 0, r * 0.38, r * 0.85);
  ctx.stroke();

  // Highlight
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.32, r * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();

  ctx.restore();
}

function drawTrail() {
  const streakColors = STATE.streak >= 3
    ? ['rgba(255,100,0,', 'rgba(255,200,0,']
    : ['rgba(255,140,0,', 'rgba(255,200,100,'];

  ball.trail.forEach((t, i) => {
    const alpha = (1 - t.age / 20) * 0.45;
    const size = ball.r * (1 - t.age / 24);
    if (size <= 0 || alpha <= 0) return;
    const col = streakColors[i % 2];
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fillStyle = col + alpha + ')';
    ctx.fill();
  });
}

function drawAimGuide() {
  if (!mouseDown || ball.flying) return;
  const alpha = 0.12 + currentPower * 0.006;
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 9]);
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  const len = 70 + currentPower;
  ctx.lineTo(ball.x + Math.cos(aimAngle) * len, ball.y + Math.sin(aimAngle) * len);
  ctx.stroke();
  ctx.setLineDash([]);

  // Power circle
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r + 4 + currentPower * 0.1, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,140,0,${0.15 + currentPower * 0.005})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ===== UI UPDATES =====
function updateSidebar() {
  document.getElementById('sidebarScore').textContent = STATE.score;
  const total = STATE.shots;
  const pct = total > 0 ? Math.round((STATE.shotsMade / total) * 100) : '—';
  document.getElementById('sidebarAccPct').textContent = total > 0 ? pct + '%' : '—';
}

function updateStreak() {
  const el = document.getElementById('sidebarStreak');
  el.textContent = STATE.streak + (STATE.streak >= 3 ? ' 🔥' : '');
  el.style.color = STATE.streak >= 5 ? '#ff00aa' : STATE.streak >= 3 ? '#ff4500' : STATE.streak >= 2 ? '#ff8c00' : '#888';
}

function updateLives() {
  document.getElementById('sidebarLives').textContent = '❤️'.repeat(STATE.lives) + '🖤'.repeat(3 - STATE.lives);
}

function updateShotDots(made) {
  const dots = document.querySelectorAll('.shot-dot');
  const idx = STATE.shots;
  if (dots[idx]) dots[idx].classList.add(made ? 'made' : 'missed');
}

function updateWindRandom() {
  STATE.wind = Math.floor((Math.random() - 0.5) * 12);
  const el = document.getElementById('windDisplay');
  const arrow = STATE.wind > 0 ? '➡️' : STATE.wind < 0 ? '⬅️' : '—';
  el.textContent = arrow + ' ' + (STATE.wind !== 0 ? Math.abs(STATE.wind) : 'calm');
}

function showFloatingScore(text, color) {
  const el = document.getElementById('floatingScore');
  el.textContent = text;
  el.style.color = color || '#ff8c00';
  el.style.left = (HOOP.x - 40) + 'px';
  el.style.top = (HOOP.y - 60) + 'px';
  el.style.opacity = '1';
  el.style.transform = 'translateY(0) scale(1.2)';
  el.style.display = 'block';
  el.style.transition = 'none';
  setTimeout(() => {
    el.style.transition = 'opacity 0.7s, transform 0.7s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-55px) scale(0.9)';
  }, 80);
  setTimeout(() => { el.style.display = 'none'; }, 900);
}

function showCombo() {
  if (STATE.streak < 2) return;
  const msgs = ['', '', 'DOUBLE! 🔥', 'TRIPLE! 🔥🔥', 'ON FIRE! 💥', 'INSANE! 👑', 'GOD MODE! 🌟'];
  const msg = msgs[Math.min(STATE.streak, msgs.length - 1)];
  const el = document.getElementById('comboDisplay');
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 1600);
}

function showBanner(id, text) {
  const el = document.getElementById(id);
  if (text) el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2200);
}

// ===== MINI GAMES =====
function triggerMiniGame(type) {
  if (!STATE.running || ball.flying) return;
  STATE.miniGame = type;
  const msgs = {
    hotStreak: '🔥 HOT STREAK ACTIVE — next basket +2 bonus!',
    bankShot: '🏦 BANK SHOT — hit the backboard first for +5!',
    alleyOop: '🚀 ALLEY-OOP — score now for +3 bonus!',
  };
  showBanner('miniGameBanner', msgs[type]);
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'leaderboard') populateLeaderboard();
  if (id === 'splash') { updateSplashStars(); initSplashCanvas(); }
  if (id === 'gameOver') startConfetti();
}

function updateSplashStars() {
  document.getElementById('totalStars').textContent = '⭐ ' + (parseInt(localStorage.getItem('totalStars') || '0'));
}

function populateLeaderboard() {
  const modes = ['classic', 'timeAttack', 'threePoint', 'challenge'];
  const names = { classic: 'Classic', timeAttack: 'Time Attack', threePoint: '3-Point', challenge: 'Survival' };
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';
  let all = [];
  modes.forEach(m => {
    (JSON.parse(localStorage.getItem('lb_' + m) || '[]')).forEach(e => all.push({ ...e, modeName: names[m] }));
  });
  all.sort((a, b) => b.score - a.score);
  all.slice(0, 10).forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'lb-entry';
    div.innerHTML = `<span class="lb-rank">${['🥇','🥈','🥉'][i] || (i+1)}</span><span>${e.modeName}</span><span class="lb-score">${e.score}</span><span class="lb-mode">${e.date}</span>`;
    list.appendChild(div);
  });
  if (!all.length) list.innerHTML = '<p style="color:#555;text-align:center;padding:30px">No games yet — play first!</p>';
}

// ===== SPLASH CANVAS ANIMATION =====
let splashAnimId = null;
const splashParticles = [];

function initSplashCanvas() {
  const sc = document.getElementById('splashCanvas');
  if (!sc) return;
  sc.width = window.innerWidth;
  sc.height = window.innerHeight;
  const sctx = sc.getContext('2d');
  splashParticles.length = 0;
  for (let i = 0; i < 60; i++) {
    splashParticles.push({
      x: Math.random() * sc.width,
      y: Math.random() * sc.height,
      r: Math.random() * 2.5 + 0.5,
      vy: -(0.2 + Math.random() * 0.6),
      vx: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() < 0.6 ? '#ff8c00' : '#ffffff',
    });
  }
  cancelAnimationFrame(splashAnimId);
  function loop() {
    const screen = document.getElementById('splash');
    if (!screen || !screen.classList.contains('active')) return;
    sctx.clearRect(0, 0, sc.width, sc.height);
    // BG gradient
    const bg = sctx.createRadialGradient(sc.width/2, sc.height*0.35, 0, sc.width/2, sc.height*0.35, sc.width*0.7);
    bg.addColorStop(0, '#1a0630');
    bg.addColorStop(0.6, '#0a0515');
    bg.addColorStop(1, '#05020a');
    sctx.fillStyle = bg;
    sctx.fillRect(0, 0, sc.width, sc.height);
    // Particles
    splashParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = sc.height + 5; p.x = Math.random() * sc.width; }
      sctx.beginPath();
      sctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      sctx.fillStyle = p.color;
      sctx.globalAlpha = p.alpha;
      sctx.fill();
      sctx.globalAlpha = 1;
    });
    // Bottom glow
    const glow = sctx.createRadialGradient(sc.width/2, sc.height, 0, sc.width/2, sc.height, sc.width*0.6);
    glow.addColorStop(0, 'rgba(255,100,0,0.08)');
    glow.addColorStop(1, 'transparent');
    sctx.fillStyle = glow;
    sctx.fillRect(0, 0, sc.width, sc.height);
    splashAnimId = requestAnimationFrame(loop);
  }
  loop();
}

// ===== CONFETTI =====
let confettiAnimId = null;
const confettiParticles = [];
function startConfetti() {
  const cc = document.getElementById('confettiCanvas');
  if (!cc) return;
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;
  const cctx = cc.getContext('2d');
  confettiParticles.length = 0;
  const cols = ['#ff8c00','#ffcc00','#00d4ff','#ff2266','#ffffff','#aa00ff','#00ff88'];
  for (let i = 0; i < 120; i++) {
    confettiParticles.push({
      x: Math.random() * cc.width, y: -10 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 4, vy: 1.5 + Math.random() * 3,
      r: 4 + Math.random() * 6, color: cols[Math.floor(Math.random() * cols.length)],
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 8,
    });
  }
  cancelAnimationFrame(confettiAnimId);
  function loop() {
    const screen = document.getElementById('gameOver');
    if (!screen || !screen.classList.contains('active')) return;
    cctx.clearRect(0, 0, cc.width, cc.height);
    confettiParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      if (p.y > cc.height + 20) { p.y = -10; p.x = Math.random() * cc.width; }
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot * Math.PI / 180);
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
      cctx.restore();
    });
    confettiAnimId = requestAnimationFrame(loop);
  }
  loop();
}

// ===== GAME END =====
function endGame() {
  STATE.running = false;
  cancelAnimationFrame(animId);
  clearInterval(STATE.timerInterval);
  saveScore();
  showGameOver();
}

function showGameOver() {
  document.getElementById('goScore').textContent = STATE.score;
  document.getElementById('goShots').textContent = STATE.shotsMade;
  document.getElementById('goStreak').textContent = STATE.bestStreak;
  const total = Math.max(STATE.shots, 1);
  document.getElementById('goAccuracy').textContent = Math.round((STATE.shotsMade / total) * 100) + '%';
  const stars = getStarRating();
  document.getElementById('starRating').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('gameOverEmoji').textContent = stars === 3 ? '🏆' : stars === 2 ? '🎉' : '😤';
  document.getElementById('gameOverTitle').textContent = stars === 3 ? 'LEGENDARY!' : stars === 2 ? 'NICE GAME!' : 'KEEP TRYING!';
  const hiKey = 'hi_' + STATE.mode;
  const prev = parseInt(localStorage.getItem(hiKey) || '0');
  if (STATE.score > prev) { localStorage.setItem(hiKey, STATE.score); document.getElementById('newRecord').style.display = 'block'; }
  else { document.getElementById('newRecord').style.display = 'none'; }
  showScreen('gameOver');
}

function getStarRating() {
  const thresholds = { classic: [22, 14], timeAttack: [40, 22], threePoint: [55, 35], challenge: [30, 16] };
  const t = thresholds[STATE.mode] || [30, 16];
  return STATE.score >= t[0] ? 3 : STATE.score >= t[1] ? 2 : 1;
}

function saveScore() {
  const key = 'lb_' + STATE.mode;
  const entries = JSON.parse(localStorage.getItem(key) || '[]');
  entries.push({ score: STATE.score, mode: STATE.mode, date: new Date().toLocaleDateString() });
  entries.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(entries.slice(0, 5)));
  const prev = parseInt(localStorage.getItem('totalStars') || '0');
  localStorage.setItem('totalStars', prev + getStarRating());
}

// ===== GAME START =====
function startGame(mode) {
  STATE.mode = mode; STATE.score = 0; STATE.shots = 0; STATE.shotsMade = 0;
  STATE.streak = 0; STATE.bestStreak = 0; STATE.lives = 3;
  STATE.timeLeft = 60; STATE.miniGame = null; STATE.running = true;
  clearInterval(STATE.timerInterval);
  particles.length = 0;

  document.getElementById('sidebarMode').textContent = { classic:'Classic', timeAttack:'Time Attack', threePoint:'3-Point', challenge:'Survival' }[mode];

  const showTimer = mode === 'timeAttack';
  const showLives = mode === 'challenge';
  const showShots = !showTimer && !showLives;
  document.getElementById('timerSection').style.display = showTimer ? '' : 'none';
  document.getElementById('livesSection').style.display = showLives ? '' : 'none';
  document.getElementById('shotCountSection').style.display = showShots ? '' : 'none';
  document.getElementById('sidebarTimer').style.color = '#00d4ff';

  if (showShots) {
    const limit = mode === 'threePoint' ? 25 : 10;
    const dotsEl = document.getElementById('shotDots');
    dotsEl.innerHTML = '';
    for (let i = 0; i < limit; i++) {
      const d = document.createElement('div'); d.className = 'shot-dot'; dotsEl.appendChild(d);
    }
  }
  if (showLives) updateLives();

  if (showTimer) {
    STATE.timerInterval = setInterval(() => {
      STATE.timeLeft--;
      document.getElementById('sidebarTimer').textContent = STATE.timeLeft;
      if (STATE.timeLeft <= 10) document.getElementById('sidebarTimer').style.color = '#ff2200';
      if (STATE.timeLeft <= 0) { clearInterval(STATE.timerInterval); endGame(); }
    }, 1000);
  }

  updateSidebar(); updateStreak(); updateWindRandom();
  showScreen('gameScreen');
  cancelAnimationFrame(animId);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    resizeCanvas(); resetBall(); gameLoop();
  }));
}

function quitGame() {
  STATE.running = false;
  cancelAnimationFrame(animId);
  clearInterval(STATE.timerInterval);
  showScreen('splash');
}

function restartGame() { startGame(STATE.mode); }

// Init splash on load
window.addEventListener('load', () => { initSplashCanvas(); updateSplashStars(); });
