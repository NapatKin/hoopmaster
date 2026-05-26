// =============================================
// MANAGER.JS — Manager Mode
// =============================================

const MGR = {
  teamName: 'My Team',
  budget: 500000,
  tactic: 'balanced',      // attack | balanced | defense
  formation: '2-1-2',      // formations for 5-player basketball
  season: 1,
  week: 0,
  wins: 0, losses: 0,
  points: 0,
  trophies: [],
  transfers: [],           // owned players (ids from PS.collection)
  schedule: [],
  results: [],
  active: false,
  phase: 'menu',           // menu | season | match | result | table | transfer | trophies
};

const MGR_TEAMS = [
  { name: 'Lake Warriors',   city: 'Los Angeles', ovr: 88, tactic: 'balanced',  color: '#1D428A', wins: 0, losses: 0, pts: 0 },
  { name: 'Heat Kings',      city: 'Miami',       ovr: 84, tactic: 'attack',    color: '#98002E', wins: 0, losses: 0, pts: 0 },
  { name: 'Bulls Legacy',    city: 'Chicago',     ovr: 91, tactic: 'defense',   color: '#CE1141', wins: 0, losses: 0, pts: 0 },
  { name: 'Thunder Pack',    city: 'Oklahoma',    ovr: 86, tactic: 'attack',    color: '#007AC1', wins: 0, losses: 0, pts: 0 },
  { name: 'Celtic Pride',    city: 'Boston',      ovr: 90, tactic: 'balanced',  color: '#007A33', wins: 0, losses: 0, pts: 0 },
  { name: 'Nets Empire',     city: 'Brooklyn',    ovr: 87, tactic: 'attack',    color: '#000000', wins: 0, losses: 0, pts: 0 },
  { name: 'Spur Dynasty',    city: 'San Antonio', ovr: 89, tactic: 'defense',   color: '#C0C0C0', wins: 0, losses: 0, pts: 0 },
  { name: 'Warrior Code',    city: 'Golden State',ovr: 92, tactic: 'attack',    color: '#FFC72C', wins: 0, losses: 0, pts: 0 },
];

const TRANSFER_MARKET_PLAYERS = [
  { id: 'tm1', name: 'D. Fox', pos: 'PG', ovr: 84, price: 45000, stats: { sht:82, spd:90, drb:85, def:79, phy:78 }, rarity:'gold', team:'Sacramento' },
  { id: 'tm2', name: 'J. Tatum', pos: 'SF', ovr: 89, price: 85000, stats: { sht:88, spd:80, drb:84, def:82, phy:83 }, rarity:'elite', team:'Boston' },
  { id: 'tm3', name: 'B. Adebayo', pos: 'C', ovr: 86, price: 65000, stats: { sht:75, spd:72, drb:78, def:90, phy:92 }, rarity:'elite', team:'Miami' },
  { id: 'tm4', name: 'T. Young', pos: 'PG', ovr: 85, price: 60000, stats: { sht:87, spd:82, drb:88, def:65, phy:70 }, rarity:'elite', team:'Atlanta' },
  { id: 'tm5', name: 'R. Barrett', pos: 'SG', ovr: 80, price: 30000, stats: { sht:79, spd:78, drb:80, def:77, phy:80 }, rarity:'gold', team:'Toronto' },
  { id: 'tm6', name: 'Z. LaVine', pos: 'SG', ovr: 87, price: 72000, stats: { sht:89, spd:86, drb:87, def:72, phy:80 }, rarity:'elite', team:'Chicago' },
  { id: 'tm7', name: 'A. Davis', pos: 'C', ovr: 93, price: 150000, stats: { sht:83, spd:76, drb:84, def:94, phy:95 }, rarity:'legend', team:'LA Lakers' },
  { id: 'tm8', name: 'P. George', pos: 'SF', ovr: 86, price: 68000, stats: { sht:85, spd:82, drb:83, def:86, phy:82 }, rarity:'elite', team:'Philadelphia' },
  { id: 'tm9', name: 'D. Booker', pos: 'SG', ovr: 90, price: 95000, stats: { sht:93, spd:80, drb:86, def:76, phy:79 }, rarity:'elite', team:'Phoenix' },
  { id: 'tm10', name: 'K. Towns', pos: 'C', ovr: 85, price: 58000, stats: { sht:84, spd:72, drb:76, def:80, phy:88 }, rarity:'elite', team:'NY Knicks' },
  { id: 'tm11', name: 'M. Monk', pos: 'SG', ovr: 77, price: 18000, stats: { sht:82, spd:84, drb:79, def:72, phy:73 }, rarity:'gold', team:'Sacramento' },
  { id: 'tm12', name: 'C. Wood', pos: 'PF', ovr: 78, price: 20000, stats: { sht:77, spd:73, drb:74, def:76, phy:84 }, rarity:'gold', team:'Dallas' },
];

