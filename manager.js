// =============================================
// MANAGER.JS — Manager Mode (Separate Squad)
// =============================================

const MGR = {
  teamName: 'My Team',
  credits: 500,
  tactic: 'balanced',
  formation: '2-1-2',
  season: 1,
  week: 0,
  wins: 0, losses: 0,
  points: 0,
  winStreak: 0,
  fanRating: 50,      // 0-100
  morale: 80,         // 0-100
  trophies: [],
  roster: { PG:null, SG:null, SF:null, PF:null, C:null }, // manager-only squad
  rosterPlayers: {},  // id → player object (separate from PS.collection)
  scoutedPlayer: null,
  schedule: [],
  results: [],
  active: false,
  phase: 'menu',
};

const MGR_TEAMS = [
  { name: 'Lake Warriors',   city: 'Los Angeles',  ovr: 88, tactic: 'balanced', color: '#1D428A', wins: 0, losses: 0, pts: 0 },
  { name: 'Heat Kings',      city: 'Miami',        ovr: 84, tactic: 'attack',   color: '#98002E', wins: 0, losses: 0, pts: 0 },
  { name: 'Bulls Legacy',    city: 'Chicago',      ovr: 91, tactic: 'defense',  color: '#CE1141', wins: 0, losses: 0, pts: 0 },
  { name: 'Thunder Pack',    city: 'Oklahoma',     ovr: 86, tactic: 'attack',   color: '#007AC1', wins: 0, losses: 0, pts: 0 },
  { name: 'Celtic Pride',    city: 'Boston',       ovr: 90, tactic: 'balanced', color: '#007A33', wins: 0, losses: 0, pts: 0 },
  { name: 'Nets Empire',     city: 'Brooklyn',     ovr: 87, tactic: 'attack',   color: '#333333', wins: 0, losses: 0, pts: 0 },
  { name: 'Spur Dynasty',    city: 'San Antonio',  ovr: 89, tactic: 'defense',  color: '#C0C0C0', wins: 0, losses: 0, pts: 0 },
  { name: 'Warrior Code',    city: 'Golden State', ovr: 92, tactic: 'attack',   color: '#FFC72C', wins: 0, losses: 0, pts: 0 },
];

const TRANSFER_MARKET_PLAYERS = [
  { id:'tm1',  name:'D. Fox',      pos:'PG', ovr:84, mcCost:30,  stats:{sht:82,spd:90,drb:85,def:79,phy:78}, rarity:'gold',   team:'Sacramento' },
  { id:'tm2',  name:'J. Tatum',    pos:'SF', ovr:89, mcCost:80,  stats:{sht:88,spd:80,drb:84,def:82,phy:83}, rarity:'elite',  team:'Boston' },
  { id:'tm3',  name:'B. Adebayo',  pos:'C',  ovr:86, mcCost:60,  stats:{sht:75,spd:72,drb:78,def:90,phy:92}, rarity:'elite',  team:'Miami' },
  { id:'tm4',  name:'T. Young',    pos:'PG', ovr:85, mcCost:55,  stats:{sht:87,spd:82,drb:88,def:65,phy:70}, rarity:'elite',  team:'Atlanta' },
  { id:'tm5',  name:'R. Barrett',  pos:'SG', ovr:80, mcCost:25,  stats:{sht:79,spd:78,drb:80,def:77,phy:80}, rarity:'gold',   team:'Toronto' },
  { id:'tm6',  name:'Z. LaVine',   pos:'SG', ovr:87, mcCost:65,  stats:{sht:89,spd:86,drb:87,def:72,phy:80}, rarity:'elite',  team:'Chicago' },
  { id:'tm7',  name:'A. Davis',    pos:'C',  ovr:93, mcCost:140, stats:{sht:83,spd:76,drb:84,def:94,phy:95}, rarity:'legend', team:'LA Lakers' },
  { id:'tm8',  name:'P. George',   pos:'SF', ovr:86, mcCost:60,  stats:{sht:85,spd:82,drb:83,def:86,phy:82}, rarity:'elite',  team:'Philadelphia' },
  { id:'tm9',  name:'D. Booker',   pos:'SG', ovr:90, mcCost:90,  stats:{sht:93,spd:80,drb:86,def:76,phy:79}, rarity:'elite',  team:'Phoenix' },
  { id:'tm10', name:'K. Towns',    pos:'C',  ovr:85, mcCost:50,  stats:{sht:84,spd:72,drb:76,def:80,phy:88}, rarity:'elite',  team:'NY Knicks' },
  { id:'tm11', name:'M. Monk',     pos:'SG', ovr:77, mcCost:15,  stats:{sht:82,spd:84,drb:79,def:72,phy:73}, rarity:'gold',   team:'Sacramento' },
  { id:'tm12', name:'C. Wood',     pos:'PF', ovr:78, mcCost:18,  stats:{sht:77,spd:73,drb:74,def:76,phy:84}, rarity:'gold',   team:'Dallas' },
  { id:'tm13', name:'J. Wiseman',  pos:'C',  ovr:76, mcCost:12,  stats:{sht:70,spd:78,drb:72,def:84,phy:90}, rarity:'gold',   team:'Detroit' },
  { id:'tm14', name:'O. Anunoby',  pos:'SF', ovr:79, mcCost:22,  stats:{sht:76,spd:88,drb:75,def:90,phy:88}, rarity:'gold',   team:'NY Knicks' },
  { id:'tm15', name:'C. Anthony',  pos:'PF', ovr:82, mcCost:35,  stats:{sht:81,spd:82,drb:80,def:75,phy:87}, rarity:'gold',   team:'Portland' },
];

