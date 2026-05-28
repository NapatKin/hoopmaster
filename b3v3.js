// ===== 3v3 BASKETBALL GAME =====
const C3 = document.getElementById('canvas3v3');
const ctx3 = C3.getContext('2d');

// ── Court measurements (recalculated on resize) ──
let CM = {};
function recalcCourt3() {
  C3.width  = C3.offsetWidth;
  C3.height = C3.offsetHeight;
  const W = C3.width, H = C3.height;
  const cPad = W * 0.06;
  CM = {
    W, H,
    cL: cPad, cR: W - cPad, cT: H * 0.04, cB: H * 0.97,
    cW: W - cPad * 2, cH: H * 0.93,
    hoopX: W / 2, hoopY: H * 0.09,
    rimR: W * 0.024,
    threeR: H * 0.36,
    paintW: W * 0.24, paintH: H * 0.28,
    ftY: H * 0.34,
    pR: Math.max(14, W * 0.022),   // player radius
    bR: Math.max(9,  W * 0.014),   // ball radius
  };
}

// ── Input ──
const K = {};
document.addEventListener('keydown', e => { K[e.code] = true; });
document.addEventListener('keyup',   e => { K[e.code] = false; });

// ── Particles ──
const FX = [];
function spawnFX(x, y, opts) {
  for (let i = 0; i < (opts.n || 10); i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (opts.speed || 3) * (0.5 + Math.random());
    FX.push({
      x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s,
      life: opts.life || 40, maxLife: opts.life || 40,
      color: Array.isArray(opts.color) ? opts.color[Math.floor(Math.random()*opts.color.length)] : (opts.color||'#ff8c00'),
      size: (opts.size || 5) * (0.6 + Math.random()*0.8),
      gravity: opts.gravity || 0.08,
    });
  }
}

// ── Player ──
class Player3 {
  constructor(id, x, y, team, isUser, name, initials, color, stats) {
    this.id = id; this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.team = team; this.isUser = isUser;
    this.name = name; this.initials = initials;
    this.color = color;
    this.stats = stats || { sht:75, spd:80, drb:75, def:75, phy:75 };
    this.hasBall = false;
    this.spd = 2.2 + (this.stats.spd / 100) * 2.2;
    this.aiState  = 'idle';
    this.aiTimer  = 0;
    this.aiTarget = null;
    this.shooting = false;
    this.shootTimer = 0;
    this.shotMeterVal = 50;  // oscillates 0-100
    this.shotMeterDir = 1;
    this.shotMeterSpeed = 1.8;
    this.dribbleAnim = 0;
    this.stunTimer = 0;
    this.trail = [];
  }
  get r() { return CM.pR || 16; }
}

// ── Ball ──
const BALL3 = {
  x: 0, y: 0, vx: 0, vy: 0,
  z: 0, vz: 0,          // z = height off ground (for arc)
  heldBy: null,          // player id
  inFlight: false,
  isPass: false,
  targetX: 0, targetY: 0,
  passTarget: null,      // player id for passes
  trail: [],
  get r() { return CM.bR || 10; }
};

// ── Game State ──
const G3 = {
  running: false,
  phase: 'warmup',  // warmup | playing | scored | gameover
  score: [0, 0],
  quarter: 1,
  timeLeft: 120,
  shotClock: 24,
  possession: 0,
  animId: null,
  lastPhaseTimer: 0,
  wonMessage: '',
  coinsEarned: 0,
};

let players3 = [];
let controlled = null;   // the player the user controls

// ── Build teams from squad ──
function buildTeams() {
  players3 = [];
  const W = C3.width || 800, H = C3.height || 600;

  // User team positions (bottom half)
  const userPos = [
    { x: W*0.5,  y: H*0.72 },
    { x: W*0.32, y: H*0.78 },
    { x: W*0.68, y: H*0.78 },
  ];
  // Opponent positions (top half)
  const oppPos = [
    { x: W*0.5,  y: H*0.28 },
    { x: W*0.32, y: H*0.22 },
    { x: W*0.68, y: H*0.22 },
  ];

  // Pull from squad if available
  let squadPlayers = [];
  if (typeof PS !== 'undefined') {
    const positions = ['PG','SG','SF','PF','C'];
    positions.forEach(pos => {
      const id = PS.squad[pos];
      if (id) {
        const p = PLAYER_DB.find(pl => pl.id === id);
        if (p) squadPlayers.push(p);
      }
    });
    // Fill gaps with collection
    if (squadPlayers.length < 3) {
      PS.collection.forEach(id => {
        if (squadPlayers.length >= 3) return;
        const p = PLAYER_DB.find(pl => pl.id === id);
        if (p && !squadPlayers.find(s => s.id === id)) squadPlayers.push(p);
      });
    }
    // Still not enough — add defaults
    while (squadPlayers.length < 3) {
      squadPlayers.push({ id:'default'+squadPlayers.length, name:'Player', stats:{sht:70,spd:75,drb:70,def:70,phy:75}, traits:[] });
    }
  } else {
    squadPlayers = [
      { id:'u1', name:'PG', stats:{sht:80,spd:88,drb:85,def:74,phy:78}, traits:[] },
      { id:'u2', name:'SG', stats:{sht:85,spd:84,drb:80,def:72,phy:76}, traits:[] },
      { id:'u3', name:'SF', stats:{sht:78,spd:82,drb:78,def:80,phy:82}, traits:[] },
    ];
  }

  // Opponent roster (random from DB)
  const oppRoster = typeof PLAYER_DB !== 'undefined'
    ? PLAYER_DB.filter(p => p.rarity === 'gold' || p.rarity === 'silver').sort(() => Math.random()-0.5).slice(0,3)
    : [
        { id:'o1', name:'Guard',   stats:{sht:78,spd:85,drb:80,def:75,phy:76}, traits:[] },
        { id:'o2', name:'Forward', stats:{sht:75,spd:80,drb:75,def:82,phy:85}, traits:[] },
        { id:'o3', name:'Center',  stats:{sht:70,spd:72,drb:70,def:88,phy:92}, traits:[] },
      ];

  // Create user players
  for (let i = 0; i < 3; i++) {
    const sp = squadPlayers[i];
    const initials = sp.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const p = new Player3('u'+i, userPos[i].x, userPos[i].y, 0, i===0, sp.name, initials, '#ff8c00', sp.stats);
    players3.push(p);
  }
  // Create opponent players
  for (let i = 0; i < 3; i++) {
    const op = oppRoster[i] || oppRoster[0];
    const initials = op.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const p = new Player3('o'+i, oppPos[i].x, oppPos[i].y, 1, false, op.name, initials, '#1e6fff', op.stats);
    players3.push(p);
  }

  controlled = players3[0];
  controlled.isUser = true;
}