function loadMGR() {
  const saved = JSON.parse(localStorage.getItem('mgrState') || 'null');
  if (saved) {
    Object.assign(MGR, saved);
    // Restore AI teams
    if (saved.aiTeams) MGR_TEAMS.forEach((t, i) => saved.aiTeams[i] && Object.assign(t, saved.aiTeams[i]));
  }
}

function saveMGR() {
  const state = { ...MGR, aiTeams: MGR_TEAMS.map(t => ({ wins: t.wins, losses: t.losses, pts: t.pts })) };
  localStorage.setItem('mgrState', JSON.stringify(state));
}

function mgrMyOVR() {
  const positions = ['PG','SG','SF','PF','C'];
  const players = positions.map(pos => {
    const id = PS.squad[pos];
    return id ? PLAYER_DB.find(p => p.id === id) : null;
  }).filter(Boolean);

  if (!players.length) return 70;
  const avg = players.reduce((s, p) => s + (p.ovr || 75), 0) / players.length;

  // Tactic modifier
  const tacticMod = { attack: 3, balanced: 0, defense: -2 }[MGR.tactic] || 0;
  return Math.round(Math.min(99, avg + tacticMod));
}

function mgrSimMatch(opponentIdx) {
  const myOVR = mgrMyOVR();
  const opp = MGR_TEAMS[opponentIdx];
  const oppOVR = opp.ovr;

  // Tactic matchup
  const tacticEdge = {
    'attack-defense': -5, 'defense-attack': 5,
    'attack-balanced': 3, 'balanced-attack': -3,
    'defense-balanced': -2, 'balanced-defense': 2,
  }[`${MGR.tactic}-${opp.tactic}`] || 0;

  const diff = (myOVR + tacticEdge) - oppOVR;
  const winChance = 0.5 + diff * 0.015;
  const win = Math.random() < Math.max(0.05, Math.min(0.95, winChance));

  // Score generation
  const baseScore = 85 + Math.floor(Math.random() * 30);
  let myScore, oppScore;
  if (win) {
    myScore = baseScore + Math.floor(Math.random() * 15) + 5;
    oppScore = baseScore - Math.floor(Math.random() * 12) - 1;
  } else {
    oppScore = baseScore + Math.floor(Math.random() * 15) + 5;
    myScore = baseScore - Math.floor(Math.random() * 12) - 1;
  }

  const result = { win, myScore, oppScore, opponent: opp.name, week: MGR.week + 1 };

  if (win) { MGR.wins++; MGR.points += 3; } else { MGR.losses++; MGR.points += 1; }
  opp.wins += win ? 0 : 1;
  opp.losses += win ? 1 : 0;
  opp.pts += win ? 1 : 3;
  MGR.week++;
  MGR.results.push(result);

  // Coin reward
  const reward = win ? 5000 + Math.floor(Math.random() * 3000) : 1500;
  window.addCoins(reward);
  result.reward = reward;

  if (window.trackDailyProgress) window.trackDailyProgress('managerWins', win ? 1 : 0);
  saveMGR();
  return result;
}

function mgrLeagueTable() {
  const myPts = MGR.points;
  const myW = MGR.wins, myL = MGR.losses;
  const all = [
    { name: 'MY TEAM ⭐', city: '', ovr: mgrMyOVR(), color: '#ff8c00', wins: myW, losses: myL, pts: myPts, isPlayer: true },
    ...MGR_TEAMS,
  ];
  return all.sort((a, b) => b.pts - a.pts || b.wins - a.wins);
}

