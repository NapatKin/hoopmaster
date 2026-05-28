// ===== BASKETBALL CLICKER =====
const CLICKER = {
  totalCoins: 0,
  cpc: 1,
  cps: 0,
  multiplier: 1,
  prestige: 0,
  prestigePoints: 0,    // spend in perk shop
  perks: {},            // { autoClick: true, goldenRush: true, discount: true, headStart: true }
  ballSkin: 'default',  // default | fire | diamond | goat | crown
  interval: null,
  clicks: 0,
  combo: 0,
  comboTimer: null,
};

const PRESTIGE_PERKS = [
  { id: 'autoClick',   icon: '🤖', name: 'Auto-Clicker',    cost: 1, desc: '1 free click per second automatically' },
  { id: 'goldenRush',  icon: '✨', name: 'Golden Rush',     cost: 1, desc: 'Golden balls appear twice as often' },
  { id: 'discount',    icon: '🏷️', name: 'Bulk Deal',       cost: 2, desc: 'All upgrade costs -25%' },
  { id: 'headStart',   icon: '🚀', name: 'Head Start',      cost: 2, desc: 'Start with 50,000 coins after each prestige' },
  { id: 'skinFire',    icon: '🔥', name: 'Fire Ball',       cost: 1, desc: 'Unlock the blazing fire ball skin', skin: 'fire' },
  { id: 'skinDiamond', icon: '💎', name: 'Diamond Ball',    cost: 2, desc: 'Unlock the diamond ball skin', skin: 'diamond' },
  { id: 'skinGoat',    icon: '🐐', name: 'GOAT Ball',       cost: 3, desc: 'The legendary GOAT ball skin', skin: 'goat' },
  { id: 'skinCrown',   icon: '👑', name: 'Crown Ball',      cost: 4, desc: 'The ultimate king of all skins', skin: 'crown' },
];

const BALL_SKINS = {
  default: '🏀', fire: '🔥', diamond: '💎', goat: '🐐', crown: '👑'
};

// Prestige threshold: 10K, 30K, 90K, 270K...
function prestigeThreshold(level) {
  return Math.floor(10000 * Math.pow(3, level));
}