function tipOff() {
  BALL3.x = CM.W / 2;
  BALL3.y = CM.H / 2;
  BALL3.vx = 0; BALL3.vy = 0;
  BALL3.z = 0; BALL3.vz = 0;
  BALL3.heldBy = null;
  BALL3.inFlight = false;
  BALL3.trail = [];
  // Give ball to center user player
  giveBallTo(players3[0]);
  G3.shotClock = 24;
}

function giveBallTo(player) {
  players3.forEach(p => p.hasBall = false);
  BALL3.heldBy = player.id;
  BALL3.inFlight = false;
  player.hasBall = true;
  G3.possession = player.team;
}

// ── Main start ──
function start3v3() {
  G3.score  = [0, 0];
  G3.quarter = 1;
  G3.timeLeft = 120;
  G3.shotClock = 24;
  G3.phase = 'warmup';
  G3.running = true;
  G3.coinsEarned = 0;
  FX.length = 0;

  cancelAnimationFrame(G3.animId);
  showScreen('game3v3');

  // Wait for canvas to be visible before reading its dimensions
  requestAnimationFrame(() => requestAnimationFrame(() => {
    recalcCourt3();
    buildTeams();
    tipOff();
    repositionPlayers();
    G3.animId = requestAnimationFrame(loop3);
  }));
}

function repositionPlayers() {
  const W = CM.W, H = CM.H;
  const userPos = [{x:W*.50,y:H*.72},{x:W*.32,y:H*.78},{x:W*.68,y:H*.78}];
  const oppPos  = [{x:W*.50,y:H*.28},{x:W*.32,y:H*.22},{x:W*.68,y:H*.22}];
  players3.filter(p=>p.team===0).forEach((p,i) => { p.x=userPos[i].x; p.y=userPos[i].y; });
  players3.filter(p=>p.team===1).forEach((p,i) => { p.x=oppPos[i].x;  p.y=oppPos[i].y;  });
  BALL3.x = CM.W/2; BALL3.y = CM.H/2;
}

// ── Game Loop ──
function loop3() {
  if (!G3.running) return;
  update3();
  draw3();
  G3.animId = requestAnimationFrame(loop3);
}

// ── UPDATE ──
function update3() {
  if (G3.phase === 'warmup') {
    G3.lastPhaseTimer++;
    if (G3.lastPhaseTimer > 90) { G3.phase = 'playing'; G3.lastPhaseTimer = 0; }
    updateBallPhysics();
    return;
  }
  if (G3.phase === 'scored') {
    G3.lastPhaseTimer++;
    updateFX();
    if (G3.lastPhaseTimer > 100) {
      G3.phase = 'playing';
      repositionPlayers();
      tipOff();
    }
    return;
  }
  if (G3.phase === 'gameover') return;

  // Timer
  G3.timeLeft -= 1/60;
  G3.shotClock -= 1/60;
  if (G3.timeLeft <= 0) {
    G3.timeLeft = 0;
    if (G3.quarter < 4) {
      G3.quarter++;
      G3.timeLeft = 120;
      G3.phase = 'scored';
      G3.lastPhaseTimer = 0;
    } else {
      endGame3();
      return;
    }
  }
  if (G3.shotClock <= 0) {
    // Shot clock violation — give ball to opponents
    G3.shotClock = 24;
    const opp = players3.find(p => p.team !== G3.possession);
    if (opp) giveBallTo(opp);
    showGameMsg('SHOT CLOCK!');
  }

  updateControlledPlayer();
  updateAI();
  separatePlayers();
  updateBallPhysics();
  checkBallPickup();
  checkShot();
  updateFX();
}