// Scout pool — hidden players only discoverable by scouting
const SCOUT_POOL = [
  { id:'sc1', name:'E. Mobley',   pos:'C',  ovr:80, mcCost:45,  stats:{sht:72,spd:83,drb:77,def:92,phy:90}, rarity:'gold',   team:'Cleveland' },
  { id:'sc2', name:'T. Haliburton',pos:'PG',ovr:81, mcCost:40,  stats:{sht:80,spd:87,drb:85,def:74,phy:74}, rarity:'gold',   team:'Indiana' },
  { id:'sc3', name:'C. Kuminga',  pos:'SF', ovr:79, mcCost:28,  stats:{sht:78,spd:89,drb:80,def:79,phy:88}, rarity:'gold',   team:'Golden State' },
  { id:'sc4', name:'J. Williams', pos:'PF', ovr:77, mcCost:20,  stats:{sht:74,spd:84,drb:73,def:86,phy:91}, rarity:'gold',   team:'Boston' },
  { id:'sc5', name:'S. Gilgeous', pos:'PG', ovr:88, mcCost:100, stats:{sht:90,spd:93,drb:92,def:84,phy:85}, rarity:'elite',  team:'OKC' },
  { id:'sc6', name:'P. Siakam',   pos:'PF', ovr:83, mcCost:48,  stats:{sht:80,spd:88,drb:84,def:82,phy:88}, rarity:'gold',   team:'Indiana' },
  { id:'sc7', name:'I. Hartenstein',pos:'C',ovr:78, mcCost:22,  stats:{sht:68,spd:76,drb:74,def:88,phy:92}, rarity:'gold',   team:'OKC' },
  { id:'sc8', name:'L. Doncic',   pos:'PG', ovr:95, mcCost:200, stats:{sht:93,spd:83,drb:96,def:74,phy:91}, rarity:'legend', team:'Dallas' },
];

// ===== SAVE / LOAD =====
function loadMGR() {
  const saved = JSON.parse(localStorage.getItem('mgrState') || 'null');
  if (saved) {
    Object.assign(MGR, saved);
    if (!MGR.credits)       MGR.credits = 500;
    if (!MGR.roster)        MGR.roster = { PG:null, SG:null, SF:null, PF:null, C:null };
    if (!MGR.rosterPlayers) MGR.rosterPlayers = {};
    if (!MGR.winStreak)     MGR.winStreak = 0;
    if (MGR.fanRating === undefined) MGR.fanRating = 50;
    if (MGR.morale === undefined)    MGR.morale = 80;
    if (saved.aiTeams) MGR_TEAMS.forEach((t, i) => saved.aiTeams[i] && Object.assign(t, saved.aiTeams[i]));
  }
}

