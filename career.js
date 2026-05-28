// =============================================
// CAREER.JS — Player Career Mode
// =============================================

const CAREER = {
  playerId: null,       // chosen player id from collection
  season: 1,
  gamesPlayed: 0,
  gamesTotal: 20,
  wins: 0, losses: 0,
  stats: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 },
  careerStats: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, games: 0, seasons: 0, wins: 0 },
  awards: [],
  milestones: [],       // career milestone badges
  phase: 'menu',        // menu | pick | season | offseason | awards
  gameLog: [],
  development: {},      // stat boosts earned through career
  active: false,
  retireAtSeason: 10,
  offseasonSlots: 3,    // training actions per off-season
};

function loadCareer() {
  const saved = JSON.parse(localStorage.getItem('careerState') || 'null');
  if (saved) Object.assign(CAREER, saved);
}

function saveCareer() {
  localStorage.setItem('careerState', JSON.stringify(CAREER));
}

function careerPlayer() {
  return PLAYER_DB.find(p => p.id === CAREER.playerId) || null;
}

function careerEffStat(stat) {
  const p = careerPlayer();
  if (!p) return 70;
  const base = (p.stats && p.stats[stat]) || 70;
  const dev = (CAREER.development[stat] || 0);
  const trainBoost = window.getEffectiveStat ? window.getEffectiveStat(p.id, stat) - base : 0;
  return Math.min(99, base + dev + Math.max(0, trainBoost));
}

// Simulate one game, returns result object
function careerSimGame() {
  const p = careerPlayer();
  if (!p) return null;

  const sht = careerEffStat('sht');
  const spd = careerEffStat('spd');
  const drb = careerEffStat('drb');
  const def = careerEffStat('def');
  const phy = careerEffStat('phy');

  // Individual game stats (bell-curve around player quality)
  const rand = (base, spread) => Math.max(0, Math.round(base + (Math.random() - 0.5) * spread));

  const ptsBase = sht * 0.35 + drb * 0.1;
  const rebBase = phy * 0.18 + def * 0.07;
  const astBase = drb * 0.15 + spd * 0.05;
  const stlBase = spd * 0.06 + def * 0.06;
  const blkBase = phy * 0.05 + def * 0.07;

  const gamePts  = rand(ptsBase, 10);
  const gameReb  = rand(rebBase, 6);
  const gameAst  = rand(astBase, 5);
  const gameStl  = rand(stlBase, 3);
  const gameBlk  = rand(blkBase, 2);

  // Team win chance based on overall
  const ovr = p.ovr || 75;
  const oppOvr = 70 + Math.floor(Math.random() * 25);
  const winChance = 0.35 + (ovr - oppOvr) * 0.015;
  const win = Math.random() < Math.max(0.1, Math.min(0.9, winChance));

  const opponents = ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks', 'Nets', 'Spurs', 'Suns', 'Nuggets', 'Clippers'];
  const opp = opponents[Math.floor(Math.random() * opponents.length)];

  const result = {
    win, opponent: opp,
    pts: gamePts, reb: gameReb, ast: gameAst, stl: gameStl, blk: gameBlk,
    ovr: p.ovr
  };

  // Update season stats
  CAREER.stats.pts  += gamePts;
  CAREER.stats.reb  += gameReb;
  CAREER.stats.ast  += gameAst;
  CAREER.stats.stl  += gameStl;
  CAREER.stats.blk  += gameBlk;
  CAREER.gamesPlayed++;
  if (win) CAREER.wins++; else CAREER.losses++;

  // Career totals
  CAREER.careerStats.pts   += gamePts;
  CAREER.careerStats.reb   += gameReb;
  CAREER.careerStats.ast   += gameAst;
  CAREER.careerStats.stl   += gameStl;
  CAREER.careerStats.blk   += gameBlk;
  CAREER.careerStats.games++;
  if (win) CAREER.careerStats.wins = (CAREER.careerStats.wins || 0) + 1;

  CAREER.gameLog.push(result);
  // Check career milestones
  checkCareerMilestones();

  if (CAREER.gameLog.length > 10) CAREER.gameLog = CAREER.gameLog.slice(-10);

  if (window.trackDailyProgress) window.trackDailyProgress('careerGames', 1);

  const reward = win ? 3000 + gamePts * 50 : 800 + gamePts * 30;
  window.addCoins(reward);
  result.reward = reward;

  saveCareer();
  return result;
}