// ── User Input ──
function updateControlledPlayer() {
  const p = controlled;
  if (!p) return;
  const spd = p.spd;
  let mx = 0, my = 0;
  if (K['ArrowLeft']  || K['KeyA']) mx = -1;
  if (K['ArrowRight'] || K['KeyD']) mx =  1;
  if (K['ArrowUp']    || K['KeyW']) my = -1;
  if (K['ArrowDown']  || K['KeyS']) my =  1;
  if (mx && my) { mx *= 0.707; my *= 0.707; }
  p.vx = mx * spd;
  p.vy = my * spd;
  p.x = Math.max(CM.cL + p.r, Math.min(CM.cR - p.r, p.x + p.vx));
  p.y = Math.max(CM.cT + p.r, Math.min(CM.cB - p.r, p.y + p.vy));

  // Dribble anim
  if (p.hasBall) p.dribbleAnim = (p.dribbleAnim + 0.18) % (Math.PI * 2);

  // Shoot: Space / hold for shot meter
  if (p.hasBall) {
    if (K['Space'] && !p.shooting) { p.shooting = true; p.shootTimer = 0; }
    if (p.shooting) {
      p.shootTimer++;
      p.shotMeterVal += p.shotMeterDir * p.shotMeterSpeed;
      if (p.shotMeterVal >= 100 || p.shotMeterVal <= 0) p.shotMeterDir *= -1;
    }
    if (!K['Space'] && p.shooting) {
      p.shooting = false;
      shootBall3(p, p.shotMeterVal);
    }
  }

  // Pass: F or E
  if ((K['KeyF'] || K['KeyE']) && p.hasBall && !BALL3.inFlight) {
    K['KeyF'] = false; K['KeyE'] = false;
    const target = getBestPassTarget(p);
    if (target) passBall3(p, target);
  }

  // Switch player: Tab
  if (K['Tab']) {
    K['Tab'] = false;
    switchControlledPlayer();
  }
}

function getBestPassTarget(from) {
  const teammates = players3.filter(p => p.team === from.team && p.id !== from.id);
  // Pick most open teammate (farthest from nearest opponent)
  let best = null, bestDist = -1;
  teammates.forEach(tm => {
    const nearestOpp = players3.filter(p => p.team !== tm.team)
      .reduce((min, opp) => {
        const d = dist(tm, opp);
        return d < min ? d : min;
      }, Infinity);
    if (nearestOpp > bestDist) { bestDist = nearestOpp; best = tm; }
  });
  return best;
}

function switchControlledPlayer() {
  const userTeam = players3.filter(p => p.team === 0);
  // Switch to teammate closest to ball
  const others = userTeam.filter(p => p !== controlled);
  if (!others.length) return;
  const closest = others.reduce((a, b) => dist(a, BALL3) < dist(b, BALL3) ? a : b);
  controlled = closest;
}

// ── Shooting ──
function shootBall3(player, meterVal) {
  if (!player.hasBall) return;
  player.hasBall = false;
  BALL3.heldBy = null;

  // How close to center (50) is the meter? 0 = worst, 1 = perfect
  const accuracy = 1 - Math.abs(meterVal - 50) / 50;
  const distToHoop = dist(player, { x: CM.hoopX, y: CM.hoopY });
  const is3pt = distToHoop > CM.threeR * 0.9;

  // Defender pressure
  const nearestDef = players3.filter(p=>p.team!==player.team)
    .reduce((m,p) => Math.min(m,dist(player,p)), Infinity);
  const contestedPenalty = nearestDef < CM.pR * 3.5 ? 0.25 : 0;

  // SHT stat bonus
  const shtBonus = (player.stats.sht - 75) / 200;  // 0 at 75 sht

  // Distance penalty
  const maxRange = CM.threeR * 1.1;
  const distPenalty = Math.max(0, distToHoop / maxRange - 0.5);

  const successChance = Math.max(0.05,
    accuracy * 0.6 + shtBonus - distPenalty * 0.4 - contestedPenalty
  );

  const makes = Math.random() < successChance;

  // Launch ball toward hoop
  BALL3.x = player.x; BALL3.y = player.y;
  BALL3.inFlight = true;
  BALL3.isPass = false;
  BALL3.targetX = CM.hoopX + (makes ? 0 : (Math.random()-0.5) * CM.rimR * 3);
  BALL3.targetY = CM.hoopY + (makes ? 0 : (Math.random()-0.5) * CM.rimR * 3);
  BALL3._makes = makes;
  BALL3._is3pt = is3pt;
  BALL3._shooterTeam = player.team;
  BALL3._flightProgress = 0;
  BALL3._flightDuration = 35;
  BALL3._startX = player.x;
  BALL3._startY = player.y;
  BALL3.trail = [];
  playSound('shoot');
}

function passBall3(from, to) {
  from.hasBall = false;
  BALL3.heldBy = null;
  BALL3.inFlight = true;
  BALL3.isPass = true;
  BALL3.passTarget = to.id;
  BALL3._startX = from.x; BALL3._startY = from.y;
  BALL3.targetX = to.x; BALL3.targetY = to.y;
  BALL3._flightProgress = 0;
  BALL3._flightDuration = Math.max(15, dist(from,to) / 12);
  BALL3.trail = [];
  G3.shotClock = Math.min(24, G3.shotClock + 4);
}