function saveMGR() {
  const state = { ...MGR, aiTeams: MGR_TEAMS.map(t => ({ wins: t.wins, losses: t.losses, pts: t.pts })) };
  localStorage.setItem('mgrState', JSON.stringify(state));
  if (window.authSnapshotSave) window.authSnapshotSave();
}

// ===== OVR CALCULATION (uses manager-only roster) =====
function mgrMyOVR() {
  const positions = ['PG','SG','SF','PF','C'];
  const players = positions.map(pos => {
    const id = MGR.roster[pos];
    return id ? MGR.rosterPlayers[id] : null;
  }).filter(Boolean);

  if (!players.length) return 65;
  const avg = players.reduce((s, p) => s + (p.ovr || 70), 0) / players.length;
  const tacticMod = { attack: 3, balanced: 0, defense: -2 }[MGR.tactic] || 0;
  const moraleMod = Math.round((MGR.morale - 80) * 0.05);
  return Math.round(Math.min(99, avg + tacticMod + moraleMod));
}

function mgrRosterCount() {
  return Object.values(MGR.roster).filter(Boolean).length;
}

// ===== SIM MATCH =====
function mgrSimMatch(opponentIdx) {
  const myOVR = mgrMyOVR();
  const opp = MGR_TEAMS[opponentIdx];

  const tacticEdge = {
    'attack-defense': -5,   'defense-attack': 5,
    'attack-balanced': 3,   'balanced-attack': -3,
    'defense-balanced': -2, 'balanced-defense': 2,
  }[`${MGR.tactic}-${opp.tactic}`] || 0;

  const diff = (myOVR + tacticEdge) - opp.ovr;
  const winChance = 0.5 + diff * 0.015;
  const win = Math.random() < Math.max(0.05, Math.min(0.95, winChance));

  const baseScore = 85 + Math.floor(Math.random() * 30);
  let myScore, oppScore;
  if (win) {
    myScore  = baseScore + Math.floor(Math.random() * 15) + 5;
    oppScore = baseScore - Math.floor(Math.random() * 12) - 1;
  } else {
    oppScore = baseScore + Math.floor(Math.random() * 15) + 5;
    myScore  = baseScore - Math.floor(Math.random() * 12) - 1;
  }

  // Win streak
  if (win) {
    MGR.winStreak++;
    MGR.fanRating   = Math.min(100, MGR.fanRating + 5);
    MGR.morale      = Math.min(100, MGR.morale + 3);
  } else {
    MGR.winStreak   = 0;
    MGR.fanRating   = Math.max(0, MGR.fanRating - 4);
    MGR.morale      = Math.max(20, MGR.morale - 5);
  }

  // MC reward with streak bonus
  let streakMult = 1;
  if (MGR.winStreak >= 5) streakMult = 1.5;
  else if (MGR.winStreak >= 3) streakMult = 1.2;

  const fanBonus = Math.floor((MGR.fanRating - 50) * 0.5);
  const mcBase   = win ? 80 + Math.floor(Math.random() * 40) : 25;
  const mcReward = Math.floor(mcBase * streakMult) + fanBonus;
  MGR.credits   += Math.max(5, mcReward);

  const coinReward = win ? 1500 + Math.floor(Math.random() * 1000) : 400;
  window.addCoins(coinReward);

  if (win)  { MGR.wins++;   MGR.points += 3; }
  else      { MGR.losses++; MGR.points += 1; }
  opp.wins     += win ? 0 : 1;
  opp.losses   += win ? 1 : 0;
  opp.pts      += win ? 1 : 3;
  MGR.week++;

  const result = { win, myScore, oppScore, opponent: opp.name, week: MGR.week, mcReward, reward: coinReward, streak: MGR.winStreak };
  MGR.results.push(result);

  if (window.trackDailyProgress) window.trackDailyProgress('managerWins', win ? 1 : 0);
  saveMGR();
  return result;
}

function mgrLeagueTable() {
  const all = [
    { name: 'MY TEAM ⭐', ovr: mgrMyOVR(), color: '#ff8c00', wins: MGR.wins, losses: MGR.losses, pts: MGR.points, isPlayer: true },
    ...MGR_TEAMS,
  ];
  return all.sort((a, b) => b.pts - a.pts || b.wins - a.wins);
}

