// =============================================
// AUTH.JS — Profile System with Password Protection
// Progress is saved automatically and NEVER deleted unless manually confirmed.
// =============================================

const AUTH = {
  activeProfile: null,
  profiles: [],   // [{ name, passwordHash, created, lastPlayed, playtime }]
};

const PROFILE_KEYS = ['playerState','clicker','trainState','dailyChallenges','mgrState','careerState'];

// Simple hash for passwords (not cryptographic — this is a game)
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h.toString(36);
}

function authLoad() {
  AUTH.profiles = JSON.parse(localStorage.getItem('hm_profiles') || '[]');
  AUTH.activeProfile = localStorage.getItem('hm_active') || null;
}

function authSave() {
  localStorage.setItem('hm_profiles', JSON.stringify(AUTH.profiles));
}

// Save ALL game state into the active profile snapshot (never destructive)
function authSnapshotSave() {
  if (!AUTH.activeProfile) return;
  const snap = {};
  PROFILE_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) snap[k] = val;
  });
  snap._savedAt = Date.now();
  localStorage.setItem(`hm_snap_${AUTH.activeProfile}`, JSON.stringify(snap));
  // Backup copy so we never lose data
  localStorage.setItem(`hm_snap_bak_${AUTH.activeProfile}`, JSON.stringify(snap));
  const p = AUTH.profiles.find(x => x.name === AUTH.activeProfile);
  if (p) {
    p.lastPlayed = Date.now();
    p.playtime   = (p.playtime || 0) + 1;
  }
  authSave();
}

function authSnapshotRestore(name) {
  let raw = localStorage.getItem(`hm_snap_${name}`);
  if (!raw) raw = localStorage.getItem(`hm_snap_bak_${name}`); // fallback to backup
  if (!raw) return;
  const snap = JSON.parse(raw);
  PROFILE_KEYS.forEach(k => {
    if (snap[k] !== undefined) localStorage.setItem(k, snap[k]);
    else localStorage.removeItem(k);
  });
}

function authClearGameState() {
  PROFILE_KEYS.forEach(k => localStorage.removeItem(k));
}

function authExists(name) {
  return AUTH.profiles.some(p => p.name.toLowerCase() === name.toLowerCase());
}

function authLogin(name) {
  authSnapshotSave();
  AUTH.activeProfile = name;
  localStorage.setItem('hm_active', name);
  authSnapshotRestore(name);
  const p = AUTH.profiles.find(x => x.name === name);
  if (p) p.lastPlayed = Date.now();
  authSave();
}

function authCreateProfile(name, password) {
  if (authExists(name)) return false;
  const passwordHash = password ? simpleHash(password) : null;
  AUTH.profiles.push({ name, passwordHash, created: Date.now(), lastPlayed: Date.now(), playtime: 0 });
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
  localStorage.removeItem(`hm_snap_bak_${name}`);
  if (AUTH.activeProfile === name) {
    AUTH.activeProfile = null;
    localStorage.removeItem('hm_active');
    authClearGameState();
  }
  authSave();
}

function authCheckPassword(name, password) {
  const p = AUTH.profiles.find(x => x.name === name);
  if (!p) return false;
  if (!p.passwordHash) return true; // no password set
  return simpleHash(password) === p.passwordHash;
}

// ===== RENDER =====
let _pendingLoginName = null;