// ── Ball Physics ──
function updateBallPhysics() {
  if (BALL3.inFlight) {
    BALL3._flightProgress++;
    const t = BALL3._flightProgress / BALL3._flightDuration;
    BALL3.trail.push({ x: BALL3.x, y: BALL3.y, age: 0 });
    if (BALL3.trail.length > 14) BALL3.trail.shift();
    BALL3.trail.forEach(tr => tr.age++);

    // Lerp position
    BALL3.x = lerp(BALL3._startX, BALL3.targetX, t);
    BALL3.y = lerp(BALL3._startY, BALL3.targetY, t);
    // Arc height
    BALL3.z = BALL3.isPass ? Math.sin(t * Math.PI) * 20 : Math.sin(t * Math.PI) * 60;

    if (t >= 1) {
      BALL3.inFlight = false;
      BALL3.trail = [];
      if (BALL3.isPass) {
        // Deliver to target
        const target = players3.find(p => p.id === BALL3.passTarget);
        if (target) giveBallTo(target);
        else { BALL3.heldBy = null; } // loose ball
      } else {
        // Shot landed
        landShot();
      }
    }
    return;
  }

  // Held by player — follow player
  if (BALL3.heldBy) {
    const holder = players3.find(p => p.id === BALL3.heldBy);
    if (holder) {
      const bobY = Math.sin(holder.dribbleAnim) * 8;
      BALL3.x = holder.x + holder.r * 0.7;
      BALL3.y = holder.y + holder.r * 0.5 + bobY;
      BALL3.z = 0;
    }
  }
}

function landShot() {
  if (BALL3._makes) {
    const pts = BALL3._is3pt ? 3 : 2;
    G3.score[BALL3._shooterTeam] += pts;
    G3.coinsEarned += pts * 15;
    G3.phase = 'scored';
    G3.lastPhaseTimer = 0;
    G3.shotClock = 24;
    spawnFX(CM.hoopX, CM.hoopY, {
      n: BALL3._is3pt ? 30 : 18, speed: 6, life: 60, size: 7,
      color: BALL3._shooterTeam === 0
        ? ['#ff8c00','#ffcc00','#ffffff']
        : ['#1e6fff','#00ccff','#ffffff']
    });
    showGameMsg(BALL3._is3pt ? '3 POINTER! +'+pts : 'BASKET! +'+pts, BALL3._shooterTeam===0 ? '#ff8c00':'#1e6fff');
    playSound('score');
    // Give ball to other team after score
    G3.possession = 1 - BALL3._shooterTeam;
  } else {
    // Rebound — give ball to nearest player
    setTimeout(() => {
      const nearest = players3.reduce((a,b) => dist(a,BALL3) < dist(b,BALL3) ? a : b);
      giveBallTo(nearest);
      G3.shotClock = 24;
    }, 200);
    playSound('rim');
  }
}

// ── Ball Pickup ──
function checkBallPickup() {
  if (BALL3.inFlight || BALL3.heldBy) return;
  const nearest = players3.reduce((a,b) => dist(a,BALL3) < dist(b,BALL3) ? a : b);
  if (dist(nearest, BALL3) < nearest.r + BALL3.r + 5) {
    giveBallTo(nearest);
  }
}

// ── Shot validation ──
function checkShot() {
  // nothing extra needed, handled in landShot
}

// ── AI ──
const AI_INTERVAL = 12;
let aiTick = 0;
function updateAI() {
  aiTick++;
  players3.forEach(p => {
    if (p === controlled) return;
    p.dribbleAnim = (p.dribbleAnim + 0.14) % (Math.PI*2);

    // Decide action every AI_INTERVAL frames
    if (aiTick % AI_INTERVAL === 0) decideAIState(p);
    executeAIState(p);
  });
}

function decideAIState(p) {
  const hasBall = p.hasBall;
  const isOffense = p.team === G3.possession;
  if (hasBall) {
    const distToHoop = dist(p, { x: CM.hoopX, y: CM.hoopY });
    const nearestDef = players3.filter(q => q.team !== p.team)
      .reduce((m, q) => Math.min(m, dist(p, q)), Infinity);
    // Shoot if in good range and not contested
    if (distToHoop < CM.threeR * 0.75 && nearestDef > CM.pR * 2.5) {
      p.aiState = 'shoot';
      p.aiTimer = 20 + Math.random() * 20;
    } else if (distToHoop < CM.threeR * 1.05 && nearestDef > CM.pR * 2) {
      // Attempt 3pt
      p.aiState = 'shoot';
      p.aiTimer = 25 + Math.random() * 20;
    } else {
      // Drive toward hoop
      p.aiState = 'drive';
      p.aiTarget = { x: CM.hoopX + (Math.random()-0.5)*40, y: CM.hoopY + 40 };
      // Pass sometimes
      if (Math.random() < 0.15 && nearestDef < CM.pR * 2.8) {
        p.aiState = 'pass';
      }
    }
  } else if (isOffense) {
    // Get open
    p.aiState = 'cut';
    const spread = 120;
    p.aiTarget = {
      x: CM.hoopX + (p.id.includes('1') ? -spread : p.id.includes('2') ? spread : 0),
      y: CM.hoopY + CM.threeR * (0.6 + Math.random() * 0.3),
    };
  } else {
    // Defense
    p.aiState = 'defend';
    const ballHolder = players3.find(q => q.hasBall);
    p.aiTarget = ballHolder
      ? { x: lerp(ballHolder.x, CM.hoopX, 0.35), y: lerp(ballHolder.y, CM.hoopY, 0.35) }
      : { x: CM.hoopX + (Math.random()-0.5)*100, y: CM.hoopY + 80 };
  }
}