const UPGRADES = [
  // --- Click upgrades ---
  { id: 'grip',      icon: '🤏', name: 'Better Grip',          desc: '+1 coin per click',           cost: 10,      maxLevel: 20, cpcBonus: 1,   cpsBonus: 0 },
  { id: 'chalk',     icon: '🤍', name: 'Chalk Bag',            desc: '+2 coins per click',          cost: 25,      maxLevel: 15, cpcBonus: 2,   cpsBonus: 0 },
  { id: 'fanbase',   icon: '👥', name: 'Fan Base',             desc: '+10 coins per click',         cost: 150,     maxLevel: 12, cpcBonus: 10,  cpsBonus: 0 },
  { id: 'shoes',     icon: '👟', name: 'Air Jordans',          desc: '+5 coins per click',          cost: 75,      maxLevel: 10, cpcBonus: 5,   cpsBonus: 0 },
  { id: 'coach',     icon: '📋', name: 'NBA Coach',            desc: '+15 coins per click',         cost: 500,     maxLevel: 8,  cpcBonus: 15,  cpsBonus: 0 },
  { id: 'agent',     icon: '🕴️', name: 'Sports Agent',         desc: '+40 coins per click',         cost: 3000,    maxLevel: 6,  cpcBonus: 40,  cpsBonus: 0 },
  { id: 'scout',     icon: '🔭', name: 'NBA Scout',            desc: '+100 coins per click',        cost: 8000,    maxLevel: 5,  cpcBonus: 100, cpsBonus: 0 },
  { id: 'contract',  icon: '📝', name: 'Max Contract',         desc: '+300 coins per click',        cost: 40000,   maxLevel: 4,  cpcBonus: 300, cpsBonus: 0 },
  // --- Auto (CPS) upgrades ---
  { id: 'trainer',   icon: '🏋️', name: 'Personal Trainer',     desc: '+1 coin/sec auto',            cost: 30,      maxLevel: 20, cpcBonus: 0,   cpsBonus: 1 },
  { id: 'practice',  icon: '🏀', name: 'Team Practice',        desc: '+3 coins/sec auto',           cost: 100,     maxLevel: 15, cpcBonus: 0,   cpsBonus: 3 },
  { id: 'merch',     icon: '👕', name: 'Merch Stand',          desc: '+15 coins/sec auto',          cost: 400,     maxLevel: 12, cpcBonus: 0,   cpsBonus: 15 },
  { id: 'arena',     icon: '🏟️', name: 'Home Arena',           desc: '+25 coins/sec auto',          cost: 750,     maxLevel: 10, cpcBonus: 0,   cpsBonus: 25 },
  { id: 'broadcast', icon: '📺', name: 'TV Broadcast',         desc: '+60 coins/sec auto',          cost: 1500,    maxLevel: 8,  cpcBonus: 0,   cpsBonus: 60 },
  { id: 'team',      icon: '🤝', name: 'NBA Team',             desc: '+120 coins/sec auto',         cost: 5000,    maxLevel: 6,  cpcBonus: 0,   cpsBonus: 120 },
  { id: 'stadium',   icon: '🌆', name: 'Stadium Upgrade',      desc: '+300 coins/sec auto',         cost: 12000,   maxLevel: 6,  cpcBonus: 0,   cpsBonus: 300 },
  { id: 'casino',    icon: '🎰', name: 'Sports Casino',        desc: '+700 coins/sec auto',         cost: 60000,   maxLevel: 5,  cpcBonus: 0,   cpsBonus: 700 },
  { id: 'global',    icon: '🌍', name: 'Global Brand',         desc: '+1500 coins/sec auto',        cost: 180000,  maxLevel: 4,  cpcBonus: 0,   cpsBonus: 1500 },
  { id: 'goatcon',   icon: '🐐', name: 'GOAT Contract',        desc: '+5000 coins/sec auto',        cost: 1200000, maxLevel: 2,  cpcBonus: 0,   cpsBonus: 5000 },
  // --- Multipliers ---
  { id: 'psych',     icon: '🧠', name: 'Sports Psychologist',  desc: '1.5x click multiplier',       cost: 250,     maxLevel: 5,  cpcBonus: 0,   cpsBonus: 0, mult: 1.5 },
  { id: 'sponsor',   icon: '💰', name: 'Sponsorship Deal',     desc: '2x ALL coins earned',         cost: 1000,    maxLevel: 3,  cpcBonus: 0,   cpsBonus: 0, mult: 2 },
  { id: 'sneaker',   icon: '✨', name: 'Sneaker Empire',       desc: '2.5x ALL coins earned',       cost: 25000,   maxLevel: 2,  cpcBonus: 0,   cpsBonus: 0, mult: 2.5 },
  { id: 'ring',      icon: '💍', name: 'Championship Ring',    desc: '3x ALL coins earned',         cost: 10000,   maxLevel: 1,  cpcBonus: 0,   cpsBonus: 0, mult: 3 },
  { id: 'crypto',    icon: '₿',  name: 'Crypto Play',          desc: '4x ALL coins earned',         cost: 500000,  maxLevel: 1,  cpcBonus: 0,   cpsBonus: 0, mult: 4 },
];

const MILESTONES = [
  { coins: 1000,      icon: '🎯', text: 'First 1,000 coins!' },
  { coins: 10000,     icon: '⭐', text: '10K coins earned!' },
  { coins: 100000,    icon: '💫', text: '100K coins — you\'re rich!' },
  { coins: 500000,    icon: '🔥', text: '500K coins! Baller!' },
  { coins: 1000000,   icon: '🏆', text: '1 MILLION coins! GOAT!' },
  { coins: 10000000,  icon: '👑', text: '10 MILLION! Legend status!' },
];
const shownMilestones = new Set();

const upgradeState = {};
UPGRADES.forEach(u => { upgradeState[u.id] = { level: 0 }; });

// ===== SAVE / LOAD =====
function loadClicker() {
  const saved = JSON.parse(localStorage.getItem('clicker') || 'null');
  if (saved) {
    CLICKER.totalCoins     = saved.totalCoins     || 0;
    CLICKER.prestige       = saved.prestige       || 0;
    CLICKER.prestigePoints = saved.prestigePoints || 0;
    CLICKER.perks          = saved.perks          || {};
    CLICKER.ballSkin       = saved.ballSkin       || 'default';
    CLICKER.clicks         = saved.clicks         || 0;
    Object.keys(saved.upgrades || {}).forEach(k => {
      if (upgradeState[k]) upgradeState[k].level = saved.upgrades[k];
    });
    if (saved.coins && window.addCoins) window.addCoins(saved.coins);
  }
  recalcClicker();
}