function mgrEndSeason() {
  const table = mgrLeagueTable();
  const myRank = table.findIndex(t => t.isPlayer) + 1;
  let trophy = null;
  if (myRank === 1)      trophy = { name: 'League Champion', icon: '🏆', season: MGR.season };
  else if (myRank <= 3)  trophy = { name: 'Top 3 Finish',    icon: '🥉', season: MGR.season };
  if (trophy) {
    MGR.trophies.push(trophy);
    window.addCoins(myRank === 1 ? 20000 : 8000);
    MGR.credits += myRank === 1 ? 500 : 200;
    if (myRank === 1 && window.addGems) window.addGems(3);
  }

  MGR.season++;
  MGR.week = 0; MGR.wins = 0; MGR.losses = 0; MGR.points = 0;
  MGR.winStreak = 0;
  MGR.results = [];
  MGR.schedule = buildSchedule();
  MGR_TEAMS.forEach(t => { t.wins = 0; t.losses = 0; t.pts = 0; });
  saveMGR();
  return { rank: myRank, trophy };
}

function buildSchedule() {
  const sched = [];
  for (let i = 0; i < MGR_TEAMS.length; i++) {
    sched.push(i);
    if (i < 4) sched.push(i);
  }
  for (let i = sched.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sched[i], sched[j]] = [sched[j], sched[i]];
  }
  return sched;
}

// ===== RENDER =====
function renderManagerScreen() {
  const el = document.getElementById('managerContent');
  if (!el) return;
  if (!MGR.active) { renderMGRMenu(el); return; }
  switch (MGR.phase) {
    case 'season':   renderMGRSeason(el);   break;
    case 'roster':   renderMGRRoster(el);   break;
    case 'transfer': renderMGRTransfer(el); break;
    case 'scout':    renderMGRScout(el);    break;
    case 'table':    renderMGRTable(el);    break;
    case 'trophies': renderMGRTrophies(el); break;
    case 'tactics':  renderMGRTactics(el);  break;
    default: renderMGRSeason(el);
  }
}

function renderMGRMenu(el) {
  el.innerHTML = `
  <div class="mgr-menu">
    <div class="mgr-logo">🏟️</div>
    <h2 class="mgr-menu-title">MANAGER MODE</h2>
    <p class="mgr-menu-sub">Build your own team with Manager Credits. Your roster is separate from My Squad.</p>
    <div class="mgr-menu-grid">
      <button class="mgr-btn-big" onclick="mgrStartNew()">🆕 NEW SEASON</button>
      ${MGR.active ? `<button class="mgr-btn-big mgr-btn-continue" onclick="MGR.phase='season';renderManagerScreen()">▶ CONTINUE</button>` : ''}
    </div>
    ${MGR.trophies.length ? `<div class="mgr-trophy-shelf">
      ${MGR.trophies.map(t=>`<span title="${t.name} (S${t.season})">${t.icon}</span>`).join('')}
      <span class="mgr-trophy-label">${MGR.trophies.length} trophy${MGR.trophies.length>1?'ies':''}</span>
    </div>` : ''}
  </div>`;
}

window.mgrStartNew = function() {
  MGR.active = true;
  MGR.week = 0; MGR.wins = 0; MGR.losses = 0; MGR.points = 0;
  MGR.winStreak = 0; MGR.results = [];
  MGR.schedule = buildSchedule();
  if (!MGR.credits)       MGR.credits = 500;
  if (!MGR.roster)        MGR.roster = { PG:null, SG:null, SF:null, PF:null, C:null };
  if (!MGR.rosterPlayers) MGR.rosterPlayers = {};
  MGR_TEAMS.forEach(t => { t.wins = 0; t.losses = 0; t.pts = 0; });
  MGR.phase = 'season';
  saveMGR();
  renderManagerScreen();
};