function executeAIState(p) {
  if (p.stunTimer > 0) { p.stunTimer--; return; }
  const spd = p.spd * 0.82;

  if (p.aiState === 'shoot') {
    p.aiTimer--;
    // Aim toward hoop
    moveToward(p, { x: CM.hoopX, y: CM.hoopY + 30 }, spd * 0.3);
    if (p.aiTimer <= 0 && p.hasBall) {
      const distToHoop = dist(p, { x: CM.hoopX, y: CM.hoopY });
      const makes = Math.random() < (p.stats.sht / 100) * 0.72;
      BALL3._makes = makes;
      BALL3._is3pt = distToHoop > CM.threeR * 0.85;
      BALL3._shooterTeam = p.team;
      p.hasBall = false;
      BALL3.heldBy = null;
      BALL3.inFlight = true;
      BALL3.isPass = false;
      BALL3._startX = p.x; BALL3._startY = p.y;
      BALL3._flightProgress = 0;
      BALL3._flightDuration = 32;
      BALL3.targetX = CM.hoopX + (makes ? 0 : (Math.random()-0.5)*CM.rimR*4);
      BALL3.targetY = CM.hoopY + (makes ? 0 : (Math.random()-0.5)*CM.rimR*4);
      BALL3.trail = [];
      playSound('shoot');
    }
  } else if (p.aiState === 'pass') {
    if (p.hasBall) {
      const target = getBestPassTarget(p);
      if (target) passBall3(p, target);
    }
    p.aiState = 'cut';
  } else if (p.aiState === 'drive' || p.aiState === 'cut') {
    if (p.aiTarget) moveToward(p, p.aiTarget, spd);
    const doneMoving = p.aiTarget && dist(p, p.aiTarget) < 10;
    if (doneMoving) p.aiState = 'idle';
  } else if (p.aiState === 'defend') {
    if (p.aiTarget) moveToward(p, p.aiTarget, spd * 0.9);
    // Try steal
    const ballHolder = players3.find(q => q.hasBall && q.team !== p.team);
    if (ballHolder && dist(p, ballHolder) < p.r * 2.2 && Math.random() < 0.012) {
      giveBallTo(p);
      G3.shotClock = 24;
      spawnFX(p.x, p.y, { n:8, speed:3, color:'#ffcc00', life:25 });
      showGameMsg('STEAL!', '#ffcc00');
    }
  }
}

function moveToward(p, target, spd) {
  const dx = target.x - p.x, dy = target.y - p.y;
  const d = Math.sqrt(dx*dx + dy*dy) || 1;
  p.vx = (dx/d) * spd; p.vy = (dy/d) * spd;
  p.x = Math.max(CM.cL+p.r, Math.min(CM.cR-p.r, p.x + p.vx));
  p.y = Math.max(CM.cT+p.r, Math.min(CM.cB-p.r, p.y + p.vy));
}

// ── FX ──
function updateFX() {
  for (let i = FX.length-1; i >= 0; i--) {
    const f = FX[i];
    f.vy += f.gravity; f.x += f.vx; f.y += f.vy; f.life--;
    if (f.life <= 0) FX.splice(i, 1);
  }
}

// ── MSG OVERLAY ──
let msgText = '', msgColor = '#ff8c00', msgTimer = 0;
function showGameMsg(text, color) {
  msgText = text; msgColor = color || '#ff8c00'; msgTimer = 90;
}

// ── DRAW ──
function draw3() {
  ctx3.clearRect(0, 0, CM.W, CM.H);
  drawCourt3();
  drawFX();
  drawBall3();
  players3.forEach(drawPlayer3);
  drawHUD3();
  if (msgTimer > 0) { drawMsg(); msgTimer--; }
  if (controlled && controlled.hasBall && controlled.shooting) drawShotMeter();
  if (G3.phase === 'warmup') drawTipOff();
  if (G3.phase === 'gameover') drawGameOver3();
}

