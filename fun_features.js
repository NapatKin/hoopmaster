// =============================================
// FUN_FEATURES.JS — 20 New Fun Features
// =============================================

// ===== POWER-UP GLOBALS =====
window._hotHandActive      = false;
window._coinBoostActive    = false;
window._streakShieldActive = false;
window._windStopActive     = false;
window._precisionShotsLeft = 0;

// ===== HELPERS =====
function showToast(msg, color, delay) {
  setTimeout(() => {
    const t = document.createElement('div');
    t.className = 'career-toast';
    if (color) { t.style.borderColor = color; t.style.color = color; }
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }, delay || 0);
}

function todayKey() { return new Date().toDateString(); }
function weekKey() {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toDateString();
}

// ===== FEATURE 1: ACHIEVEMENTS SCREEN =====
window.renderAchievementsScreen = function() {
  const container = document.getElementById('achievementsContent');
  if (!container) return;
  const earned = JSON.parse(localStorage.getItem('hm_achievements') || '[]');
  const total = ACHIEVEMENTS.length;
  const count = earned.length;

  let html = `
  <div class="ach-header">
    <div class="ach-count">${count}/${total} Achievements Unlocked</div>
    <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${(count/total)*100}%"></div></div>
    <div class="ach-gems-note">💎 Each achievement awards 1 gem</div>
  </div>
  <div class="ach-grid">`;

  ACHIEVEMENTS.forEach(a => {
    const done = earned.includes(a.id);
    html += `
    <div class="ach-card ${done ? 'ach-done' : 'ach-locked'}">
      <div class="ach-icon">${done ? a.icon : '🔒'}</div>
      <div class="ach-info">
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>
      ${done ? '<div class="ach-badge">✓ DONE</div>' : ''}
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
};

// ===== FEATURE 2: PLAYER FUSION LAB =====
let fusionSelected = [];
window.fusionSelected = fusionSelected;

window.renderFusionScreen = function() {
  const container = document.getElementById('fusionContent');
  if (!container) return;
  const rarityOrder = ['bronze','silver','gold','elite','legend'];
  const nextRarity = { bronze:'silver', silver:'gold', gold:'elite', elite:'legend' };

  const allPlayers = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean)
    .filter(p => !p.id.startsWith('ico_') && p.rarity !== 'legend')
    .sort((a,b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) || b.ovr - a.ovr);

  // Count players per rarity
  const rarityCounts = {};
  allPlayers.forEach(p => { rarityCounts[p.rarity] = (rarityCounts[p.rarity] || 0) + 1; });

  let html = `
  <div class="fusion-header">
    <h3 class="fusion-title">⚗️ FUSION LAB</h3>
    <p class="fusion-desc">Sacrifice 3 players of the same rarity to gain 1 random player of higher rarity!</p>
    <div class="fusion-counts">`;
  ['bronze','silver','gold','elite'].forEach(r => {
    const cnt = rarityCounts[r] || 0;
    const nr = nextRarity[r];
    const rCfg = RARITY[r];
    html += `
    <div class="fusion-rarity-row">
      <span class="fus-rarity-label" style="color:${rCfg.textColor}">${rCfg.label}</span>
      <span class="fus-rarity-count">(${cnt} owned)</span>
      <button class="btn ${cnt >= 3 ? 'btn-primary' : 'btn-secondary'} fus-btn"
        onclick="doFusion('${r}')" ${cnt < 3 ? 'disabled' : ''}
        style="padding:6px 14px;font-size:11px;min-width:0">
        ${cnt >= 3 ? `⚗️ Fuse 3 → 1 ${RARITY[nr]?.label}` : `Need ${3-cnt} more`}
      </button>
    </div>`;
  });
  html += `</div></div>`;

  html += `<div class="trade-section">
    <h3 class="fusion-title" style="font-size:16px;margin:16px 0 8px">🔄 TRADE-IN (5→1 upgrade)</h3>
    <p class="fusion-desc" style="font-size:11px;margin-bottom:12px">Trade 5 players of same rarity → 1 guaranteed higher rarity!</p>
    <div class="fusion-counts">`;
  ['bronze','silver','gold','elite'].forEach(r => {
    const cnt = rarityCounts[r] || 0;
    const nr = nextRarity[r];
    const rCfg = RARITY[r];
    html += `
    <div class="fusion-rarity-row">
      <span class="fus-rarity-label" style="color:${rCfg.textColor}">${rCfg.label}</span>
      <span class="fus-rarity-count">(${cnt} owned)</span>
      <button class="btn ${cnt >= 5 ? 'btn-primary' : 'btn-secondary'} fus-btn"
        onclick="doTradeIn('${r}')" ${cnt < 5 ? 'disabled' : ''}
        style="padding:6px 14px;font-size:11px;min-width:0;background:${cnt>=5?'linear-gradient(135deg,#00d4ff,#0080ff)':''}">
        ${cnt >= 5 ? `🔄 Trade 5 → 1 ${RARITY[nr]?.label}` : `Need ${5-cnt} more`}
      </button>
    </div>`;
  });
  html += `</div></div>`;
  container.innerHTML = html;
};

window.doFusion = function(rarity) {
  const nextRarity = { bronze:'silver', silver:'gold', gold:'elite', elite:'legend' };
  const nr = nextRarity[rarity];
  if (!nr) return;
  const candidates = PS.collection.filter(id => {
    const p = PLAYER_DB.find(pl => pl.id === id);
    return p && p.rarity === rarity && !id.startsWith('ico_');
  });
  if (candidates.length < 3) { alert('Need 3 players of this rarity!'); return; }
  if (!confirm(`Fuse 3 ${RARITY[rarity].label} players → 1 ${RARITY[nr].label}? This cannot be undone!`)) return;
  for (let i = 0; i < 3; i++) PS.collection.splice(PS.collection.indexOf(candidates[i]), 1);
  const higherPool = PLAYER_DB.filter(p => p.rarity === nr && !p.id.startsWith('ico_'));
  const result = higherPool[Math.floor(Math.random() * higherPool.length)];
  if (result && !PS.collection.includes(result.id)) PS.collection.push(result.id);
  savePS();
  checkCollectionMilestones();
  updateCoinsDisplay();
  showToast(`⚗️ Fusion! Got ${result ? result.name : 'a '+nr+' player'}!`, '#a855f7');
  window.renderFusionScreen();
};

window.doTradeIn = function(rarity) {
  const nextRarity = { bronze:'silver', silver:'gold', gold:'elite', elite:'legend' };
  const nr = nextRarity[rarity];
  if (!nr) return;
  const candidates = PS.collection.filter(id => {
    const p = PLAYER_DB.find(pl => pl.id === id);
    return p && p.rarity === rarity && !id.startsWith('ico_');
  });
  if (candidates.length < 5) { alert('Need 5 players of this rarity!'); return; }
  if (!confirm(`Trade 5 ${RARITY[rarity].label} players → 1 guaranteed ${RARITY[nr].label}? This cannot be undone!`)) return;
  for (let i = 0; i < 5; i++) PS.collection.splice(PS.collection.indexOf(candidates[i]), 1);
  const higherPool = PLAYER_DB.filter(p => p.rarity === nr && !p.id.startsWith('ico_'));
  const result = higherPool[Math.floor(Math.random() * higherPool.length)];
  if (result && !PS.collection.includes(result.id)) PS.collection.push(result.id);
  savePS();
  checkCollectionMilestones();
  updateCoinsDisplay();
  showToast(`🔄 Trade-In! Got ${result ? result.name : 'a '+nr+' player'}!`, '#00d4ff');
  window.renderFusionScreen();
};

// ===== FEATURE 3: TROPHY ROOM =====
window.renderTrophyRoom = function() {
  const container = document.getElementById('trophyContent');
  if (!container) return;

  const earned = JSON.parse(localStorage.getItem('hm_achievements') || '[]');
  const mgrWins = (JSON.parse(localStorage.getItem('mgrState') || '{}')).wins || 0;
  const tournWins = parseInt(localStorage.getItem('hm_tourneyWins') || '0');
  const careerSeasons = (JSON.parse(localStorage.getItem('careerState') || '{}')).careerStats?.seasons || 0;
  const loginStreak = parseInt(localStorage.getItem('hm_loginStreak') || '0');
  const ls = getLifetimeStats();

  // Top 5 players
  const top5 = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean)
    .sort((a,b) => b.ovr - a.ovr).slice(0, 5);

  let html = `
  <div class="trophy-grid">
    <div class="trophy-card">
      <div class="trophy-icon">🏆</div>
      <div class="trophy-val">${tournWins}</div>
      <div class="trophy-lbl">Tournament Wins</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">🏅</div>
      <div class="trophy-val">${earned.length}</div>
      <div class="trophy-lbl">Achievements</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">🏟️</div>
      <div class="trophy-val">${mgrWins}</div>
      <div class="trophy-lbl">Manager Wins</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">📚</div>
      <div class="trophy-val">${PS.collection.length}</div>
      <div class="trophy-lbl">Cards Collected</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">🔥</div>
      <div class="trophy-val">${loginStreak}</div>
      <div class="trophy-lbl">Login Streak</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">🎯</div>
      <div class="trophy-val">${ls.totalMade}</div>
      <div class="trophy-lbl">Total Baskets Made</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">🌐</div>
      <div class="trophy-val">${ls.totalThreePointers}</div>
      <div class="trophy-lbl">3-Pointers</div>
    </div>
    <div class="trophy-card">
      <div class="trophy-icon">🏀</div>
      <div class="trophy-val">${ls.gamesPlayed}</div>
      <div class="trophy-lbl">Games Played</div>
    </div>
  </div>
  <h3 class="section-title" style="font-size:18px;margin:20px 0 12px;letter-spacing:3px">⭐ HALL OF FAME</h3>
  <div class="hof-grid">`;

  top5.forEach((p, i) => {
    const r = RARITY[p.rarity];
    const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    html += `
    <div class="hof-card" style="border-color:${r.color}55;background:${r.bg}">
      <div class="hof-rank">#${i+1}</div>
      <div class="hof-initials" style="color:${r.color}">${initials}</div>
      <div class="hof-name" style="color:${r.textColor}">${p.name}</div>
      <div class="hof-ovr" style="color:${r.color}">${p.ovr} OVR</div>
      <div class="hof-team">${p.team}</div>
    </div>`;
  });
  if (!top5.length) html += `<p style="color:#555;padding:20px">No players in collection yet!</p>`;
  html += `</div>`;
  container.innerHTML = html;
};

// ===== FEATURE 4: LIFETIME STATS =====
function getLifetimeStats() {
  return JSON.parse(localStorage.getItem('hm_lifetimeStats') || JSON.stringify({
    gamesPlayed:0, totalShots:0, totalMade:0, totalThreePointers:0, totalScore:0,
    bestStreak:0, bestByMode:{}
  }));
}
function saveLifetimeStats(s) { localStorage.setItem('hm_lifetimeStats', JSON.stringify(s)); }

window.renderStatsScreen = function() {
  const container = document.getElementById('statsContent');
  if (!container) return;
  const s = getLifetimeStats();
  const acc = s.totalShots > 0 ? Math.round((s.totalMade / s.totalShots) * 100) : 0;
  const xp = getXPState();

  let html = `
  <div class="stats-header">
    <div class="xp-level-bar">
      <div class="xp-level-badge">LVL ${xp.level}</div>
      <div class="xp-bar-wrap">
        <div class="xp-bar-fill" style="width:${xpPct(xp)}%"></div>
      </div>
      <div class="xp-label">${xp.xp} / ${xpForLevel(xp.level + 1)} XP</div>
    </div>
  </div>
  <div class="stats-grid">
    <div class="stat-tile"><div class="st-num">${s.gamesPlayed}</div><div class="st-lbl">Games Played</div></div>
    <div class="stat-tile"><div class="st-num">${s.totalScore.toLocaleString()}</div><div class="st-lbl">Total Score</div></div>
    <div class="stat-tile"><div class="st-num">${s.totalMade.toLocaleString()}</div><div class="st-lbl">Baskets Made</div></div>
    <div class="stat-tile"><div class="st-num">${acc}%</div><div class="st-lbl">Lifetime Accuracy</div></div>
    <div class="stat-tile"><div class="st-num">${s.totalThreePointers.toLocaleString()}</div><div class="st-lbl">3-Pointers</div></div>
    <div class="stat-tile"><div class="st-num">${s.bestStreak}</div><div class="st-lbl">Best Streak</div></div>
  </div>
  <h3 class="upgrade-title" style="margin:16px 0 8px">Best Score Per Mode</h3>
  <div class="stats-modes">`;
  const modes = [
    { key:'classic', label:'Classic', icon:'🏀' },
    { key:'timeAttack', label:'Time Attack', icon:'⏱️' },
    { key:'threePoint', label:'3-Point', icon:'🎯' },
    { key:'challenge', label:'Survival', icon:'🔥' },
    { key:'gauntlet', label:'Gauntlet', icon:'⚔️' },
    { key:'rapidFire', label:'Rapid Fire', icon:'⚡' },
  ];
  modes.forEach(m => {
    const best = s.bestByMode[m.key] || 0;
    html += `<div class="mode-stat-chip">${m.icon} ${m.label}: <strong>${best}</strong></div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
};

// ===== FEATURE 5: MYSTERY BOX (balanced) =====
window.openMysteryBox = function() {
  if (!window.spendCoins(5000)) { alert('Need 🪙5,000 coins to open a Mystery Box!'); return; }
  const roll = Math.random();
  let reward = '', emoji = '🎁';
  if (roll < 0.22) {
    // Nothing — house wins
    reward = 'Nothing... better luck next time!';
    emoji = '🪨';
  } else if (roll < 0.52) {
    // Small coins back (loss/break even)
    const coins = 1000 + Math.floor(Math.random() * 3000);
    window.addCoins(coins);
    reward = `🪙 ${coins.toLocaleString()} coins`;
    emoji = '🪙';
  } else if (roll < 0.72) {
    // Medium coins (slight win)
    const coins = 5000 + Math.floor(Math.random() * 5000);
    window.addCoins(coins);
    reward = `🪙 ${coins.toLocaleString()} coins!`;
    emoji = '💰';
  } else if (roll < 0.85) {
    // 1 gem
    window.addGems(1);
    reward = '💎 1 gem!';
    emoji = '💎';
  } else if (roll < 0.96) {
    // Random silver or gold player
    const pool = PLAYER_DB.filter(p => (p.rarity === 'silver' || p.rarity === 'gold') && !p.id.startsWith('ico_'));
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (p && !PS.collection.includes(p.id)) PS.collection.push(p.id);
    savePS(); checkCollectionMilestones();
    reward = `🌟 ${p ? p.name : 'a player card'}!`;
    emoji = '🌟';
  } else {
    // Jackpot — 2 gems + random gold player
    window.addGems(2);
    const pool = PLAYER_DB.filter(p => p.rarity === 'gold' && !p.id.startsWith('ico_'));
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (p && !PS.collection.includes(p.id)) PS.collection.push(p.id);
    savePS(); checkCollectionMilestones();
    reward = `💎💎 2 gems + ${p ? p.name : 'a gold player'} JACKPOT!`;
    emoji = '🎉';
  }
  showToast(`${emoji} Mystery Box: ${reward}`, '#ffd700');
  updateCoinsDisplay();
  if (document.getElementById('mysteryBoxScreen')?.classList.contains('active')) renderMysteryBoxScreen();
};

function renderMysteryBoxScreen() {
  const container = document.getElementById('mysteryBoxContent');
  if (!container) return;
  const coins = window.getCoins();
  const canAfford = coins >= 5000;
  container.innerHTML = `
  <div class="mystery-box-wrap">
    <div class="mystery-box-visual">
      <div class="mb-box-anim">🎁</div>
      <h3 class="mb-title">MYSTERY BOX</h3>
      <p class="mb-desc">Spend 🪙5,000 — could be great, could be nothing!</p>
      <div class="mb-odds">
        <div class="mb-odd-row"><span style="color:#666">🪨</span> <span style="color:#888">Nothing (22%)</span></div>
        <div class="mb-odd-row"><span>🪙</span> 1,000–4,000 coins (30%)</div>
        <div class="mb-odd-row"><span>💰</span> 5,000–10,000 coins (20%)</div>
        <div class="mb-odd-row"><span>💎</span> 1 gem (13%)</div>
        <div class="mb-odd-row"><span>🌟</span> Silver/Gold player card (11%)</div>
        <div class="mb-odd-row"><span style="color:#ffd700">🎉</span> <span style="color:#ffd700">JACKPOT: 2 gems + gold player (4%)</span></div>
      </div>
      <button class="btn ${canAfford ? 'btn-primary' : 'btn-secondary'}" onclick="openMysteryBox()"
        ${canAfford ? '' : 'disabled'} style="margin-top:20px">
        ${canAfford ? '🎁 OPEN BOX (🪙5,000)' : 'Need 🪙5,000'}
      </button>
    </div>
  </div>`;
}

// ===== FEATURE 6: FREE DAILY SPIN =====
function renderFreeDailySpin() {
  const container = document.getElementById('freeSpinContent');
  if (!container) return;
  const today = todayKey();
  const lastSpin = localStorage.getItem('hm_freeSpin_date') || '';
  const claimed = lastSpin === today;

  const prizes = [
    { label:'🪙 2,000', color:'#ff8c00' }, { label:'🪙 5,000', color:'#ffd700' },
    { label:'💎 1 Gem', color:'#00d4ff' }, { label:'🪙 1,000', color:'#888' },
    { label:'🪙 10,000', color:'#ff4444' }, { label:'💎 2 Gems', color:'#a855f7' },
    { label:'🪙 500', color:'#666' }, { label:'🪙 3,000', color:'#ff8c00' },
  ];

  let html = `
  <div class="free-spin-wrap">
    <h3 class="spin-title">🎰 FREE DAILY SPIN</h3>
    <p class="spin-sub">Spin once per day for FREE prizes!</p>
    <div class="spin-wheel-visual">
      <div class="spin-segments">`;
  prizes.forEach((p, i) => {
    html += `<div class="spin-seg" style="background:${p.color}22;border-color:${p.color}44;color:${p.color}">${p.label}</div>`;
  });
  html += `</div></div>
    ${claimed
      ? '<div class="spin-claimed">✓ Already spun today! Come back tomorrow.</div>'
      : `<button class="btn btn-primary" onclick="claimFreeSpin()" style="margin-top:20px">🎰 SPIN NOW (FREE)</button>`
    }
  </div>`;
  container.innerHTML = html;
}

window.claimFreeSpin = function() {
  const today = todayKey();
  if (localStorage.getItem('hm_freeSpin_date') === today) { alert('Already spun today!'); return; }
  localStorage.setItem('hm_freeSpin_date', today);
  localStorage.setItem('hm_achv_spin_done', '1');

  const prizes = [
    { label:'🪙 2,000', coins:2000 }, { label:'🪙 5,000', coins:5000 },
    { label:'💎 1 Gem', gems:1 }, { label:'🪙 1,000', coins:1000 },
    { label:'🪙 10,000', coins:10000 }, { label:'💎 2 Gems', gems:2 },
    { label:'🪙 500', coins:500 }, { label:'🪙 3,000', coins:3000 },
  ];
  const weights = [20, 15, 10, 25, 5, 5, 15, 5];
  let total = weights.reduce((a,b)=>a+b,0), r = Math.random()*total, cum=0, idx=0;
  for (let i=0; i<weights.length; i++) { cum+=weights[i]; if (r<cum){idx=i;break;} }
  const prize = prizes[idx];

  if (prize.coins) window.addCoins(prize.coins);
  if (prize.gems) window.addGems(prize.gems);
  updateCoinsDisplay();
  showToast(`🎰 FREE SPIN: ${prize.label}!`, '#ffd700');
  renderFreeDailySpin();
};

// ===== FEATURE 7: WEEKLY CHALLENGE =====
const WEEKLY_CHALLENGES = [
  { id:'w_games10', text:'Play 10 shooting games', key:'gamesPlayed', goal:10 },
  { id:'w_threes50', text:'Hit 50 three-pointers total', key:'totalThreePointers', goal:50 },
  { id:'w_coins100k', text:'Earn 100,000 coins from any source', key:'coinsEarned', goal:100000 },
  { id:'w_train15', text:'Train player stats 15 times', key:'trainSessions', goal:15 },
  { id:'w_packs5', text:'Open 5 packs', key:'packsOpened', goal:5 },
  { id:'w_tourney2', text:'Win 2 tournaments', key:'tourneyWins', goal:2 },
  { id:'w_prestige', text:'Prestige in Ball Tycoon', key:'prestige', goal:1 },
  { id:'w_squad5', text:'Fill your squad and play 5 games', key:'squadGames', goal:5 },
];

function getWeeklyChallenge() {
  const wk = weekKey();
  const saved = JSON.parse(localStorage.getItem('hm_weeklyChallenge') || 'null');
  if (saved && saved.week === wk) return saved;
  const hash = wk.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const ch = WEEKLY_CHALLENGES[hash % WEEKLY_CHALLENGES.length];
  const fresh = { week: wk, ch, progress: 0, claimed: false };
  localStorage.setItem('hm_weeklyChallenge', JSON.stringify(fresh));
  return fresh;
}

function saveWeeklyChallenge(w) { localStorage.setItem('hm_weeklyChallenge', JSON.stringify(w)); }

function renderWeeklyChallengeScreen() {
  const container = document.getElementById('weeklyChallengeContent');
  if (!container) return;
  const w = getWeeklyChallenge();
  const pct = Math.min(100, (w.progress / w.ch.goal) * 100);
  const done = w.progress >= w.ch.goal;
  const ls = getLifetimeStats();

  // Auto-update progress from lifetime stats / daily progress
  if (!w.claimed) {
    let prog = 0;
    if (w.ch.key === 'gamesPlayed') prog = ls.gamesPlayed;
    else if (w.ch.key === 'totalThreePointers') prog = ls.totalThreePointers;
    else if (w.ch.key === 'trainSessions') prog = DAILY.progress?.trainSessions || 0;
    else if (w.ch.key === 'packsOpened') prog = DAILY.progress?.packsOpened || 0;
    else if (w.ch.key === 'tourneyWins') prog = parseInt(localStorage.getItem('hm_tourneyWins')||'0');
    const wSaved = JSON.parse(localStorage.getItem('hm_weeklyChallenge')||'{}');
    wSaved.progress = Math.max(wSaved.progress||0, prog);
    saveWeeklyChallenge(wSaved);
  }

  const wFresh = getWeeklyChallenge();
  const wPct = Math.min(100, (wFresh.progress / wFresh.ch.goal) * 100);
  const wDone = wFresh.progress >= wFresh.ch.goal;

  container.innerHTML = `
  <div class="weekly-wrap">
    <div class="weekly-badge">🗓️ WEEKLY CHALLENGE</div>
    <div class="weekly-card ${wDone ? 'wc-done' : ''}">
      <div class="wc-icon">🌟</div>
      <div class="wc-info">
        <div class="wc-text">${wFresh.ch.text}</div>
        <div class="ch-prog-wrap" style="margin-top:8px">
          <div class="ch-prog-bar"><div class="ch-prog-fill" style="width:${wPct}%"></div></div>
          <span class="ch-prog-label">${Math.min(wFresh.progress, wFresh.ch.goal)} / ${wFresh.ch.goal}</span>
        </div>
      </div>
      <div class="wc-reward">
        <div style="color:#a855f7;font-size:20px">💎 3</div>
        <div style="font-size:10px;color:#888">GEMS</div>
        ${wFresh.claimed
          ? '<div class="ch-claimed-badge">✓ CLAIMED</div>'
          : wDone ? `<button class="btn-claim" onclick="claimWeeklyChallenge()">CLAIM</button>`
          : '<div class="ch-lock">🔒</div>'}
      </div>
    </div>
    <p class="weekly-resets">🔄 Resets every Monday</p>
  </div>`;
}

window.claimWeeklyChallenge = function() {
  const w = getWeeklyChallenge();
  if (w.claimed || w.progress < w.ch.goal) return;
  w.claimed = true;
  saveWeeklyChallenge(w);
  window.addGems(3);
  updateCoinsDisplay();
  showToast('🌟 Weekly Challenge Complete! +3💎', '#a855f7');
  renderWeeklyChallengeScreen();
};

// ===== FEATURE 8: DAILY TRIVIA =====
const TRIVIA_Q = [
  { q: 'How many points is a free throw worth?', opts:['1','2','3','4'], ans:0 },
  { q: 'Which player scored 100 points in a single NBA game?', opts:['Kobe Bryant','Michael Jordan','Wilt Chamberlain','LeBron James'], ans:2 },
  { q: 'How many players are on the court per team in basketball?', opts:['4','5','6','7'], ans:1 },
  { q: 'What is the shot clock duration in the NBA (seconds)?', opts:['24','30','20','35'], ans:0 },
  { q: 'Which team has won the most NBA championships?', opts:['Lakers','Bulls','Celtics','Warriors'], ans:2 },
  { q: 'What year was the NBA founded?', opts:['1946','1950','1960','1936'], ans:0 },
  { q: 'How tall is a regulation basketball hoop (feet)?', opts:['8','9','10','11'], ans:2 },
  { q: 'What does MVP stand for?', opts:['Most Valuable Player','Most Versatile Player','Master Victory Performance','Most Visible Player'], ans:0 },
  { q: 'Which country invented basketball?', opts:['USA','Canada','UK','Brazil'], ans:0 },
  { q: 'How many rings did Michael Jordan win?', opts:['4','5','6','7'], ans:2 },
];

function getDailyTrivia() {
  const today = todayKey();
  const hash = today.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  return TRIVIA_Q[hash % TRIVIA_Q.length];
}

function renderTriviaScreen() {
  const container = document.getElementById('triviaContent');
  if (!container) return;
  const today = todayKey();
  const answered = localStorage.getItem('hm_trivia_date') === today;
  const correct = localStorage.getItem('hm_trivia_result') === 'correct';
  const q = getDailyTrivia();

  if (answered) {
    container.innerHTML = `
    <div class="trivia-wrap">
      <div class="trivia-result ${correct ? 'trivia-correct' : 'trivia-wrong'}">
        ${correct ? '✅ Correct! +🪙1,500 coins earned!' : '❌ Wrong answer. Try again tomorrow!'}
      </div>
      <div class="trivia-ans">The answer was: <strong>${q.opts[q.ans]}</strong></div>
      <p style="color:#555;font-size:12px;margin-top:16px">Come back tomorrow for a new question!</p>
    </div>`;
    return;
  }

  container.innerHTML = `
  <div class="trivia-wrap">
    <div class="trivia-badge">📚 DAILY TRIVIA</div>
    <div class="trivia-question">${q.q}</div>
    <div class="trivia-opts">
      ${q.opts.map((o,i) => `<button class="trivia-opt" onclick="answerTrivia(${i})">${o}</button>`).join('')}
    </div>
    <div class="trivia-reward">Correct answer = 🪙 1,500 coins!</div>
  </div>`;
}

window.answerTrivia = function(idx) {
  const today = todayKey();
  if (localStorage.getItem('hm_trivia_date') === today) return;
  const q = getDailyTrivia();
  const correct = idx === q.ans;
  localStorage.setItem('hm_trivia_date', today);
  localStorage.setItem('hm_trivia_result', correct ? 'correct' : 'wrong');
  if (correct) { window.addCoins(1500); updateCoinsDisplay(); }
  renderTriviaScreen();
};

// ===== FEATURE 9: PLAYER OF THE DAY =====
function getPlayerOfDay() {
  const today = todayKey();
  const hash = today.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const goldElite = PLAYER_DB.filter(p => (p.rarity==='gold'||p.rarity==='elite') && !p.id.startsWith('ico_'));
  return goldElite[hash % goldElite.length];
}

function renderPlayerOfDayScreen() {
  const container = document.getElementById('playerOfDayContent');
  if (!container) return;
  const p = getPlayerOfDay();
  if (!p) { container.innerHTML = '<p>No player today.</p>'; return; }
  const r = RARITY[p.rarity];
  const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const owned = PS.collection.includes(p.id);
  const listing = PS.marketListings.find(l => l.id === p.id);
  const origPrice = listing?.price || 50000;
  const discPrice = Math.floor(origPrice * 0.75);
  const canAfford = PS.coins >= discPrice;

  container.innerHTML = `
  <div class="potd-wrap">
    <div class="potd-badge">⭐ PLAYER OF THE DAY</div>
    <p class="potd-desc">Today's featured player gets a 25% market discount!</p>
    <div class="pcard rarity-${p.rarity}" style="--card-color:${r.color};--card-glow:${r.glow};width:180px;margin:0 auto">
      <div class="pcard-header">
        <span class="pcard-ovr" style="color:${r.color}">${p.ovr}</span>
        <span class="pcard-pos" style="background:${r.color}33">${p.pos}</span>
        <span class="pcard-rarity" style="color:${r.textColor}">${r.label}</span>
      </div>
      <div class="pcard-avatar" style="background:${p.color}33;border-color:${r.color}88">
        <span class="pcard-initials" style="color:${r.color};font-size:28px">${initials}</span>
        <span class="pcard-nat">${p.nat}</span>
      </div>
      <div class="pcard-name" style="color:${r.textColor}">${p.name}</div>
      <div class="pcard-team">${p.team}</div>
      <div class="pcard-stats">
        ${['sht','spd','drb','def','phy'].map(s=>`<div class="pstat"><span class="pstat-val" style="color:${r.color}">${p.stats[s]}</span><span class="pstat-lbl">${s.toUpperCase()}</span></div>`).join('')}
      </div>
    </div>
    <div class="potd-price">
      <span style="text-decoration:line-through;color:#555">🪙${origPrice.toLocaleString()}</span>
      <span style="color:#ffd700;font-size:20px;margin-left:10px">🪙${discPrice.toLocaleString()}</span>
      <span style="color:#22c55e;font-size:11px;margin-left:6px">-25% TODAY ONLY</span>
    </div>
    <button class="btn ${owned ? 'btn-secondary' : canAfford ? 'btn-primary' : 'btn-secondary'}"
      onclick="${owned ? '' : `buyPlayerOfDay('${p.id}',${discPrice})`}"
      ${owned ? 'disabled' : ''} style="margin-top:12px">
      ${owned ? '✓ ALREADY OWNED' : canAfford ? `BUY (🪙${discPrice.toLocaleString()})` : `Need 🪙${discPrice.toLocaleString()}`}
    </button>
    <p style="color:#555;font-size:11px;margin-top:12px">🔄 Changes daily at midnight</p>
  </div>`;
}

window.buyPlayerOfDay = function(pid, price) {
  if (!window.spendCoins(price)) { alert('Not enough coins!'); return; }
  if (!PS.collection.includes(pid)) PS.collection.push(pid);
  savePS();
  checkCollectionMilestones();
  updateCoinsDisplay();
  showToast('⭐ Player of the Day added to collection!', '#ffd700');
  renderPlayerOfDayScreen();
};

// ===== SESSION 3-POINTER TRACKER =====
window._sessionThrees = 0;
const _origTrackDailyFun = window.trackDailyProgress;
window.trackDailyProgress = function(key, amount) {
  if (_origTrackDailyFun) _origTrackDailyFun(key, amount);
  if (key === 'threePointers') window._sessionThrees = (window._sessionThrees || 0) + amount;
};

// ===== FEATURE 10: XP & LEVEL SYSTEM =====
function getXPState() {
  return JSON.parse(localStorage.getItem('hm_xp') || JSON.stringify({ xp:0, level:1, claimedLevels:[] }));
}
function saveXPState(s) { localStorage.setItem('hm_xp', JSON.stringify(s)); }
function xpForLevel(lv) { return Math.floor(100 * Math.pow(1.4, lv - 1)); }
function xpPct(s) {
  const needed = xpForLevel(s.level + 1) - xpForLevel(s.level);
  const have = s.xp - xpForLevel(s.level);
  return Math.min(100, Math.max(0, (have / needed) * 100));
}

function addXP(amount) {
  const s = getXPState();
  s.xp += amount;
  while (s.level < 50 && s.xp >= xpForLevel(s.level + 1)) {
    s.level++;
    const coinsBonus = s.level % 10 === 0 ? 5000 : s.level % 5 === 0 ? 2000 : 500;
    const gemBonus = s.level % 10 === 0 ? 1 : 0;
    window.addCoins(coinsBonus);
    if (gemBonus) window.addGems(gemBonus);
    showToast(`⬆️ Level Up! Now Level ${s.level}! +🪙${coinsBonus.toLocaleString()}${gemBonus ? ' +1💎' : ''}`, '#ffd700', 800);
  }
  saveXPState(s);
}

// ===== FEATURE 11: COLLECTION MILESTONES =====
const COLL_MILESTONES = [
  { count:5,  coins:2000,  gems:0, label:'Rookie Collector' },
  { count:10, coins:5000,  gems:0, label:'Card Hunter' },
  { count:20, coins:10000, gems:1, label:'Collector' },
  { count:30, coins:20000, gems:1, label:'Card Shark' },
  { count:40, coins:30000, gems:2, label:'Elite Collector' },
  { count:50, coins:50000, gems:3, label:'Legend Collector' },
];

function checkCollectionMilestones() {
  const claimed = JSON.parse(localStorage.getItem('hm_collMilestones') || '[]');
  COLL_MILESTONES.forEach(m => {
    if (!claimed.includes(m.count) && PS.collection.length >= m.count) {
      claimed.push(m.count);
      window.addCoins(m.coins);
      if (m.gems) window.addGems(m.gems);
      showToast(`📚 ${m.label}! Owned ${m.count} players! +🪙${m.coins.toLocaleString()}${m.gems ? ` +${m.gems}💎` : ''}`, '#ffd700', 500);
    }
  });
  localStorage.setItem('hm_collMilestones', JSON.stringify(claimed));
}

// ===== FEATURE 12-13: POWER-UP SHOP =====
const POWER_UPS = [
  { id:'hotHand',      icon:'🔥', name:'Hot Hand',       desc:'Double points for 1 game',          cost:500,  key:'_hotHandActive' },
  { id:'coinBoost',    icon:'💰', name:'Coin Boost',     desc:'Double coins earned for 1 game',    cost:1000, key:'_coinBoostActive' },
  { id:'streakShield', icon:'🛡️', name:'Streak Shield',  desc:'Survive 1 miss without losing streak (Survival/Gauntlet)', cost:800, key:'_streakShieldActive' },
  { id:'windStop',     icon:'💨', name:'Wind Stop',      desc:'No wind effect for 1 game',         cost:600,  key:'_windStopActive' },
  { id:'precision',    icon:'🎯', name:'Precision Shot', desc:'Perfect accuracy for next 3 shots', cost:700,  key:'_precisionShotsLeft' },
];

function getPUInventory() {
  return JSON.parse(localStorage.getItem('hm_powerUps') || '{}');
}
function savePUInventory(inv) { localStorage.setItem('hm_powerUps', JSON.stringify(inv)); }

function renderPowerUpsScreen() {
  const container = document.getElementById('powerUpsContent');
  if (!container) return;
  const inv = getPUInventory();
  const coins = window.getCoins();

  let html = `
  <div class="pu-header">
    <p class="pu-desc">Buy power-ups to boost your next shooting game! Activates automatically when you start a game.</p>
  </div>
  <div class="pu-grid">`;

  POWER_UPS.forEach(pu => {
    const qty = inv[pu.id] || 0;
    const canAfford = coins >= pu.cost;
    html += `
    <div class="pu-card">
      <div class="pu-icon">${pu.icon}</div>
      <div class="pu-name">${pu.name}</div>
      <div class="pu-desc-text">${pu.desc}</div>
      <div class="pu-owned">Owned: <strong>${qty}</strong></div>
      <div class="pu-cost">🪙 ${pu.cost.toLocaleString()}</div>
      <button class="btn ${canAfford ? 'btn-primary' : 'btn-secondary'} pu-buy-btn"
        onclick="buyPowerUp('${pu.id}')" ${canAfford ? '' : 'disabled'}
        style="min-width:0;padding:6px 14px;font-size:11px">
        ${canAfford ? 'BUY' : 'Need More 🪙'}
      </button>
    </div>`;
  });

  // Active power-ups display
  html += `</div>
  <h3 class="upgrade-title" style="margin:16px 0 8px">⚡ ACTIVE IN NEXT GAME</h3>
  <div class="pu-active-grid">`;
  POWER_UPS.forEach(pu => {
    const qty = inv[pu.id] || 0;
    if (qty > 0) {
      html += `<div class="pu-active-chip">${pu.icon} ${pu.name} (${qty}x)</div>`;
    }
  });
  if (!POWER_UPS.some(pu => (inv[pu.id]||0) > 0)) {
    html += `<p style="color:#555;font-size:12px">No power-ups owned. Buy some above!</p>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

window.buyPowerUp = function(id) {
  const pu = POWER_UPS.find(p => p.id === id);
  if (!pu || !window.spendCoins(pu.cost)) { alert('Not enough coins!'); return; }
  const inv = getPUInventory();
  inv[id] = (inv[id] || 0) + 1;
  savePUInventory(inv);
  updateCoinsDisplay();
  showToast(`${pu.icon} ${pu.name} purchased! Will activate next game.`, '#ff8c00');
  renderPowerUpsScreen();
};

function activatePowerUpsForGame() {
  window._sessionThrees = 0;
  const inv = getPUInventory();
  window._hotHandActive = false;
  window._coinBoostActive = false;
  window._streakShieldActive = false;
  window._windStopActive = false;
  window._precisionShotsLeft = 0;

  if (inv.hotHand > 0) { window._hotHandActive = true; inv.hotHand--; showToast('🔥 Hot Hand ACTIVE! Double points this game!', '#ff8c00', 500); }
  if (inv.coinBoost > 0) { window._coinBoostActive = true; inv.coinBoost--; showToast('💰 Coin Boost ACTIVE! Double coins this game!', '#ffd700', 700); }
  if (inv.streakShield > 0) { window._streakShieldActive = true; inv.streakShield--; showToast('🛡️ Streak Shield ACTIVE! Protected from one miss!', '#00d4ff', 900); }
  if (inv.windStop > 0) { window._windStopActive = true; inv.windStop--; showToast('💨 Wind Stop ACTIVE! No wind this game!', '#22c55e', 1100); }
  if (inv.precision > 0) { window._precisionShotsLeft = 3; inv.precision--; showToast('🎯 Precision Shot ACTIVE! Next 3 shots are perfect!', '#a855f7', 1300); }
  savePUInventory(inv);
}

// ===== FEATURE 14: COIN RAIN POST-GAME EVENT =====
function triggerCoinRain(score) {
  if (Math.random() < 0.12) {
    const bonus = 500 + Math.floor(Math.random() * score * 50);
    const capped = Math.min(bonus, 5000);
    window.addCoins(capped);
    setTimeout(() => {
      showToast(`🌧️ COIN RAIN! Bonus +🪙${capped.toLocaleString()}!`, '#ffd700', 1500);
    }, 1200);
  }
}

// ===== FEATURE 15: SQUAD SYNERGY BONUS =====
function checkSquadSynergy() {
  const today = todayKey();
  if (localStorage.getItem('hm_synergy_date') === today) return;

  const positions = ['PG','SG','SF','PF','C'];
  const players = positions.map(pos => {
    const id = PS.squad[pos];
    return id ? PLAYER_DB.find(p => p.id === id) : null;
  }).filter(Boolean);
  if (players.length < 5) return;

  const teams = [...new Set(players.map(p => p.team))];
  const rarities = [...new Set(players.map(p => p.rarity))];
  let triggered = false;

  if (teams.length === 1) {
    window.addCoins(1000);
    showToast(`🤝 Full Team Synergy: All ${teams[0]}! +🪙1,000`, '#22c55e', 300);
    triggered = true;
  }
  if (rarities.length === 1) {
    const bonus = { bronze:200, silver:400, gold:800, elite:1500, legend:3000 }[rarities[0]] || 500;
    window.addCoins(bonus);
    showToast(`⭐ Pure ${rarities[0].toUpperCase()} Squad Synergy! +🪙${bonus.toLocaleString()}`, RARITY[rarities[0]]?.color, 600);
    triggered = true;
  }
  if (triggered) localStorage.setItem('hm_synergy_date', today);
}

// ===== FEATURE 16: GAUNTLET MODE (UI helper) =====
// Gauntlet logic is in game.js (patched above). This is the mode card.

// ===== FEATURE 17: RAPID FIRE MODE (UI helper) =====
// Rapid Fire logic is in game.js (patched above). This is the mode card.

// ===== FEATURE 18: AROUND THE WORLD =====
const ATW_ZONES = [
  { label: 'Left Corner 3', icon: '↙️', x: 0.15, y: 0.75, is3pt: true },
  { label: 'Left Wing 3',   icon: '◀️', x: 0.22, y: 0.55, is3pt: true },
  { label: 'Left Elbow',    icon: '↖️', x: 0.35, y: 0.42, is3pt: false },
  { label: 'Top of Key',    icon: '⬆️', x: 0.50, y: 0.38, is3pt: false },
  { label: 'Right Elbow',   icon: '↗️', x: 0.65, y: 0.42, is3pt: false },
  { label: 'Right Wing 3',  icon: '▶️', x: 0.78, y: 0.55, is3pt: true },
  { label: 'Right Corner 3',icon: '↘️', x: 0.85, y: 0.75, is3pt: true },
];

let ATW_STATE = { active: false, currentZone: 0, lives: 2, score: 0 };

function renderAroundWorldScreen() {
  const container = document.getElementById('aroundWorldContent');
  if (!container) return;
  const today = todayKey();
  const lastPlayed = localStorage.getItem('hm_atw_date');
  const alreadyPlayed = lastPlayed === today;

  if (!ATW_STATE.active && alreadyPlayed) {
    container.innerHTML = `
    <div class="atw-wrap">
      <div class="atw-title">🌍 AROUND THE WORLD</div>
      <div class="atw-done">✅ Played today! Best today: 🪙${localStorage.getItem('hm_atw_best')||0}</div>
      <p style="color:#555;margin-top:12px;font-size:12px">Come back tomorrow for another round!</p>
    </div>`;
    return;
  }

  if (!ATW_STATE.active) {
    const ap = window.getActivePlayer ? window.getActivePlayer() : null;
    container.innerHTML = `
    <div class="atw-wrap">
      <div class="atw-title">🌍 AROUND THE WORLD</div>
      <p class="atw-desc">Hit all 7 zones around the court! 2 misses and it's over. 3-pointers give double coins!</p>
      ${ap ? `<p class="atw-player">Active player: <strong style="color:#ff8c00">${ap.name}</strong> (SHT: ${ap.stats?.sht || 75})</p>` : ''}
      <button class="btn btn-primary" onclick="startATW()" style="margin-top:16px">🌍 START AROUND THE WORLD</button>
    </div>`;
    return;
  }

  const zone = ATW_ZONES[ATW_STATE.currentZone];
  container.innerHTML = `
  <div class="atw-wrap atw-active">
    <div class="atw-hud">
      <span>Zone ${ATW_STATE.currentZone + 1}/7: ${zone.label}</span>
      <span>❤️ x${ATW_STATE.lives}</span>
      <span>🪙 ${ATW_STATE.score.toLocaleString()}</span>
    </div>
    <div class="atw-court">
      ${ATW_ZONES.map((z, i) => `
        <div class="atw-zone ${i < ATW_STATE.currentZone ? 'atw-zone-done' : i === ATW_STATE.currentZone ? 'atw-current' : 'atw-future'}"
          style="left:${z.x*100}%;top:${z.y*100}%"
          onclick="${i === ATW_STATE.currentZone ? 'shootATW()' : ''}">
          ${i < ATW_STATE.currentZone ? '✅' : z.icon}
        </div>`).join('')}
    </div>
    <div class="atw-shoot-prompt">
      <strong>${zone.icon} ${zone.label} ${zone.is3pt ? '(3PT)' : '(2PT)'}</strong><br>
      <button class="btn btn-primary" onclick="shootATW()" style="margin-top:8px;padding:10px 28px">🏀 SHOOT!</button>
    </div>
  </div>`;
}

window.startATW = function() {
  localStorage.setItem('hm_atw_date', todayKey());
  ATW_STATE = { active: true, currentZone: 0, lives: 2, score: 0 };
  renderAroundWorldScreen();
};

window.shootATW = function() {
  if (!ATW_STATE.active) return;
  const zone = ATW_ZONES[ATW_STATE.currentZone];
  const ap = window.getActivePlayer ? window.getActivePlayer() : null;
  const sht = ap ? (ap.stats?.sht || 75) : 75;
  const hitChance = 0.35 + (sht / 99) * 0.45;
  const made = Math.random() < hitChance;

  if (made) {
    const pts = zone.is3pt ? 300 : 150;
    ATW_STATE.score += pts;
    ATW_STATE.currentZone++;
    showToast(`✅ ${zone.label} — MADE! +🪙${pts}`, '#22c55e');
    if (ATW_STATE.currentZone >= ATW_ZONES.length) {
      // Completed all 7!
      ATW_STATE.score += 5000;
      window.addCoins(ATW_STATE.score);
      updateCoinsDisplay();
      const prev = parseInt(localStorage.getItem('hm_atw_best')||'0');
      if (ATW_STATE.score > prev) localStorage.setItem('hm_atw_best', ATW_STATE.score);
      ATW_STATE.active = false;
      showToast(`🏆 AROUND THE WORLD COMPLETE! +🪙${ATW_STATE.score.toLocaleString()}`, '#ffd700', 400);
      addXP(200);
    }
  } else {
    ATW_STATE.lives--;
    showToast(`❌ ${zone.label} — MISSED! ${ATW_STATE.lives} lives left`, '#ff3333');
    if (ATW_STATE.lives <= 0) {
      window.addCoins(ATW_STATE.score);
      updateCoinsDisplay();
      const prev = parseInt(localStorage.getItem('hm_atw_best')||'0');
      if (ATW_STATE.score > prev) localStorage.setItem('hm_atw_best', ATW_STATE.score);
      ATW_STATE.active = false;
      showToast(`💔 Game Over! Coins earned: 🪙${ATW_STATE.score.toLocaleString()}`, '#ff3333', 400);
    }
  }
  setTimeout(renderAroundWorldScreen, 500);
};

// ===== HOOK INTO GAME END =====
const _origEndGame = window.endGame;
window.endGame = function() {
  if (typeof _origEndGame === 'function') _origEndGame();

  // Lifetime stats
  const s = getLifetimeStats();
  s.gamesPlayed++;
  s.totalShots += STATE.shots || 0;
  s.totalMade += STATE.shotsMade || 0;
  s.totalScore += STATE.score || 0;
  s.totalThreePointers += (window._sessionThrees || 0);
  window._sessionThrees = 0;
  if ((STATE.bestStreak||0) > s.bestStreak) s.bestStreak = STATE.bestStreak;
  const modeKey = STATE.mode;
  s.bestByMode = s.bestByMode || {};
  if ((STATE.score||0) > (s.bestByMode[modeKey]||0)) s.bestByMode[modeKey] = STATE.score;
  saveLifetimeStats(s);

  // XP reward
  addXP(Math.max(10, Math.floor((STATE.score || 0) * 3)));

  // Coin rain event
  triggerCoinRain(STATE.score || 0);

  // Deactivate power-ups
  window._hotHandActive = false;
  window._coinBoostActive = false;
  window._windStopActive = false;

  // Update weekly challenge
  updateWeeklyCoinsTracking();

  // Random post-game event
  setTimeout(triggerRandomEvent, 2500);
};

function updateWeeklyCoinsTracking() {
  const w = getWeeklyChallenge();
  if (w.ch.key === 'gamesPlayed') {
    const s = getLifetimeStats();
    const wSaved = JSON.parse(localStorage.getItem('hm_weeklyChallenge')||'{}');
    wSaved.progress = s.gamesPlayed;
    saveWeeklyChallenge(wSaved);
  }
}

// ===== HOOK INTO START GAME FOR POWER-UPS =====
const _origStartGameFun = window.startGame;
window.startGame = function(mode) {
  activatePowerUpsForGame();
  _origStartGameFun(mode);
};

// ===== HOOK INTO TOURNAMENT WINS =====
const _origPlayTourneyRoundFun = window.playTourneyRound;
window.playTourneyRound = function() {
  if (typeof _origPlayTourneyRoundFun === 'function') _origPlayTourneyRoundFun();
  if (TOURNEY.bracket && TOURNEY.bracket.length === 1 && TOURNEY.bracket[0]?.isPlayer) {
    const wins = parseInt(localStorage.getItem('hm_tourneyWins')||'0') + 1;
    localStorage.setItem('hm_tourneyWins', wins);
    addXP(100);
  }
};

// ===== SCREEN HOOK FOR NEW SCREENS =====
const _origShowScreenFun = window.showScreen;
window.showScreen = function(id) {
  if (_origShowScreenFun) _origShowScreenFun(id);
  if (id === 'achievementsScreen') window.renderAchievementsScreen();
  if (id === 'fusionScreen')       window.renderFusionScreen();
  if (id === 'trophyRoomScreen')   window.renderTrophyRoom();
  if (id === 'statsScreen')        window.renderStatsScreen();
  if (id === 'mysteryBoxScreen')   renderMysteryBoxScreen();
  if (id === 'freeSpinScreen')     renderFreeDailySpin();
  if (id === 'weeklyChallengeScreen') renderWeeklyChallengeScreen();
  if (id === 'triviaScreen')       renderTriviaScreen();
  if (id === 'playerOfDayScreen')  renderPlayerOfDayScreen();
  if (id === 'powerUpsScreen')     renderPowerUpsScreen();
  if (id === 'aroundWorldScreen')  renderAroundWorldScreen();
  if (id === 'squadScreen')        { setTimeout(checkSquadSynergy, 800); }
  if (id === 'scratchScreen')      renderScratchCard();
  if (id === 'coinFlipScreen')     { _flipResult = null; renderCoinFlip(); }
  if (id === 'draftPickScreen')    renderDraftPick();
};

// ===== SQUAD SYNERGY ON HUB CARD OPEN =====
// (Squad synergy checked via showScreen hook above)

// ===== SCRATCH CARD (GAMBLING — buyable, no daily limit) =====
const SCRATCH_TIERS = [
  {
    id:'basic', name:'Basic Scratch', icon:'🎟️', cost:500, color:'#888',
    desc:'Match 3 to win! 1 in 500 jackpot.',
    symbols:[
      { emoji:'🪙', label:'500c',   coins:500,   weight:30 },
      { emoji:'💵', label:'200c',   coins:200,   weight:40 },
      { emoji:'⭐', label:'1Kc',    coins:1000,  weight:15 },
      { emoji:'🔥', label:'3Kc',    coins:3000,  weight:8  },
      { emoji:'💎', label:'1 Gem',  gems:1,      weight:5  },
      { emoji:'🏆', label:'JACKPOT',coins:50000, weight:2  },
    ],
    jackpotChance: 1/500,
    miniWinChance: 0.18,
  },
  {
    id:'silver', name:'Silver Scratch', icon:'🥈', cost:2000, color:'#c0c0c0',
    desc:'Better odds. 1 in 300 jackpot: Bronze card!',
    symbols:[
      { emoji:'🪙', label:'1Kc',    coins:1000,  weight:30 },
      { emoji:'💵', label:'500c',   coins:500,   weight:25 },
      { emoji:'⭐', label:'5Kc',    coins:5000,  weight:15 },
      { emoji:'🔥', label:'15Kc',   coins:15000, weight:8  },
      { emoji:'💎', label:'2 Gems', gems:2,      weight:6  },
      { emoji:'🃏', label:'Bronze!',bcard:'bronze', weight:2 },
      { emoji:'🏆', label:'JACKPOT',bcard:'silver', weight:1 },
    ],
    jackpotChance: 1/300,
    miniWinChance: 0.20,
  },
  {
    id:'gold', name:'Gold Scratch', icon:'🥇', cost:10000, color:'#ffd700',
    desc:'High stakes. 1 in 200 jackpot: Silver/Gold card!',
    symbols:[
      { emoji:'🪙', label:'5Kc',    coins:5000,  weight:25 },
      { emoji:'💵', label:'2Kc',    coins:2000,  weight:20 },
      { emoji:'⭐', label:'20Kc',   coins:20000, weight:15 },
      { emoji:'🔥', label:'50Kc',   coins:50000, weight:6  },
      { emoji:'💎', label:'3 Gems', gems:3,      weight:5  },
      { emoji:'🃏', label:'Gold!',  bcard:'gold',weight:3  },
      { emoji:'🏆', label:'JACKPOT',bcard:'elite',weight:1 },
    ],
    jackpotChance: 1/200,
    miniWinChance: 0.22,
  },
  {
    id:'diamond', name:'Diamond Scratch', icon:'💎', cost:50000, color:'#00d4ff',
    desc:'Ultra rare. 1 in 100 jackpot: LEGEND card!',
    symbols:[
      { emoji:'🪙', label:'25Kc',   coins:25000,  weight:20 },
      { emoji:'💵', label:'10Kc',   coins:10000,  weight:20 },
      { emoji:'⭐', label:'100Kc',  coins:100000, weight:10 },
      { emoji:'🔥', label:'250Kc',  coins:250000, weight:4  },
      { emoji:'💎', label:'5 Gems', gems:5,       weight:4  },
      { emoji:'🃏', label:'Elite!', bcard:'elite', weight:3  },
      { emoji:'🏆', label:'LEGEND!',bcard:'legend',weight:1  },
    ],
    jackpotChance: 1/100,
    miniWinChance: 0.25,
  },
];

function weightedPick(prizes) {
  const total = prizes.reduce((a,p) => a + p.weight, 0);
  let r = Math.random() * total, cum = 0;
  for (const p of prizes) { cum += p.weight; if (r < cum) return p; }
  return prizes[prizes.length - 1];
}

function generateScratchTiles(tier) {
  const jackpot = Math.random() < tier.jackpotChance;
  const miniWin = !jackpot && Math.random() < tier.miniWinChance;
  const tiles = [];
  for (let i = 0; i < 9; i++) tiles.push(weightedPick(tier.symbols));

  if (jackpot) {
    const jp = tier.symbols[tier.symbols.length - 1];
    tiles[0] = jp; tiles[1] = jp; tiles[2] = jp;
  } else if (miniWin) {
    const win = weightedPick(tier.symbols.slice(0, -1));
    const pos = [0,1,2,3,4,5,6,7,8].sort(() => Math.random()-0.5).slice(0,2);
    pos.forEach(p => tiles[p] = win);
  }
  return tiles.sort(() => Math.random() - 0.5);
}

function claimScratchPrize(tile) {
  if (tile.coins) window.addCoins(tile.coins);
  if (tile.gems) window.addGems(tile.gems);
  if (tile.bcard) {
    const pool = PLAYER_DB.filter(p => p.rarity === tile.bcard && !p.id.startsWith('ico_') && !PS.collection.includes(p.id));
    const p = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
    if (p) { PS.collection.push(p.id); savePS(); checkCollectionMilestones(); return p.name; }
  }
  return null;
}

let _scratchState = null;
let _scratchTierId = 'basic';

function renderScratchCard() {
  const container = document.getElementById('scratchContent');
  if (!container) return;

  // Lobby — show tier selection and current active card
  if (!_scratchState) {
    const coins = window.getCoins();
    let html = `<div class="scratch-lobby">
      <h3 class="scratch-title">🃏 SCRATCH CARDS</h3>
      <p class="scratch-sub">Buy a scratch card — reveal all 9 tiles, match 3 to win big!</p>
      <div class="scratch-tier-grid">`;
    SCRATCH_TIERS.forEach(t => {
      const can = coins >= t.cost;
      html += `<div class="scratch-tier-card ${can ? '' : 'scratch-tier-locked'}">
        <div class="scratch-tier-icon">${t.icon}</div>
        <div class="scratch-tier-name" style="color:${t.color}">${t.name}</div>
        <div class="scratch-tier-desc">${t.desc}</div>
        <div class="scratch-tier-cost">🪙 ${t.cost.toLocaleString()}</div>
        <button class="btn ${can ? 'btn-primary' : 'btn-secondary'} scratch-buy-btn"
          onclick="${can ? `buyScratchCard('${t.id}')` : ''}" ${can ? '' : 'disabled'}
          style="min-width:0;padding:7px 14px;font-size:11px">
          ${can ? `BUY ${t.icon}` : `Need 🪙${t.cost.toLocaleString()}`}
        </button>
      </div>`;
    });
    html += `</div>
      <p class="scratch-odds-note">💡 Tip: match 3 identical symbols = big win! Match 2 = mini win. Fully reveal all 9 tiles.</p>
    </div>`;
    container.innerHTML = html;
    return;
  }

  const tier = SCRATCH_TIERS.find(t => t.id === _scratchTierId);
  const { tiles, revealed, done: sDone, result } = _scratchState;
  const allRevealed = revealed.every(Boolean);

  let html = `<div class="scratch-active-wrap">
    <div class="scratch-active-header">
      <span style="color:${tier.color}">${tier.icon} ${tier.name}</span>
      <span class="scratch-reveal-hint">${allRevealed ? 'All revealed!' : `Tap tiles to reveal (${revealed.filter(Boolean).length}/9)`}</span>
    </div>
    <div class="scratch-grid">`;

  tiles.forEach((tile, i) => {
    const rev = revealed[i];
    html += `<div class="scratch-tile ${rev ? 'scratch-revealed' : sDone ? 'scratch-miss' : 'scratch-hidden'}"
      onclick="${(!rev && !sDone) ? `scratchReveal(${i})` : ''}">
      ${rev ? `<div class="scratch-emoji">${tile.emoji}</div><div class="scratch-val">${tile.label}</div>` : '<div class="scratch-q">?</div>'}
    </div>`;
  });

  html += `</div>`;

  if (!sDone && !allRevealed) {
    html += `<button class="btn btn-secondary" onclick="revealAllScratch()" style="min-width:0;padding:8px 18px;font-size:11px;margin-top:10px">⚡ Reveal All</button>`;
  }

  if (sDone || allRevealed) {
    if (!sDone) finalizeScratch();
    const res = _scratchState.result;
    if (res) {
      html += `<div class="scratch-result ${res.tier === 'jackpot' ? 'scratch-jackpot' : res.won ? 'scratch-win' : 'scratch-lose'}">
        ${res.tier === 'jackpot' ? `🎉🎉 JACKPOT! ${res.desc}` : res.won ? `✅ MATCH x${res.count}! ${res.desc}` : '😞 No match. Try again!'}
      </div>`;
    }
    html += `<button class="btn btn-primary" onclick="_scratchState=null;renderScratchCard()" style="min-width:0;padding:9px 22px;margin-top:10px;font-size:12px">🎟️ Buy Another</button>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

window.buyScratchCard = function(tierId) {
  const tier = SCRATCH_TIERS.find(t => t.id === tierId);
  if (!tier || !window.spendCoins(tier.cost)) { alert(`Need 🪙${tier.cost.toLocaleString()}!`); return; }
  _scratchTierId = tierId;
  _scratchState = { tiles: generateScratchTiles(tier), revealed: Array(9).fill(false), done: false, result: null };
  updateCoinsDisplay();
  renderScratchCard();
};

window.scratchReveal = function(idx) {
  if (!_scratchState || _scratchState.done || _scratchState.revealed[idx]) return;
  _scratchState.revealed[idx] = true;
  if (_scratchState.revealed.every(Boolean)) finalizeScratch();
  renderScratchCard();
};

window.revealAllScratch = function() {
  if (!_scratchState) return;
  _scratchState.revealed = Array(9).fill(true);
  finalizeScratch();
  renderScratchCard();
};

function finalizeScratch() {
  if (!_scratchState || _scratchState.done) return;
  _scratchState.done = true;
  const tiles = _scratchState.tiles;
  const counts = {};
  tiles.forEach(t => { counts[t.label] = (counts[t.label] || 0) + 1; });
  const best = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];

  if (best && best[1] >= 3) {
    const prize = tiles.find(t => t.label === best[0]);
    const extra = claimScratchPrize(prize);
    const desc = prize.bcard ? `${prize.bcard.toUpperCase()} card${extra ? ': '+extra : ''}!` :
                 prize.gems ? `+${prize.gems} 💎` : `+🪙${prize.coins?.toLocaleString()}`;
    _scratchState.result = { won: true, tier: 'jackpot', count: 3, desc };
    updateCoinsDisplay();
  } else if (best && best[1] >= 2) {
    const prize = tiles.find(t => t.label === best[0]);
    const desc = prize.coins ? `+🪙${prize.coins.toLocaleString()}` : prize.gems ? `+${prize.gems} 💎` : prize.label;
    // Only partial prize for 2-match
    const partial = prize.coins ? Math.floor(prize.coins * 0.4) : null;
    if (partial) window.addCoins(partial);
    if (prize.gems) window.addGems(1);
    _scratchState.result = { won: true, tier: 'mini', count: 2, desc: `Mini win! ${partial ? `+🪙${partial.toLocaleString()}` : '+1💎'}` };
    updateCoinsDisplay();
  } else {
    _scratchState.result = { won: false };
  }
}

// ===== COIN FLIP GAMBLE =====
const FLIP_LIMITS = { daily: 30000 };

function getFlipState() {
  const today = todayKey();
  const saved = JSON.parse(localStorage.getItem('hm_coinflip') || '{}');
  if (saved.date !== today) return { date: today, wagered: 0 };
  return saved;
}
function saveFlipState(s) { localStorage.setItem('hm_coinflip', JSON.stringify(s)); }

let _flipResult = null;

function renderCoinFlip() {
  const container = document.getElementById('coinFlipContent');
  if (!container) return;
  const fs = getFlipState();
  const remaining = Math.max(0, FLIP_LIMITS.daily - fs.wagered);
  const coins = window.getCoins();

  const bets = [500, 1000, 2500, 5000, 10000];

  let html = `<div class="flip-wrap">
    <div class="flip-title">🪙 COIN FLIP</div>
    <p class="flip-sub">50/50 chance — win double or lose it all!</p>
    <div class="flip-coin ${_flipResult ? (_flipResult === 'win' ? 'flip-heads' : 'flip-tails') : ''}" id="flipCoin">🪙</div>
    ${_flipResult ? `<div class="flip-result-label ${_flipResult === 'win' ? 'flip-win-txt' : 'flip-lose-txt'}">${_flipResult === 'win' ? '🎉 YOU WIN! +Double!' : '💸 YOU LOSE!'}</div>` : ''}
    <div class="flip-limit">Daily wager limit: 🪙${remaining.toLocaleString()} remaining</div>
    <p class="flip-desc">Choose your bet:</p>
    <div class="flip-bets">`;

  bets.forEach(b => {
    const canBet = coins >= b && remaining >= b;
    html += `<button class="flip-bet-btn ${canBet ? 'flip-bet-ok' : 'flip-bet-no'}"
      onclick="${canBet ? `doFlip(${b})` : ''}" ${canBet ? '' : 'disabled'}>
      🪙${b.toLocaleString()}
    </button>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

window.doFlip = function(bet) {
  if (!window.spendCoins(bet)) return;
  const fs = getFlipState();
  fs.wagered += bet;
  saveFlipState(fs);

  const won = Math.random() < 0.5;
  _flipResult = won ? 'win' : 'lose';

  if (won) {
    window.addCoins(bet * 2);
    addXP(10);
  }
  updateCoinsDisplay();
  renderCoinFlip();
  setTimeout(() => { _flipResult = null; renderCoinFlip(); }, 2800);
};

// ===== DRAFT PICK =====
let _draftCards = null;

function renderDraftPick() {
  const container = document.getElementById('draftPickContent');
  if (!container) return;
  const cost = 8000;
  const rerollCost = 3000;
  const coins = window.getCoins();

  if (!_draftCards) {
    container.innerHTML = `<div class="draft-wrap">
      <div class="draft-title">📋 DRAFT PICK</div>
      <p class="draft-sub">Pay 🪙8,000 to see 3 random players — choose 1 to add to your collection!</p>
      <button class="btn ${coins >= cost ? 'btn-primary' : 'btn-secondary'}"
        onclick="startDraft()" ${coins >= cost ? '' : 'disabled'} style="margin-top:16px">
        ${coins >= cost ? `📋 START DRAFT (🪙${cost.toLocaleString()})` : `Need 🪙${cost.toLocaleString()}`}
      </button>
    </div>`;
    return;
  }

  let html = `<div class="draft-wrap">
    <div class="draft-title">📋 PICK YOUR PLAYER</div>
    <p class="draft-sub">Select one player to add to your collection!</p>
    <div class="draft-cards">`;

  _draftCards.forEach((p, i) => {
    const r = RARITY[p.rarity];
    const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const owned = PS.collection.includes(p.id);
    html += `<div class="draft-card-wrap">
      <div class="pcard rarity-${p.rarity}" style="--card-color:${r.color};--card-glow:${r.glow};width:150px;cursor:${owned?'default':'pointer'}" onclick="${owned ? '' : `pickDraft(${i})`}">
        <div class="pcard-header">
          <span class="pcard-ovr" style="color:${r.color}">${p.ovr}</span>
          <span class="pcard-pos" style="background:${r.color}33">${p.pos}</span>
          <span class="pcard-rarity" style="color:${r.textColor}">${r.label}</span>
        </div>
        <div class="pcard-avatar" style="background:${p.color}33;border-color:${r.color}88">
          <span class="pcard-initials" style="color:${r.color};font-size:24px">${initials}</span>
          <span class="pcard-nat">${p.nat}</span>
        </div>
        <div class="pcard-name" style="color:${r.textColor};font-size:12px">${p.name}</div>
        <div class="pcard-team">${p.team}</div>
        <div class="pcard-stats">
          ${['sht','spd','drb','def','phy'].map(s=>`<div class="pstat"><span class="pstat-val" style="color:${r.color}">${p.stats[s]}</span><span class="pstat-lbl">${s.toUpperCase()}</span></div>`).join('')}
        </div>
      </div>
      <button class="btn ${owned ? 'btn-secondary' : 'btn-primary'}" onclick="${owned ? '' : `pickDraft(${i})`}"
        ${owned ? 'disabled' : ''} style="min-width:0;width:150px;padding:7px;font-size:11px;margin-top:6px">
        ${owned ? '✓ OWNED' : '✅ PICK THIS'}
      </button>
    </div>`;
  });

  html += `</div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
      <button class="btn btn-secondary" onclick="rerollDraft()" ${coins >= rerollCost ? '' : 'disabled'}
        style="min-width:0;padding:8px 18px;font-size:11px">
        🔄 Reroll (🪙${rerollCost.toLocaleString()})
      </button>
      <button class="btn btn-secondary" onclick="_draftCards=null;renderDraftPick()"
        style="min-width:0;padding:8px 18px;font-size:11px">✕ Skip</button>
    </div>
  </div>`;
  container.innerHTML = html;
}

window.startDraft = function() {
  if (!window.spendCoins(8000)) return;
  _draftCards = generateDraftPool();
  updateCoinsDisplay();
  renderDraftPick();
};

window.rerollDraft = function() {
  if (!window.spendCoins(3000)) { alert('Need 🪙3,000 to reroll!'); return; }
  _draftCards = generateDraftPool();
  updateCoinsDisplay();
  renderDraftPick();
};

function generateDraftPool() {
  const pool = PLAYER_DB.filter(p => !p.id.startsWith('ico_'));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Weight higher rarities to appear more often
  const weighted = pool.flatMap(p => {
    const w = { bronze:1, silver:2, gold:4, elite:6, legend:3 }[p.rarity] || 1;
    return Array(w).fill(p);
  });
  const picks = [];
  const seen = new Set();
  for (const p of weighted.sort(() => Math.random() - 0.5)) {
    if (!seen.has(p.id)) { seen.add(p.id); picks.push(p); }
    if (picks.length >= 3) break;
  }
  return picks;
}

window.pickDraft = function(idx) {
  if (!_draftCards || !_draftCards[idx]) return;
  const p = _draftCards[idx];
  if (!PS.collection.includes(p.id)) PS.collection.push(p.id);
  savePS();
  checkCollectionMilestones();
  _draftCards = null;
  updateCoinsDisplay();
  showToast(`📋 Drafted ${p.name}! Added to collection.`, RARITY[p.rarity]?.color);
  renderDraftPick();
};

// ===== POST-GAME RANDOM EVENTS =====
const RANDOM_EVENTS = [
  { id:'crowd', chance:0.18, fn: () => {
    const bonus = 300 + Math.floor(Math.random() * 700);
    window.addCoins(bonus);
    showToast(`📣 HOT CROWD! Fans love you! +🪙${bonus}`, '#ff8c00', 1800);
  }},
  { id:'sponsor', chance:0.10, fn: () => {
    const bonus = 1000 + Math.floor(Math.random() * 1500);
    window.addCoins(bonus);
    showToast(`🤝 SPONSOR DEAL! +🪙${bonus} bonus payment!`, '#22c55e', 1800);
  }},
  { id:'scout', chance:0.07, fn: () => {
    const pool = PLAYER_DB.filter(p => p.rarity === 'silver' && !p.id.startsWith('ico_') && !PS.collection.includes(p.id));
    if (!pool.length) return;
    const p = pool[Math.floor(Math.random() * pool.length)];
    PS.collection.push(p.id);
    savePS(); checkCollectionMilestones();
    showToast(`🔍 SCOUT SPOTTED YOU! Free card: ${p.name}!`, '#00d4ff', 1800);
  }},
  { id:'media', chance:0.12, fn: () => {
    addXP(50);
    showToast(`📺 MEDIA FRENZY! You're going viral! +50 XP`, '#a855f7', 1800);
  }},
  { id:'hot_gym', chance:0.09, fn: () => {
    window.addCoins(500);
    window.addGems && window.addGems(0); // just refresh display
    showToast(`🏋️ HOT GYM SESSION! +🪙500 training bonus!`, '#ffd700', 1800);
  }},
  { id:'gem_found', chance:0.04, fn: () => {
    window.addGems(1);
    showToast(`💎 LUCKY FIND! Someone dropped a gem!`, '#00d4ff', 1800);
    updateCoinsDisplay();
  }},
];

function triggerRandomEvent() {
  for (const ev of RANDOM_EVENTS) {
    if (Math.random() < ev.chance) {
      ev.fn();
      return;
    }
  }
}

// Random events hook — injected into the existing endGame wrapper above via a call at the bottom
// of the first wrapper. We just add the trigger here since the first wrapper already runs.

// (screen hooks for scratch/flip/draft added into main showScreen wrapper below)

// =============================================
// 10 MORE COOL FEATURES
// =============================================

// ===== COOL 1: TOURNAMENT BETTING =====
let _betState = { active: false, amount: 0, teamBet: null };

window.placeTournamentBet = function(amount, teamName) {
  if (!window.spendCoins(amount)) { showToast('Not enough coins to bet!', '#ff4444'); return; }
  _betState = { active: true, amount, teamBet: teamName };
  showToast(`🎰 Bet 🪙${amount.toLocaleString()} on ${teamName}!`, '#ffd700');
  updateCoinsDisplay();
};

window.resolveTournamentBet = function(winnerName) {
  if (!_betState.active) return;
  if (_betState.teamBet === winnerName) {
    const payout = _betState.amount * 3;
    window.addCoins(payout);
    showToast(`🎉 Bet WON! +🪙${payout.toLocaleString()}!`, '#22c55e', 500);
    updateCoinsDisplay();
  } else {
    showToast(`😢 Bet lost — ${winnerName} won instead.`, '#ff4444', 500);
  }
  _betState = { active: false, amount: 0, teamBet: null };
};

// ===== COOL 2: CARD LEVEL-UP SYSTEM =====
function getCardLevels() {
  return JSON.parse(localStorage.getItem('hm_cardLevels') || '{}');
}
function saveCardLevels(l) { localStorage.setItem('hm_cardLevels', JSON.stringify(l)); }

function getCardLevel(pid) { return getCardLevels()[pid] || 0; }

function renderCardLevelUp() {
  const container = document.getElementById('cardLevelContent');
  if (!container) return;
  const levels = getCardLevels();
  const coins = window.getCoins();
  const allPlayers = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean)
    .sort((a,b) => b.ovr - a.ovr);

  let html = `<div class="cardlv-header">
    <p class="cardlv-desc">Spend coins to level up your cards! Each level adds +1 OVR to base stats. Max level 10.</p>
  </div><div class="cardlv-list">`;

  allPlayers.forEach(p => {
    const lv = levels[p.id] || 0;
    const maxed = lv >= 10;
    const cost = Math.floor(2000 * Math.pow(2.2, lv));
    const can = !maxed && coins >= cost;
    const r = RARITY[p.rarity];
    html += `<div class="cardlv-row">
      <div class="cardlv-info">
        <span class="cardlv-name" style="color:${r.textColor}">${p.name}</span>
        <span class="cardlv-sub">${p.ovr + lv} OVR${lv > 0 ? ` (+${lv})` : ''} · ${r.label}</span>
      </div>
      <div class="cardlv-stars">${'⭐'.repeat(lv)}${'☆'.repeat(10-lv)}</div>
      <button class="btn ${can ? 'btn-primary' : 'btn-secondary'} cardlv-btn"
        onclick="${maxed || !can ? '' : `levelUpCard('${p.id}')`}"
        ${maxed || !can ? 'disabled' : ''}
        style="min-width:0;padding:5px 12px;font-size:10px">
        ${maxed ? '✓ MAX' : can ? `⬆️ ${fmtCoins(cost)}` : `🔒 ${fmtCoins(cost)}`}
      </button>
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.levelUpCard = function(pid) {
  const levels = getCardLevels();
  const lv = levels[pid] || 0;
  if (lv >= 10) return;
  const cost = Math.floor(2000 * Math.pow(2.2, lv));
  if (!window.spendCoins(cost)) { alert('Not enough coins!'); return; }
  levels[pid] = lv + 1;
  saveCardLevels(levels);
  updateCoinsDisplay();
  showToast(`⭐ Card leveled up! ${PLAYER_DB.find(p=>p.id===pid)?.name} is now Level ${lv+1}`, '#ffd700');
  renderCardLevelUp();
};

// Patch getEffectiveStat to include card levels
const _origGetEffStat = window.getEffectiveStat;
window.getEffectiveStat = function(pid, stat) {
  const base = _origGetEffStat ? _origGetEffStat(pid, stat) : 0;
  return Math.min(99, base + (getCardLevel(pid) || 0));
};

// ===== COOL 3: SET COMPLETION BONUSES =====
function checkSetCompletion() {
  const teams = {};
  PS.collection.forEach(id => {
    const p = PLAYER_DB.find(pl => pl.id === id);
    if (p) teams[p.team] = (teams[p.team] || 0) + 1;
  });
  const claimed = JSON.parse(localStorage.getItem('hm_setBonus') || '{}');
  let earned = false;
  Object.entries(teams).forEach(([team, count]) => {
    if (count >= 5 && !claimed[team]) {
      claimed[team] = true;
      const bonus = 15000;
      window.addCoins(bonus);
      showToast(`🏀 TEAM SET: ${team} (5 players)! +🪙${bonus.toLocaleString()}`, '#22c55e', 400);
      earned = true;
    }
    if (count >= 10 && !claimed[team+'_10']) {
      claimed[team+'_10'] = true;
      window.addGems(2);
      showToast(`👑 FULL ROSTER: ${team} (10 players)! +2💎`, '#ffd700', 600);
      earned = true;
    }
  });
  if (earned) { localStorage.setItem('hm_setBonus', JSON.stringify(claimed)); updateCoinsDisplay(); }
}

// ===== COOL 4: BOUNTY BOARD =====
const BOUNTY_TYPES = [
  { key:'bronze', label:'Collect 3 Bronze', goal:3, coins:3000, rarity:'bronze' },
  { key:'silver', label:'Collect 2 Silver', goal:2, coins:8000, rarity:'silver' },
  { key:'gold',   label:'Collect 1 Gold',   goal:1, coins:20000, rarity:'gold' },
  { key:'elite',  label:'Collect 1 Elite',  goal:1, coins:50000, gems:1, rarity:'elite' },
  { key:'legend', label:'Collect 1 Legend', goal:1, coins:100000, gems:3, rarity:'legend' },
];

function renderBountyBoard() {
  const container = document.getElementById('bountyContent');
  if (!container) return;
  const claimed = JSON.parse(localStorage.getItem('hm_bounties') || '{}');
  const today = todayKey();
  if (!claimed.date || claimed.date !== today) {
    localStorage.setItem('hm_bounties', JSON.stringify({ date: today }));
  }
  const bState = JSON.parse(localStorage.getItem('hm_bounties') || '{}');

  let html = `<div class="bounty-wrap">
    <h3 class="bounty-title">📌 BOUNTY BOARD</h3>
    <p class="bounty-sub">Complete collection targets for big rewards! Resets daily.</p>
    <div class="bounty-list">`;

  BOUNTY_TYPES.forEach(b => {
    const count = PS.collection.filter(id => {
      const p = PLAYER_DB.find(pl => pl.id === id);
      return p && p.rarity === b.rarity;
    }).length;
    const progress = Math.min(b.goal, count);
    const done = progress >= b.goal;
    const isClaimed = bState[b.key];
    const reward = `🪙${(b.coins||0).toLocaleString()}${b.gems ? ` +${b.gems}💎` : ''}`;

    html += `<div class="bounty-row ${done ? 'bounty-done' : ''} ${isClaimed ? 'bounty-claimed' : ''}">
      <div class="bounty-info">
        <div class="bounty-label">${b.label}</div>
        <div class="bounty-prog">${progress}/${b.goal} · ${reward}</div>
      </div>
      <div class="bounty-action">
        ${isClaimed ? '<span style="color:#22c55e;font-size:12px">✓ CLAIMED</span>'
          : done ? `<button class="btn-claim" onclick="claimBounty('${b.key}')">CLAIM</button>`
          : `<div style="font-size:11px;color:#555">${progress}/${b.goal}</div>`}
      </div>
    </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

window.claimBounty = function(key) {
  const b = BOUNTY_TYPES.find(x => x.key === key);
  if (!b) return;
  const bState = JSON.parse(localStorage.getItem('hm_bounties') || '{}');
  if (bState[key]) return;
  bState[key] = true;
  localStorage.setItem('hm_bounties', JSON.stringify(bState));
  if (b.coins) window.addCoins(b.coins);
  if (b.gems) window.addGems(b.gems);
  updateCoinsDisplay();
  showToast(`📌 Bounty claimed: ${b.label}! ${b.coins ? `+🪙${b.coins.toLocaleString()}` : ''}${b.gems ? ` +${b.gems}💎` : ''}`, '#ff8c00');
  renderBountyBoard();
};

// ===== COOL 5: ARENA UPGRADES =====
const ARENA_UPGRADES = [
  { id:'crowd1',    name:'Louder Crowd',       desc:'+100 coins per shooting game', cost:10000,  bonus:'gameCoin', val:100  },
  { id:'crowd2',    name:'Sell-Out Arena',      desc:'+300 coins per shooting game', cost:40000,  bonus:'gameCoin', val:300  },
  { id:'hotcourt',  name:'Lucky Court',         desc:'+5% chance for lucky game',    cost:25000,  bonus:'lucky',    val:0.05 },
  { id:'gym',       name:'Premium Gym',         desc:'Training costs -20%',          cost:30000,  bonus:'trainDisc',val:0.20 },
  { id:'analytics', name:'Analytics Suite',     desc:'+15 XP per game',              cost:20000,  bonus:'xpBonus',  val:15   },
  { id:'jumbotron', name:'Jumbotron',            desc:'XP earned x1.5',               cost:80000,  bonus:'xpMult',   val:1.5  },
  { id:'vip',       name:'VIP Section',          desc:'+500 coins per tournament win',cost:100000, bonus:'tourCoin', val:500  },
  { id:'legacy',    name:'Legacy Wing',          desc:'+1 gem every 5 games played',  cost:500000, bonus:'gemPer5',  val:1    },
];

function getArenaUpgrades() {
  return JSON.parse(localStorage.getItem('hm_arenaUps') || '{}');
}
function saveArenaUpgrades(u) { localStorage.setItem('hm_arenaUps', JSON.stringify(u)); }

function renderArenaUpgradesScreen() {
  const container = document.getElementById('arenaUpContent');
  if (!container) return;
  const owned = getArenaUpgrades();
  const coins = window.getCoins();

  let html = `<div class="arena-up-wrap">
    <p class="arena-up-desc">Permanent upgrades to your arena — boost passive income, XP, and bonuses forever!</p>
    <div class="arena-up-grid">`;

  ARENA_UPGRADES.forEach(u => {
    const have = owned[u.id];
    const can = !have && coins >= u.cost;
    html += `<div class="arena-up-card ${have ? 'arena-up-owned' : ''}">
      <div class="arena-up-name">${have ? '✓ ' : ''}${u.name}</div>
      <div class="arena-up-desc-txt">${u.desc}</div>
      <div class="arena-up-cost">${have ? 'OWNED' : `🪙${u.cost.toLocaleString()}`}</div>
      <button class="btn ${have ? 'btn-secondary' : can ? 'btn-primary' : 'btn-secondary'} arena-up-btn"
        onclick="${have || !can ? '' : `buyArenaUpgrade('${u.id}')`}"
        ${have || !can ? 'disabled' : ''}
        style="min-width:0;padding:6px 12px;font-size:11px">
        ${have ? '✓ OWNED' : can ? 'BUY' : `Need 🪙${fmtCoins(u.cost)}`}
      </button>
    </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

window.buyArenaUpgrade = function(id) {
  const u = ARENA_UPGRADES.find(x => x.id === id);
  if (!u || !window.spendCoins(u.cost)) return;
  const owned = getArenaUpgrades();
  owned[id] = true;
  saveArenaUpgrades(owned);
  updateCoinsDisplay();
  showToast(`🏟️ Arena upgrade: ${u.name} purchased!`, '#ff8c00');
  renderArenaUpgradesScreen();
};

function getArenaBonus(type) {
  const owned = getArenaUpgrades();
  return ARENA_UPGRADES.filter(u => u.bonus === type && owned[u.id]).reduce((a,u) => a + u.val, 0);
}

// Hook arena bonuses into game end
const _origEndGameArena = window.endGame;
window.endGame = function() {
  if (typeof _origEndGameArena === 'function') _origEndGameArena();
  // Crowd bonus
  const crowdBonus = getArenaBonus('gameCoin');
  if (crowdBonus > 0) { window.addCoins(crowdBonus); updateCoinsDisplay(); }
  // XP bonus
  const xpBonus = getArenaBonus('xpBonus');
  if (xpBonus > 0) addXP(xpBonus);
  // Gem per 5 games
  const ls = getLifetimeStats();
  if (getArenaBonus('gemPer5') > 0 && ls.gamesPlayed % 5 === 0) {
    window.addGems(1); updateCoinsDisplay();
    showToast('🏟️ Arena bonus: +1💎 (5 games played!)', '#00d4ff', 2000);
  }
};

// ===== COOL 6: PLAYER SHOWCASE (top 3 cards on hub) =====
function renderShowcase() {
  const container = document.getElementById('showcaseBar');
  if (!container) return;
  const top3 = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean)
    .sort((a,b) => b.ovr - a.ovr).slice(0,3);
  if (!top3.length) { container.innerHTML = ''; return; }
  let html = `<div class="showcase-bar">`;
  top3.forEach(p => {
    const r = RARITY[p.rarity];
    const lv = getCardLevel(p.id);
    html += `<div class="showcase-chip" style="border-color:${r.color}55;background:${r.bg}">
      <span style="color:${r.color};font-weight:900">${p.ovr + lv}</span>
      <span style="font-size:10px;color:${r.textColor}">${p.name}</span>
      ${lv > 0 ? `<span style="font-size:9px;color:#ffd700">Lv${lv}</span>` : ''}
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ===== COOL 7: LUCKY PLAYER DAILY =====
function getLuckyPlayer() {
  const today = todayKey();
  const hash = today.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const myPlayers = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean);
  if (!myPlayers.length) return null;
  return myPlayers[hash % myPlayers.length];
}

function getLuckyPlayerBonus() { return 0.10; } // 10% stat boost

// Patch getEffectiveStat to include lucky player boost
const _origGetEffStat2 = window.getEffectiveStat;
window.getEffectiveStat = function(pid, stat) {
  const base = _origGetEffStat2 ? _origGetEffStat2(pid, stat) : 0;
  const lucky = getLuckyPlayer();
  if (lucky && lucky.id === pid) return Math.min(99, Math.floor(base * (1 + getLuckyPlayerBonus())));
  return base;
};

// ===== COOL 8: QUICK SELL PLAYERS =====
window.quickSellPlayer = function(pid) {
  const p = PLAYER_DB.find(pl => pl.id === pid);
  if (!p) return;
  const prices = { bronze:200, silver:800, gold:3000, elite:10000, legend:35000 };
  const price = prices[p.rarity] || 500;
  if (!confirm(`Sell ${p.name} for 🪙${price.toLocaleString()}? This removes them from your collection!`)) return;
  const idx = PS.collection.indexOf(pid);
  if (idx === -1) return;
  PS.collection.splice(idx, 1);
  // Remove from squad if equipped
  ['PG','SG','SF','PF','C'].forEach(pos => { if (PS.squad[pos] === pid) PS.squad[pos] = null; });
  savePS();
  window.addCoins(price);
  updateCoinsDisplay();
  showToast(`💰 Sold ${p.name} for 🪙${price.toLocaleString()}!`, '#22c55e');
};

// ===== COOL 9: PRESTIGE ICON CARDS =====
const PRESTIGE_ICONS = [
  { id:'pio_golden', name:'GOLDEN Jordan', base:'mj', reqPrestige:3, gemCost:0, boostedStats:{sht:99,spd:99,drb:99,def:99,phy:99}, extraTrait:'legend_aura', color:'#ffd700' },
  { id:'pio_fire',   name:'FIRE LeBron',   base:'lebron', reqPrestige:5, gemCost:0, boostedStats:{sht:99,spd:99,drb:99,def:99,phy:99}, extraTrait:'hot_hand', color:'#ff4500' },
  { id:'pio_ice',    name:'ICE Curry',     base:'curry',  reqPrestige:4, gemCost:0, boostedStats:{sht:99,spd:99,drb:99,def:90,phy:88}, extraTrait:'deep_range', color:'#00d4ff' },
];

function renderPrestigeIconsScreen() {
  const container = document.getElementById('prestigeIconContent');
  if (!container) return;
  const prestige = (JSON.parse(localStorage.getItem('clicker')||'{}')).prestige || 0;

  let html = `<div class="pio-wrap">
    <h3 class="pio-title">👑 PRESTIGE ICON CARDS</h3>
    <p class="pio-desc">Exclusive cards unlocked only by prestiging in Ball Tycoon. Your prestige: ⭐${prestige}</p>
    <div class="pio-grid">`;

  PRESTIGE_ICONS.forEach(ic => {
    const base = PLAYER_DB.find(p => p.id === ic.base);
    if (!base) return;
    const owned = PS.collection.includes(ic.id);
    const unlocked = prestige >= ic.reqPrestige;
    html += `<div class="pio-card ${!unlocked ? 'pio-locked' : owned ? 'pio-owned' : ''}">
      <div class="pio-badge" style="background:${ic.color}22;color:${ic.color};border-color:${ic.color}44">
        ${unlocked ? '👑 PRESTIGE ICON' : `🔒 Req ⭐${ic.reqPrestige}`}
      </div>
      <div style="font-size:28px;margin:8px 0">${unlocked ? '🏀' : '❓'}</div>
      <div style="font-size:14px;font-weight:900;color:${ic.color}">${ic.name}</div>
      <div style="font-size:11px;color:#888;margin:4px 0">${base.team} · ICON</div>
      <div style="font-size:22px;font-weight:900;color:${ic.color};margin:4px 0">99 OVR</div>
      <button class="btn ${owned ? 'btn-secondary' : unlocked ? 'btn-primary' : 'btn-secondary'} pio-btn"
        onclick="${!unlocked || owned ? '' : `claimPrestigeIcon('${ic.id}')`}"
        ${!unlocked || owned ? 'disabled' : ''}
        style="min-width:0;padding:6px 14px;font-size:11px;margin-top:8px;background:${unlocked&&!owned?ic.color:''};border-color:${ic.color}">
        ${owned ? '✓ OWNED' : unlocked ? 'CLAIM FREE' : `Need ⭐${ic.reqPrestige}`}
      </button>
    </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

window.claimPrestigeIcon = function(iconId) {
  const ic = PRESTIGE_ICONS.find(x => x.id === iconId);
  if (!ic) return;
  const prestige = (JSON.parse(localStorage.getItem('clicker')||'{}')).prestige || 0;
  if (prestige < ic.reqPrestige) { alert(`Need Prestige ${ic.reqPrestige}!`); return; }
  const base = PLAYER_DB.find(p => p.id === ic.base);
  if (!base) return;
  if (!PLAYER_DB.find(p => p.id === ic.id)) {
    PLAYER_DB.push({ ...base, id:ic.id, name:ic.name, full:ic.name, ovr:99, rarity:'legend',
      stats:{...ic.boostedStats}, traits:[...new Set([...base.traits.slice(0,2), ic.extraTrait])], color:ic.color });
  }
  if (!PS.collection.includes(ic.id)) PS.collection.push(ic.id);
  savePS(); updateCoinsDisplay();
  showToast(`👑 ${ic.name} — Prestige Icon claimed!`, ic.color);
  renderPrestigeIconsScreen();
};

// ===== COOL 10: RARITY UPGRADE (SPECIAL SILVER CARD) =====
window.openRarityUpgradeScreen = function() { showScreen('rarityUpgradeScreen'); };

function renderRarityUpgradeScreen() {
  const container = document.getElementById('rarityUpContent');
  if (!container) return;
  const rarityOrder = ['bronze','silver','gold','elite','legend'];
  const nextRarity = { bronze:'silver', silver:'gold', gold:'elite', elite:'legend' };
  const upgCosts = { bronze:5000, silver:20000, gold:80000, elite:300000 };

  // Count owned by rarity
  const counts = {};
  PS.collection.forEach(id => {
    const p = PLAYER_DB.find(pl => pl.id === id);
    if (p && !p.id.startsWith('ico_') && !p.id.startsWith('pio_')) counts[p.rarity] = (counts[p.rarity]||0)+1;
  });

  const coins = window.getCoins();
  let html = `<div class="rarup-wrap">
    <h3 class="rarup-title">✨ RARITY UPGRADE</h3>
    <p class="rarup-desc">Spend coins to upgrade a random card to the next rarity!</p>
    <div class="rarup-grid">`;

  ['bronze','silver','gold','elite'].forEach(r => {
    const nr = nextRarity[r];
    const cost = upgCosts[r];
    const count = counts[r] || 0;
    const can = count > 0 && coins >= cost;
    const rc = RARITY[r], nc = RARITY[nr];
    html += `<div class="rarup-card">
      <div class="rarup-from" style="color:${rc.textColor}">${rc.label}</div>
      <div class="rarup-arrow">→</div>
      <div class="rarup-to" style="color:${nc.textColor}">${nc.label}</div>
      <div class="rarup-owned">${count} owned</div>
      <div class="rarup-cost">🪙${cost.toLocaleString()}</div>
      <button class="btn ${can ? 'btn-primary' : 'btn-secondary'} rarup-btn"
        onclick="${can ? `doRarityUpgrade('${r}')` : ''}" ${can ? '' : 'disabled'}
        style="min-width:0;padding:6px 12px;font-size:10px">
        ${can ? '✨ UPGRADE' : count === 0 ? `No ${rc.label}` : `Need 🪙${fmtCoins(cost)}`}
      </button>
    </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

window.doRarityUpgrade = function(rarity) {
  const nr = { bronze:'silver', silver:'gold', gold:'elite', elite:'legend' }[rarity];
  const cost = { bronze:5000, silver:20000, gold:80000, elite:300000 }[rarity];
  if (!nr || !window.spendCoins(cost)) return;
  const candidates = PS.collection.filter(id => {
    const p = PLAYER_DB.find(pl => pl.id === id);
    return p && p.rarity === rarity && !id.startsWith('ico_') && !id.startsWith('pio_');
  });
  if (!candidates.length) return;
  const upId = candidates[Math.floor(Math.random() * candidates.length)];
  PS.collection.splice(PS.collection.indexOf(upId), 1);
  const pool = PLAYER_DB.filter(p => p.rarity === nr && !p.id.startsWith('ico_') && !PS.collection.includes(p.id));
  const result = pool[Math.floor(Math.random() * pool.length)];
  if (result) PS.collection.push(result.id);
  savePS(); checkCollectionMilestones(); updateCoinsDisplay();
  showToast(`✨ Rarity Upgrade! Got ${result ? result.name : 'a '+nr+' player'}!`, RARITY[nr]?.color);
  renderRarityUpgradeScreen();
};

// ===== SCREEN HOOKS FOR NEW COOL FEATURES =====
const _origShowScreen3 = window.showScreen;
window.showScreen = function(id) {
  if (_origShowScreen3) _origShowScreen3(id);
  if (id === 'cardLevelScreen')     renderCardLevelUp();
  if (id === 'bountyScreen')        renderBountyBoard();
  if (id === 'arenaUpgradeScreen')  renderArenaUpgradesScreen();
  if (id === 'prestigeIconScreen')  renderPrestigeIconsScreen();
  if (id === 'rarityUpgradeScreen') renderRarityUpgradeScreen();
  if (id === 'splash') { setTimeout(renderShowcase, 500); setTimeout(checkSetCompletion, 1000); }
};

// ===== INIT =====
window.addEventListener('load', () => {
  setTimeout(() => {
    checkCollectionMilestones();
    checkAchievements();
    // Update XP bar on hub if needed
  }, 4000);
});