function mgrEndSeason() {
  const table = mgrLeagueTable();
  const myRank = table.findIndex(t => t.isPlayer) + 1;
  let trophy = null;
  if (myRank === 1) trophy = { name: 'League Champion', icon: '🏆', season: MGR.season };
  else if (myRank <= 3) trophy = { name: 'Top 3 Finish', icon: '🥉', season: MGR.season };
  if (trophy) {
    MGR.trophies.push(trophy);
    window.addCoins(myRank === 1 ? 50000 : 20000);
  }

  // New season reset
  MGR.season++;
  MGR.week = 0; MGR.wins = 0; MGR.losses = 0; MGR.points = 0;
  MGR.results = [];
  MGR.schedule = buildSchedule();
  MGR_TEAMS.forEach(t => { t.wins = 0; t.losses = 0; t.pts = 0; });
  saveMGR();
  return { rank: myRank, trophy };
}

function buildSchedule() {
  const schedule = [];
  for (let i = 0; i < MGR_TEAMS.length; i++) {
    schedule.push(i);
    if (i < 4) schedule.push(i); // play top 4 twice
  }
  // Shuffle
  for (let i = schedule.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [schedule[i], schedule[j]] = [schedule[j], schedule[i]];
  }
  return schedule;
}

// ===== RENDER =====
function renderManagerScreen() {
  const el = document.getElementById('managerContent');
  if (!el) return;

  if (!MGR.active) {
    renderMGRMenu(el);
  } else {
    switch (MGR.phase) {
      case 'season':   renderMGRSeason(el); break;
      case 'table':    renderMGRTable(el); break;
      case 'transfer': renderMGRTransfer(el); break;
      case 'trophies': renderMGRTrophies(el); break;
      case 'tactics':  renderMGRTactics(el); break;
      default: renderMGRSeason(el);
    }
  }
}

function renderMGRMenu(el) {
  el.innerHTML = `
  <div class="mgr-menu">
    <div class="mgr-logo">🏟️</div>
    <h2 class="mgr-menu-title">MANAGER MODE</h2>
    <p class="mgr-menu-sub">Build your dynasty. Win the league. Own the court.</p>
    <div class="mgr-menu-grid">
      <button class="mgr-btn-big" onclick="mgrStartNew()">🆕 NEW SEASON</button>
      ${MGR.active ? `<button class="mgr-btn-big mgr-btn-continue" onclick="MGR.phase='season';renderManagerScreen()">▶ CONTINUE</button>` : ''}
    </div>
    ${MGR.trophies.length ? `<div class="mgr-trophy-shelf">
      ${MGR.trophies.map(t => `<span title="${t.name} (S${t.season})">${t.icon}</span>`).join('')}
      <span class="mgr-trophy-label">${MGR.trophies.length} trophy${MGR.trophies.length>1?'ies':''}</span>
    </div>` : ''}
  </div>`;
}

window.mgrStartNew = function() {
  MGR.active = true;
  MGR.week = 0; MGR.wins = 0; MGR.losses = 0; MGR.points = 0;
  MGR.results = [];
  MGR.schedule = buildSchedule();
  MGR_TEAMS.forEach(t => { t.wins = 0; t.losses = 0; t.pts = 0; });
  MGR.phase = 'season';
  saveMGR();
  renderManagerScreen();
};