function drawCourt3() {
  const { W, H, cL, cR, cT, cB, hoopX, hoopY, threeR, paintW, paintH, ftY } = CM;

  // Arena background
  ctx3.fillStyle = '#08060f';
  ctx3.fillRect(0, 0, W, H);

  // Court floor
  ctx3.fillStyle = '#2a1505';
  ctx3.beginPath();
  ctx3.roundRect(cL, cT, cR-cL, cB-cT, 8);
  ctx3.fill();

  // Wood grain
  ctx3.strokeStyle = 'rgba(60,30,5,0.4)';
  ctx3.lineWidth = 1;
  for (let x = cL; x < cR; x += 16) {
    ctx3.beginPath();
    ctx3.moveTo(x, cT); ctx3.lineTo(x, cB);
    ctx3.stroke();
  }

  // Court lines
  ctx3.strokeStyle = 'rgba(255,180,80,0.55)';
  ctx3.lineWidth = 2;
  // Boundary
  ctx3.strokeRect(cL+2, cT+2, cR-cL-4, cB-cT-4);

  // Mid-court line
  const midY = (cT + cB) / 2;
  ctx3.beginPath(); ctx3.moveTo(cL, midY); ctx3.lineTo(cR, midY); ctx3.stroke();
  // Mid-court circle
  ctx3.beginPath(); ctx3.arc(W/2, midY, W*0.08, 0, Math.PI*2); ctx3.stroke();

  // 3-point arc (top)
  ctx3.beginPath();
  ctx3.arc(hoopX, hoopY - CM.rimR, threeR, 0.15, Math.PI - 0.15);
  ctx3.stroke();
  // 3pt corner lines
  ctx3.beginPath(); ctx3.moveTo(cL+2, hoopY+30); ctx3.lineTo(cL+2, cT+threeR*0.4); ctx3.stroke();
  ctx3.beginPath(); ctx3.moveTo(cR-2, hoopY+30); ctx3.lineTo(cR-2, cT+threeR*0.4); ctx3.stroke();

  // Paint (key)
  const paintL = hoopX - paintW/2, paintTop = cT;
  ctx3.fillStyle = 'rgba(255,120,0,0.07)';
  ctx3.fillRect(paintL, paintTop, paintW, paintH);
  ctx3.strokeRect(paintL, paintTop, paintW, paintH);

  // Free throw line
  ctx3.beginPath(); ctx3.moveTo(paintL, ftY); ctx3.lineTo(paintL+paintW, ftY); ctx3.stroke();
  // Free throw circle
  ctx3.beginPath(); ctx3.arc(hoopX, ftY, paintW/2, 0, Math.PI*2); ctx3.stroke();

  // Hoop shadow
  ctx3.fillStyle = 'rgba(0,0,0,0.4)';
  ctx3.beginPath(); ctx3.ellipse(hoopX, hoopY+6, CM.rimR+6, 6, 0, 0, Math.PI*2); ctx3.fill();

  // Backboard
  ctx3.fillStyle = 'rgba(200,220,255,0.85)';
  ctx3.fillRect(hoopX - paintW*0.28, cT, paintW*0.56, 7);
  ctx3.strokeStyle = 'rgba(100,150,220,0.8)';
  ctx3.lineWidth = 1.5;
  ctx3.strokeRect(hoopX - paintW*0.28, cT, paintW*0.56, 7);
  // Target square
  ctx3.strokeStyle = '#ff2222';
  ctx3.lineWidth = 2;
  ctx3.shadowBlur = 6; ctx3.shadowColor = '#ff0000';
  ctx3.strokeRect(hoopX - paintW*0.12, cT+1, paintW*0.24, 5);
  ctx3.shadowBlur = 0;

  // Rim
  ctx3.strokeStyle = '#ff4500';
  ctx3.lineWidth = 5;
  ctx3.shadowBlur = 18; ctx3.shadowColor = 'rgba(255,80,0,0.7)';
  ctx3.beginPath(); ctx3.arc(hoopX, hoopY, CM.rimR, 0, Math.PI*2); ctx3.stroke();
  ctx3.shadowBlur = 0;

  // Net lines
  drawNet3(hoopX, hoopY, CM.rimR);
}

function drawNet3(cx, cy, r) {
  ctx3.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx3.lineWidth = 1;
  const netH = r * 1.4;
  for (let i = 0; i <= 6; i++) {
    const a = (i/6) * Math.PI * 2;
    ctx3.beginPath();
    ctx3.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    ctx3.lineTo(cx + Math.cos(a)*(r*0.4), cy + Math.sin(a)*(r*0.4) + netH);
    ctx3.stroke();
  }
}

function drawFX() {
  FX.forEach(f => {
    ctx3.save();
    ctx3.globalAlpha = f.life / f.maxLife;
    ctx3.fillStyle = f.color;
    ctx3.beginPath();
    ctx3.arc(f.x, f.y, Math.max(0.5, f.size * (f.life/f.maxLife)), 0, Math.PI*2);
    ctx3.fill();
    ctx3.restore();
  });
}

function drawBall3() {
  // Trail
  BALL3.trail.forEach((t, i) => {
    const alpha = (1 - t.age / 14) * 0.35;
    ctx3.save();
    ctx3.globalAlpha = alpha;
    ctx3.fillStyle = '#ff8c00';
    ctx3.beginPath();
    ctx3.arc(t.x, t.y, BALL3.r * (1 - t.age/16), 0, Math.PI*2);
    ctx3.fill();
    ctx3.restore();
  });

  const bx = BALL3.x, by = BALL3.y - BALL3.z;
  // Shadow
  if (BALL3.z > 0) {
    ctx3.save();
    ctx3.globalAlpha = 0.3 - BALL3.z*0.003;
    ctx3.fillStyle = '#000';
    ctx3.beginPath();
    ctx3.ellipse(BALL3.x, BALL3.y, BALL3.r, BALL3.r*0.35, 0, 0, Math.PI*2);
    ctx3.fill();
    ctx3.restore();
  }

  // Ball body
  const gr = ctx3.createRadialGradient(bx - BALL3.r*0.3, by - BALL3.r*0.3, 1, bx, by, BALL3.r);
  gr.addColorStop(0, '#ffaa28');
  gr.addColorStop(0.6, '#e06000');
  gr.addColorStop(1, '#5a2000');
  ctx3.beginPath(); ctx3.arc(bx, by, BALL3.r, 0, Math.PI*2);
  ctx3.fillStyle = gr; ctx3.fill();
  // Seam
  ctx3.strokeStyle = '#1a0800'; ctx3.lineWidth = 1.2;
  ctx3.beginPath(); ctx3.arc(bx, by, BALL3.r, 0, Math.PI, false); ctx3.stroke();
  ctx3.beginPath(); ctx3.arc(bx, by, BALL3.r, Math.PI/2, Math.PI*3/2, false); ctx3.stroke();
}

