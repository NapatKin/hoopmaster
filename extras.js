// =============================================
// EXTRAS.JS — Training, 1v1, Challenges, Tournament, Icon Store, Chemistry
// =============================================

// ===== CHEMISTRY SYSTEM =====
function calcChemistry() {
  const positions = ['PG','SG','SF','PF','C'];
  const players = positions.map(pos => {
    const id = PS.squad[pos];
    return id ? PLAYER_DB.find(p => p.id === id) : null;
  }).filter(Boolean);
  if (!players.length) return 0;

  let score = 0, max = 0;
  // Same team pairs
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      max += 20;
      if (players[i].team === players[j].team) score += 20;
    }
  }
  // Rarity bonus
  const rarityPts = { bronze: 2, silver: 5, gold: 8, elite: 11, legend: 15 };
  players.forEach(p => { max += 15; score += rarityPts[p.rarity] || 0; });

  return max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
}

function chemStars(pct) {
  if (pct >= 90) return '⭐⭐⭐⭐⭐';
  if (pct >= 70) return '⭐⭐⭐⭐';
  if (pct >= 50) return '⭐⭐⭐';
  if (pct >= 30) return '⭐⭐';
  return '⭐';
}

function chemBonus(pct) {
  if (pct >= 90) return '+15% shooting';
  if (pct >= 70) return '+10% shooting';
  if (pct >= 50) return '+5% shooting';
  return 'No bonus';
}

// ===== TRAINING SYSTEM =====
let TRAIN_STATE = { boosts: {}, selectedPlayer: null };

function loadTraining() {
  const saved = JSON.parse(localStorage.getItem('trainState') || 'null');
  if (saved) TRAIN_STATE.boosts = saved.boosts || {};
}

function saveTraining() {
  localStorage.setItem('trainState', JSON.stringify({ boosts: TRAIN_STATE.boosts }));
}

function getStatBoost(pid, stat) {
  return TRAIN_STATE.boosts[pid]?.[stat] || 0;
}

window.getEffectiveStat = function(pid, stat) {
  const p = PLAYER_DB.find(pl => pl.id === pid);
  if (!p) return 0;
  return Math.min(99, (p.stats[stat] || 0) + getStatBoost(pid, stat));
};

function doTrainStat(pid, stat) {
  const boost = getStatBoost(pid, stat);
  if (boost >= 15) { return; }
  const cost = Math.floor(800 * Math.pow(1.9, boost));
  if (!window.spendCoins(cost)) { alert('Not enough coins!'); return; }
  if (!TRAIN_STATE.boosts[pid]) TRAIN_STATE.boosts[pid] = {};
  TRAIN_STATE.boosts[pid][stat] = boost + 1;
  saveTraining();
  if (window.trackDailyProgress) window.trackDailyProgress('trainSessions', 1);
  updateCoinsDisplay();
  renderTrainingScreen();
}
window.doTrainStat = doTrainStat;

window.selectTrainingPlayer = function(id) {
  TRAIN_STATE.selectedPlayer = id;
  renderTrainingScreen();
};