// ===== SEASON VIEW =====
function renderMGRSeason(el) {
  const totalMatches = MGR.schedule.length;
  const matchesLeft  = totalMatches - MGR.week;
  const myOVR        = mgrMyOVR();
  const rCount       = mgrRosterCount();

  const lastResult = MGR.results[MGR.results.length - 1];
  const lastHtml = lastResult ? `
  <div class="mgr-last-result ${lastResult.win ? 'mgr-win' : 'mgr-loss'}">
    <span>${lastResult.win ? '✅ WIN' : '❌ LOSS'}</span>
    <span>${lastResult.myScore} – ${lastResult.oppScore} vs ${lastResult.opponent}</span>
    <span class="mgr-reward">+🪙${lastResult.reward.toLocaleString()} +${lastResult.mcReward}MC${lastResult.streak >= 3 ? ` 🔥${lastResult.streak}` : ''}</span>
  </div>` : '';

  const nextOppIdx = MGR.schedule[MGR.week];
  const nextOpp    = MGR_TEAMS[nextOppIdx];

  const streakHtml = MGR.winStreak >= 2 ? `<div class="mgr-streak-banner">🔥 WIN STREAK: ${MGR.winStreak} — ${MGR.winStreak >= 5 ? '+50% MC' : '+20% MC'} per win!</div>` : '';

  el.innerHTML = `
  <div class="mgr-season">
    <div class="mgr-header-row">
      <div class="mgr-stat-box"><div class="mgr-stat-num">${MGR.season}</div><div class="mgr-stat-lbl">SEASON</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num">${MGR.wins}W-${MGR.losses}L</div><div class="mgr-stat-lbl">RECORD</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num">${matchesLeft}</div><div class="mgr-stat-lbl">GAMES LEFT</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num">${myOVR}</div><div class="mgr-stat-lbl">TEAM OVR</div></div>
      <div class="mgr-stat-box"><div class="mgr-stat-num" style="color:#22c55e">${MGR.credits}</div><div class="mgr-stat-lbl">MC 💳</div></div>
    </div>

    <div class="mgr-vitals-row">
      <span>📣 Fans: <strong style="color:${MGR.fanRating>=70?'#22c55e':MGR.fanRating>=40?'#ff8c00':'#f44'}">${MGR.fanRating}%</strong></span>
      <span>💪 Morale: <strong style="color:${MGR.morale>=70?'#22c55e':MGR.morale>=40?'#ff8c00':'#f44'}">${MGR.morale}</strong></span>
      <span>👥 Roster: <strong style="color:${rCount>=5?'#22c55e':'#ff8c00'}">${rCount}/5</strong></span>
    </div>

    ${streakHtml}
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
      <p>Season complete! View the table to see your rank.</p>
      <button class="mgr-btn-play" onclick="mgrDoEndSeason()">🏆 END SEASON</button>
    </div>` : ''}

    <div class="mgr-nav-row">
      <button class="mgr-btn-nav" onclick="MGR.phase='roster';renderManagerScreen()">👥 My Roster</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='transfer';renderManagerScreen()">💸 Transfers</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='scout';renderManagerScreen()">🔭 Scout</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='table';renderManagerScreen()">📊 Table</button>
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
    ? `Season ${MGR.season-1} done! You finished #${rank}. ${trophy.icon} ${trophy.name}!`
    : `Season ${MGR.season-1} done! You finished #${rank}. Keep building!`;
  updateCoinsDisplay();
  alert(msg);
  renderManagerScreen();
};