function drawPlayer3(p) {
  const x = p.x, y = p.y, r = p.r;
  // Shadow
  ctx3.save();
  ctx3.globalAlpha = 0.3;
  ctx3.fillStyle = '#000';
  ctx3.beginPath(); ctx3.ellipse(x, y+r*0.5, r*0.85, r*0.25, 0, 0, Math.PI*2); ctx3.fill();
  ctx3.restore();

  // Glow if controlled or has ball
  if (p === controlled || p.hasBall) {
    ctx3.save();
    ctx3.shadowBlur = p.hasBall ? 22 : 14;
    ctx3.shadowColor = p.team === 0 ? 'rgba(255,140,0,0.7)' : 'rgba(30,120,255,0.7)';
    ctx3.beginPath(); ctx3.arc(x, y, r, 0, Math.PI*2);
    ctx3.fillStyle = 'transparent'; ctx3.fill();
    ctx3.restore();
  }

  // Body circle
  const teamColor = p.team === 0 ? '#ff8c00' : '#1e6fff';
  const bodyGrad = ctx3.createRadialGradient(x-r*0.3, y-r*0.3, 1, x, y, r);
  bodyGrad.addColorStop(0, p.team===0 ? '#ffaa40' : '#4080ff');
  bodyGrad.addColorStop(1, p.team===0 ? '#cc5500' : '#0040cc');
  ctx3.beginPath(); ctx3.arc(x, y, r, 0, Math.PI*2);
  ctx3.fillStyle = bodyGrad; ctx3.fill();
  ctx3.strokeStyle = p === controlled ? '#ffffff' : teamColor;
  ctx3.lineWidth = p === controlled ? 2.5 : 1.5;
  ctx3.stroke();

  // Initials
  ctx3.fillStyle = '#fff';
  ctx3.font = `bold ${Math.max(9, r*0.65)}px Segoe UI`;
  ctx3.textAlign = 'center'; ctx3.textBaseline = 'middle';
  ctx3.fillText(p.initials, x, y);

  // "Has ball" dot
  if (p.hasBall) {
    ctx3.fillStyle = '#ffdd00';
    ctx3.beginPath(); ctx3.arc(x + r*0.75, y - r*0.75, 4, 0, Math.PI*2); ctx3.fill();
  }

  // Shooting charge ring
  if (p.shooting && p === controlled) {
    const progress = p.shootTimer / 60;
    ctx3.strokeStyle = `rgba(255,200,0,0.6)`;
    ctx3.lineWidth = 3;
    ctx3.beginPath();
    ctx3.arc(x, y, r + 6, -Math.PI/2, -Math.PI/2 + Math.min(progress,1) * Math.PI*2);
    ctx3.stroke();
  }
}

function drawShotMeter() {
  const p = controlled;
  if (!p) return;
  const mw = 120, mh = 14;
  const mx = p.x - mw/2, my = p.y - p.r - 28;

  // Background
  ctx3.fillStyle = 'rgba(0,0,0,0.7)';
  ctx3.beginPath(); ctx3.roundRect(mx, my, mw, mh, 3); ctx3.fill();
  // Zones
  ctx3.fillStyle = '#ff3333';
  ctx3.beginPath(); ctx3.roundRect(mx, my, mw*0.2, mh, 3); ctx3.fill();
  ctx3.beginPath(); ctx3.roundRect(mx+mw*0.8, my, mw*0.2, mh, [0,3,3,0]); ctx3.fill();
  ctx3.fillStyle = '#ffaa00';
  ctx3.fillRect(mx+mw*0.2, my, mw*0.15, mh);
  ctx3.fillRect(mx+mw*0.65, my, mw*0.15, mh);
  ctx3.fillStyle = '#00cc44';
  ctx3.fillRect(mx+mw*0.35, my, mw*0.3, mh);

  // Indicator
  const ix = mx + (p.shotMeterVal/100)*mw;
  ctx3.fillStyle = '#fff';
  ctx3.fillRect(ix - 2, my - 2, 4, mh + 4);

  // Label
  ctx3.fillStyle = '#fff'; ctx3.font = 'bold 10px Segoe UI';
  ctx3.textAlign = 'center';
  ctx3.fillText('SHOOT', p.x, my - 6);
}

function drawHUD3() {
  const { W, H } = CM;
  // Scoreboard background
  const sbW = 260, sbH = 52;
  const sbX = (W - sbW) / 2, sbY = 6;
  ctx3.fillStyle = 'rgba(0,0,0,0.75)';
  ctx3.beginPath(); ctx3.roundRect(sbX, sbY, sbW, sbH, 8); ctx3.fill();
  ctx3.strokeStyle = 'rgba(255,140,0,0.35)';
  ctx3.lineWidth = 1;
  ctx3.beginPath(); ctx3.roundRect(sbX, sbY, sbW, sbH, 8); ctx3.stroke();

  // Scores
  ctx3.font = 'bold 28px Segoe UI'; ctx3.textBaseline = 'middle';
  ctx3.fillStyle = '#ff8c00';
  ctx3.textAlign = 'right';
  ctx3.fillText(G3.score[0], sbX + 100, sbY + sbH/2);
  ctx3.fillStyle = '#1e6fff';
  ctx3.textAlign = 'left';
  ctx3.fillText(G3.score[1], sbX + 160, sbY + sbH/2);

  // Divider
  ctx3.strokeStyle = '#555'; ctx3.lineWidth = 1;
  ctx3.beginPath(); ctx3.moveTo(sbX+sbW/2, sbY+8); ctx3.lineTo(sbX+sbW/2, sbY+sbH-8); ctx3.stroke();

  // Timer
  const secs = Math.ceil(G3.timeLeft);
  const mm = Math.floor(secs/60), ss = secs%60;
  ctx3.fillStyle = secs <= 10 ? '#ff2200' : '#ffffff';
  ctx3.font = 'bold 16px Segoe UI'; ctx3.textAlign = 'center';
  ctx3.fillText(`Q${G3.quarter}  ${mm}:${ss.toString().padStart(2,'0')}`, sbX+sbW/2, sbY+sbH/2);

  // Shot clock
  const scColor = G3.shotClock <= 5 ? '#ff2200' : G3.shotClock <= 10 ? '#ffaa00' : '#aaa';
  ctx3.fillStyle = scColor;
  ctx3.font = 'bold 11px Segoe UI';
  ctx3.fillText(`${Math.ceil(G3.shotClock)}s`, sbX+sbW/2, sbY+sbH-5);

  // Controls hint
  ctx3.fillStyle = 'rgba(255,255,255,0.3)';
  ctx3.font = '10px Segoe UI'; ctx3.textAlign = 'left';
  ctx3.fillText('WASD/Arrows: Move  |  Space: Shoot  |  F: Pass  |  Tab: Switch', CM.cL, CM.cB + 14);

  // Coins earned
  if (G3.coinsEarned > 0) {
    ctx3.fillStyle = '#ffd700';
    ctx3.font = 'bold 12px Segoe UI'; ctx3.textAlign = 'right';
    ctx3.fillText(`🪙 +${G3.coinsEarned}`, CM.cR, CM.cB + 14);
  }
}

