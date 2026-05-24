// ===== GLOBAL STATE =====
const STATE = {
  mode: 'classic',
  score: 0,
  shots: 0,
  shotsMade: 0,
  shotsTotal: 10,
  streak: 0,
  bestStreak: 0,
  lives: 3,
  timeLeft: 60,
  timerInterval: null,
  maxShotsLeft: 10,
  miniGame: null,
  wind: 0,
  running: false,
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== HOOP & COURT =====
let HOOP = { x: 0, y: 0, rimW: 50, rimH: 8, backboardW: 8, backboardH: 70 };
let BALL_START = { x: 0, y: 0 };

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  HOOP.x = canvas.width * 0.65;
  HOOP.y = canvas.height * 0.32;
  BALL_START.x = canvas.width * 0.22;
  BALL_START.y = canvas.height * 0.72;
}
window.addEventListener('resize', () => { resizeCanvas(); if (!ball.flying) drawFrame(); });
resizeCanvas();

// ===== BALL =====
const ball = {
  x: 0, y: 0, vx: 0, vy: 0, r: 18,
  flying: false, trail: [],
  rotation: 0, scored: false,
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
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onPointerDown(e) {
  if (!STATE.running || ball.flying) return;
  mouseDown = true;
  currentPower = 0;
  const pos = getPos(e);
  aimAngle = Math.atan2(HOOP.y - pos.y, HOOP.x - pos.x);
  document.getElementById('powerMeterContainer').style.display = 'block';
  powerInterval = setInterval(() => {
    currentPower = Math.min(currentPower + 2, 100);
    document.getElementById('powerBar').style.width = currentPower + '%';
  }, 30);
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
const GRAVITY = 0.45;
const FPS = 60;

function shootBall() {
  const accuracySkill = parseInt(document.getElementById('accuracySlider').value);
  const maxSpread = (11 - accuracySkill) * 0.06;
  const spread = (Math.random() - 0.5) * maxSpread;

  const speed = 6 + currentPower * 0.14;
  const windEffect = STATE.wind * 0.008;

  ball.vx = Math.cos(aimAngle + spread) * speed + windEffect;
  ball.vy = Math.sin(aimAngle + spread) * speed;
  ball.flying = true;
  ball.trail = [];
  ball.scored = false;

  playSound('shoot');
  if (STATE.miniGame === 'hotStreak') showMiniGameBanner('🔥 HOT STREAK - +2 BONUS!');
}

let animId = null;
function gameLoop() {
  if (!STATE.running) return;
  update();
  drawFrame();
  animId = requestAnimationFrame(gameLoop);
}

function update() {
  if (!ball.flying) return;
  ball.trail.push({ x: ball.x, y: ball.y, age: 0 });
  if (ball.trail.length > 18) ball.trail.shift();
  ball.trail.forEach(t => t.age++);

  ball.x += ball.vx;
  ball.vy += GRAVITY;
  ball.y += ball.vy;
  ball.rotation += ball.vx * 3;

  // Wind drift
  ball.vx += STATE.wind * 0.0005;

  checkScore();
  checkOutOfBounds();
}

function checkScore() {
  if (ball.scored) return;
  const rimLeft = HOOP.x - HOOP.rimW / 2;
  const rimRight = HOOP.x + HOOP.rimW / 2;
  const rimY = HOOP.y;

  // Ball passing through hoop from above
  if (ball.x > rimLeft + 4 && ball.x < rimRight - 4 &&
      ball.y + ball.r >= rimY - 2 && ball.y - ball.r < rimY + 10 &&
      ball.vy > 0) {
    ball.scored = true;
    registerScore(true);
  }

  // Backboard bounce
  const bbX = HOOP.x + HOOP.rimW / 2 + HOOP.backboardW / 2 + 10;
  if (ball.x + ball.r >= bbX - 10 && ball.x + ball.r <= bbX + 10 &&
      ball.y >= HOOP.y - HOOP.backboardH / 2 && ball.y <= HOOP.y + HOOP.backboardH / 2) {
    ball.vx *= -0.5;
    ball.x -= 2;
  }

  // Rim collision
  [[rimLeft, rimY], [rimRight, rimY]].forEach(([rx, ry]) => {
    const dx = ball.x - rx, dy = ball.y - ry;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < ball.r + 5) {
      const nx = dx / dist, ny = dy / dist;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = (ball.vx - 2 * dot * nx) * 0.55;
      ball.vy = (ball.vy - 2 * dot * ny) * 0.55;
      ball.x += nx * (ball.r + 5 - dist + 1);
      ball.y += ny * (ball.r + 5 - dist + 1);
      playSound('rim');
    }
  });
}

function checkOutOfBounds() {
  if (ball.scored) {
    setTimeout(() => { endShot(true); }, 600);
    return;
  }
  if (ball.y > canvas.height + 50 || ball.x < -100 || ball.x > canvas.width + 100) {
    endShot(false);
  }
  // Bounce off floor for drama
  if (ball.y + ball.r >= canvas.height - 20) {
    ball.vy *= -0.45;
    ball.vx *= 0.7;
    ball.y = canvas.height - 20 - ball.r;
    if (Math.abs(ball.vy) < 1.5) endShot(false);
  }
}

function endShot(made) {
  if (!ball.flying) return;
  ball.flying = false;

  if (made) {
    registerScore(false);
  } else {
    STATE.streak = 0;
    updateStreak();
    if (STATE.mode === 'challenge') {
      STATE.lives = Math.max(0, STATE.lives - 1);
      updateLives();
      if (STATE.lives === 0) { endGame(); return; }
    }
    animateMiss();
  }

  advanceShot(made);
  setTimeout(() => { resetBall(); drawFrame(); }, 400);
}

function registerScore(fromPhysics) {
  if (ball.scored && fromPhysics) return;
  if (!fromPhysics && !ball.scored) return;

  const is3pt = ball.x < canvas.width * 0.35 || ball.x > canvas.width * 0.85;
  let pts = is3pt ? 3 : 2;

  // Mini-game bonuses
  if (STATE.miniGame === 'hotStreak') pts += 2;
  if (STATE.miniGame === 'alleyOop') pts += 3;
  if (STATE.miniGame === 'bankShot') { pts = 5; showMiniGameBanner('🏦 BANK SHOT! +5 pts!'); }

  // Streak bonus
  STATE.streak++;
  if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak;
  if (STATE.streak >= 3) pts += STATE.streak - 2;

  STATE.score += pts;
  STATE.shotsMade++;
  updateSidebar();
  updateStreak();
  showFloatingScore('+' + pts + (is3pt ? ' 🎯' : ''), is3pt ? '#00d4ff' : '#ff8c00');
  showCombo();
  playSound('score');
  STATE.miniGame = null;
}

// ===== SHOT ADVANCE =====
function advanceShot(made) {
  if (STATE.mode === 'classic' || STATE.mode === 'threePoint') {
    STATE.shots++;
    updateShotDots(made);
    const limit = STATE.mode === 'threePoint' ? 25 : 10;
    if (STATE.shots >= limit) { setTimeout(endGame, 700); return; }
  }
  updateWindRandom();
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
  const total = STATE.shots || 1;
  document.getElementById('goAccuracy').textContent = Math.round((STATE.shotsMade / total) * 100) + '%';

  const stars = getStarRating();
  document.getElementById('starRating').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  const emoji = stars === 3 ? '🏆' : stars === 2 ? '🎉' : '😤';
  document.getElementById('gameOverEmoji').textContent = emoji;
  document.getElementById('gameOverTitle').textContent = stars === 3 ? 'LEGEND!' : stars === 2 ? 'NICE GAME!' : 'KEEP TRYING!';

  const hiKey = 'hi_' + STATE.mode;
  const prev = parseInt(localStorage.getItem(hiKey) || '0');
  if (STATE.score > prev) {
    localStorage.setItem(hiKey, STATE.score);
    document.getElementById('newRecord').style.display = 'block';
  } else {
    document.getElementById('newRecord').style.display = 'none';
  }

  showScreen('gameOver');
}

function getStarRating() {
  if (STATE.mode === 'classic') {
    if (STATE.score >= 22) return 3;
    if (STATE.score >= 14) return 2;
    return 1;
  }
  if (STATE.mode === 'timeAttack') {
    if (STATE.score >= 40) return 3;
    if (STATE.score >= 24) return 2;
    return 1;
  }
  if (STATE.mode === 'challenge') {
    if (STATE.score >= 30) return 3;
    if (STATE.score >= 16) return 2;
    return 1;
  }
  return STATE.score >= 50 ? 3 : STATE.score >= 30 ? 2 : 1;
}

function saveScore() {
  const key = 'lb_' + STATE.mode;
  const entries = JSON.parse(localStorage.getItem(key) || '[]');
  entries.push({ score: STATE.score, mode: STATE.mode, date: new Date().toLocaleDateString() });
  entries.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(entries.slice(0, 5)));

  const totalStarsKey = 'totalStars';
  const prev = parseInt(localStorage.getItem(totalStarsKey) || '0');
  localStorage.setItem(totalStarsKey, prev + getStarRating());
}

