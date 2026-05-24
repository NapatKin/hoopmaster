// ===== BASKETBALL CLICKER =====
const CLICKER = {
  coins: 0,
  totalCoins: 0,
  cpc: 1,       // coins per click
  cps: 0,       // coins per second
  multiplier: 1,
  interval: null,
};

const UPGRADES = [
  { id: 'grip',      icon: '🤏', name: 'Better Grip',       desc: '+1 coin per click',          cost: 10,   maxLevel: 20, cpcBonus: 1,  cpsBonus: 0 },
  { id: 'chalk',     icon: '🤍', name: 'Chalk Bag',         desc: '+2 coins per click',          cost: 25,   maxLevel: 15, cpcBonus: 2,  cpsBonus: 0 },
  { id: 'trainer',   icon: '🏋️', name: 'Personal Trainer',  desc: '+1 coin/sec auto',            cost: 30,   maxLevel: 20, cpcBonus: 0,  cpsBonus: 1 },
  { id: 'shoes',     icon: '👟', name: 'Air Jordans',       desc: '+5 coins per click',          cost: 75,   maxLevel: 10, cpcBonus: 5,  cpsBonus: 0 },
  { id: 'practice',  icon: '🏀', name: 'Team Practice',     desc: '+3 coins/sec auto',           cost: 100,  maxLevel: 15, cpcBonus: 0,  cpsBonus: 3 },
  { id: 'psych',     icon: '🧠', name: 'Sports Psychologist',desc: '1.5x click multiplier',      cost: 250,  maxLevel: 5,  cpcBonus: 0,  cpsBonus: 0, mult: 1.5 },
  { id: 'coach',     icon: '📋', name: 'NBA Coach',         desc: '+15 coins per click',         cost: 500,  maxLevel: 8,  cpcBonus: 15, cpsBonus: 0 },
  { id: 'arena',     icon: '🏟️', name: 'Home Arena',        desc: '+10 coins/sec auto',          cost: 750,  maxLevel: 10, cpcBonus: 0,  cpsBonus: 10 },
  { id: 'sponsor',   icon: '💰', name: 'Sponsorship Deal',  desc: '2x ALL coins earned',         cost: 1000, maxLevel: 3,  cpcBonus: 0,  cpsBonus: 0, mult: 2 },
  { id: 'scout',     icon: '🔭', name: 'NBA Scout',         desc: '+50 coins per click',         cost: 2500, maxLevel: 5,  cpcBonus: 50, cpsBonus: 0 },
  { id: 'team',      icon: '🤝', name: 'NBA Team',          desc: '+50 coins/sec auto',          cost: 5000, maxLevel: 5,  cpcBonus: 0,  cpsBonus: 50 },
  { id: 'ring',      icon: '💍', name: 'Championship Ring', desc: '3x ALL coins earned',         cost: 10000,maxLevel: 1,  cpcBonus: 0,  cpsBonus: 0, mult: 3 },
];

const upgradeState = {};
UPGRADES.forEach(u => { upgradeState[u.id] = { level: 0 }; });

function loadClicker() {
  const saved = JSON.parse(localStorage.getItem('clicker') || 'null');
  if (saved) {
    CLICKER.coins = saved.coins || 0;
    CLICKER.totalCoins = saved.totalCoins || 0;
    Object.keys(saved.upgrades || {}).forEach(k => { if (upgradeState[k]) upgradeState[k].level = saved.upgrades[k]; });
  }
  recalcClicker();
}

function saveClicker() {
  const upgrades = {};
  Object.keys(upgradeState).forEach(k => { upgrades[k] = upgradeState[k].level; });
  localStorage.setItem('clicker', JSON.stringify({ coins: CLICKER.coins, totalCoins: CLICKER.totalCoins, upgrades }));
}

function recalcClicker() {
  let cpc = 1, cps = 0, mult = 1;
  UPGRADES.forEach(u => {
    const lv = upgradeState[u.id].level;
    cpc += (u.cpcBonus || 0) * lv;
    cps += (u.cpsBonus || 0) * lv;
    if (u.mult && lv > 0) mult *= Math.pow(u.mult, lv);
  });
  CLICKER.cpc = Math.round(cpc * mult);
  CLICKER.cps = Math.round(cps * mult);
  CLICKER.multiplier = mult;
}

function getUpgradeCost(upgrade) {
  const lv = upgradeState[upgrade.id].level;
  return Math.floor(upgrade.cost * Math.pow(1.55, lv));
}