// ===== ROSTER SCREEN =====
function renderMGRRoster(el) {
  const positions = ['PG','SG','SF','PF','C'];
  const posNames  = { PG:'Point Guard', SG:'Shooting Guard', SF:'Small Forward', PF:'Power Forward', C:'Center' };

  const rosterHtml = positions.map(pos => {
    const id = MGR.roster[pos];
    const p  = id ? MGR.rosterPlayers[id] : null;
    const rarColor = p ? ({bronze:'#cd7f32',silver:'#c0c0c0',gold:'#ffd700',elite:'#a855f7',legend:'#ff8c00'}[p.rarity]||'#888') : '#444';
    return `
    <div class="mgr-roster-slot">
      <div class="mgr-roster-pos-label">${pos}<small> ${posNames[pos]}</small></div>
      ${p ? `
      <div class="mgr-roster-player" style="border-color:${rarColor}55">
        <div class="mgr-roster-ovr" style="color:${rarColor}">${p.ovr}</div>
        <div class="mgr-roster-info">
          <div class="mgr-roster-name">${p.name}</div>
          <div class="mgr-roster-stats">SHT:${p.stats.sht} SPD:${p.stats.spd} DEF:${p.stats.def}</div>
        </div>
        <button class="mgr-btn-sm" style="color:#f44" onclick="mgrReleasePlayer('${pos}')">✕</button>
      </div>` : `
      <div class="mgr-roster-empty" onclick="MGR.phase='transfer';renderManagerScreen()">
        + Sign a ${pos} in Transfer Market
      </div>`}
    </div>`;
  }).join('');

  const benchPlayers = Object.keys(MGR.rosterPlayers).filter(id => !Object.values(MGR.roster).includes(id));
  const benchHtml = benchPlayers.length ? `
  <h4 class="mgr-section-title" style="margin-top:16px">BENCH (${benchPlayers.length})</h4>
  <div class="mgr-bench-grid">
    ${benchPlayers.map(id => {
      const p = MGR.rosterPlayers[id];
      if (!p) return '';
      const rarColor = {bronze:'#cd7f32',silver:'#c0c0c0',gold:'#ffd700',elite:'#a855f7',legend:'#ff8c00'}[p.rarity]||'#888';
      return `
      <div class="mgr-roster-player" style="border-color:${rarColor}55">
        <div class="mgr-roster-ovr" style="color:${rarColor}">${p.ovr}</div>
        <div class="mgr-roster-info">
          <div class="mgr-roster-name">${p.name} <span style="color:#666;font-size:10px">${p.pos}</span></div>
          <div class="mgr-roster-stats">SHT:${p.stats.sht} SPD:${p.stats.spd} DEF:${p.stats.def}</div>
        </div>
        <button class="mgr-btn-sm" onclick="mgrStartRosterPlayer('${id}')">→</button>
      </div>`;
    }).join('')}
  </div>` : '';

  el.innerHTML = `
  <div class="mgr-roster-wrap">
    <h3 class="mgr-section-title">👥 MANAGER ROSTER
      <span style="font-size:11px;color:#888;font-weight:400;margin-left:8px">Separate from My Squad — earn these through Manager mode</span>
    </h3>
    <div class="mgr-roster-grid">${rosterHtml}</div>
    ${benchHtml}
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button class="mgr-btn-nav" onclick="MGR.phase='transfer';renderManagerScreen()">💸 Transfer Market</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='scout';renderManagerScreen()">🔭 Scout Players</button>
      <button class="mgr-btn-nav" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
    </div>
  </div>`;
}

window.mgrReleasePlayer = function(pos) {
  const id = MGR.roster[pos];
  if (!id) return;
  const p = MGR.rosterPlayers[id];
  if (!confirm(`Release ${p ? p.name : 'this player'}? They will go to the bench.`)) return;
  MGR.roster[pos] = null;
  saveMGR();
  renderManagerScreen();
};

window.mgrStartRosterPlayer = function(id) {
  const p = MGR.rosterPlayers[id];
  if (!p) return;
  const pos = p.pos;
  const current = MGR.roster[pos];
  if (current && current !== id) {
    // Current starter goes to bench (already in rosterPlayers, just remove from roster)
    MGR.roster[pos] = null;
  }
  // Assign to their natural position; if taken, show alert to swap
  if (MGR.roster[pos]) {
    alert(`${pos} slot is taken. Release the current player first.`);
    return;
  }
  // Remove from any other position
  Object.keys(MGR.roster).forEach(pPos => { if (MGR.roster[pPos] === id) MGR.roster[pPos] = null; });
  MGR.roster[pos] = id;
  saveMGR();
  renderManagerScreen();
};