function drawMsg() {
  const alpha = Math.min(1, msgTimer / 20) * Math.min(1, (msgTimer) / 30);
  ctx3.save();
  ctx3.globalAlpha = alpha;
  ctx3.fillStyle = msgColor;
  ctx3.font = `bold ${Math.max(20, CM.W*0.035)}px Segoe UI`;
  ctx3.textAlign = 'center'; ctx3.textBaseline = 'middle';
  ctx3.shadowBlur = 20; ctx3.shadowColor = msgColor;
  ctx3.fillText(msgText, CM.W/2, CM.H*0.5);
  ctx3.restore();
}

function drawTipOff() {
  const alpha = Math.max(0, 1 - G3.lastPhaseTimer/90);
  ctx3.save();
  ctx3.globalAlpha = alpha;
  ctx3.fillStyle = '#fff';
  ctx3.font = `bold ${CM.W*0.06}px Segoe UI`;
  ctx3.textAlign = 'center'; ctx3.textBaseline = 'middle';
  ctx3.shadowBlur = 30; ctx3.shadowColor = '#ff8c00';
  ctx3.fillText('TIP-OFF!', CM.W/2, CM.H/2);
  ctx3.restore();
}

function drawGameOver3() {
  ctx3.save();
  ctx3.fillStyle = 'rgba(0,0,0,0.75)';
  ctx3.fillRect(0, 0, CM.W, CM.H);
  ctx3.fillStyle = '#ff8c00';
  ctx3.font = `bold ${CM.W*0.05}px Segoe UI`;
  ctx3.textAlign = 'center'; ctx3.textBaseline = 'middle';
  ctx3.shadowBlur = 30; ctx3.shadowColor = '#ff8c00';
  ctx3.fillText(G3.wonMessage, CM.W/2, CM.H/2 - 30);
  ctx3.font = `bold ${CM.W*0.035}px Segoe UI`;
  ctx3.fillStyle = '#fff'; ctx3.shadowBlur = 0;
  ctx3.fillText(`${G3.score[0]} — ${G3.score[1]}`, CM.W/2, CM.H/2 + 20);
  ctx3.fillStyle = '#ffd700';
  ctx3.font = `bold ${CM.W*0.022}px Segoe UI`;
  ctx3.fillText(`🪙 +${G3.coinsEarned} coins earned`, CM.W/2, CM.H/2 + 65);
  ctx3.restore();
}

// ── End Game ──
function endGame3() {
  G3.phase = 'gameover';
  G3.running = false;
  const won = G3.score[0] > G3.score[1];
  const tied = G3.score[0] === G3.score[1];
  G3.wonMessage = tied ? "IT'S A TIE!" : won ? 'YOUR TEAM WINS! 🏆' : 'OPPONENT WINS!';
  if (window.addCoins) window.addCoins(G3.coinsEarned);
  spawnFX(CM.W/2, CM.H/2, { n:50, speed:7, life:80, size:8,
    color: won ? ['#ff8c00','#ffcc00','#fff'] : ['#1e6fff','#00ccff','#fff'] });
  draw3();

  // Show return button after 2s
  setTimeout(() => {
    document.getElementById('btn3v3Back').style.display = 'block';
    document.getElementById('btn3v3Again').style.display = 'block';
  }, 2000);
}

// ── Player separation (prevent overlap) ──
function separatePlayers() {
  for (let i = 0; i < players3.length; i++) {
    for (let j = i + 1; j < players3.length; j++) {
      const a = players3[i], b = players3[j];
      const minDist = a.r + b.r;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 0.01;
      if (d < minDist) {
        const push = (minDist - d) / 2;
        const nx = dx / d, ny = dy / d;
        a.x = Math.max(CM.cL + a.r, Math.min(CM.cR - a.r, a.x - nx * push));
        a.y = Math.max(CM.cT + a.r, Math.min(CM.cB - a.r, a.y - ny * push));
        b.x = Math.max(CM.cL + b.r, Math.min(CM.cR - b.r, b.x + nx * push));
        b.y = Math.max(CM.cT + b.r, Math.min(CM.cB - b.r, b.y + ny * push));
      }
    }
  }
}

// ── Helpers ──
function dist(a, b) { const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
function lerp(a, b, t) { return a + (b-a)*t; }

window.addEventListener('resize', () => { if (document.getElementById('game3v3').classList.contains('active')) recalcCourt3(); });