function renderUpgrades() {
  const list = document.getElementById('upgradeList');
  if (!list) return;
  list.innerHTML = '';
  UPGRADES.forEach(u => {
    const lv = upgradeState[u.id].level;
    const maxed = lv >= u.maxLevel;
    const cost = getUpgradeCost(u);
    const canAfford = CLICKER.coins >= cost;
    const card = document.createElement('div');
    card.className = 'upgrade-card' + (maxed ? ' maxed' : canAfford ? '' : ' locked');
    card.innerHTML = `
      <span class="upgrade-icon">${u.icon}</span>
      <div class="upgrade-info">
        <div class="upgrade-name">${u.name}</div>
        <div class="upgrade-desc">${u.desc}</div>
        <div class="upgrade-level">Level ${lv}/${u.maxLevel}</div>
      </div>
      <div class="upgrade-cost">
        <span class="cost-num">${maxed ? 'MAX' : '🪙 ' + formatCoins(cost)}</span>
        <span class="cost-label">${maxed ? 'MAXED OUT' : 'COST'}</span>
      </div>`;
    if (!maxed && canAfford) card.onclick = () => buyUpgrade(u.id);
    list.appendChild(card);
  });
}

function formatCoins(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function updateClickerUI() {
  const el = document.getElementById('clickerCoins');
  if (el) el.textContent = formatCoins(Math.floor(CLICKER.coins));
  const cpsEl = document.getElementById('clickerCPS');
  if (cpsEl) cpsEl.textContent = CLICKER.cps > 0 ? `${formatCoins(CLICKER.cps)} coins/sec` : '0 coins/sec';
  const cpcEl = document.getElementById('clickerCPC');
  if (cpcEl) cpcEl.textContent = formatCoins(CLICKER.cpc);
  const multEl = document.getElementById('clickerMult');
  const multVal = document.getElementById('multVal');
  if (multEl && multVal) {
    multEl.style.display = CLICKER.multiplier > 1 ? '' : 'none';
    multVal.textContent = CLICKER.multiplier.toFixed(1);
  }
}

function clickBall() {
  const earned = CLICKER.cpc;
  CLICKER.coins += earned;
  CLICKER.totalCoins += earned;
  updateClickerUI();
  renderUpgrades();
  saveClicker();

  // Click animation
  const ballEl = document.getElementById('clickerBall');
  if (ballEl) {
    ballEl.style.animation = 'none';
    void ballEl.offsetWidth;
    ballEl.style.animation = 'ballClick 0.15s ease';
    setTimeout(() => { ballEl.style.animation = 'idleBob 3s ease-in-out infinite'; }, 200);
  }

  // Spawn coin pop text
  const wrap = document.getElementById('clickParticles');
  if (wrap) {
    const pop = document.createElement('div');
    pop.className = 'coin-pop';
    pop.textContent = '+' + formatCoins(earned) + ' 🪙';
    pop.style.left = (40 + Math.random() * 60) + '%';
    pop.style.top = (30 + Math.random() * 30) + '%';
    wrap.appendChild(pop);
    setTimeout(() => pop.remove(), 950);
  }

  playSound('score');
}

function buyUpgrade(id) {
  const upgrade = UPGRADES.find(u => u.id === id);
  if (!upgrade) return;
  const lv = upgradeState[id].level;
  if (lv >= upgrade.maxLevel) return;
  const cost = getUpgradeCost(upgrade);
  if (CLICKER.coins < cost) return;
  CLICKER.coins -= cost;
  upgradeState[id].level++;
  recalcClicker();
  updateClickerUI();
  renderUpgrades();
  saveClicker();
  playSound('score');
}

function startClickerLoop() {
  clearInterval(CLICKER.interval);
  CLICKER.interval = setInterval(() => {
    if (!document.getElementById('clickerScreen').classList.contains('active')) return;
    if (CLICKER.cps > 0) {
      const earned = CLICKER.cps / 10;
      CLICKER.coins += earned;
      CLICKER.totalCoins += earned;
      updateClickerUI();
      if (Math.floor(CLICKER.coins) % 5 === 0) renderUpgrades();
    }
  }, 100);
}

// Init clicker when screen becomes active — patch showScreen
const _origShowScreen = window.showScreen;
window.showScreen = function(id) {
  _origShowScreen(id);
  if (id === 'clickerScreen') {
    loadClicker();
    renderUpgrades();
    updateClickerUI();
    startClickerLoop();
  }
};

// Load on startup
loadClicker();