// ===== TRANSFER MARKET =====
function renderMGRTransfer(el) {
  el.innerHTML = `
  <div class="mgr-transfer">
    <h3 class="mgr-section-title">💸 TRANSFER MARKET</h3>
    <div class="mgr-budget-bar">Manager Credits: <strong style="color:#22c55e">${MGR.credits} MC 💳</strong>
      &nbsp;·&nbsp; Players go to your Manager Roster — not My Squad</div>
    <div class="mgr-transfer-grid">
      ${TRANSFER_MARKET_PLAYERS.map(p => {
        const owned    = !!MGR.rosterPlayers[p.id];
        const canAfford = MGR.credits >= p.mcCost;
        return `
        <div class="mgr-transfer-card rarity-${p.rarity}">
          <div class="mgr-transfer-ovr">${p.ovr}</div>
          <div class="mgr-transfer-name">${p.name}</div>
          <div class="mgr-transfer-pos">${p.pos} · ${p.rarity.toUpperCase()}</div>
          <div class="mgr-transfer-stats">SHT:${p.stats.sht} SPD:${p.stats.spd} DRB:${p.stats.drb} DEF:${p.stats.def}</div>
          <div class="mgr-transfer-price">💳 ${p.mcCost} MC</div>
          ${owned
            ? `<div class="mgr-transfer-owned">✅ SIGNED</div>`
            : `<button class="mgr-btn-buy ${canAfford ? '' : 'mgr-btn-disabled'}"
                onclick="mgrSignPlayer('${p.id}','transfer')" ${canAfford ? '' : 'disabled'}>SIGN</button>`}
        </div>`;
      }).join('')}
    </div>
    <button class="mgr-btn-nav" style="margin-top:16px" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
  </div>`;
}

// ===== SCOUTING =====
function renderMGRScout(el) {
  el.innerHTML = `
  <div class="mgr-scout">
    <h3 class="mgr-section-title">🔭 SCOUTING</h3>
    <div class="mgr-budget-bar">MC: <strong style="color:#22c55e">${MGR.credits}</strong>
      &nbsp;·&nbsp; Scout cost: <strong>50 MC</strong> per report</div>
    <p style="color:#888;font-size:12px;margin:8px 0 14px">Discover hidden players not available in the open transfer market.</p>

    ${MGR.scoutedPlayer ? `
    <div class="mgr-scout-result">
      <div class="mgr-scout-found">🔭 SCOUTED PLAYER</div>
      <div class="mgr-transfer-card rarity-${MGR.scoutedPlayer.rarity}" style="max-width:220px;margin:0 auto">
        <div class="mgr-transfer-ovr">${MGR.scoutedPlayer.ovr}</div>
        <div class="mgr-transfer-name">${MGR.scoutedPlayer.name}</div>
        <div class="mgr-transfer-pos">${MGR.scoutedPlayer.pos} · ${MGR.scoutedPlayer.rarity.toUpperCase()}</div>
        <div class="mgr-transfer-stats">SHT:${MGR.scoutedPlayer.stats.sht} SPD:${MGR.scoutedPlayer.stats.spd} DRB:${MGR.scoutedPlayer.stats.drb} DEF:${MGR.scoutedPlayer.stats.def}</div>
        <div class="mgr-transfer-price">💳 ${MGR.scoutedPlayer.mcCost} MC</div>
        ${MGR.rosterPlayers[MGR.scoutedPlayer.id]
          ? `<div class="mgr-transfer-owned">✅ SIGNED</div>`
          : MGR.credits >= MGR.scoutedPlayer.mcCost
            ? `<button class="mgr-btn-buy" onclick="mgrSignPlayer('${MGR.scoutedPlayer.id}','scout')">SIGN NOW</button>`
            : `<div style="color:#888;font-size:11px">Need ${MGR.scoutedPlayer.mcCost} MC</div>`}
      </div>
    </div>` : ''}

    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center">
      <button class="mgr-btn-play" onclick="mgrDoScout()" ${MGR.credits < 50 ? 'disabled style="opacity:0.5"' : ''}>
        🔭 SCOUT PLAYER (50 MC)
      </button>
      <button class="mgr-btn-nav" onclick="MGR.phase='season';renderManagerScreen()">← Back</button>
    </div>
  </div>`;
}

window.mgrDoScout = function() {
  if (MGR.credits < 50) { alert('Need 50 MC to scout!'); return; }
  MGR.credits -= 50;
  const unowned = SCOUT_POOL.filter(p => !MGR.rosterPlayers[p.id]);
  if (!unowned.length) { alert('All scouted players are already signed!'); return; }
  MGR.scoutedPlayer = unowned[Math.floor(Math.random() * unowned.length)];
  saveMGR();
  renderManagerScreen();
};