function renderMGRSeason(el) {
  const totalMatches = MGR.schedule.length;
  const matchesLeft = totalMatches - MGR.week;
  const myOVR = mgrMyOVR();

  const lastResult = MGR.results[MGR.results.length - 1];
  const lastHtml = lastResult ? `
  <div class="mgr-last-result ${lastResult.win ? 'mgr-win' : 'mgr-loss'}">
    <span>${lastResult.win ? '✅ WIN' : '❌ LOSS'}</span>
    <span>${lastResult.myScore} — ${lastResult.oppScore} vs ${lastResult.opponent}</span>
    <span class="mgr-reward">+🪙${lastResult.reward.toLocaleString()}</span>
  </div>` : '';

  const nextOppIdx = MGR.schedule[MGR.week];
  const nextOpp = MGR_TEAMS[nextOppIdx];

  el.innerHTML = `
  <div class="mgr-season">
    <div class="mgr-header-row">
      <div class="mgr-stat-box"><div class="mgr-stat-num">${MGR.season}</div><div class="mgr-stat-lbl">SEASON</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num">${MGR.wins}W-${MGR.losses}L</div><div class="mgr-stat-lbl">RECORD</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num">${matchesLeft}</div><div class="mgr-stat-lbl">MATCHES LEFT</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num">${myOVR}</div><div class="mgr-stat-lbl">TEAM OVR</div></div>
    </div>

    ${lastHtml}

    <div class="mgr-tactic-bar">
      <span>Tactic: <strong style="color:#ff8c00;text-transform:uppercase">${MGR.tactic}</strong></span>
      <span>Formation: <strong style="color:#00d4ff">${MGR.formation}</strong></span>
      <button class="mgr-btn-sm" onclick="MGR.phase='tactics';renderManagerScreen()">⚙️ Change</button>
    </div>

    ${matchesLeft > 0 && nextOpp ? `
    <div class="mgr-match-preview">
      <div class="mgr-match-team mgr-my-team">
        <div class="mgr-team-badge" style="background:#ff8c00">MY</div>
        <div class="mgr-team-name">MY TEAM</div>
        <div class="mgr-team-ovr">${myOVR} OVR</div>
      </div>
      <div class="mgr-match-vs">VS</div>
      <div class="mgr-match-team">
        <div class="mgr-team-badge" style="background:${nextOpp.color}">${nextOpp.name.slice(0,2).toUpperCase()}</div>
        <div class="mgr-team-name">${nextOpp.name}</div>
        <div class="mgr-team-ovr">${nextOpp.ovr} OVR</div>
      </div>
    </div>
    <button class="mgr-btn-play" onclick="mgrPlayNextMatch()">▶ PLAY MATCH</button>
    ` : matchesLeft === 0 ? `
    <div class="mgr-season-over">
      <p>Season complete! Check the table to see your final rank.</p>
      <button class="mgr-btn-play" onclick="mgrDoEndSeason()">🏆 END SEASON</button>
    </div>
    ` : ''}

    <div class="mgr-nav-row">
      <button class="mgr-btn-nav" onclick="MGR.phase='table';renderManagerScreen()">📊 League Table</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='transfer';renderManagerScreen()">💸 Transfer Market</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='trophies';renderManagerScreen()">🏆 Trophies</button>
    </div>
  </div>`;
}

window.mgrPlayNextMatch = function() {
  if (MGR.week >= MGR.schedule.length) return;
  const oppIdx = MGR.schedule[MGR.week];
  const result = mgrSimMatch(oppIdx);
  updateCoinsDisplay();
  renderManagerScreen();
};

window.mgrDoEndSeason = function() {
  const { rank, trophy } = mgrEndSeason();
  const msg = trophy
    ? `Season ${MGR.season - 1} complete! You finished #${rank}. ${trophy.icon} ${trophy.name}!`
    : `Season ${MGR.season - 1} complete! You finished #${rank}. Keep building!`;
  updateCoinsDisplay();
  alert(msg);
  renderManagerScreen();
};