function renderTrainingScreen() {
  const container = document.getElementById('trainingContent');
  if (!container) return;
  const allPlayers = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean)
    .sort((a, b) => b.ovr - a.ovr);
  const chem = calcChemistry();

  let html = `
  <div class="training-top">
    <div class="training-chem">
      <span class="chem-label">⚗️ Squad Chemistry</span>
      <span class="chem-pct">${chem}%</span>
      <span class="chem-stars">${chemStars(chem)}</span>
      <span class="chem-bonus">${chemBonus(chem)}</span>
    </div>
    <p class="training-tip">Train player stats to boost performance. Max +15 per stat. Costs increase each level.</p>
  </div>
  <div class="training-layout">
    <div class="training-player-list">`;

  allPlayers.forEach(player => {
    const isSelected = TRAIN_STATE.selectedPlayer === player.id;
    const r = RARITY[player.rarity];
    const totalBoosts = Object.values(TRAIN_STATE.boosts[player.id] || {}).reduce((a, b) => a + b, 0);
    html += `
    <div class="training-player-card ${isSelected ? 'tp-selected' : ''}" onclick="selectTrainingPlayer('${player.id}')">
      <div class="tp-ovr" style="color:${r.color}">${player.ovr}</div>
      <div class="tp-info">
        <div class="tp-name">${player.name}</div>
        <div class="tp-sub">${player.pos} · <span style="color:${r.textColor}">${r.label}</span></div>
      </div>
      ${totalBoosts > 0 ? `<div class="tp-boosts">+${totalBoosts} trained</div>` : ''}
    </div>`;
  });

  if (!allPlayers.length) html += `<p style="color:#555;padding:20px">No players in collection yet!</p>`;
  html += `</div><div class="training-stats-panel">`;

  if (TRAIN_STATE.selectedPlayer) {
    const player = PLAYER_DB.find(p => p.id === TRAIN_STATE.selectedPlayer);
    if (player) {
      const r = RARITY[player.rarity];
      html += `<div class="train-player-header">
        <span class="train-player-ovr" style="color:${r.color}">${player.ovr}</span>
        <div>
          <div class="train-player-name">${player.full}</div>
          <div class="train-player-sub">${player.pos} · ${player.team} · <span style="color:${r.textColor}">${r.label}</span></div>
        </div>
      </div>
      <div class="train-stats-grid">`;

      const statMeta = [
        { key: 'sht', label: '🎯 Shooting',  color: '#ff8c00' },
        { key: 'spd', label: '⚡ Speed',     color: '#00d4ff' },
        { key: 'drb', label: '🏀 Dribbling', color: '#a855f7' },
        { key: 'def', label: '🛡️ Defense',   color: '#22c55e' },
        { key: 'phy', label: '💪 Physical',  color: '#ff4444' },
      ];

      statMeta.forEach(({ key, label, color }) => {
        const base = player.stats[key];
        const boost = getStatBoost(player.id, key);
        const eff = Math.min(99, base + boost);
        const maxed = boost >= 15;
        const cost = maxed ? 0 : Math.floor(800 * Math.pow(1.9, boost));
        const canAfford = window.getCoins() >= cost;
        const basePct = (base / 99) * 100;
        const boostPct = (boost / 99) * 100;

        html += `
        <div class="train-stat-row">
          <span class="train-stat-label">${label}</span>
          <div class="train-bar-wrap">
            <div class="train-bar-base" style="width:${basePct}%;background:${color}55"></div>
            <div class="train-bar-boost" style="width:${boostPct}%;left:${basePct}%;background:${color}"></div>
            <span class="train-bar-val" style="color:${color}">${eff}${boost > 0 ? `<sup>+${boost}</sup>` : ''}</span>
          </div>
          <button class="train-btn ${maxed ? 'train-maxed' : canAfford ? 'train-buy' : 'train-broke'}"
            onclick="${maxed ? '' : `doTrainStat('${player.id}','${key}')`}"
            ${maxed ? 'disabled' : ''}>
            ${maxed ? '✓ MAX' : canAfford ? `🪙 ${fmtCoins(cost)}` : `Need ${fmtCoins(cost)}`}
          </button>
        </div>`;
      });

      html += `</div>
      <div class="train-traits">
        <div class="train-traits-label">Traits:</div>
        ${player.traits.map(t => TRAITS[t] ? `<span class="ptrait">${TRAITS[t].icon} ${TRAITS[t].label} — ${TRAITS[t].desc}</span>` : '').join('')}
        ${!player.traits.length ? '<span style="color:#555;font-size:11px">No traits</span>' : ''}
      </div>`;
    }
  } else {
    html += `<div class="train-empty-hint">← Select a player to view and train their stats</div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

// ===== DAILY CHALLENGES =====
const CHALLENGE_TYPES = [
  { id: 'click200',  icon: '🖱️', text: 'Click the ball 200 times',         key: 'clicks',        goal: 200,   reward: 800 },
  { id: 'earn15k',   icon: '💰', text: 'Earn 15,000 coins in Ball Tycoon', key: 'clickerEarned', goal: 15000, reward: 3000 },
  { id: 'shoot_game',icon: '🏀', text: 'Complete any shooting game',        key: 'shootGames',    goal: 1,     reward: 1500 },
  { id: 'open_pack', icon: '📦', text: 'Open any player pack',             key: 'packsOpened',   goal: 1,     reward: 1200 },
  { id: 'buy_mkt',   icon: '📈', text: 'Buy a player from the Market',     key: 'marketBuys',    goal: 1,     reward: 1500 },
  { id: 'three5',    icon: '🎯', text: 'Score 5 three-pointers',           key: 'threePointers', goal: 5,     reward: 1000 },
  { id: 'streak5',   icon: '🔥', text: 'Hit a 5-shot streak',              key: 'bestStreak',    goal: 5,     reward: 800 },
  { id: 'win_1v1',   icon: '⚔️', text: 'Win a 1v1 game',                   key: 'ovoWins',       goal: 1,     reward: 2500 },
  { id: 'train3',    icon: '💪', text: 'Train any player stat 3 times',    key: 'trainSessions', goal: 3,     reward: 1500 },
  { id: 'win_tour',  icon: '🏆', text: 'Win a tournament',                 key: 'tourneyWins',   goal: 1,     reward: 5000 },
  { id: 'upgrade3',  icon: '⬆️', text: 'Buy 3 Clicker upgrades',          key: 'upgradesBought',goal: 3,     reward: 700 },
  { id: 'full_squad',icon: '👥', text: 'Have all 5 squad spots filled',    key: 'squadFilled',   goal: 1,     reward: 2000 },
];

let DAILY = { date: '', challenges: [], progress: {} };
let _weeklyBonusClaimed = false;

function loadDailyChallenges() {
  const saved = JSON.parse(localStorage.getItem('dailyChallenges') || 'null');
  const today = new Date().toDateString();
  if (saved && saved.date === today) {
    DAILY = saved;
  } else {
    const hash = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const used = new Set();
    const selected = [];
    for (let i = 0; selected.length < 3; i++) {
      const idx = (hash + i * 7 + i * i * 3) % CHALLENGE_TYPES.length;
      if (!used.has(idx)) { used.add(idx); selected.push({ typeId: CHALLENGE_TYPES[idx].id, progress: 0, claimed: false }); }
    }
    DAILY = { date: today, challenges: selected, progress: {} };
    saveDailyChallenges();
  }
  _weeklyBonusClaimed = !!localStorage.getItem('weeklyBonus_' + new Date().toDateString());
}

function saveDailyChallenges() {
  localStorage.setItem('dailyChallenges', JSON.stringify(DAILY));
}

window.trackDailyProgress = function(key, amount) {
  if (!DAILY.progress) DAILY.progress = {};
  DAILY.progress[key] = (DAILY.progress[key] || 0) + amount;
  DAILY.challenges.forEach(ch => {
    if (ch.claimed) return;
    const type = CHALLENGE_TYPES.find(t => t.id === ch.typeId);
    if (type && type.key === key) ch.progress = Math.min(type.goal, DAILY.progress[key]);
  });
  saveDailyChallenges();
  if (document.getElementById('challengesScreen')?.classList.contains('active')) renderChallengesScreen();

  // Check squad filled
  if (key === 'squadFilled') {
    const filled = Object.values(PS.squad).filter(Boolean).length;
    DAILY.progress.squadFilled = filled === 5 ? 1 : 0;
    saveDailyChallenges();
  }
};

window.claimDailyReward = function(index) {
  const ch = DAILY.challenges[index];
  if (!ch || ch.claimed) return;
  const type = CHALLENGE_TYPES.find(t => t.id === ch.typeId);
  if (!type || ch.progress < type.goal) return;
  ch.claimed = true;
  window.addCoins(type.reward);
  saveDailyChallenges();
  updateCoinsDisplay();
  renderChallengesScreen();
};

window.claimWeeklyBonus = function() {
  if (_weeklyBonusClaimed) return;
  const today = new Date().toDateString();
  if (localStorage.getItem('weeklyBonus_' + today)) return;
  localStorage.setItem('weeklyBonus_' + today, '1');
  _weeklyBonusClaimed = true;
  window.addCoins(5000);
  updateCoinsDisplay();
  renderChallengesScreen();
};

function renderChallengesScreen() {
  const container = document.getElementById('challengesContent');
  if (!container) return;
  const today = new Date().toDateString();
  const allClaimed = DAILY.challenges.every(c => c.claimed);

  let html = `
  <div class="challenges-header">
    <p class="challenges-date">📅 ${today} — Challenges reset daily at midnight</p>
  </div>
  <div class="challenges-list">`;

  DAILY.challenges.forEach((ch, i) => {
    const type = CHALLENGE_TYPES.find(t => t.id === ch.typeId);
    if (!type) return;
    const pct = Math.min(100, (ch.progress / type.goal) * 100);
    const done = ch.progress >= type.goal;
    html += `
    <div class="challenge-card ${ch.claimed ? 'ch-claimed' : done ? 'ch-done' : ''}">
      <div class="challenge-icon">${type.icon}</div>
      <div class="challenge-info">
        <div class="challenge-text">${type.text}</div>
        <div class="ch-prog-wrap">
          <div class="ch-prog-bar"><div class="ch-prog-fill" style="width:${pct}%"></div></div>
          <span class="ch-prog-label">${Math.floor(ch.progress)}/${type.goal}</span>
        </div>
      </div>
      <div class="challenge-reward">
        <div class="ch-reward-coins">🪙 ${fmtCoins(type.reward)}</div>
        ${ch.claimed
          ? '<div class="ch-claimed-badge">✓ DONE</div>'
          : done
            ? `<button class="btn-claim" onclick="claimDailyReward(${i})">CLAIM</button>`
            : '<div class="ch-lock">🔒</div>'
        }
      </div>
    </div>`;
  });

  html += `</div>
  <div class="challenges-bonus-section">
    <div class="bonus-section-title">🌟 DAILY BONUS REWARD</div>
    <div class="bonus-card ${allClaimed ? 'bonus-ready' : ''}">
      <div class="bonus-card-icon">🎁</div>
      <div class="bonus-card-info">
        <div class="bonus-card-title">Complete All 3 Challenges</div>
        <div class="bonus-card-sub">Earn 5,000 extra coins when all daily tasks are done</div>
      </div>
      <div class="bonus-card-action">
        ${allClaimed && !_weeklyBonusClaimed
          ? `<button class="btn-claim" onclick="claimWeeklyBonus()">CLAIM 🪙5K</button>`
          : allClaimed && _weeklyBonusClaimed
            ? '<div class="ch-claimed-badge">✓ CLAIMED</div>'
            : `<div class="ch-lock">${DAILY.challenges.filter(c=>c.claimed).length}/3</div>`
        }
      </div>
    </div>
  </div>`;

  container.innerHTML = html;
}

// ===== 1v1 GAME =====
let ovoCanvas, ovoCtx, ovoAnimId;
const OVO = {
  playerScore: 0, aiScore: 0,
  phase: 'idle',   // idle | choosing | timing | animating | result
  possession: 'player',
  round: 0, maxRounds: 12,
  winner: null,
  timingVal: 50, timingDir: 1, timingSpeed: 2,
  chosenZone: null,
  ballX: 0, ballY: 0, ballTX: 0, ballTY: 0,
  animT: 0, animDur: 55,
  ballIn: false,
  aiPlayer: null,
};

function initOVO() {
  ovoCanvas = document.getElementById('ovoCanvas');
  if (!ovoCanvas) return;
  ovoCtx = ovoCanvas.getContext('2d');
  window.addEventListener('resize', resizeOvoCanvas);

  const notOwned = PLAYER_DB.filter(p => !PS.collection.includes(p.id) && p.rarity !== 'legend');
  OVO.aiPlayer = notOwned[Math.floor(Math.random() * notOwned.length)] || PLAYER_DB[5];

  resetOVO();
}

function exitOVO() {
  cancelAnimationFrame(ovoAnimId);
  window.removeEventListener('resize', resizeOvoCanvas);
  showScreen('splash');
}
window.exitOVO = exitOVO;

function resizeOvoCanvas() {
  if (!ovoCanvas) return;
  ovoCanvas.width  = ovoCanvas.offsetWidth;
  ovoCanvas.height = ovoCanvas.offsetHeight;
}

function resetOVO() {
  OVO.playerScore = 0; OVO.aiScore = 0;
  OVO.phase = 'choosing'; OVO.possession = 'player';
  OVO.round = 0; OVO.winner = null;
  OVO.timingVal = 50;
  resizeOvoCanvas();
  renderOVOControls();
  cancelAnimationFrame(ovoAnimId);
  ovoLoop();
}
window.resetOVO = resetOVO;

function ovoLoop() {
  drawOVOCourt();
  if (OVO.phase === 'timing') {
    OVO.timingVal += OVO.timingDir * OVO.timingSpeed;
    if (OVO.timingVal >= 100 || OVO.timingVal <= 0) OVO.timingDir *= -1;
    updateOVOTimingBar();
  }
  if (OVO.phase === 'animating') {
    OVO.animT++;
    if (OVO.animT >= OVO.animDur) resolveOVOShot();
  }
  ovoAnimId = requestAnimationFrame(ovoLoop);
}

function drawOVOCourt() {
  if (!ovoCtx || !ovoCanvas) return;
  const W = ovoCanvas.width, H = ovoCanvas.height;
  ovoCtx.clearRect(0, 0, W, H);

  // Sky gradient
  const sky = ovoCtx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0a0514');
  sky.addColorStop(1, '#1a0a00');
  ovoCtx.fillStyle = sky;
  ovoCtx.fillRect(0, 0, W, H);

  // Floor
  const floorY = H * 0.68;
  ovoCtx.fillStyle = '#5c3010';
  ovoCtx.fillRect(0, floorY, W, H - floorY);
  ovoCtx.fillStyle = '#6b3a14';
  ovoCtx.fillRect(0, floorY, W, 3);

  // Court lines
  ovoCtx.strokeStyle = 'rgba(255,220,150,0.25)';
  ovoCtx.lineWidth = 2;
  ovoCtx.setLineDash([10, 10]);
  ovoCtx.beginPath();
  ovoCtx.moveTo(W * 0.5, floorY); ovoCtx.lineTo(W * 0.5, H);
  ovoCtx.stroke();
  ovoCtx.setLineDash([]);

  // 3-point arc (shooter's arc from right side)
  ovoCtx.strokeStyle = 'rgba(255,220,150,0.2)';
  ovoCtx.lineWidth = 2;
  ovoCtx.beginPath();
  ovoCtx.arc(W * 0.13, floorY + 8, W * 0.32, -Math.PI * 0.6, 0.05);
  ovoCtx.stroke();

  // Paint (key area)
  ovoCtx.strokeStyle = 'rgba(255,220,150,0.15)';
  ovoCtx.strokeRect(W * 0.13, floorY - H * 0.18, W * 0.15, H * 0.18);

  // Hoop
  const hX = W * 0.15, hY = H * 0.42;
  // Pole
  ovoCtx.fillStyle = '#888';
  ovoCtx.fillRect(hX - 3, hY, 6, floorY - hY);
  // Backboard
  ovoCtx.fillStyle = 'rgba(200,220,255,0.8)';
  ovoCtx.fillRect(hX - 3, hY - 30, 7, 55);
  ovoCtx.strokeStyle = '#aaa';
  ovoCtx.lineWidth = 1;
  ovoCtx.strokeRect(hX - 3, hY - 30, 7, 55);
  // Inner square
  ovoCtx.strokeStyle = '#fff';
  ovoCtx.strokeRect(hX - 1, hY - 8, 5, 18);
  // Rim
  ovoCtx.strokeStyle = '#ff4400';
  ovoCtx.lineWidth = 4;
  ovoCtx.beginPath();
  ovoCtx.moveTo(hX + 4, hY + 4); ovoCtx.lineTo(hX + 38, hY + 4);
  ovoCtx.stroke();
  // Net
  ovoCtx.strokeStyle = 'rgba(255,255,255,0.35)';
  ovoCtx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    ovoCtx.beginPath();
    ovoCtx.moveTo(hX + 4 + i * 6.8, hY + 4);
    ovoCtx.lineTo(hX + 8 + i * 5, hY + 28);
    ovoCtx.stroke();
  }
  ovoCtx.beginPath();
  ovoCtx.moveTo(hX + 4, hY + 16); ovoCtx.lineTo(hX + 38, hY + 16);
  ovoCtx.stroke();
  ovoCtx.beginPath();
  ovoCtx.moveTo(hX + 8, hY + 28); ovoCtx.lineTo(hX + 38, hY + 28);
  ovoCtx.stroke();

  // Zone markers
  const zones = [
    { x: W * 0.30, label: 'IN', color: '#22c55e' },
    { x: W * 0.50, label: 'MID', color: '#ff8c00' },
    { x: W * 0.72, label: '3PT', color: '#00d4ff' },
  ];
  zones.forEach(z => {
    ovoCtx.fillStyle = z.color + '33';
    ovoCtx.strokeStyle = z.color + '66';
    ovoCtx.lineWidth = 1;
    ovoCtx.setLineDash([5, 5]);
    ovoCtx.beginPath();
    ovoCtx.moveTo(z.x, floorY); ovoCtx.lineTo(z.x, floorY + H * 0.04);
    ovoCtx.stroke();
    ovoCtx.setLineDash([]);
    ovoCtx.fillStyle = z.color;
    ovoCtx.font = 'bold 10px sans-serif';
    ovoCtx.textAlign = 'center';
    ovoCtx.fillText(z.label, z.x, floorY + H * 0.07);
  });

  // Players
  drawOVOPlayer(W * 0.63, floorY - 30, window.getActivePlayer(), true);
  drawOVOPlayer(W * 0.80, floorY - 30, OVO.aiPlayer, false);

  // Ball animation
  if (OVO.phase === 'animating') {
    const t = OVO.animT / OVO.animDur;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const bx = OVO.ballX + (OVO.ballTX - OVO.ballX) * ease;
    const arc = -H * 0.35 * Math.sin(Math.PI * t);
    const by = OVO.ballY + (OVO.ballTY - OVO.ballY) * ease + arc;
    ovoCtx.font = '28px sans-serif';
    ovoCtx.textAlign = 'center';
    ovoCtx.fillText('🏀', bx, by);
  }

  // Score board
  const sbW = 180, sbH = 60, sbX = W / 2 - sbW / 2, sbY = 10;
  ovoCtx.fillStyle = 'rgba(0,0,0,0.75)';
  roundRect(ovoCtx, sbX, sbY, sbW, sbH, 8);
  ovoCtx.fill();
  ovoCtx.strokeStyle = 'rgba(255,140,0,0.5)';
  ovoCtx.lineWidth = 1;
  roundRect(ovoCtx, sbX, sbY, sbW, sbH, 8);
  ovoCtx.stroke();

  ovoCtx.fillStyle = '#ff8c00';
  ovoCtx.font = 'bold 9px sans-serif';
  ovoCtx.textAlign = 'center';
  ovoCtx.fillText('YOU', sbX + sbW * 0.3, sbY + 16);
  ovoCtx.fillStyle = '#ff6666';
  ovoCtx.fillText('AI', sbX + sbW * 0.7, sbY + 16);
  ovoCtx.fillStyle = '#fff';
  ovoCtx.font = 'bold 28px sans-serif';
  ovoCtx.fillText(`${OVO.playerScore}`, sbX + sbW * 0.3, sbY + 48);
  ovoCtx.fillText(`${OVO.aiScore}`, sbX + sbW * 0.7, sbY + 48);
  ovoCtx.fillStyle = '#555';
  ovoCtx.font = 'bold 22px sans-serif';
  ovoCtx.fillText('-', sbX + sbW * 0.5, sbY + 48);

  // Win/lose overlay
  if (OVO.winner) {
    ovoCtx.fillStyle = 'rgba(0,0,0,0.6)';
    ovoCtx.fillRect(0, 0, W, H);
    ovoCtx.fillStyle = OVO.winner === 'player' ? '#ffd700' : '#ff4444';
    ovoCtx.font = `bold ${Math.floor(W / 12)}px sans-serif`;
    ovoCtx.textAlign = 'center';
    ovoCtx.fillText(OVO.winner === 'player' ? '🏆 YOU WIN!' : '😢 AI WINS', W / 2, H / 2);
  }
}

function drawOVOPlayer(x, y, player, isYou) {
  if (!ovoCtx) return;
  const color = isYou ? '#1D428A' : '#8B0000';
  const r = 22;
  ovoCtx.fillStyle = color;
  ovoCtx.beginPath();
  ovoCtx.arc(x, y - r, r, 0, Math.PI * 2);
  ovoCtx.fill();
  ovoCtx.strokeStyle = isYou ? '#ff8c00' : '#ff4444';
  ovoCtx.lineWidth = OVO.possession === (isYou ? 'player' : 'ai') ? 3 : 1;
  ovoCtx.beginPath();
  ovoCtx.arc(x, y - r, r, 0, Math.PI * 2);
  ovoCtx.stroke();

  // Body
  ovoCtx.fillStyle = color + 'aa';
  ovoCtx.fillRect(x - 14, y - r * 0.3, 28, 30);

  ovoCtx.fillStyle = '#fff';
  ovoCtx.font = 'bold 10px sans-serif';
  ovoCtx.textAlign = 'center';
  if (player) {
    ovoCtx.fillText(player.name.split('.')[0].slice(0, 6), x, y - r + 5);
    ovoCtx.fillStyle = isYou ? '#ff8c00' : '#ff9999';
    ovoCtx.font = 'bold 9px sans-serif';
    ovoCtx.fillText(player.ovr + ' OVR', x, y - r + 17);
  } else {
    ovoCtx.fillText(isYou ? 'YOU' : 'AI', x, y - r + 5);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function renderOVOControls() {
  const ctrl = document.getElementById('ovoControls');
  if (!ctrl) return;

  if (OVO.winner) {
    ctrl.innerHTML = `
    <div class="ovo-result ${OVO.winner === 'player' ? 'ovo-win' : 'ovo-lose'}">
      <div class="ovo-result-emoji">${OVO.winner === 'player' ? '🏆' : '😢'}</div>
      <div class="ovo-result-score">Final Score: YOU ${OVO.playerScore} — ${OVO.aiScore} AI</div>
      ${OVO.winner === 'player' ? '<div class="ovo-reward">🪙 +2,000 coins earned!</div>' : '<div style="color:#888;font-size:12px">Better luck next time! Train your players to improve.</div>'}
      <div class="ovo-result-btns">
        <button class="btn btn-primary" onclick="resetOVO()" style="min-width:0;padding:10px 24px;font-size:13px">PLAY AGAIN</button>
        <button class="btn btn-secondary" onclick="exitOVO()" style="min-width:0;padding:10px 24px;font-size:13px">MAIN MENU</button>
      </div>
    </div>`;
    return;
  }

  if (OVO.phase === 'choosing' && OVO.possession === 'player') {
    const myPlayer = window.getActivePlayer();
    const sht = myPlayer ? window.getEffectiveStat(myPlayer.id, 'sht') : 70;
    ctrl.innerHTML = `
    <div class="ovo-choose-label">🏀 YOUR TURN — Pick a shot zone</div>
    <div class="ovo-player-tip">Your shooting: <strong>${sht}</strong> | AI defense: <strong>${OVO.aiPlayer?.stats?.def || 75}</strong></div>
    <div class="ovo-zones">
      <button class="ovo-zone-btn zone-inside" onclick="ovoChooseZone('inside')">
        <span class="zone-icon">🏀</span><span class="zone-name">INSIDE</span><span class="zone-pts">2 pts</span><span class="zone-rate">High %</span>
      </button>
      <button class="ovo-zone-btn zone-mid" onclick="ovoChooseZone('mid')">
        <span class="zone-icon">🎯</span><span class="zone-name">MID-RANGE</span><span class="zone-pts">2 pts</span><span class="zone-rate">Medium %</span>
      </button>
      <button class="ovo-zone-btn zone-three" onclick="ovoChooseZone('three')">
        <span class="zone-icon">⭐</span><span class="zone-name">THREE-POINT</span><span class="zone-pts">3 pts</span><span class="zone-rate">Lower %</span>
      </button>
    </div>`;
  } else if (OVO.phase === 'timing') {
    const myPlayer = window.getActivePlayer();
    const sht = myPlayer ? window.getEffectiveStat(myPlayer.id, 'sht') : 70;
    const greenWidth = Math.max(15, Math.round(sht / 4));
    ctrl.innerHTML = `
    <div class="ovo-timing-label">⏱️ Click <strong>SHOOT</strong> when the bar is in the green zone!</div>
    <div class="ovo-timing-hint">Higher shooting stat = wider green zone (yours: ${sht})</div>
    <div class="ovo-timing-wrap">
      <div class="ovo-timing-track">
        <div class="ovo-timing-green" style="width:${greenWidth}%;left:${50 - greenWidth / 2}%"></div>
        <div class="ovo-timing-marker" id="ovoTimingMarker"></div>
      </div>
      <button class="btn btn-primary ovo-shoot-btn" onclick="ovoShoot()">🏀 SHOOT!</button>
    </div>`;
    requestAnimationFrame(tickOVOMarker);
  } else {
    ctrl.innerHTML = `
    <div class="ovo-waiting">
      <div class="ovo-waiting-dot"></div>
      ${OVO.possession === 'ai' ? '🤖 AI is taking their shot...' : '⏳ Processing...'}
    </div>`;
  }
}

function tickOVOMarker() {
  const el = document.getElementById('ovoTimingMarker');
  if (el && OVO.phase === 'timing') {
    el.style.left = OVO.timingVal + '%';
    requestAnimationFrame(tickOVOMarker);
  }
}

function updateOVOTimingBar() { /* marker updated by tickOVOMarker */ }

window.ovoChooseZone = function(zone) {
  if (OVO.phase !== 'choosing' || OVO.possession !== 'player') return;
  OVO.chosenZone = zone;
  OVO.phase = 'timing';
  OVO.timingVal = 50; OVO.timingDir = 1;
  OVO.timingSpeed = zone === 'inside' ? 1.4 : zone === 'mid' ? 2.0 : 2.8;
  renderOVOControls();
};

window.ovoShoot = function() {
  if (OVO.phase !== 'timing') return;
  const myPlayer = window.getActivePlayer();
  const sht = myPlayer ? window.getEffectiveStat(myPlayer.id, 'sht') : 70;
  const aiDef = OVO.aiPlayer?.stats?.def || 75;
  const greenW = Math.max(15, Math.round(sht / 4));
  const greenL = 50 - greenW / 2;
  const inGreen = OVO.timingVal >= greenL && OVO.timingVal <= greenL + greenW;
  const timingAcc = inGreen ? 1.0 : Math.max(0, 1 - Math.abs(OVO.timingVal - 50) / 50);

  const zoneBase = { inside: 0.72, mid: 0.52, three: 0.38 }[OVO.chosenZone] || 0.5;
  const shotChance = zoneBase * (0.5 + timingAcc * 0.5) * (sht / 80) * (80 / aiDef);
  OVO.ballIn = Math.random() < shotChance;

  if (!ovoCanvas) return;
  const W = ovoCanvas.width, H = ovoCanvas.height;
  const zoneX = { inside: W * 0.30, mid: W * 0.50, three: W * 0.72 }[OVO.chosenZone];
  OVO.ballX = zoneX; OVO.ballY = H * 0.62;
  OVO.ballTX = W * 0.17; OVO.ballTY = H * 0.42;
  OVO.animT = 0; OVO.animDur = 55;
  OVO.phase = 'animating';
  renderOVOControls();
};

function resolveOVOShot() {
  const pts = { inside: 2, mid: 2, three: 3 }[OVO.chosenZone] || 2;
  if (OVO.possession === 'player') {
    if (OVO.ballIn) OVO.playerScore += pts;
    OVO.possession = 'ai';
    OVO.phase = 'choosing';
    if (OVO.playerScore >= 21 && OVO.playerScore - OVO.aiScore >= 2) { endOVO('player'); return; }
    renderOVOControls();
    setTimeout(aiOVOShot, 1300);
  } else {
    if (OVO.ballIn) OVO.aiScore += pts;
    OVO.possession = 'player';
    OVO.round++;
    OVO.phase = 'choosing';
    if (OVO.aiScore >= 21 && OVO.aiScore - OVO.playerScore >= 2) { endOVO('ai'); return; }
    if (OVO.round >= OVO.maxRounds) { endOVO(OVO.playerScore >= OVO.aiScore ? 'player' : 'ai'); return; }
    renderOVOControls();
  }
}

function aiOVOShot() {
  if (!ovoCanvas) return;
  const aiSht = OVO.aiPlayer?.stats?.sht || 75;
  const myPlayer = window.getActivePlayer();
  const myDef = myPlayer ? window.getEffectiveStat(myPlayer.id, 'def') : 75;
  const roll = Math.random();
  OVO.chosenZone = roll < 0.4 ? 'inside' : roll < 0.75 ? 'mid' : 'three';
  const zoneBase = { inside: 0.72, mid: 0.52, three: 0.38 }[OVO.chosenZone];
  OVO.ballIn = Math.random() < zoneBase * (aiSht / 80) * (80 / myDef);

  const W = ovoCanvas.width, H = ovoCanvas.height;
  OVO.ballX = W * 0.82; OVO.ballY = H * 0.62;
  OVO.ballTX = W * 0.17; OVO.ballTY = H * 0.42;
  OVO.animT = 0; OVO.animDur = 55;
  OVO.phase = 'animating';
}

function endOVO(winner) {
  OVO.winner = winner;
  OVO.phase = 'result';
  cancelAnimationFrame(ovoAnimId);
  drawOVOCourt();
  if (winner === 'player') {
    window.addCoins(2000);
    updateCoinsDisplay();
    if (window.trackDailyProgress) window.trackDailyProgress('ovoWins', 1);
  }
  renderOVOControls();
}

// ===== TOURNAMENT =====
const TOURNEY = {
  bracket: [], round: 0, active: false, results: [],
  prizes: { 4: [0, 3000, 8000], 8: [0, 3000, 7000, 18000] },
  size: 4,
};

const AI_TEAMS = [
  { name: 'Lake Warriors',    ovr: 88, color: '#1D428A' },
  { name: 'Heat Kings',       ovr: 84, color: '#98002E' },
  { name: 'Bulls Legacy',     ovr: 91, color: '#CE1141' },
  { name: 'Thunder Pack',     ovr: 86, color: '#007AC1' },
  { name: 'Celtic Pride',     ovr: 90, color: '#007A33' },
  { name: 'Splash Bros',      ovr: 89, color: '#1D428A' },
  { name: 'Clutch City',      ovr: 83, color: '#CE1141' },
  { name: 'Greek Freaks',     ovr: 87, color: '#00471B' },
  { name: 'Knick Nation',     ovr: 82, color: '#006BB6' },
  { name: 'Desert Phoenix',   ovr: 85, color: '#1D1160' },
  { name: 'Lakeshow II',      ovr: 93, color: '#552583' },
  { name: 'Jazz Cats',        ovr: 80, color: '#002B5C' },
  { name: 'Bay Thunder',      ovr: 87, color: '#FFC72C' },
  { name: 'River Hawks',      ovr: 81, color: '#CE1141' },
];

function getSquadOVR() {
  const players = ['PG','SG','SF','PF','C'].map(pos => {
    const id = PS.squad[pos];
    return id ? PLAYER_DB.find(p => p.id === id) : null;
  }).filter(Boolean);
  if (!players.length) return 70;
  return Math.round(players.reduce((a, p) => a + p.ovr, 0) / players.length);
}

window.startTournament = function(size) {
  const shuffled = [...AI_TEAMS].sort(() => Math.random() - 0.5).slice(0, size - 1);
  const myOVR = getSquadOVR();
  const yourTeam = { name: 'YOUR SQUAD', ovr: myOVR, color: '#ff8c00', isPlayer: true };
  TOURNEY.bracket = [...shuffled, yourTeam].sort(() => Math.random() - 0.5);
  TOURNEY.round = 0; TOURNEY.active = true; TOURNEY.results = []; TOURNEY.size = size;
  renderTournamentScreen();
};

window.playTourneyRound = function() {
  const teams = TOURNEY.bracket;
  const next = [], results = [];
  for (let i = 0; i < teams.length; i += 2) {
    const t1 = teams[i], t2 = teams[i + 1];
    if (!t1 || !t2) { next.push(t1 || t2); continue; }
    const ovr1 = t1.ovr + (Math.random() - 0.5) * 18;
    const ovr2 = t2.ovr + (Math.random() - 0.5) * 18;
    const winner = ovr1 > ovr2 ? t1 : t2;
    const loser  = ovr1 > ovr2 ? t2 : t1;
    const s1 = Math.floor(85 + Math.random() * 25);
    const s2 = Math.floor(65 + Math.random() * 25);
    results.push({ winner, loser, s1, s2 });
    next.push(winner);
  }
  TOURNEY.results = results;
  TOURNEY.bracket = next;
  TOURNEY.round++;
  renderTournamentScreen();

  if (next.length === 1) {
    const champ = next[0];
    if (champ.isPlayer) {
      const prizes = TOURNEY.prizes[TOURNEY.size] || [0, 5000, 15000];
      const prize = prizes[Math.min(TOURNEY.round, prizes.length - 1)];
      window.addCoins(prize);
      updateCoinsDisplay();
      if (window.trackDailyProgress) window.trackDailyProgress('tourneyWins', 1);
    }
  }
};

function renderTournamentScreen() {
  const container = document.getElementById('tournamentContent');
  if (!container) return;
  if (!TOURNEY.active) {
    container.innerHTML = `
    <div class="tourney-start">
      <div class="tourney-logo">🏆</div>
      <h3 class="tourney-title">TOURNAMENT MODE</h3>
      <p class="tourney-sub">Lead your squad through a knockout bracket and claim the trophy!</p>
      <div class="tourney-your-ovr">Your Squad OVR: <span>${getSquadOVR()}</span></div>
      <div class="tourney-formats">
        <div class="tf-card" onclick="startTournament(4)">
          <div class="tf-icon">⚡</div>
          <div class="tf-name">Quick Cup</div>
          <div class="tf-detail">4 Teams · 2 Rounds</div>
          <div class="tf-prize">🪙 Up to 8,000</div>
        </div>
        <div class="tf-card" onclick="startTournament(8)">
          <div class="tf-icon">🏆</div>
          <div class="tf-name">Championship</div>
          <div class="tf-detail">8 Teams · 3 Rounds</div>
          <div class="tf-prize">🪙 Up to 18,000</div>
        </div>
      </div>
    </div>`;
    return;
  }

  const playerIn = TOURNEY.bracket.some(t => t?.isPlayer);
  const roundLabels = ['Round of 8','Quarter-Final','Semi-Final','FINAL','CHAMPION'];
  const rLabel = roundLabels[Math.min(TOURNEY.round, roundLabels.length - 1)];

  let html = `<div class="tourney-active-wrap">`;
  html += `<div class="tourney-round-badge">${rLabel}</div>`;

  // Results
  if (TOURNEY.results.length) {
    html += `<div class="tourney-results-title">Match Results</div><div class="tourney-results">`;
    TOURNEY.results.forEach(r => {
      const pMatch = r.winner.isPlayer || r.loser.isPlayer;
      html += `
      <div class="match-result ${pMatch ? 'match-player' : ''}">
        <span class="${r.winner.isPlayer ? 'mw' : ''}" style="color:${r.winner.color}">${r.winner.name}</span>
        <span class="match-score-txt">${r.s1} – ${r.s2}</span>
        <span class="${r.loser.isPlayer ? 'ml' : ''}" style="color:${r.loser.color};opacity:0.45">${r.loser.name}</span>
      </div>`;
    });
    html += `</div>`;
  }

  // Final result
  if (TOURNEY.bracket.length === 1) {
    const c = TOURNEY.bracket[0];
    const prizes = TOURNEY.prizes[TOURNEY.size] || [0, 5000, 15000];
    const prize = prizes[Math.min(TOURNEY.round, prizes.length - 1)];
    html += `
    <div class="tourney-champ ${c.isPlayer ? 'tc-win' : 'tc-lose'}">
      <div class="tc-emoji">${c.isPlayer ? '🏆' : '😢'}</div>
      <div class="tc-title">${c.isPlayer ? 'CHAMPION!' : 'DEFEATED'}</div>
      <div class="tc-team" style="color:${c.color}">${c.name}</div>
      ${c.isPlayer ? `<div class="tc-prize">🪙 ${fmtCoins(prize)} coins earned!</div>` : `<div class="tc-sub">Train your squad and try again!</div>`}
    </div>
    <button class="btn btn-primary" onclick="TOURNEY.active=false;renderTournamentScreen();" style="min-width:0;padding:10px 24px;margin-top:12px">NEW TOURNAMENT</button>`;
  } else if (!playerIn) {
    html += `
    <div class="tourney-champ tc-lose">
      <div class="tc-emoji">😢</div>
      <div class="tc-title">ELIMINATED</div>
      <div class="tc-sub">Your squad was knocked out. Train harder!</div>
    </div>
    <button class="btn btn-secondary" onclick="TOURNEY.active=false;renderTournamentScreen();" style="min-width:0;padding:10px 24px;margin-top:12px">TRY AGAIN</button>`;
  } else {
    // Next bracket
    html += `<div class="tourney-next-title">Upcoming Matches</div><div class="tourney-bracket">`;
    for (let i = 0; i < TOURNEY.bracket.length; i += 2) {
      const t1 = TOURNEY.bracket[i], t2 = TOURNEY.bracket[i + 1];
      if (t1 && t2) {
        const pMatch = t1.isPlayer || t2.isPlayer;
        html += `
        <div class="bracket-match ${pMatch ? 'bm-player' : ''}">
          <div class="bm-team ${t1.isPlayer ? 'bm-you' : ''}" style="border-color:${t1.color}55">
            <span style="color:${t1.color}">${t1.name}</span><span class="bm-ovr">${t1.ovr} OVR</span>
          </div>
          <div class="vs-badge">VS</div>
          <div class="bm-team ${t2.isPlayer ? 'bm-you' : ''}" style="border-color:${t2.color}55">
            <span style="color:${t2.color}">${t2.name}</span><span class="bm-ovr">${t2.ovr} OVR</span>
          </div>
        </div>`;
      }
    }
    html += `</div>
    <button class="btn btn-primary" onclick="playTourneyRound()" style="min-width:0;padding:12px 32px;font-size:14px;margin-top:16px">▶ PLAY ROUND</button>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// ===== ICON STORE (Special Cards) =====
const ICON_PLAYERS = [
  { id:'ico_mj',     base:'mj',     name:'ICON Jordan',   ovr:99, boostedStats:{sht:99,spd:99,drb:99,def:99,phy:95}, extraTrait:'bank_king',   cost:200000 },
  { id:'ico_lebron', base:'lebron', name:'ICON LeBron',   ovr:99, boostedStats:{sht:96,spd:95,drb:99,def:96,phy:99}, extraTrait:'wind_proof',  cost:180000 },
  { id:'ico_kobe',   base:'kobe',   name:'ICON Kobe',     ovr:98, boostedStats:{sht:99,spd:97,drb:99,def:96,phy:92}, extraTrait:'magic_touch', cost:175000 },
  { id:'ico_curry',  base:'curry',  name:'ICON Curry',    ovr:97, boostedStats:{sht:99,spd:96,drb:97,def:86,phy:86}, extraTrait:'bank_king',   cost:160000 },
  { id:'ico_giannis',base:'giannis',name:'ICON Giannis',  ovr:98, boostedStats:{sht:88,spd:99,drb:98,def:99,phy:99}, extraTrait:'glass_cleaner',cost:165000 },
];

function renderIconStore() {
  const container = document.getElementById('iconStoreContent');
  if (!container) return;

  let html = `
  <div class="icon-store-header">
    <p class="icon-store-desc">Exclusive ICON cards — maximum boosted stats + bonus trait. The pinnacle of player cards!</p>
  </div>
  <div class="icon-cards-grid">`;

  ICON_PLAYERS.forEach(ic => {
    const base = PLAYER_DB.find(p => p.id === ic.base);
    if (!base) return;
    const owned = PS.collection.includes(ic.id);
    const canAfford = window.getCoins() >= ic.cost;
    const et = TRAITS[ic.extraTrait];
    const initials = base.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    html += `
    <div class="icon-card-outer ${owned ? 'ico-owned' : ''}">
      <div class="ico-badge">⭐ ICON CARD</div>
      <div class="pcard rarity-legend" style="--card-color:#ffd700;--card-glow:rgba(255,215,0,0.9);width:155px;min-height:235px;margin:0 auto">
        <div class="pcard-header">
          <span class="pcard-ovr" style="color:#ffd700;font-size:26px">${ic.ovr}</span>
          <span class="pcard-pos" style="background:#ffd700;color:#000">${base.pos}</span>
          <span class="pcard-rarity" style="color:#ffd700">ICON</span>
        </div>
        <div class="pcard-avatar" style="background:${base.color}33;border-color:#ffd70088">
          <span class="pcard-initials" style="color:#ffd700;font-size:26px">${initials}</span>
          <span class="pcard-nat">${base.nat}</span>
        </div>
        <div class="pcard-name" style="color:#ffd700;font-size:13px">${ic.name}</div>
        <div class="pcard-team">${base.team}</div>
        <div class="pcard-stats">
          ${['sht','spd','drb','def','phy'].map(s => `<div class="pstat"><span class="pstat-val" style="color:#ffd700">${ic.boostedStats[s]}</span><span class="pstat-lbl">${s.toUpperCase()}</span></div>`).join('')}
        </div>
        <div class="pcard-traits">
          ${[...base.traits.slice(0,2), ic.extraTrait].map(t => TRAITS[t] ? `<span class="ptrait" style="border-color:rgba(255,215,0,0.4);color:#ffd700">${TRAITS[t].icon}</span>` : '').join('')}
        </div>
      </div>
      <div class="ico-price">🪙 ${fmtCoins(ic.cost)}</div>
      ${et ? `<div class="ico-bonus-trait">★ Bonus: ${et.icon} ${et.label}</div>` : ''}
      <button class="btn ${owned ? 'btn-secondary' : canAfford ? 'btn-primary' : 'btn-secondary'} ico-buy-btn"
        onclick="${owned ? '' : `buyIconCard('${ic.id}')`}"
        ${owned ? 'disabled' : ''} style="min-width:0;width:155px;padding:8px;font-size:11px">
        ${owned ? '✓ IN COLLECTION' : canAfford ? 'BUY ICON' : '🔒 NEED MORE 🪙'}
      </button>
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.buyIconCard = function(iconId) {
  const ic = ICON_PLAYERS.find(c => c.id === iconId);
  if (!ic) return;
  if (!window.spendCoins(ic.cost)) { alert('Not enough coins!'); return; }
  const base = PLAYER_DB.find(p => p.id === ic.base);
  if (!base) return;
  if (!PLAYER_DB.find(p => p.id === ic.id)) {
    PLAYER_DB.push({
      ...base, id: ic.id, name: ic.name, full: ic.name,
      ovr: ic.ovr, rarity: 'legend', stats: { ...ic.boostedStats },
      traits: [...new Set([...base.traits.slice(0, 2), ic.extraTrait])],
    });
  }
  if (!PS.collection.includes(ic.id)) PS.collection.push(ic.id);
  savePS();
  updateCoinsDisplay();
  renderIconStore();
  alert(`🌟 ${ic.name} added to your collection!`);
};

// ===== SCREEN HOOK =====
const _origShowScreenExtras = window.showScreen;
window.showScreen = function(id) {
  _origShowScreenExtras(id);
  if (id === 'trainingScreen')   { renderTrainingScreen(); updateCoinsDisplay(); }
  if (id === 'oneVoneScreen')    { initOVO(); }
  if (id === 'challengesScreen') { renderChallengesScreen(); }
  if (id === 'tournamentScreen') { renderTournamentScreen(); }
  if (id === 'iconStoreScreen')  { renderIconStore(); updateCoinsDisplay(); }
  if (id === 'squadScreen') {
    // Check squad filled challenge
    if (window.trackDailyProgress) {
      const filled = Object.values(PS.squad).filter(Boolean).length;
      if (filled === 5) window.trackDailyProgress('squadFilled', 1);
    }
  }
};

// ===== INIT =====
window.addEventListener('load', () => {
  loadTraining();
  loadDailyChallenges();
});