function renderAuthScreen() {
  const el = document.getElementById('authContent');
  if (!el) return;

  el.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-logo">🏀</div>
    <h1 class="auth-title">HOOP<span>MASTER</span></h1>
    <p class="auth-sub">Your progress is saved automatically and never lost. Select a profile to play.</p>

    <div class="auth-profiles">
      ${AUTH.profiles.length === 0
        ? '<p class="auth-empty">No profiles yet. Create one below!</p>'
        : AUTH.profiles.map(p => `
          <div class="auth-profile-card ${p.name === AUTH.activeProfile ? 'auth-active' : ''}">
            <div class="auth-profile-avatar">${p.name[0].toUpperCase()}</div>
            <div class="auth-profile-info">
              <div class="auth-profile-name">${p.name} ${p.passwordHash ? '🔒' : ''}</div>
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
        <input type="text"     id="authNameInput" class="auth-input" placeholder="Your name (2-16 chars)..." maxlength="16"
          onkeydown="if(event.key==='Enter')document.getElementById('authPassInput').focus()" />
      </div>
      <div class="auth-create-row" style="margin-top:8px">
        <input type="password" id="authPassInput" class="auth-input" placeholder="Password (optional)..." maxlength="32"
          onkeydown="if(event.key==='Enter')authSubmitCreate()" />
        <button class="auth-btn-create" onclick="authSubmitCreate()">CREATE</button>
      </div>
      <div id="authMsg" class="auth-msg"></div>
    </div>

    <!-- Password prompt modal -->
    <div id="authPasswordModal" class="auth-pw-modal" style="display:none">
      <div class="auth-pw-inner">
        <div class="auth-pw-title">🔒 Enter Password</div>
        <div class="auth-pw-name" id="authPwProfileName"></div>
        <input type="password" id="authPwInput" class="auth-input" placeholder="Password..." maxlength="32"
          onkeydown="if(event.key==='Enter')authSubmitPassword()" style="margin-top:10px" />
        <div id="authPwMsg" class="auth-msg"></div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          <button class="auth-btn-create" onclick="authSubmitPassword()">UNLOCK</button>
          <button class="auth-btn-delete" onclick="document.getElementById('authPasswordModal').style.display='none'">CANCEL</button>
        </div>
      </div>
    </div>
  </div>`;
}

window.authSelectProfile = function(name) {
  if (name === AUTH.activeProfile) {
    showScreen('splash');
    return;
  }
  const p = AUTH.profiles.find(x => x.name === name);
  if (p && p.passwordHash) {
    // Show password prompt
    _pendingLoginName = name;
    document.getElementById('authPasswordModal').style.display = 'flex';
    document.getElementById('authPwProfileName').textContent = name;
    document.getElementById('authPwInput').value = '';
    document.getElementById('authPwMsg').textContent = '';
    setTimeout(() => document.getElementById('authPwInput')?.focus(), 100);
    return;
  }
  authDoLogin(name);
};

window.authSubmitPassword = function() {
  const input = document.getElementById('authPwInput');
  const msg   = document.getElementById('authPwMsg');
  if (!input || !_pendingLoginName) return;
  const pw = input.value;
  if (!authCheckPassword(_pendingLoginName, pw)) {
    msg.textContent = '❌ Wrong password. Try again.';
    msg.style.color = '#f66';
    input.value = '';
    return;
  }
  document.getElementById('authPasswordModal').style.display = 'none';
  authDoLogin(_pendingLoginName);
  _pendingLoginName = null;
};

function authDoLogin(name) {
  authLogin(name);
  // Reload all game systems with new profile data
  if (typeof loadPS === 'function')   loadPS();
  if (typeof loadClicker === 'function') loadClicker();
  if (typeof loadMGR === 'function')  loadMGR();
  if (typeof loadCareer === 'function') loadCareer();
  if (typeof loadDailyChallenges === 'function') loadDailyChallenges();
  updateCoinsDisplay();
  updateHubProfileName();
  showScreen('splash');
}

window.authSubmitCreate = function() {
  const input  = document.getElementById('authNameInput');
  const passIn = document.getElementById('authPassInput');
  const msg    = document.getElementById('authMsg');
  if (!input) return;
  const name = input.value.trim();
  const pass = passIn ? passIn.value.trim() : '';

  if (!name || name.length < 2)  { msg.textContent = 'Name must be at least 2 characters.'; msg.style.color='#f66'; return; }
  if (name.length > 16)          { msg.textContent = 'Name too long (max 16 chars).';        msg.style.color='#f66'; return; }
  if (!/^[a-zA-Z0-9_ ]+$/.test(name)) { msg.textContent = 'Only letters, numbers, spaces, underscores.'; msg.style.color='#f66'; return; }
  if (authExists(name))          { msg.textContent = 'Profile already exists! Pick another name.'; msg.style.color='#f66'; return; }

  authCreateProfile(name, pass || null);
  updateCoinsDisplay();
  updateHubProfileName();
  showScreen('splash');
};

window.authDeleteConfirm = function(name) {
  if (confirm(`⚠️ Delete profile "${name}"?\n\nThis will permanently erase ALL progress for this profile. This cannot be undone!`)) {
    authDeleteProfile(name);
    renderAuthScreen();
  }
};

// ===== AUTO-SAVE (aggressive — every 30s + on every important action) =====
setInterval(() => { if (AUTH.activeProfile) authSnapshotSave(); }, 30000);
window.addEventListener('beforeunload', () => { if (AUTH.activeProfile) authSnapshotSave(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && AUTH.activeProfile) authSnapshotSave();
});

function updateHubProfileName() {
  const el = document.getElementById('hubProfileName');
  if (el) el.textContent = AUTH.activeProfile || 'Guest';
}

// ===== INIT =====
authLoad();
window.renderAuthScreen   = renderAuthScreen;
window.authSnapshotSave   = authSnapshotSave;
window.AUTH = AUTH;

window.addEventListener('load', () => {
  updateHubProfileName();
  if (!AUTH.activeProfile || AUTH.profiles.length === 0) {
    setTimeout(() => showScreen('authScreen'), 150);
  }
});

const _origShowScreenAuth = window.showScreen;
window.showScreen = function(id) {
  _origShowScreenAuth(id);
  if (id === 'splash') updateHubProfileName();
  // Auto-save whenever navigating back to hub
  if (id === 'splash' && AUTH.activeProfile) authSnapshotSave();
};