function saveClicker() {
  const upgrades = {};
  Object.keys(upgradeState).forEach(k => { upgrades[k] = upgradeState[k].level; });
  localStorage.setItem('clicker', JSON.stringify({
    totalCoins: CLICKER.totalCoins,
    prestige:   CLICKER.prestige,
    prestigePoints: CLICKER.prestigePoints,
    perks:      CLICKER.perks,
    ballSkin:   CLICKER.ballSkin,
    clicks:     CLICKER.clicks,
    upgrades
  }));
}

// ===== CALC =====
function recalcClicker() {
  let cpc = 1, cps = 0, mult = 1;
  UPGRADES.forEach(u => {
    const lv = upgradeState[u.id]?.level || 0;
    cpc += (u.cpcBonus || 0) * lv;
    cps += (u.cpsBonus || 0) * lv;
    if (u.mult && lv > 0) mult *= Math.pow(u.mult, lv);
  });
  const prestigeMult = Math.pow(3, CLICKER.prestige || 0);
  if (CLICKER.perks.autoClick) cps += Math.max(1, Math.floor(cpc * 0.3));
  CLICKER.cpc = Math.round(cpc * mult * prestigeMult);
  CLICKER.cps = Math.round(cps * mult * prestigeMult);
  CLICKER.multiplier = mult * prestigeMult;
}

function getUpgradeCost(upgrade) {
  const lv = upgradeState[upgrade.id]?.level || 0;
  const discount = CLICKER.perks.discount ? 0.75 : 1;
  return Math.floor(upgrade.cost * Math.pow(1.55, lv) * discount);
}