function renderMGRTactics(el) {
  const formations = ['2-1-2', '1-2-2', '2-2-1', '3-2'];
  const tactics = [
    { id: 'attack',   icon: '⚡', label: 'ATTACK',   desc: '+3 OVR, aggressive offense. Weak vs Defense tactic.' },
    { id: 'balanced', icon: '⚖️', label: 'BALANCED', desc: 'Neutral matchup, consistent performance.' },
    { id: 'defense',  icon: '🛡️', label: 'DEFENSE',  desc: '+2 OVR vs Attack, strong defensive scheme.' },
  ];

  el.innerHTML = `
  <div class="mgr-tactics">
    <h3 class="mgr-section-title">⚙️ TACTICS & FORMATION</h3>

    <div class="mgr-tactics-group">
      <div class="mgr-tactics-label">PLAY STYLE</div>
      <div class="mgr-tactics-grid">
        ${tactics.map(t => `
        <div class="mgr-tactic-card ${MGR.tactic === t.id ? 'mgr-tactic-active' : ''}" onclick="mgrSetTactic('${t.id}')">
          <div class="mgr-tactic-icon">${t.icon}</div>
          <div class="mgr-tactic-name">${t.label}</div>
          <div class="mgr-tactic-desc">${t.desc}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="mgr-tactics-group">
      <div class="mgr-tactics-label">FORMATION</div>
      <div class="mgr-formation-grid">
        ${formations.map(f => `
        <button class="mgr-formation-btn ${MGR.formation === f ? 'mgr-formation-active' : ''}" onclick="mgrSetFormation('${f}')">${f}</button>
        `).join('')}
      </div>
    </div>

    <div class="mgr-tactics-back">
      <button class="mgr-btn-nav" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
    </div>
  </div>`;
}

window.mgrSetTactic = function(t) { MGR.tactic = t; saveMGR(); renderManagerScreen(); };
window.mgrSetFormation = function(f) { MGR.formation = f; saveMGR(); renderManagerScreen(); };

function renderMGRTable(el) {
  const table = mgrLeagueTable();
  el.innerHTML = `
  <div class="mgr-table-wrap">
    <h3 class="mgr-section-title">📊 LEAGUE TABLE — Season ${MGR.season}</h3>
    <table class="mgr-table">
      <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>PTS</th></tr></thead>
      <tbody>
        ${table.map((t, i) => `
        <tr class="${t.isPlayer ? 'mgr-my-row' : ''}">
          <td>${i + 1}</td>
          <td><span class="mgr-dot" style="background:${t.color || '#888'}"></span>${t.name}</td>
          <td>${t.wins}</td>
          <td>${t.losses}</td>
          <td><strong>${t.pts}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
    <button class="mgr-btn-nav" style="margin-top:16px" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
  </div>`;
}

function renderMGRTransfer(el) {
  const budget = MGR.budget;
  const ownedIds = PS.collection;

  el.innerHTML = `
  <div class="mgr-transfer">
    <h3 class="mgr-section-title">💸 TRANSFER MARKET</h3>
    <div class="mgr-budget-bar">Transfer Budget: <strong style="color:#22c55e">🪙${window.getCoins().toLocaleString()}</strong> coins</div>
    <div class="mgr-transfer-grid">
      ${TRANSFER_MARKET_PLAYERS.map(p => {
        const owned = ownedIds.includes(p.id);
        const canAfford = window.getCoins() >= p.price;
        return `
        <div class="mgr-transfer-card rarity-${p.rarity}">
          <div class="mgr-transfer-ovr">${p.ovr}</div>
          <div class="mgr-transfer-name">${p.name}</div>
          <div class="mgr-transfer-pos">${p.pos} · ${p.rarity.toUpperCase()}</div>
          <div class="mgr-transfer-stats">
            SHT:${p.stats.sht} SPD:${p.stats.spd} DRB:${p.stats.drb} DEF:${p.stats.def}
          </div>
          <div class="mgr-transfer-price">🪙${p.price.toLocaleString()}</div>
          ${owned
            ? `<div class="mgr-transfer-owned">✅ OWNED</div>`
            : `<button class="mgr-btn-buy ${canAfford ? '' : 'mgr-btn-disabled'}" onclick="mgrBuyPlayer('${p.id}')" ${canAfford ? '' : 'disabled'}>BUY</button>`
          }
        </div>`;
      }).join('')}
    </div>
    <button class="mgr-btn-nav" style="margin-top:16px" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
  </div>`;
}

window.mgrBuyPlayer = function(id) {
  const p = TRANSFER_MARKET_PLAYERS.find(x => x.id === id);
  if (!p) return;
  if (PS.collection.includes(p.id)) { alert('Already owned!'); return; }
  if (!window.spendCoins(p.price)) { alert('Not enough coins!'); return; }

  // Add to PLAYER_DB and PS.collection
  const card = {
    id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, rarity: p.rarity, team: p.team,
    stats: p.stats, traits: [],
  };
  if (!PLAYER_DB.find(x => x.id === p.id)) PLAYER_DB.push(card);
  PS.collection.push(p.id);
  savePS();
  updateCoinsDisplay();
  if (window.trackDailyProgress) window.trackDailyProgress('marketBuys', 1);
  alert(`✅ ${p.name} signed! Check My Squad to add them.`);
  renderManagerScreen();
};

function renderMGRTrophies(el) {
  el.innerHTML = `
  <div class="mgr-trophies">
    <h3 class="mgr-section-title">🏆 TROPHY CABINET</h3>
    ${MGR.trophies.length === 0
      ? '<p class="mgr-empty">No trophies yet. Win the league to earn your first!</p>'
      : `<div class="mgr-trophy-grid">
          ${MGR.trophies.map(t => `
          <div class="mgr-trophy-item">
            <div class="mgr-trophy-icon">${t.icon}</div>
            <div class="mgr-trophy-name">${t.name}</div>
            <div class="mgr-trophy-season">Season ${t.season}</div>
          </div>`).join('')}
        </div>`}
    <button class="mgr-btn-nav" style="margin-top:20px" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
  </div>`;
}

// ===== INIT =====
loadMGR();

// ===== SCREEN HOOK (chained in extras.js) =====
window.renderManagerScreen = renderManagerScreen;
