// =============================================
// AUTH.JS — Profile System (multi-save, persists forever)
// =============================================

const AUTH = {
  activeProfile: null,
  profiles: [],         // [{ name, created, lastPlayed }]
};

const PROFILE_KEYS = ['ps', 'clicker', 'trainState', 'dailyChallenges', 'mgrState', 'careerState'];

function authLoad() {
  AUTH.profiles = JSON.parse(localStorage.getItem('hm_profiles') || '[]');
  AUTH.activeProfile = localStorage.getItem('hm_active') || null;
}

function authSave() {
  localStorage.setItem('hm_profiles', JSON.stringify(AUTH.profiles));
}

function authExists(name) {
  return AUTH.profiles.some(p => p.name.toLowerCase() === name.toLowerCase());
}

// Save all current game state into the active profile snapshot
function authSnapshotSave() {
  if (!AUTH.activeProfile) return;
  const snap = {};
  PROFILE_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) snap[k] = val;
  });
  localStorage.setItem(`hm_snap_${AUTH.activeProfile}`, JSON.stringify(snap));
  // Update last played
  const p = AUTH.profiles.find(x => x.name === AUTH.activeProfile);
  if (p) p.lastPlayed = Date.now();
  authSave();
}

// Restore a profile's game state
function authSnapshotRestore(name) {
  const raw = localStorage.getItem(`hm_snap_${name}`);
  if (!raw) return;
  const snap = JSON.parse(raw);
  PROFILE_KEYS.forEach(k => {
    if (snap[k] !== undefined) localStorage.setItem(k, snap[k]);
    else localStorage.removeItem(k);
  });
}

// Clear game state (for new profile)
function authClearGameState() {
  PROFILE_KEYS.forEach(k => localStorage.removeItem(k));
}

function authLogin(name) {
  authSnapshotSave(); // save current if any
  AUTH.activeProfile = name;
  localStorage.setItem('hm_active', name);
  authSnapshotRestore(name);
  const p = AUTH.profiles.find(x => x.name === name);
  if (p) p.lastPlayed = Date.now();
  authSave();
}

function authCreateProfile(name) {
  if (authExists(name)) return false;
  AUTH.profiles.push({ name, created: Date.now(), lastPlayed: Date.now() });
  authSave();
  authSnapshotSave();
  AUTH.activeProfile = name;
  localStorage.setItem('hm_active', name);
  authClearGameState();
  return true;
}

function authDeleteProfile(name) {
  AUTH.profiles = AUTH.profiles.filter(p => p.name !== name);
  localStorage.removeItem(`hm_snap_${name}`);
  if (AUTH.activeProfile === name) {
    AUTH.activeProfile = null;
    localStorage.removeItem('hm_active');
    authClearGameState();
  }
  authSave();
}

// ===== RENDER =====
function renderAuthScreen() {
  const el = document.getElementById('authContent');
  if (!el) return;

  el.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-logo">🏀</div>
    <h1 class="auth-title">HOOP<span>MASTER</span></h1>
    <p class="auth-sub">Select a profile or create a new one to save your progress forever.</p>

    <div class="auth-profiles">
      ${AUTH.profiles.length === 0
        ? '<p class="auth-empty">No profiles yet. Create one below!</p>'
        : AUTH.profiles.map(p => `
          <div class="auth-profile-card ${p.name === AUTH.activeProfile ? 'auth-active' : ''}">
            <div class="auth-profile-avatar">${p.name[0].toUpperCase()}</div>
            <div class="auth-profile-info">
              <div class="auth-profile-name">${p.name}</div>
              <div class="auth-profile-date">Last played: ${p.lastPlayed ? new Date(p.lastPlayed).toLocaleDateString() : 'Never'}</div>
            </div>
            <div class="auth-profile-actions">
              <button class="auth-btn-login" onclick="authSelectProfile('${p.name}')">
                ${p.name === AUTH.activeProfile ? '✅ ACTIVE' : '▶ PLAY'}
              </button>
              ${p.name !== AUTH.activeProfile ? `<button class="auth-btn-delete" onclick="authDeleteConfirm('${p.name}')">🗑️</button>` : ''}
            </div>
          </div>`
        ).join('')}
    </div>

    <div class="auth-create">
      <h3 class="auth-create-title">Create New Profile</h3>
      <div class="auth-create-row">
        <input type="text" id="authNameInput" class="auth-input" placeholder="Enter your name..." maxlength="16" onkeydown="if(event.key==='Enter')authSubmitCreate()" />
        <button class="auth-btn-create" onclick="authSubmitCreate()">CREATE</button>
      </div>
      <div id="authMsg" class="auth-msg"></div>
    </div>
  </div>`;
}

window.authSelectProfile = function(name) {
  if (name === AUTH.activeProfile) {
    showScreen('splash');
    return;
  }
  authLogin(name);
  // Reload game state
  if (window.PS) {
    const saved = JSON.parse(localStorage.getItem('ps') || 'null');
    if (saved) Object.assign(window.PS, saved);
  }
  updateCoinsDisplay();
  showScreen('splash');
};

window.authSubmitCreate = function() {
  const input = document.getElementById('authNameInput');
  const msg = document.getElementById('authMsg');
  if (!input) return;
  const name = input.value.trim();
  if (!name || name.length < 2) { msg.textContent = 'Name must be at least 2 characters.'; msg.style.color = '#f66'; return; }
  if (name.length > 16) { msg.textContent = 'Name too long (max 16 chars).'; msg.style.color = '#f66'; return; }
  if (!/^[a-zA-Z0-9_ ]+$/.test(name)) { msg.textContent = 'Only letters, numbers, spaces, underscores.'; msg.style.color = '#f66'; return; }
  if (authExists(name)) { msg.textContent = 'Profile already exists! Pick a different name.'; msg.style.color = '#f66'; return; }

  authCreateProfile(name);
  // Reload fresh game state
  if (window.PS) {
    const saved = JSON.parse(localStorage.getItem('ps') || 'null');
    if (saved) Object.assign(window.PS, { coins:0, collection:[], squad:{}, trophies:[], highScores:{} });
  }
  updateCoinsDisplay();
  showScreen('splash');
};

window.authDeleteConfirm = function(name) {
  if (confirm(`Delete profile "${name}"? All progress will be lost forever!`)) {
    authDeleteProfile(name);
    renderAuthScreen();
  }
};

// Auto-save snapshot every 60 seconds
setInterval(() => { if (AUTH.activeProfile) authSnapshotSave(); }, 60000);

// Save on page unload
window.addEventListener('beforeunload', () => { if (AUTH.activeProfile) authSnapshotSave(); });

function updateHubProfileName() {
  const el = document.getElementById('hubProfileName');
  if (el) el.textContent = AUTH.activeProfile || 'Guest';
}

// ===== INIT =====
authLoad();
window.renderAuthScreen = renderAuthScreen;
window.authSnapshotSave = authSnapshotSave;
window.AUTH = AUTH;

// Show auth screen on load if no active profile
window.addEventListener('load', () => {
  updateHubProfileName();
  if (!AUTH.activeProfile || AUTH.profiles.length === 0) {
    setTimeout(() => showScreen('authScreen'), 100);
  }
});

// Update name when returning to hub
const _origShowScreenAuth = window.showScreen;
window.showScreen = function(id) {
  _origShowScreenAuth(id);
  if (id === 'splash') updateHubProfileName();
};