// ===== FORMAT =====
function formatCoins(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ===== UI =====
function updateClickerUI() {
  const el = document.getElementById('clickerCoins');
  if (el) el.textContent = formatCoins(Math.floor(CLICKER.totalCoins));
  const walletEl = document.getElementById('clickerWallet');
  if (walletEl) walletEl.textContent = formatCoins(Math.floor(window.getCoins ? window.getCoins() : 0)) + ' 🪙 wallet';

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

  // Ball skin
  const ballEl2 = document.getElementById('clickerBall');
  if (ballEl2) ballEl2.textContent = BALL_SKINS[CLICKER.ballSkin] || '🏀';

  // Prestige
  const prestigeEl = document.getElementById('prestigeLevel');
  if (prestigeEl) {
    if (CLICKER.prestige > 0) {
      const pp = CLICKER.prestigePoints;
      prestigeEl.innerHTML = `⭐ Prestige <strong>${CLICKER.prestige}</strong>${pp > 0 ? ` &nbsp;<span class="prestige-pp" title="Prestige Points">${pp}PP</span>` : ''}`;
    } else {
      prestigeEl.textContent = '';
    }
  }
  const threshold = prestigeThreshold(CLICKER.prestige);
  const pPct = Math.min(100, Math.floor((CLICKER.totalCoins / threshold) * 100));
  const canPrestige = CLICKER.totalCoins >= threshold;
  const pBtn = document.getElementById('prestigeBtn');
  if (pBtn) {
    pBtn.style.display = '';
    pBtn.textContent = canPrestige
      ? `⭐ PRESTIGE #${CLICKER.prestige + 1} — READY! (+${CLICKER.prestige + 1} 💎)`
      : `⭐ PRESTIGE #${CLICKER.prestige + 1}: ${pPct}% (${formatCoins(CLICKER.totalCoins)}/${formatCoins(threshold)})`;
    pBtn.disabled = !canPrestige;
    pBtn.style.opacity = canPrestige ? '1' : '0.55';
    pBtn.style.animation = canPrestige ? 'glowPulse 1.2s ease-in-out infinite' : 'none';
  }
  // Perk shop btn
  const perkBtn = document.getElementById('perkShopBtn');
  if (perkBtn) {
    perkBtn.style.display = CLICKER.prestige > 0 ? '' : 'none';
    const pp = CLICKER.prestigePoints;
    perkBtn.textContent = `🎁 Perk Shop (${pp}PP)`;
  }

  // Daily bonus
  const dBtn = document.getElementById('dailyBonusBtn');
  if (dBtn) {
    const today = new Date().toDateString();
    const claimed = !!localStorage.getItem('clickerDailyBonus_' + today);
    dBtn.disabled = claimed;
    dBtn.textContent = claimed ? '✓ Daily Bonus Claimed' : '🎁 Claim Daily Bonus';
  }

  // Combo
  const comboEl = document.getElementById('clickerCombo');
  if (comboEl) {
    if (CLICKER.combo >= 10) {
      comboEl.style.display = '';
      const multi = CLICKER.combo >= 50 ? '5x' : CLICKER.combo >= 25 ? '3x' : '2x';
      comboEl.textContent = `🔥 COMBO x${CLICKER.combo} (${multi} BONUS)`;
    } else {
      comboEl.style.display = 'none';
    }
  }

  checkMilestones();
}

function checkMilestones() {
  const total = CLICKER.totalCoins;
  MILESTONES.forEach(m => {
    if (total >= m.coins && !shownMilestones.has(m.coins)) {
      shownMilestones.add(m.coins);
      showMilestoneToast(m);
    }
  });
}

function showMilestoneToast(m) {
  const container = document.getElementById('milestoneToast');
  if (!container) return;
  container.innerHTML = `${m.icon} ${m.text}`;
  container.style.display = 'block';
  container.classList.add('toast-in');
  setTimeout(() => {
    container.classList.remove('toast-in');
    container.classList.add('toast-out');
    setTimeout(() => {
      container.style.display = 'none';
      container.classList.remove('toast-out');
    }, 500);
  }, 2500);
}

// ===== UPGRADES RENDER =====
function renderUpgrades() {
  const list = document.getElementById('upgradeList');
  if (!list) return;
  const coins = window.getCoins ? window.getCoins() : 0;
  list.innerHTML = '';
  UPGRADES.forEach(u => {
    const lv = upgradeState[u.id]?.level || 0;
    const maxed = lv >= u.maxLevel;
    const cost = getUpgradeCost(u);
    const canAfford = coins >= cost;
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

// ===== CLICK BALL =====
function clickBall() {
  CLICKER.clicks++;
  CLICKER.combo++;
  clearTimeout(CLICKER.comboTimer);
  CLICKER.comboTimer = setTimeout(() => { CLICKER.combo = 0; updateClickerUI(); }, 1500);

  let earned = CLICKER.cpc;
  if (CLICKER.combo >= 50) earned *= 5;
  else if (CLICKER.combo >= 25) earned *= 3;
  else if (CLICKER.combo >= 10) earned *= 2;
  if (CLICKER._rushActive) earned = Math.floor(earned * (CLICKER._rushMult || 1));

  CLICKER.totalCoins += earned;
  if (window.addCoins) window.addCoins(earned);
  if (window.trackDailyProgress) window.trackDailyProgress('clicks', 1);
  if (window.trackDailyProgress) window.trackDailyProgress('clickerEarned', earned);

  updateClickerUI();
  renderUpgrades();
  saveClicker();

  // Ball animation
  const ballEl = document.getElementById('clickerBall');
  if (ballEl) {
    ballEl.style.animation = 'none';
    void ballEl.offsetWidth;
    ballEl.style.animation = 'ballClick 0.15s ease';
    setTimeout(() => { ballEl.style.animation = 'idleBob 3s ease-in-out infinite'; }, 200);
  }

  // Coin pop
  const wrap = document.getElementById('clickParticles');
  if (wrap) {
    const pop = document.createElement('div');
    pop.className = 'coin-pop' + (CLICKER.combo >= 10 ? ' golden-pop' : '');
    pop.textContent = '+' + formatCoins(earned) + ' 🪙' + (CLICKER.combo >= 10 ? ' 🔥' : '');
    pop.style.left = (30 + Math.random() * 40) + '%';
    pop.style.top = (20 + Math.random() * 40) + '%';
    wrap.appendChild(pop);
    setTimeout(() => pop.remove(), 950);
  }

  playSound('score');
}

// ===== BUY UPGRADE =====
function buyUpgrade(id) {
  const upgrade = UPGRADES.find(u => u.id === id);
  if (!upgrade) return;
  const lv = upgradeState[id]?.level || 0;
  if (lv >= upgrade.maxLevel) return;
  const cost = getUpgradeCost(upgrade);
  if (!window.spendCoins || !window.spendCoins(cost)) return;
  upgradeState[id].level = lv + 1;
  recalcClicker();
  updateClickerUI();
  renderUpgrades();
  saveClicker();
  if (window.trackDailyProgress) window.trackDailyProgress('upgradesBought', 1);
  playSound('score');
}

// ===== DAILY BONUS =====
function claimDailyClickerBonus() {
  const today = new Date().toDateString();
  const key = 'clickerDailyBonus_' + today;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  const bonus = Math.floor(1000 * Math.pow(2, CLICKER.prestige || 0));
  CLICKER.totalCoins += bonus;
  if (window.addCoins) window.addCoins(bonus);

  const wrap = document.getElementById('clickParticles');
  if (wrap) {
    const pop = document.createElement('div');
    pop.className = 'coin-pop golden-pop';
    pop.textContent = '🎁 +' + formatCoins(bonus) + ' Daily Bonus!';
    pop.style.left = '20%';
    pop.style.top = '20%';
    pop.style.fontSize = '20px';
    wrap.appendChild(pop);
    setTimeout(() => pop.remove(), 1500);
  }

  updateClickerUI();
  renderUpgrades();
  saveClicker();
}
window.claimDailyClickerBonus = claimDailyClickerBonus;

// ===== PRESTIGE =====
function prestigeReset() {
  const threshold = prestigeThreshold(CLICKER.prestige);
  if (CLICKER.totalCoins < threshold) return;
  const nextLevel = (CLICKER.prestige || 0) + 1;
  const mult = Math.pow(3, nextLevel);
  const headStartAmt = CLICKER.perks.headStart ? 200000 : 25000;
  if (!confirm(
    `⭐ PRESTIGE #${nextLevel}\n\n` +
    `• Clicker upgrades reset\n` +
    `• Permanent ${mult}x ALL clicker earnings!\n` +
    `• +1 Prestige Point for the Perk Shop\n` +
    `• +💎 ${nextLevel} GEMS (buy elite players!)\n` +
    `• +🪙${(headStartAmt).toLocaleString()} coins to start\n` +
    `• 60-second PRESTIGE RUSH (5x bonus!)\n` +
    `• Next prestige at ${formatCoins(prestigeThreshold(nextLevel))}\n\n` +
    `Ready to ascend?`
  )) return;

  CLICKER.prestige = nextLevel;
  CLICKER.prestigePoints = (CLICKER.prestigePoints || 0) + 1;
  CLICKER.totalCoins = 0;
  Object.keys(upgradeState).forEach(k => { upgradeState[k].level = 0; });

  // Head Start — give coins
  if (window.addCoins) window.addCoins(headStartAmt);
  CLICKER.totalCoins += headStartAmt;

  // Give gems: prestige N gives N gems
  const gemsEarned = nextLevel;
  if (window.addGems) window.addGems(gemsEarned);

  // Ball auto-upgrades based on prestige (cosmetic)
  if (nextLevel >= 3 && !CLICKER.perks.skinFire)    CLICKER.ballSkin = 'fire';
  if (nextLevel >= 6 && !CLICKER.perks.skinDiamond) CLICKER.ballSkin = 'diamond';
  if (nextLevel >= 9 && !CLICKER.perks.skinGoat)    CLICKER.ballSkin = 'goat';

  recalcClicker();
  updateClickerUI();
  renderUpgrades();
  renderPerkShop();
  saveClicker();
  playSound('score');

  // Prestige Rush: 5x multiplier for 60 seconds
  CLICKER._rushActive = true;
  CLICKER._rushMult = 5;
  const rushEl = document.getElementById('prestigeRushBanner');
  if (rushEl) { rushEl.style.display = ''; rushEl.textContent = '🚀 PRESTIGE RUSH! 5x for 60s'; }
  let rushSeconds = 60;
  const rushInterval = setInterval(() => {
    rushSeconds--;
    if (rushEl) rushEl.textContent = `🚀 PRESTIGE RUSH! 5x — ${rushSeconds}s`;
    if (rushSeconds <= 0) {
      clearInterval(rushInterval);
      CLICKER._rushActive = false;
      CLICKER._rushMult = 1;
      if (rushEl) rushEl.style.display = 'none';
    }
  }, 1000);

  // Dramatic flash
  const ballEl = document.getElementById('clickerBall');
  if (ballEl) {
    ballEl.style.filter = 'drop-shadow(0 0 60px gold) drop-shadow(0 0 120px orange)';
    setTimeout(() => { ballEl.style.filter = ''; }, 3000);
  }
  showMilestoneToast({ icon: '⭐', text: `PRESTIGE #${nextLevel}! ${mult}x + RUSH!` });
}
window.prestigeReset = prestigeReset;

// ===== PERK SHOP =====
function renderPerkShop() {
  const el = document.getElementById('perkShopContent');
  if (!el) return;
  const pp = CLICKER.prestigePoints || 0;
  el.innerHTML = `
  <div class="perk-shop-header">🎁 Perk Shop &nbsp;<span class="perk-pp-badge">${pp} PP available</span></div>
  <div class="perk-shop-grid">
    ${PRESTIGE_PERKS.map(p => {
      const owned = CLICKER.perks[p.id];
      const canAfford = pp >= p.cost;
      const isSkin = !!p.skin;
      const activeSkin = isSkin && CLICKER.ballSkin === p.skin;
      return `
      <div class="perk-card ${owned ? 'perk-owned' : ''} ${activeSkin ? 'perk-active-skin' : ''}">
        <div class="perk-icon">${p.icon}</div>
        <div class="perk-name">${p.name}</div>
        <div class="perk-desc">${p.desc}</div>
        <div class="perk-cost">${p.cost} PP</div>
        ${owned
          ? (isSkin
            ? `<button class="perk-btn perk-btn-equip" onclick="perkEquipSkin('${p.skin}')">${activeSkin ? '✅ Equipped' : 'Equip'}</button>`
            : '<div class="perk-owned-label">✅ OWNED</div>')
          : `<button class="perk-btn ${canAfford ? '' : 'perk-btn-locked'}" onclick="perkBuy('${p.id}')" ${canAfford ? '' : 'disabled'}>${canAfford ? 'BUY' : 'Need ' + p.cost + ' PP'}</button>`
        }
      </div>`;
    }).join('')}
  </div>`;
}

window.perkBuy = function(id) {
  const perk = PRESTIGE_PERKS.find(p => p.id === id);
  if (!perk || CLICKER.perks[id]) return;
  if ((CLICKER.prestigePoints || 0) < perk.cost) { alert('Not enough Prestige Points!'); return; }
  CLICKER.prestigePoints -= perk.cost;
  CLICKER.perks[id] = true;
  if (perk.skin) CLICKER.ballSkin = perk.skin;
  recalcClicker();
  updateClickerUI();
  renderPerkShop();
  saveClicker();
};

window.perkEquipSkin = function(skin) {
  CLICKER.ballSkin = skin;
  updateClickerUI();
  saveClicker();
  renderPerkShop();
};

window.togglePerkShop = function() {
  const modal = document.getElementById('perkShopModal');
  if (!modal) return;
  const isOpen = modal.style.display === 'flex';
  modal.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) renderPerkShop();
};

// ===== GOLDEN BALL =====
let _gbActive = false;
function scheduleGoldenBall() {
  const base = CLICKER.perks?.goldenRush ? 15000 : 30000;
  const spread = CLICKER.perks?.goldenRush ? 20000 : 60000;
  setTimeout(showGoldenBall, base + Math.random() * spread);
}

function showGoldenBall() {
  if (_gbActive) return;
  const screen = document.getElementById('clickerScreen');
  if (!screen || !screen.classList.contains('active')) {
    setTimeout(showGoldenBall, 5000);
    return;
  }
  _gbActive = true;
  const wrap = document.getElementById('clickParticles');
  if (!wrap) { _gbActive = false; return; }

  const gb = document.createElement('div');
  gb.id = 'goldenBallEl';
  gb.className = 'golden-ball-bonus';
  gb.textContent = '✨';
  gb.style.left = (10 + Math.random() * 70) + '%';
  gb.style.top = (10 + Math.random() * 60) + '%';
  wrap.appendChild(gb);

  gb.onclick = () => {
    const bonus = Math.max(CLICKER.cpc * 100, 500);
    CLICKER.totalCoins += bonus;
    if (window.addCoins) window.addCoins(bonus);
    gb.remove();
    _gbActive = false;

    const pop = document.createElement('div');
    pop.className = 'coin-pop golden-pop';
    pop.style.fontSize = '22px';
    pop.style.left = gb.style.left;
    pop.style.top = gb.style.top;
    pop.textContent = '🌟 GOLDEN +' + formatCoins(bonus) + '!';
    wrap.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);

    updateClickerUI();
    renderUpgrades();
    saveClicker();
    scheduleGoldenBall();
  };

  setTimeout(() => {
    if (document.getElementById('goldenBallEl')) {
      document.getElementById('goldenBallEl')?.remove();
      _gbActive = false;
      scheduleGoldenBall();
    }
  }, 12000);
}

// ===== LUCKY SPIN =====
const SPIN_PRIZES = [
  { label: '+500 coins',    weight: 30, action: () => { window.addCoins(500); } },
  { label: '+2,000 coins',  weight: 20, action: () => { window.addCoins(2000); } },
  { label: '+10,000 coins', weight: 10, action: () => { window.addCoins(10000); } },
  { label: '+1 Gem 💎',     weight: 8,  action: () => { if(window.addGems) window.addGems(1); } },
  { label: '+3 Gems 💎',    weight: 4,  action: () => { if(window.addGems) window.addGems(3); } },
  { label: '+1 Prestige PP',weight: 4,  action: () => { CLICKER.prestigePoints = (CLICKER.prestigePoints||0)+1; updateClickerUI(); saveClicker(); } },
  { label: '2x CPC 30s 🔥', weight: 12, action: () => { const old=CLICKER.cpc; CLICKER.cpc*=2; setTimeout(()=>{CLICKER.cpc=old;updateClickerUI();},30000); } },
  { label: 'NOTHING 😔',    weight: 12, action: () => {} },
];

const SPIN_COST = 5000;
let _spinCooldown = false;

window.doLuckySpin = function() {
  if (_spinCooldown) { return; }
  const coins = window.getCoins ? window.getCoins() : 0;
  if (coins < SPIN_COST) { alert(`Lucky Spin costs 🪙${SPIN_COST.toLocaleString()} coins!`); return; }
  if (!window.spendCoins(SPIN_COST)) return;

  _spinCooldown = true;
  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) spinBtn.disabled = true;

  // Weighted random prize
  const total = SPIN_PRIZES.reduce((s,p) => s + p.weight, 0);
  let r = Math.random() * total;
  let prize = SPIN_PRIZES[SPIN_PRIZES.length - 1];
  for (const p of SPIN_PRIZES) {
    r -= p.weight;
    if (r <= 0) { prize = p; break; }
  }

  // Animate the spin display
  const spinEl = document.getElementById('spinResult');
  if (spinEl) {
    spinEl.style.display = 'block';
    spinEl.textContent = '🎰 Spinning…';
    spinEl.className = 'spin-result spin-spinning';
  }

  setTimeout(() => {
    prize.action();
    if (spinEl) {
      spinEl.textContent = `🎉 ${prize.label}!`;
      spinEl.className = 'spin-result spin-win' + (prize.label.includes('NOTHING') ? ' spin-nothing' : '');
    }
    updateClickerUI();
    renderUpgrades();
    saveClicker();
    setTimeout(() => {
      if (spinEl) spinEl.style.display = 'none';
      _spinCooldown = false;
      if (spinBtn) spinBtn.disabled = false;
    }, 2500);
  }, 1200);
};

// ===== AUTO-EARN LOOP =====
let _autoSaveTick = 0;
function startClickerLoop() {
  clearInterval(CLICKER.interval);
  CLICKER.interval = setInterval(() => {
    if (!document.getElementById('clickerScreen')?.classList.contains('active')) return;
    if (CLICKER.cps > 0) {
      const rushMult = CLICKER._rushActive ? (CLICKER._rushMult || 1) : 1;
      const earned = (CLICKER.cps / 10) * rushMult;
      CLICKER.totalCoins += earned;
      if (window.addCoins) window.addCoins(earned);
      if (window.trackDailyProgress) window.trackDailyProgress('clickerEarned', earned);
      updateClickerUI();
      if (Math.floor(window.getCoins ? window.getCoins() : 0) % 100 === 0) renderUpgrades();
    }
    // Save clicker totalCoins every ~5 seconds so prestige progress is persisted
    _autoSaveTick++;
    if (_autoSaveTick >= 50) { _autoSaveTick = 0; saveClicker(); }
  }, 100);
}

// ===== SCREEN HOOK =====
const _origShowScreen = window.showScreen;
window.showScreen = function(id) {
  _origShowScreen(id);
  if (id === 'clickerScreen') {
    const modal = document.getElementById('perkShopModal');
    if (modal) modal.style.display = 'none';
    loadClicker();
    renderUpgrades();
    updateClickerUI();
    renderPerkShop();
    startClickerLoop();
  }
};

// Load on startup
loadClicker();
scheduleGoldenBall();