function careerPPG()  { return CAREER.gamesPlayed ? (CAREER.stats.pts / CAREER.gamesPlayed).toFixed(1) : '0.0'; }
function careerRPG()  { return CAREER.gamesPlayed ? (CAREER.stats.reb / CAREER.gamesPlayed).toFixed(1) : '0.0'; }
function careerAPG()  { return CAREER.gamesPlayed ? (CAREER.stats.ast / CAREER.gamesPlayed).toFixed(1) : '0.0'; }
function careerSPG()  { return CAREER.gamesPlayed ? (CAREER.stats.stl / CAREER.gamesPlayed).toFixed(1) : '0.0'; }
function careerBPG()  { return CAREER.gamesPlayed ? (CAREER.stats.blk / CAREER.gamesPlayed).toFixed(1) : '0.0'; }

function careerEndSeason() {
  const ppg = parseFloat(careerPPG());
  const rpg = parseFloat(careerRPG());
  const apg = parseFloat(careerAPG());
  const winRate = CAREER.gamesPlayed ? CAREER.wins / CAREER.gamesPlayed : 0;

  const awards = [];
  if (ppg >= 28 && winRate >= 0.6) awards.push({ icon: '🏆', name: 'Season MVP' });
  else if (ppg >= 22) awards.push({ icon: '⭐', name: 'All-NBA First Team' });
  else if (ppg >= 18) awards.push({ icon: '✨', name: 'All-NBA Second Team' });

  if (apg >= 8) awards.push({ icon: '🎯', name: 'Assists Leader' });
  if (rpg >= 10) awards.push({ icon: '💪', name: 'Rebounds Leader' });
  if (CAREER.season === 1 && ppg >= 15) awards.push({ icon: '🌟', name: 'Rookie of the Year' });
  if (winRate >= 0.75) awards.push({ icon: '🔥', name: 'Champion' });

  awards.forEach(a => CAREER.awards.push({ ...a, season: CAREER.season }));

  // Development boost (player improves each season, peaks at season 6, then slight decline)
  const peakSeason = 6;
  const seasonDiff = CAREER.season - peakSeason;
  const devBoost = seasonDiff < 0 ? 1 : seasonDiff === 0 ? 0 : -1;
  ['sht','spd','drb','def','phy'].forEach(stat => {
    CAREER.development[stat] = (CAREER.development[stat] || 0) + devBoost;
  });

  // Award coins
  const awardCoins = awards.length * 10000 + (winRate >= 0.5 ? 5000 : 0);
  if (awardCoins > 0) window.addCoins(awardCoins);

  CAREER.careerStats.seasons++;
  const seaDone = CAREER.season;
  CAREER.season++;
  CAREER.gamesPlayed = 0;
  CAREER.wins = 0; CAREER.losses = 0;
  CAREER.stats = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 };
  CAREER.gameLog = [];
  CAREER.phase = 'awards';

  saveCareer();
  return { awards, awardCoins, season: seaDone, ppg, rpg: rpg.toFixed(1), apg: apg.toFixed(1), winRate };
}

// ===== CAREER MILESTONES =====
const CAREER_MILESTONES = [
  { id: 'pts500',   icon: '🏀', name: '500 Career Pts',    key: 'pts',   goal: 500,   gemReward: 2 },
  { id: 'pts2000',  icon: '⭐', name: '2,000 Career Pts',  key: 'pts',   goal: 2000,  gemReward: 5 },
  { id: 'pts5000',  icon: '👑', name: '5,000 Career Pts',  key: 'pts',   goal: 5000,  gemReward: 10 },
  { id: 'games50',  icon: '🎯', name: '50 Games Played',   key: 'games', goal: 50,    gemReward: 3 },
  { id: 'games100', icon: '💯', name: '100 Games Played',  key: 'games', goal: 100,   gemReward: 8 },
  { id: 'wins50',   icon: '🏆', name: '50 Career Wins',    key: 'wins',  goal: 50,    gemReward: 5 },
  { id: 'seas5',    icon: '📅', name: '5 Seasons Played',  key: 'seasons',goal: 5,   gemReward: 5 },
];