// ===== DRAW =====
function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCourt();
  drawHoop();
  drawTrail();
  if (!ball.flying || !ball.scored) drawBall();
  drawAimGuide();
}

function drawCourt() {
  // Floor gradient
  const grad = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
  grad.addColorStop(0, '#1a0e00');
  grad.addColorStop(1, '#0d0800');
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

  // Court lines
  ctx.strokeStyle = 'rgba(255,140,0,0.15)';
  ctx.lineWidth = 1;
  // 3-point arc approximation
  ctx.beginPath();
  ctx.arc(BALL_START.x - 10, canvas.height, canvas.width * 0.42, -Math.PI, 0);
  ctx.stroke();

  // Free throw line
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.1, canvas.height * 0.75);
  ctx.lineTo(canvas.width * 0.55, canvas.height * 0.75);
  ctx.stroke();

  // Key (paint)
  ctx.strokeStyle = 'rgba(255,140,0,0.1)';
  ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.75, canvas.width * 0.45, canvas.height * 0.25);
}

function drawHoop() {
  const { x, y, rimW, rimH, backboardW, backboardH } = HOOP;

  // Backboard
  const bbX = x + rimW / 2 + 12;
  const bbGrad = ctx.createLinearGradient(bbX, y - backboardH / 2, bbX + backboardW, y + backboardH / 2);
  bbGrad.addColorStop(0, 'rgba(200,220,255,0.9)');
  bbGrad.addColorStop(1, 'rgba(150,180,220,0.7)');
  ctx.fillStyle = bbGrad;
  ctx.fillRect(bbX, y - backboardH / 2, backboardW, backboardH);
  // Backboard square
  ctx.strokeStyle = 'rgba(255,60,60,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bbX + 1, y - 14, backboardW - 2, 28);

  // Pole
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bbX + backboardW / 2, y + backboardH / 2);
  ctx.lineTo(bbX + backboardW / 2, canvas.height);
  ctx.stroke();

  // Rim support arm
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bbX, y);
  ctx.lineTo(x + rimW / 2, y);
  ctx.stroke();

  // Net
  drawNet(x, y, rimW);

  // Rim (draw on top of net)
  ctx.strokeStyle = '#ff4500';
  ctx.lineWidth = 5;
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(255,80,0,0.6)';
  ctx.beginPath();
  ctx.moveTo(x - rimW / 2, y);
  ctx.lineTo(x + rimW / 2, y);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawNet(x, y, rimW) {
  const segments = 6;
  const netDepth = 35;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  // Vertical net lines
  for (let i = 0; i <= segments; i++) {
    const px = x - rimW / 2 + (rimW / segments) * i;
    const drift = (i - segments / 2) * 1.5;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.quadraticCurveTo(px + drift, y + netDepth * 0.6, x + drift * 0.3, y + netDepth);
    ctx.stroke();
  }
  // Horizontal lines
  for (let j = 1; j <= 3; j++) {
    const ny = y + (netDepth / 4) * j;
    const shrink = j * 2;
    ctx.beginPath();
    ctx.moveTo(x - rimW / 2 + shrink, ny);
    ctx.lineTo(x + rimW / 2 - shrink, ny);
    ctx.stroke();
  }
}