window.mgrSignPlayer = function(id, source) {
  const pool = source === 'scout' ? SCOUT_POOL : TRANSFER_MARKET_PLAYERS;
  const p = pool.find(x => x.id === id);
  if (!p) return;
  if (MGR.rosterPlayers[p.id]) { alert('Already signed!'); return; }
  if (MGR.credits < p.mcCost) { alert(`Need ${p.mcCost} MC!`); return; }
  MGR.credits -= p.mcCost;
  // Add to manager-only rosterPlayers (NOT PS.collection)
  MGR.rosterPlayers[p.id] = { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, rarity: p.rarity, stats: { ...p.stats } };
  // Auto-assign to position if empty
  if (!MGR.roster[p.pos]) MGR.roster[p.pos] = p.id;
  if (source === 'scout') MGR.scoutedPlayer = null;
  saveMGR();
  alert(`✅ ${p.name} signed! (-${p.mcCost} MC) Added to Manager Roster.`);
  renderManagerScreen();
};

// ===== TACTICS =====
function renderMGRTactics(el) {
  const formations = ['2-1-2','1-2-2','2-2-1','3-2'];
  const tactics = [
    { id:'attack',   icon:'⚡', label:'ATTACK',   desc:'+3 OVR, aggressive offense. Weak vs Defense.' },
    { id:'balanced', icon:'⚖️', label:'BALANCED', desc:'Neutral matchup, consistent performance.' },
    { id:'defense',  icon:'🛡️', label:'DEFENSE',  desc:'+2 OVR vs Attack, strong defensive scheme.' },
  ];
  el.innerHTML = `
  <div class="mgr-tactics">
    <h3 class="mgr-section-title">⚙️ TACTICS & FORMATION</h3>
    <div class="mgr-tactics-group">
      <div class="mgr-tactics-label">PLAY STYLE</div>
      <div class="mgr-tactics-grid">
        ${tactics.map(t=>`
        <div class="mgr-tactic-card ${MGR.tactic===t.id?'mgr-tactic-active':''}" onclick="mgrSetTactic('${t.id}')">
          <div class="mgr-tactic-icon">${t.icon}</div>
          <div class="mgr-tactic-name">${t.label}</div>
          <div class="mgr-tactic-desc">${t.desc}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="mgr-tactics-group">
      <div class="mgr-tactics-label">FORMATION</div>
      <div class="mgr-formation-grid">
        ${formations.map(f=>`
        <button class="mgr-formation-btn ${MGR.formation===f?'mgr-formation-active':''}" onclick="mgrSetFormation('${f}')">${f}</button>
        `).join('')}
      </div>
    </div>
    <div class="mgr-tactics-back">
      <button class="mgr-btn-nav" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
    </div>
  </div>`;
}
window.mgrSetTactic   = t => { MGR.tactic    = t; saveMGR(); renderManagerScreen(); };
window.mgrSetFormation = f => { MGR.formation = f; saveMGR(); renderManagerScreen(); };

// ===== LEAGUE TABLE =====
function renderMGRTable(el) {
  const table = mgrLeagueTable();
  el.innerHTML = `
  <div class="mgr-table-wrap">
    <h3 class="mgr-section-title">📊 LEAGUE TABLE — Season ${MGR.season}</h3>
    <table class="mgr-table">
      <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>PTS</th></tr></thead>
      <tbody>
        ${table.map((t,i)=>`
        <tr class="${t.isPlayer?'mgr-my-row':''}">
          <td>${i+1}</td>
          <td><span class="mgr-dot" style="background:${t.color||'#888'}"></span>${t.name}</td>
          <td>${t.wins}</td><td>${t.losses}</td><td><strong>${t.pts}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
    <button class="mgr-btn-nav" style="margin-top:16px" onclick="MGR.phase='season';renderManagerScreen()">← Back to Season</button>
  </div>`;
}

// ===== TROPHIES =====
function renderMGRTrophies(el) {
  el.innerHTML = `
  <div class="mgr-trophies">
    <h3 class="mgr-section-title">🏆 TROPHY CABINET</h3>
    ${!MGR.trophies.length
      ? '<p class="mgr-empty">No trophies yet. Win the league to earn your first!</p>'
      : `<div class="mgr-trophy-grid">
          ${MGR.trophies.map(t=>`
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
window.renderManagerScreen = renderManagerScreen;
window.MGR = MGR;
window.saveMGR = saveMGR;