function checkCareerMilestones() {
  if (!CAREER.milestones) CAREER.milestones = [];
  const cs = CAREER.careerStats;
  CAREER_MILESTONES.forEach(m => {
    if (CAREER.milestones.includes(m.id)) return;
    const val = m.key === 'seasons' ? (cs.seasons || 0) : (cs[m.key] || 0);
    if (val >= m.goal) {
      CAREER.milestones.push(m.id);
      if (window.addGems) window.addGems(m.gemReward);
      showCareerToast(`${m.icon} ${m.name} — +${m.gemReward}💎`);
    }
  });
}

function showCareerToast(msg) {
  const el = document.createElement('div');
  el.className = 'career-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===== OFF-SEASON =====
function renderCareerOffseason(el) {
  const p = careerPlayer();
  if (!p) { CAREER.phase = 'pick'; renderCareerScreen(); return; }

  const slots = CAREER.offseasonSlots || 3;
  const OFFSEASON_ACTIONS = [
    { id: 'train_sht', icon: '🎯', label: 'Shooting Camp',  stat: 'sht', boost: 2, cost: 8000 },
    { id: 'train_spd', icon: '⚡', label: 'Speed Training', stat: 'spd', boost: 2, cost: 8000 },
    { id: 'train_drb', icon: '🏀', label: 'Ball Handling',  stat: 'drb', boost: 2, cost: 8000 },
    { id: 'train_def', icon: '🛡️', label: 'Defense Drills', stat: 'def', boost: 2, cost: 8000 },
    { id: 'train_phy', icon: '💪', label: 'Gym & Strength', stat: 'phy', boost: 2, cost: 8000 },
    { id: 'rest',      icon: '😴', label: 'Rest & Recover', stat: null,  boost: 0, cost: 0, note: '+1 slot next season' },
  ];

  const used = CAREER._offseasonUsed || 0;
  const remaining = slots - used;

  el.innerHTML = `
  <div class="career-offseason">
    <h3 class="career-section-title">☀️ OFF-SEASON — Season ${CAREER.season - 1} Complete</h3>
    <p class="career-pick-sub">Choose ${slots} training actions before next season. Remaining: <strong style="color:#ff8c00">${remaining}</strong></p>
    <div class="career-offseason-grid">
      ${OFFSEASON_ACTIONS.map(a => {
        const canAfford = a.cost === 0 || window.getCoins() >= a.cost;
        const curDev = CAREER.development[a.stat] || 0;
        return `
        <div class="career-offseason-card ${canAfford ? '' : 'career-os-locked'}">
          <div class="career-os-icon">${a.icon}</div>
          <div class="career-os-label">${a.label}</div>
          ${a.stat ? `<div class="career-os-stat">+${a.boost} ${a.stat.toUpperCase()} (current dev: +${curDev})</div>` : `<div class="career-os-stat">${a.note}</div>`}
          ${a.cost > 0 ? `<div class="career-os-cost">🪙${a.cost.toLocaleString()}</div>` : `<div class="career-os-cost" style="color:#22c55e">FREE</div>`}
          ${remaining > 0 && canAfford
            ? `<button class="career-btn-nav" onclick="careerOffseasonAction('${a.id}')">TRAIN</button>`
            : remaining === 0
              ? ''
              : `<div style="color:#555;font-size:11px">Need 🪙${a.cost.toLocaleString()}</div>`}
        </div>`;
      }).join('')}
    </div>
    ${remaining === 0 ? `<button class="career-btn-play" style="margin-top:16px" onclick="careerStartNextSeason()">▶ START SEASON ${CAREER.season}</button>` : ''}
  </div>`;
}

window.careerOffseasonAction = function(id) {
  const OFFSEASON_ACTIONS = [
    { id: 'train_sht', stat: 'sht', boost: 2, cost: 8000 },
    { id: 'train_spd', stat: 'spd', boost: 2, cost: 8000 },
    { id: 'train_drb', stat: 'drb', boost: 2, cost: 8000 },
    { id: 'train_def', stat: 'def', boost: 2, cost: 8000 },
    { id: 'train_phy', stat: 'phy', boost: 2, cost: 8000 },
    { id: 'rest',      stat: null,  boost: 0, cost: 0 },
  ];
  const a = OFFSEASON_ACTIONS.find(x => x.id === id);
  if (!a) return;
  if (a.cost > 0 && !window.spendCoins(a.cost)) { alert('Not enough coins!'); return; }

  if (a.stat) {
    CAREER.development[a.stat] = (CAREER.development[a.stat] || 0) + a.boost;
  } else {
    // Rest: gain an extra slot next off-season
    CAREER.offseasonSlots = Math.min(5, (CAREER.offseasonSlots || 3) + 1);
  }
  CAREER._offseasonUsed = (CAREER._offseasonUsed || 0) + 1;
  updateCoinsDisplay();
  saveCareer();
  renderCareerScreen();
};

window.careerStartNextSeason = function() {
  CAREER.phase = 'season';
  CAREER._offseasonUsed = 0;
  saveCareer();
  renderCareerScreen();
};

// ===== RENDER =====
function renderCareerScreen() {
  const el = document.getElementById('careerContent');
  if (!el) return;

  if (!CAREER.active) { renderCareerMenu(el); return; }
  switch (CAREER.phase) {
    case 'pick':       renderCareerPick(el); break;
    case 'season':     renderCareerSeason(el); break;
    case 'awards':     renderCareerAwards(el); break;
    case 'offseason':  renderCareerOffseason(el); break;
    default: renderCareerMenu(el);
  }
}

function renderCareerMenu(el) {
  const p = careerPlayer();
  el.innerHTML = `
  <div class="career-menu">
    <div class="career-logo">🏅</div>
    <h2 class="career-menu-title">CAREER MODE</h2>
    <p class="career-menu-sub">Live out your player's journey. Rise to legend status.</p>
    ${CAREER.active && p ? `
    <div class="career-current-player">
      <div class="career-cp-badge rarity-${p.rarity}">${p.ovr}</div>
      <div>
        <div class="career-cp-name">${p.name}</div>
        <div class="career-cp-info">Season ${CAREER.season} · ${CAREER.careerStats.seasons} seasons played</div>
      </div>
    </div>
    ` : ''}
    <div class="career-menu-btns">
      ${CAREER.active ? `
      <button class="career-btn-big" onclick="CAREER.phase='season';renderCareerScreen()">▶ CONTINUE CAREER</button>
      <button class="career-btn-big career-btn-new" onclick="careerNewGame()">🔄 NEW CAREER</button>
      ` : `
      <button class="career-btn-big" onclick="careerNewGame()">🆕 START CAREER</button>
      `}
    </div>
    ${CAREER.awards.length ? `
    <div class="career-award-shelf">
      ${CAREER.awards.slice(-6).map(a => `<span title="${a.name} (S${a.season})">${a.icon}</span>`).join('')}
      <span class="career-award-count">${CAREER.awards.length} award${CAREER.awards.length>1?'s':''}</span>
    </div>` : ''}
  </div>`;
}

window.careerNewGame = function() {
  CAREER.active = true;
  CAREER.season = 1; CAREER.gamesPlayed = 0; CAREER.wins = 0; CAREER.losses = 0;
  CAREER.stats = { pts:0, reb:0, ast:0, stl:0, blk:0 };
  CAREER.careerStats = { pts:0, reb:0, ast:0, stl:0, blk:0, games:0, seasons:0 };
  CAREER.awards = []; CAREER.gameLog = []; CAREER.development = {};
  CAREER.playerId = null;
  CAREER.phase = 'pick';
  saveCareer();
  renderCareerScreen();
};

function renderCareerPick(el) {
  const myPlayers = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean);
  if (!myPlayers.length) {
    el.innerHTML = `<div class="career-empty"><p>You need players in your collection to start a career!</p><p>Open some packs first.</p><button class="career-btn-nav" onclick="showScreen('packStore')">📦 Open Packs</button></div>`;
    return;
  }
  el.innerHTML = `
  <div class="career-pick">
    <h3 class="career-section-title">🏅 CHOOSE YOUR PLAYER</h3>
    <p class="career-pick-sub">This will be your career player for the entire season.</p>
    <div class="career-pick-grid">
      ${myPlayers.map(p => `
      <div class="career-pick-card rarity-${p.rarity}" onclick="careerSelectPlayer('${p.id}')">
        <div class="career-pick-ovr">${p.ovr}</div>
        <div class="career-pick-name">${p.name}</div>
        <div class="career-pick-pos">${p.pos || '—'} · ${p.rarity.toUpperCase()}</div>
        <div class="career-pick-stats">
          <span>SHT:${p.stats?.sht||'—'}</span><span>SPD:${p.stats?.spd||'—'}</span>
          <span>DRB:${p.stats?.drb||'—'}</span><span>DEF:${p.stats?.def||'—'}</span>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

window.careerSelectPlayer = function(id) {
  CAREER.playerId = id;
  CAREER.phase = 'season';
  saveCareer();
  renderCareerScreen();
};

function renderCareerSeason(el) {
  const p = careerPlayer();
  if (!p) { CAREER.phase = 'pick'; renderCareerScreen(); return; }

  const gamesLeft = CAREER.gamesTotal - CAREER.gamesPlayed;
  const lastLog = CAREER.gameLog[CAREER.gameLog.length - 1];

  el.innerHTML = `
  <div class="career-season">
    <div class="career-player-header">
      <div class="career-player-badge rarity-${p.rarity}">
        <div class="career-player-ovr">${p.ovr}</div>
        <div class="career-player-name">${p.name}</div>
        <div class="career-player-pos">${p.pos || '—'}</div>
      </div>
      <div class="career-season-info">
        <div class="career-s-title">Season ${CAREER.season}</div>
        <div class="career-record">${CAREER.wins}W — ${CAREER.losses}L</div>
        <div class="career-games-bar-wrap">
          <div class="career-games-bar" style="width:${(CAREER.gamesPlayed/CAREER.gamesTotal)*100}%"></div>
        </div>
        <div class="career-games-label">${CAREER.gamesPlayed}/${CAREER.gamesTotal} games played</div>
      </div>
    </div>

    <div class="career-stats-row">
      <div class="career-stat-box"><div class="career-stat-num">${careerPPG()}</div><div class="career-stat-lbl">PPG</div></div>
      <div class="career-stat-box"><div class="career-stat-num">${careerRPG()}</div><div class="career-stat-lbl">RPG</div></div>
      <div class="career-stat-box"><div class="career-stat-num">${careerAPG()}</div><div class="career-stat-lbl">APG</div></div>
      <div class="career-stat-box"><div class="career-stat-num">${careerSPG()}</div><div class="career-stat-lbl">SPG</div></div>
      <div class="career-stat-box"><div class="career-stat-num">${careerBPG()}</div><div class="career-stat-lbl">BPG</div></div>
    </div>

    ${lastLog ? `
    <div class="career-last-game ${lastLog.win ? 'career-win' : 'career-loss'}">
      <span>${lastLog.win ? '✅ WIN' : '❌ LOSS'} vs ${lastLog.opponent}</span>
      <span>${lastLog.pts}pts / ${lastLog.reb}reb / ${lastLog.ast}ast</span>
      <span class="career-reward">+🪙${lastLog.reward.toLocaleString()}</span>
    </div>` : ''}

    ${gamesLeft > 0 ? `
    <button class="career-btn-play" onclick="careerPlayGame()">▶ PLAY NEXT GAME</button>
    <button class="career-btn-play career-btn-sim5" onclick="careerSim5()" ${gamesLeft < 5 ? 'disabled' : ''}>⏩ SIM 5 GAMES</button>
    ` : `
    <button class="career-btn-play" onclick="careerDoEndSeason()">🏆 END SEASON</button>
    `}

    <div class="career-nav-row">
      <button class="career-btn-nav" onclick="renderCareerLog()">📋 Game Log</button>
      <button class="career-btn-nav" onclick="renderCareerHistory()">🏅 Career Stats</button>
      ${CAREER._sponsor
        ? `<div class="career-sponsor-badge">🤝 ${CAREER._sponsor.name} +🪙${CAREER._sponsor.income}/game</div>`
        : `<button class="career-btn-nav" onclick="careerSignSponsor()">🤝 Sign Sponsor (🪙${(5000+CAREER.season*2000).toLocaleString()})</button>`
      }
    </div>
    <div id="careerSubView"></div>
  </div>`;
}

window.careerPlayGame = function() {
  if (CAREER.gamesPlayed >= CAREER.gamesTotal) return;
  careerSimGame();
  updateCoinsDisplay();
  renderCareerScreen();
};

window.careerSim5 = function() {
  const remaining = CAREER.gamesTotal - CAREER.gamesPlayed;
  const count = Math.min(5, remaining);
  for (let i = 0; i < count; i++) careerSimGame();
  updateCoinsDisplay();
  renderCareerScreen();
};

window.careerDoEndSeason = function() {
  const result = careerEndSeason();
  updateCoinsDisplay();
  renderCareerScreen();
};

window.renderCareerLog = function() {
  const sub = document.getElementById('careerSubView');
  if (!sub) return;
  const log = [...CAREER.gameLog].reverse();
  sub.innerHTML = `
  <div class="career-log">
    <h4 class="career-log-title">Recent Games</h4>
    ${log.map(g => `
    <div class="career-log-row ${g.win ? 'career-win' : 'career-loss'}">
      <span>${g.win?'✅':'❌'} vs ${g.opponent}</span>
      <span>${g.pts}pts / ${g.reb}reb / ${g.ast}ast / ${g.stl}stl</span>
    </div>`).join('') || '<p style="color:#666;text-align:center">No games yet</p>'}
  </div>`;
};

window.renderCareerHistory = function() {
  const sub = document.getElementById('careerSubView');
  if (!sub) return;
  const cs = CAREER.careerStats;
  const avgPts = cs.games ? (cs.pts / cs.games).toFixed(1) : '0.0';
  const avgReb = cs.games ? (cs.reb / cs.games).toFixed(1) : '0.0';
  const avgAst = cs.games ? (cs.ast / cs.games).toFixed(1) : '0.0';
  sub.innerHTML = `
  <div class="career-history">
    <h4 class="career-log-title">Career Averages (${cs.seasons} seasons, ${cs.games} games)</h4>
    <div class="career-history-grid">
      <div><span>${avgPts}</span><label>PPG</label></div>
      <div><span>${avgReb}</span><label>RPG</label></div>
      <div><span>${avgAst}</span><label>APG</label></div>
    </div>
    <h4 class="career-log-title" style="margin-top:12px">Awards</h4>
    ${CAREER.awards.length
      ? CAREER.awards.map(a => `<div class="career-award-row">${a.icon} <strong>${a.name}</strong> <span style="color:#666">Season ${a.season}</span></div>`).join('')
      : '<p style="color:#666;text-align:center">No awards yet</p>'}
  </div>`;
};

function renderCareerAwards(el) {
  const saved = JSON.parse(localStorage.getItem('_lastCareerResult') || 'null');
  const p = PLAYER_DB.find(x => x.id === CAREER.playerId);
  el.innerHTML = `
  <div class="career-awards-screen">
    <h3 class="career-section-title">🏆 SEASON ${saved?.season || CAREER.season - 1} WRAP-UP</h3>
    ${p ? `<div class="career-award-player">${p.name} · ${p.rarity.toUpperCase()}</div>` : ''}
    ${saved ? `
    <div class="career-season-stats-final">
      <div><span>${saved.ppg}</span><label>PPG</label></div>
      <div><span>${saved.rpg}</span><label>RPG</label></div>
      <div><span>${saved.apg}</span><label>APG</label></div>
      <div><span>${Math.round(saved.winRate*100)}%</span><label>WIN%</label></div>
    </div>` : ''}
    <div class="career-awards-list">
      ${CAREER.awards.filter(a => a.season === (saved?.season || CAREER.season - 1)).map(a => `
      <div class="career-award-item">
        <div class="career-award-icon">${a.icon}</div>
        <div class="career-award-name">${a.name}</div>
      </div>`).join('') || '<p class="career-no-award">No awards this season. Work harder next year!</p>'}
    </div>
    ${saved?.awardCoins > 0 ? `<div class="career-award-coins">+🪙${saved.awardCoins.toLocaleString()} coins earned!</div>` : ''}
    <button class="career-btn-play" onclick="CAREER.phase='offseason';CAREER._offseasonUsed=0;saveCareer();renderCareerScreen()">☀️ OFF-SEASON TRAINING</button>
  </div>`;
}

// Patch careerEndSeason to save result for awards screen then go to offseason
const _origCareerEndSeason = careerEndSeason;
window.careerDoEndSeason = function() {
  const result = _origCareerEndSeason();
  localStorage.setItem('_lastCareerResult', JSON.stringify(result));
  checkCareerMilestones();
  updateCoinsDisplay();
  renderCareerScreen();
};

// ===== INIT =====
loadCareer();
window.renderCareerScreen = renderCareerScreen;