function drawBall() {
  const { x, y, r, rotation } = ball;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Shadow
  ctx.save();
  ctx.translate(0, 5);
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.restore();

  // Ball body
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#ff9d1e');
  grad.addColorStop(0.6, '#e06000');
  grad.addColorStop(1, '#6b2e00');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Seams
  ctx.strokeStyle = '#1a0800';
  ctx.lineWidth = 1.5;
  // Horizontal seam
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI, false);
  ctx.stroke();
  // Vertical seam
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  ctx.stroke();
  // Curved seams
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.8);
  ctx.bezierCurveTo(-r * 0.6, 0, -r * 0.6, 0, -r * 0.4, r * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.4, -r * 0.8);
  ctx.bezierCurveTo(r * 0.6, 0, r * 0.6, 0, r * 0.4, r * 0.8);
  ctx.stroke();

  // Highlight
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.35, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fill();

  ctx.restore();
}

function drawTrail() {
  ball.trail.forEach((t, i) => {
    const alpha = (1 - t.age / 18) * 0.5;
    const size = ball.r * (1 - t.age / 22);
    if (size <= 0 || alpha <= 0) return;
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,140,0,${alpha})`;
    ctx.fill();
  });
}

function drawAimGuide() {
  if (mouseDown && !ball.flying) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + currentPower * 0.005})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    const guideLen = 80 + currentPower * 0.8;
    ctx.lineTo(ball.x + Math.cos(aimAngle) * guideLen, ball.y + Math.sin(aimAngle) * guideLen);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ===== UI UPDATES =====
function updateSidebar() {
  document.getElementById('sidebarScore').textContent = STATE.score;
  const total = STATE.shots || 0;
  const pct = total > 0 ? Math.round((STATE.shotsMade / total) * 100) : '—';
  document.getElementById('sidebarAccPct').textContent = total > 0 ? pct + '%' : '—';
}

function updateStreak() {
  const el = document.getElementById('sidebarStreak');
  el.textContent = STATE.streak + (STATE.streak >= 3 ? ' 🔥' : '');
  el.style.color = STATE.streak >= 3 ? '#ff4500' : STATE.streak >= 2 ? '#ff8c00' : '#aaa';
}

function updateLives() {
  document.getElementById('sidebarLives').textContent = '❤️'.repeat(STATE.lives) + '🖤'.repeat(3 - STATE.lives);
}

function updateShotDots(made) {
  const dots = document.querySelectorAll('.shot-dot');
  const idx = STATE.shots - 1;
  if (dots[idx]) dots[idx].classList.add(made ? 'made' : 'missed');
}

function updateWindRandom() {
  STATE.wind = Math.floor((Math.random() - 0.5) * 10);
  const el = document.getElementById('windDisplay');
  const arrow = STATE.wind > 0 ? '➡️' : STATE.wind < 0 ? '⬅️' : '—';
  el.textContent = arrow + ' ' + (STATE.wind > 0 ? '+' : '') + STATE.wind;
  document.getElementById('windArrow').textContent = STATE.wind !== 0 ? `${arrow} ${Math.abs(STATE.wind)}` : '';
}

function showFloatingScore(text, color) {
  const el = document.getElementById('floatingScore');
  el.textContent = text;
  el.style.color = color || '#ff8c00';
  el.style.left = (HOOP.x - 30) + 'px';
  el.style.top = (HOOP.y - 50) + 'px';
  el.style.opacity = '1';
  el.style.transform = 'translateY(0)';
  el.style.fontSize = '32px';
  el.style.display = 'block';
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-40px)';
  }, 100);
  setTimeout(() => { el.style.display = 'none'; }, 800);
}

function showCombo() {
  if (STATE.streak < 2) return;
  const messages = ['', '', 'DOUBLE!', 'TRIPLE! 🔥', 'ON FIRE! 🔥🔥', 'UNSTOPPABLE! 💥', 'GOD MODE! 👑'];
  const msg = messages[Math.min(STATE.streak, messages.length - 1)];
  const el = document.getElementById('comboDisplay');
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 1500);
}

function animateMiss() {
  showFloatingScore('MISS', '#ff3333');
}

function showMiniGameBanner(text) {
  const el = document.getElementById('miniGameBanner');
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

// ===== MINI GAMES =====
function triggerMiniGame(type) {
  if (!STATE.running || ball.flying) return;
  STATE.miniGame = type;
  const messages = {
    hotStreak: '🔥 HOT STREAK! Next basket = +2 bonus!',
    bankShot: '🏦 BANK SHOT! Hit backboard first = +5 pts!',
    alleyOop: '🚀 ALLEY-OOP! +3 bonus if you score!',
  };
  showMiniGameBanner(messages[type]);
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'leaderboard') populateLeaderboard();
  if (id === 'splash') updateSplashStars();
}

function updateSplashStars() {
  const stars = parseInt(localStorage.getItem('totalStars') || '0');
  document.getElementById('totalStars').textContent = '⭐ ' + stars;
}

function populateLeaderboard() {
  const modes = ['classic', 'timeAttack', 'threePoint', 'challenge'];
  const names = { classic: 'Classic', timeAttack: 'Time Attack', threePoint: '3-Point', challenge: 'Survival' };
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';

  let all = [];
  modes.forEach(m => {
    const entries = JSON.parse(localStorage.getItem('lb_' + m) || '[]');
    entries.forEach(e => all.push({ ...e, modeName: names[m] }));
  });
  all.sort((a, b) => b.score - a.score);
  all.slice(0, 10).forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'lb-entry';
    div.innerHTML = `<span class="lb-rank">${i + 1}</span><span>${e.modeName}</span><span class="lb-score">${e.score}</span><span class="lb-mode">${e.date}</span>`;
    list.appendChild(div);
  });
  if (all.length === 0) list.innerHTML = '<p style="color:#666;text-align:center;padding:30px">No games yet. Play first!</p>';
}

// ===== GAME START =====
function startGame(mode) {
  STATE.mode = mode;
  STATE.score = 0;
  STATE.shots = 0;
  STATE.shotsMade = 0;
  STATE.streak = 0;
  STATE.bestStreak = 0;
  STATE.lives = 3;
  STATE.timeLeft = 60;
  STATE.miniGame = null;
  STATE.running = true;
  clearInterval(STATE.timerInterval);

  document.getElementById('sidebarMode').textContent = {
    classic: 'Classic', timeAttack: 'Time Attack', threePoint: '3-Point', challenge: 'Survival'
  }[mode];

  // Show/hide sidebar sections
  const showTimer = mode === 'timeAttack';
  const showLives = mode === 'challenge';
  const showShots = mode !== 'timeAttack' && mode !== 'challenge';
  document.getElementById('timerSection').style.display = showTimer ? '' : 'none';
  document.getElementById('livesSection').style.display = showLives ? '' : 'none';
  document.getElementById('shotCountSection').style.display = showShots ? '' : 'none';

  // Shot dots
  if (showShots) {
    const limit = mode === 'threePoint' ? 25 : 10;
    const dotsEl = document.getElementById('shotDots');
    dotsEl.innerHTML = '';
    for (let i = 0; i < limit; i++) {
      const d = document.createElement('div');
      d.className = 'shot-dot';
      dotsEl.appendChild(d);
    }
  }

  if (showLives) updateLives();

  if (mode === 'timeAttack') {
    STATE.timerInterval = setInterval(() => {
      STATE.timeLeft--;
      document.getElementById('sidebarTimer').textContent = STATE.timeLeft;
      if (STATE.timeLeft <= 10) document.getElementById('sidebarTimer').style.color = '#ff2200';
      if (STATE.timeLeft <= 0) { clearInterval(STATE.timerInterval); endGame(); }
    }, 1000);
  }

  updateSidebar();
  updateStreak();
  updateWindRandom();
  showScreen('gameScreen');
  cancelAnimationFrame(animId);
  // Wait two frames so the canvas is visible and has real dimensions
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeCanvas();
      resetBall();
      gameLoop();
    });
  });
}

function quitGame() {
  STATE.running = false;
  cancelAnimationFrame(animId);
  clearInterval(STATE.timerInterval);
  showScreen('splash');
}

function restartGame() { startGame(STATE.mode); }
