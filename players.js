// ===== TRAITS =====
const TRAITS = {
  hot_hand:      { id: 'hot_hand',      icon: '🔥', label: 'Hot Hand',       desc: 'On 3+ streak: accuracy +30%' },
  sharpshooter:  { id: 'sharpshooter',  icon: '🎯', label: 'Sharpshooter',   desc: '3-pointers give +1 extra pt' },
  clutch_gene:   { id: 'clutch_gene',   icon: '💪', label: 'Clutch Gene',    desc: 'Last 3 shots: spread halved' },
  deep_range:    { id: 'deep_range',    icon: '🌐', label: 'Deep Range',     desc: '3pt zone is wider' },
  quick_release: { id: 'quick_release', icon: '⚡', label: 'Quick Release',  desc: 'Power bar fills 40% slower' },
  legend_aura:   { id: 'legend_aura',   icon: '👑', label: 'Legend Aura',    desc: 'Every basket +1 bonus pt' },
  glass_cleaner: { id: 'glass_cleaner', icon: '🪟', label: 'Glass Cleaner',  desc: 'Bank shots always score' },
  wind_proof:    { id: 'wind_proof',    icon: '💨', label: 'Wind Proof',     desc: 'Wind has zero effect' },
  magic_touch:   { id: 'magic_touch',   icon: '🔮', label: 'Magic Touch',    desc: 'Rim hits score 45% of time' },
  floor_general: { id: 'floor_general', icon: '📋', label: 'Floor General',  desc: '+5 coins bonus per basket' },
  bank_king:     { id: 'bank_king',     icon: '🏦', label: 'Bank King',      desc: 'Bank Shot mini-game +8 pts' },
};

// ===== PLAYER DATABASE =====
const PLAYER_DB = [
  // ── LEGEND (93-99) ──────────────────────────────────────────────
  { id:'mj',    name:'M. Jordan',    full:'Michael Jordan',       pos:'SG', ovr:99, rarity:'legend', team:'Bulls',       nat:'🇺🇸', color:'#e03333', stats:{sht:99,spd:95,drb:98,def:96,phy:92}, traits:['hot_hand','clutch_gene','sharpshooter'] },
  { id:'lebron',name:'LeBron James', full:'LeBron James',         pos:'SF', ovr:97, rarity:'legend', team:'Lakers',      nat:'🇺🇸', color:'#552583', stats:{sht:91,spd:90,drb:95,def:90,phy:99}, traits:['legend_aura','clutch_gene','floor_general'] },
  { id:'kobe',  name:'K. Bryant',    full:'Kobe Bryant',          pos:'SG', ovr:97, rarity:'legend', team:'Lakers',      nat:'🇺🇸', color:'#552583', stats:{sht:97,spd:93,drb:96,def:92,phy:88}, traits:['sharpshooter','clutch_gene','quick_release'] },
  { id:'giannis',name:'Giannis A.',  full:'Giannis Antetokounmpo',pos:'PF', ovr:97, rarity:'legend', team:'Bucks',       nat:'🇬🇷', color:'#00471B', stats:{sht:78,spd:98,drb:95,def:95,phy:99}, traits:['legend_aura','glass_cleaner'] },
  { id:'curry',  name:'S. Curry',    full:'Stephen Curry',        pos:'PG', ovr:96, rarity:'legend', team:'Warriors',    nat:'🇺🇸', color:'#1D428A', stats:{sht:99,spd:92,drb:94,def:80,phy:80}, traits:['sharpshooter','deep_range','hot_hand'] },
  { id:'kareem', name:'K. Abdul-J.', full:'Kareem Abdul-Jabbar',  pos:'C',  ovr:96, rarity:'legend', team:'Lakers',      nat:'🇺🇸', color:'#552583', stats:{sht:88,spd:82,drb:92,def:97,phy:98}, traits:['glass_cleaner','legend_aura'] },
  { id:'kd',     name:'K. Durant',   full:'Kevin Durant',         pos:'SF', ovr:96, rarity:'legend', team:'Suns',        nat:'🇺🇸', color:'#1D1160', stats:{sht:97,spd:90,drb:95,def:88,phy:88}, traits:['sharpshooter','clutch_gene','deep_range'] },
  { id:'jokic',  name:'N. Jokic',    full:'Nikola Jokic',         pos:'C',  ovr:95, rarity:'legend', team:'Nuggets',     nat:'🇷🇸', color:'#0E2240', stats:{sht:88,spd:78,drb:93,def:83,phy:95}, traits:['magic_touch','floor_general'] },
  { id:'magic',  name:'Magic Johnson',full:'Magic Johnson',        pos:'PG', ovr:95, rarity:'legend', team:'Lakers',      nat:'🇺🇸', color:'#552583', stats:{sht:84,spd:88,drb:96,def:83,phy:92}, traits:['floor_general','clutch_gene','legend_aura'] },
  { id:'bird',   name:'L. Bird',     full:'Larry Bird',           pos:'SF', ovr:95, rarity:'legend', team:'Celtics',     nat:'🇺🇸', color:'#007A33', stats:{sht:97,spd:80,drb:89,def:84,phy:88}, traits:['sharpshooter','clutch_gene','deep_range'] },

  // ── ELITE (87-92) ───────────────────────────────────────────────
  { id:'luka',  name:'L. Doncic',    full:'Luka Doncic',          pos:'PG', ovr:92, rarity:'elite',  team:'Mavericks',   nat:'🇸🇮', color:'#00538C', stats:{sht:92,spd:83,drb:95,def:74,phy:90}, traits:['deep_range','clutch_gene'] },
  { id:'ant',   name:'A. Edwards',   full:'Anthony Edwards',      pos:'SG', ovr:91, rarity:'elite',  team:'Timberwolves',nat:'🇺🇸', color:'#0C2340', stats:{sht:89,spd:96,drb:90,def:85,phy:93}, traits:['hot_hand','sharpshooter'] },
  { id:'wemby', name:'V. Wembanyama',full:'Victor Wembanyama',    pos:'C',  ovr:91, rarity:'elite',  team:'Spurs',       nat:'🇫🇷', color:'#C4CED4', stats:{sht:85,spd:86,drb:88,def:99,phy:82}, traits:['deep_range','glass_cleaner'] },
  { id:'embiid',name:'J. Embiid',    full:'Joel Embiid',          pos:'C',  ovr:91, rarity:'elite',  team:'76ers',       nat:'🇨🇲', color:'#006BB6', stats:{sht:88,spd:78,drb:87,def:92,phy:99}, traits:['glass_cleaner','sharpshooter'] },
  { id:'sga',   name:'SGA',          full:'Shai Gilgeous-Alexander',pos:'PG',ovr:91,rarity:'elite',  team:'Thunder',     nat:'🇨🇦', color:'#007AC1', stats:{sht:91,spd:94,drb:93,def:85,phy:86}, traits:['quick_release','clutch_gene'] },
  { id:'tatum', name:'J. Tatum',     full:'Jayson Tatum',         pos:'SF', ovr:90, rarity:'elite',  team:'Celtics',     nat:'🇺🇸', color:'#007A33', stats:{sht:90,spd:87,drb:90,def:86,phy:88}, traits:['sharpshooter','clutch_gene'] },
  { id:'dame',  name:'D. Lillard',   full:'Damian Lillard',       pos:'PG', ovr:90, rarity:'elite',  team:'Bucks',       nat:'🇺🇸', color:'#00471B', stats:{sht:93,spd:88,drb:91,def:75,phy:82}, traits:['deep_range','clutch_gene'] },
  { id:'ad',    name:'A. Davis',     full:'Anthony Davis',        pos:'PF', ovr:89, rarity:'elite',  team:'Lakers',      nat:'🇺🇸', color:'#552583', stats:{sht:82,spd:86,drb:86,def:96,phy:97}, traits:['glass_cleaner'] },
  { id:'booker',name:'D. Booker',    full:'Devin Booker',         pos:'SG', ovr:89, rarity:'elite',  team:'Suns',        nat:'🇺🇸', color:'#1D1160', stats:{sht:93,spd:89,drb:88,def:78,phy:84}, traits:['sharpshooter','hot_hand'] },
  { id:'kawhi', name:'K. Leonard',   full:'Kawhi Leonard',        pos:'SF', ovr:88, rarity:'elite',  team:'Clippers',    nat:'🇺🇸', color:'#C8102E', stats:{sht:87,spd:87,drb:88,def:95,phy:93}, traits:['clutch_gene','sharpshooter'] },
  { id:'butler',name:'J. Butler',    full:'Jimmy Butler',         pos:'SF', ovr:88, rarity:'elite',  team:'Heat',        nat:'🇺🇸', color:'#98002E', stats:{sht:83,spd:87,drb:85,def:90,phy:96}, traits:['clutch_gene','wind_proof'] },
  { id:'trae',  name:'T. Young',     full:'Trae Young',           pos:'PG', ovr:88, rarity:'elite',  team:'Hawks',       nat:'🇺🇸', color:'#E03A3E', stats:{sht:92,spd:86,drb:90,def:60,phy:70}, traits:['deep_range','magic_touch'] },
  { id:'kyrie', name:'K. Irving',    full:'Kyrie Irving',         pos:'PG', ovr:87, rarity:'elite',  team:'Mavericks',   nat:'🇺🇸', color:'#00538C', stats:{sht:91,spd:92,drb:96,def:74,phy:80}, traits:['magic_touch','quick_release'] },
  { id:'ja',    name:'J. Morant',    full:'Ja Morant',            pos:'PG', ovr:87, rarity:'elite',  team:'Grizzlies',   nat:'🇺🇸', color:'#5D76A9', stats:{sht:82,spd:97,drb:93,def:75,phy:82}, traits:['quick_release','hot_hand'] },
  { id:'kat',   name:'K-A. Towns',   full:'Karl-Anthony Towns',   pos:'C',  ovr:87, rarity:'elite',  team:'Timberwolves',nat:'🇺🇸', color:'#0C2340', stats:{sht:90,spd:80,drb:83,def:82,phy:90}, traits:['deep_range','sharpshooter'] },

  // ── GOLD (77-86) ────────────────────────────────────────────────
  { id:'brunson',name:'J. Brunson',  full:'Jalen Brunson',        pos:'PG', ovr:85, rarity:'gold',   team:'Knicks',      nat:'🇺🇸', color:'#006BB6', stats:{sht:87,spd:84,drb:87,def:74,phy:80}, traits:['clutch_gene'] },
  { id:'zion',  name:'Z. Williamson',full:'Zion Williamson',      pos:'PF', ovr:84, rarity:'gold',   team:'Pelicans',    nat:'🇺🇸', color:'#0C2340', stats:{sht:76,spd:90,drb:86,def:78,phy:99}, traits:['glass_cleaner'] },
  { id:'mitchell',name:'D. Mitchell',full:'Donovan Mitchell',     pos:'SG', ovr:83, rarity:'gold',   team:'Cavaliers',   nat:'🇺🇸', color:'#860038', stats:{sht:86,spd:92,drb:87,def:79,phy:85}, traits:['clutch_gene'] },
  { id:'jgreen',name:'J. Green',     full:'Jalen Green',          pos:'SG', ovr:82, rarity:'gold',   team:'Rockets',     nat:'🇺🇸', color:'#CE1141', stats:{sht:84,spd:94,drb:83,def:72,phy:82}, traits:['hot_hand'] },
  { id:'fox',   name:"D. Fox",       full:"De'Aaron Fox",         pos:'PG', ovr:82, rarity:'gold',   team:'Kings',       nat:'🇺🇸', color:'#5A2D81', stats:{sht:80,spd:98,drb:88,def:76,phy:80}, traits:['quick_release'] },
  { id:'beal',  name:'B. Beal',      full:'Bradley Beal',         pos:'SG', ovr:82, rarity:'gold',   team:'Suns',        nat:'🇺🇸', color:'#1D1160', stats:{sht:89,spd:86,drb:86,def:76,phy:80}, traits:['sharpshooter'] },
  { id:'pg13',  name:'P. George',    full:'Paul George',          pos:'SF', ovr:81, rarity:'gold',   team:'76ers',       nat:'🇺🇸', color:'#006BB6', stats:{sht:86,spd:87,drb:85,def:88,phy:85}, traits:['sharpshooter'] },
  { id:'bam',   name:'B. Adebayo',   full:'Bam Adebayo',          pos:'C',  ovr:81, rarity:'gold',   team:'Heat',        nat:'🇺🇸', color:'#98002E', stats:{sht:72,spd:84,drb:80,def:91,phy:97}, traits:['glass_cleaner'] },
  { id:'dray',  name:'D. Green',     full:'Draymond Green',       pos:'PF', ovr:81, rarity:'gold',   team:'Warriors',    nat:'🇺🇸', color:'#1D428A', stats:{sht:68,spd:82,drb:80,def:95,phy:90}, traits:['floor_general'] },
  { id:'middleton',name:'K. Middleton',full:'Khris Middleton',    pos:'SF', ovr:80, rarity:'gold',   team:'Bucks',       nat:'🇺🇸', color:'#00471B', stats:{sht:86,spd:82,drb:83,def:80,phy:83}, traits:['clutch_gene'] },
  { id:'siakam',name:'P. Siakam',    full:'Pascal Siakam',        pos:'PF', ovr:80, rarity:'gold',   team:'Pacers',      nat:'🇨🇲', color:'#002D62', stats:{sht:80,spd:88,drb:84,def:82,phy:88}, traits:['hot_hand'] },
  { id:'lamelo',name:'LaMelo Ball',  full:'LaMelo Ball',          pos:'PG', ovr:79, rarity:'gold',   team:'Hornets',     nat:'🇺🇸', color:'#1D1160', stats:{sht:80,spd:88,drb:89,def:68,phy:74}, traits:['magic_touch'] },
  { id:'herro', name:'T. Herro',     full:'Tyler Herro',          pos:'SG', ovr:79, rarity:'gold',   team:'Heat',        nat:'🇺🇸', color:'#98002E', stats:{sht:86,spd:84,drb:84,def:68,phy:74}, traits:['hot_hand'] },
  { id:'cjmc',  name:'CJ McCollum',  full:'CJ McCollum',          pos:'SG', ovr:78, rarity:'gold',   team:'Pelicans',    nat:'🇺🇸', color:'#0C2340', stats:{sht:85,spd:84,drb:83,def:72,phy:74}, traits:['quick_release'] },
  { id:'franz', name:'F. Wagner',    full:'Franz Wagner',         pos:'SF', ovr:77, rarity:'gold',   team:'Magic',       nat:'🇩🇪', color:'#0077C0', stats:{sht:79,spd:85,drb:81,def:80,phy:82}, traits:['hot_hand'] },

  // ── SILVER (68-76) ──────────────────────────────────────────────
  { id:'bridges',name:'M. Bridges',  full:'Mikal Bridges',        pos:'SF', ovr:76, rarity:'silver', team:'Knicks',      nat:'🇺🇸', color:'#006BB6', stats:{sht:79,spd:88,drb:78,def:88,phy:82}, traits:['sharpshooter'] },
  { id:'tyhalip',name:'T. Haliburton',full:'Tyrese Haliburton',   pos:'PG', ovr:76, rarity:'silver', team:'Pacers',      nat:'🇺🇸', color:'#002D62', stats:{sht:80,spd:87,drb:85,def:74,phy:74}, traits:['floor_general'] },
  { id:'mobley',name:'E. Mobley',    full:'Evan Mobley',          pos:'C',  ovr:75, rarity:'silver', team:'Cavaliers',   nat:'🇺🇸', color:'#860038', stats:{sht:72,spd:82,drb:77,def:90,phy:88}, traits:['glass_cleaner'] },
  { id:'og',    name:'OG Anunoby',   full:'OG Anunoby',           pos:'SF', ovr:75, rarity:'silver', team:'Knicks',      nat:'🇨🇦', color:'#006BB6', stats:{sht:75,spd:88,drb:75,def:90,phy:88}, traits:['wind_proof'] },
  { id:'poole', name:'J. Poole',     full:'Jordan Poole',         pos:'SG', ovr:73, rarity:'silver', team:'Wizards',     nat:'🇺🇸', color:'#E31837', stats:{sht:82,spd:86,drb:81,def:64,phy:72}, traits:['deep_range'] },
  { id:'rjb',   name:'RJ Barrett',   full:'RJ Barrett',           pos:'SF', ovr:73, rarity:'silver', team:'Raptors',     nat:'🇨🇦', color:'#CE1141', stats:{sht:76,spd:83,drb:80,def:77,phy:84}, traits:['clutch_gene'] },
  { id:'rozier',name:'T. Rozier',    full:'Terry Rozier',         pos:'SG', ovr:72, rarity:'silver', team:'Heat',        nat:'🇺🇸', color:'#98002E', stats:{sht:79,spd:87,drb:79,def:72,phy:76}, traits:['deep_range'] },
  { id:'iq',    name:'I. Quickley',  full:'Immanuel Quickley',    pos:'PG', ovr:72, rarity:'silver', team:'Raptors',     nat:'🇺🇸', color:'#CE1141', stats:{sht:78,spd:88,drb:80,def:72,phy:74}, traits:['quick_release'] },
  { id:'clarkson',name:'J. Clarkson',full:'Jordan Clarkson',      pos:'SG', ovr:71, rarity:'silver', team:'Jazz',        nat:'🇵🇭', color:'#00471B', stats:{sht:77,spd:84,drb:79,def:64,phy:74}, traits:['magic_touch'] },
  { id:'mbridges',name:'M. Bridges', full:'Miles Bridges',        pos:'SF', ovr:71, rarity:'silver', team:'Hornets',     nat:'🇺🇸', color:'#1D1160', stats:{sht:74,spd:88,drb:78,def:74,phy:90}, traits:['hot_hand'] },

  // ── BRONZE (60-67) ──────────────────────────────────────────────
  { id:'jabari',name:'J. Smith Jr',  full:'Jabari Smith Jr',      pos:'PF', ovr:67, rarity:'bronze', team:'Rockets',     nat:'🇺🇸', color:'#CE1141', stats:{sht:72,spd:79,drb:70,def:78,phy:84}, traits:[] },
  { id:'chet',  name:'C. Holmgren',  full:'Chet Holmgren',        pos:'C',  ovr:67, rarity:'bronze', team:'Thunder',     nat:'🇺🇸', color:'#007AC1', stats:{sht:74,spd:78,drb:72,def:84,phy:72}, traits:['deep_range'] },
  { id:'kelel', name:"K. Ware",      full:"Kel'el Ware",          pos:'C',  ovr:65, rarity:'bronze', team:'Heat',        nat:'🇺🇸', color:'#98002E', stats:{sht:68,spd:76,drb:66,def:80,phy:88}, traits:[] },
  { id:'bmiller',name:'B. Miller',   full:'Brandon Miller',       pos:'SF', ovr:66, rarity:'bronze', team:'Hornets',     nat:'🇺🇸', color:'#1D1160', stats:{sht:72,spd:82,drb:70,def:70,phy:76}, traits:[] },
  { id:'scoot', name:'S. Henderson', full:'Scoot Henderson',      pos:'PG', ovr:64, rarity:'bronze', team:'Trail Blazers',nat:'🇺🇸',color:'#E03A3E', stats:{sht:68,spd:90,drb:76,def:66,phy:74}, traits:['quick_release'] },
];

// ===== PACK DEFINITIONS =====
const PACKS = [
  { id:'starter',   name:'Starter Pack',   icon:'🎒', cost:500,    cards:3, color:'#4a7a4a',
    odds:{ bronze:0.90, silver:0.10, gold:0,    elite:0,    legend:0 },
    desc:'3 cards — great for beginners, cheap entry pack' },
  { id:'bronze',    name:'Bronze Pack',    icon:'🟫', cost:3000,   cards:5, color:'#8B5E3C',
    odds:{ bronze:0.70, silver:0.25, gold:0.05, elite:0,    legend:0 },
    desc:'Mostly bronze players with a chance of silver' },
  { id:'silver',    name:'Silver Pack',    icon:'🥈', cost:12000,  cards:5, color:'#8892B0',
    odds:{ bronze:0.15, silver:0.55, gold:0.25, elite:0.05, legend:0 },
    desc:'Solid silver cards, good gold chance' },
  { id:'youngstars',name:'Young Stars',    icon:'🌟', cost:18000,  cards:4, color:'#00d4ff',
    odds:{ bronze:0,    silver:0.40, gold:0.45, elite:0.15, legend:0 },
    desc:'4 cards focused on up-and-coming talent' },
  { id:'gold',      name:'Gold Pack',      icon:'🥇', cost:50000,  cards:5, color:'#FFD700',
    odds:{ bronze:0,    silver:0.15, gold:0.55, elite:0.25, legend:0.05 },
    desc:'Mostly gold with elite & legend chance' },
  { id:'draft',     name:'Draft Night',    icon:'📋', cost:25000,  cards:3, color:'#007AC1',
    odds:{ bronze:0,    silver:0.30, gold:0.50, elite:0.20, legend:0 },
    desc:'3 hand-picked quality players — good value' },
  { id:'allstar',   name:'All-Star Pack',  icon:'⭐', cost:90000,  cards:5, color:'#ff4080',
    odds:{ bronze:0,    silver:0,    gold:0.20, elite:0.65, legend:0.15 },
    desc:'Guaranteed elite+ — handpicked All-Stars' },
  { id:'elite',     name:'Elite Pack',     icon:'💎', cost:200000, cards:5, color:'#7B2FBE',
    odds:{ bronze:0,    silver:0,    gold:0.10, elite:0.70, legend:0.20 },
    desc:'Guaranteed elite players, high legend chance' },
  { id:'throwback', name:'Throwback Pack', icon:'📼', cost:150000, cards:4, color:'#cc8800',
    odds:{ bronze:0,    silver:0,    gold:0.05, elite:0.45, legend:0.50 },
    desc:'4 cards — retro legends, very high legend rate' },
  { id:'legend',    name:'Legend Pack',    icon:'👑', cost:800000, cards:5, color:'#FFD700',
    odds:{ bronze:0,    silver:0,    gold:0,    elite:0.30, legend:0.70 },
    desc:'Guaranteed legends — the best of the best' },
  { id:'gem',       name:'Gem Pack',       icon:'💫', cost:0,      cards:3, color:'#00d4ff', gemCost:8,
    odds:{ bronze:0,    silver:0,    gold:0.20, elite:0.60, legend:0.20 },
    desc:'3 elite+ cards — spend 8 💎 gems to open' },
];

// ===== RARITY CONFIG =====
const RARITY = {
  bronze: { label:'BRONZE', color:'#cd7f32', bg:'linear-gradient(135deg,#3d1f0a,#6b3a1f)', glow:'rgba(205,127,50,0.5)',  textColor:'#f0a060' },
  silver: { label:'SILVER', color:'#c0c0c0', bg:'linear-gradient(135deg,#1a1a2e,#2e3b55)', glow:'rgba(180,190,220,0.5)', textColor:'#c8d8f0' },
  gold:   { label:'GOLD',   color:'#ffd700', bg:'linear-gradient(135deg,#1a1000,#3d2e00)', glow:'rgba(255,215,0,0.6)',   textColor:'#ffe566' },
  elite:  { label:'ELITE',  color:'#a855f7', bg:'linear-gradient(135deg,#120020,#2d0050)', glow:'rgba(168,85,247,0.6)',  textColor:'#d090ff' },
  legend: { label:'LEGEND', color:'#ff8c00', bg:'linear-gradient(135deg,#0a0000,#2a0a00)', glow:'rgba(255,140,0,0.8)',  textColor:'#ffcc00' },
};

// ===== PLAYER STATE =====
let PS = {
  coins: 0,
  gems: 0,
  collection: [],   // array of player IDs owned
  squad: { PG:null, SG:null, SF:null, PF:null, C:null },
  activePlayer: null,
  marketListings: [],
  marketRefresh: 0,
};

function loadPS() {
  const saved = JSON.parse(localStorage.getItem('playerState') || 'null');
  if (saved) {
    PS.coins        = saved.coins || 0;
    PS.gems         = saved.gems  || 0;
    PS.collection   = saved.collection || [];
    PS.squad        = saved.squad || { PG:null, SG:null, SF:null, PF:null, C:null };
    PS.activePlayer = saved.activePlayer || null;
    PS.marketListings = saved.marketListings || [];
    PS.marketRefresh  = saved.marketRefresh || 0;
  }
  // Merge clicker coins
  const clickerSave = JSON.parse(localStorage.getItem('clicker') || 'null');
  if (clickerSave && clickerSave.coins) {
    PS.coins += clickerSave.coins;
    clickerSave.coins = 0;
    localStorage.setItem('clicker', JSON.stringify(clickerSave));
  }
  // Give starter player if empty
  if (!PS.collection.length) {
    PS.collection = ['scoot'];
    PS.squad.PG = 'scoot';
    PS.activePlayer = 'scoot';
  }
  if (!PS.marketListings.length || Date.now() - PS.marketRefresh > 600000) refreshMarket();
  savePS();
}

function savePS() {
  localStorage.setItem('playerState', JSON.stringify({
    coins: PS.coins, gems: PS.gems, collection: PS.collection,
    squad: PS.squad, activePlayer: PS.activePlayer,
    marketListings: PS.marketListings, marketRefresh: PS.marketRefresh,
  }));
}

// ===== COINS + GEMS API (shared) =====
window.getCoins   = () => PS.coins;
window.addCoins   = (n) => { PS.coins += n; savePS(); updateCoinsDisplay(); };
window.spendCoins = (n) => { if (PS.coins < n) return false; PS.coins -= n; savePS(); updateCoinsDisplay(); return true; };
window.getGems    = () => PS.gems;
window.addGems    = (n) => { PS.gems += Math.floor(n); savePS(); updateCoinsDisplay(); };
window.spendGems  = (n) => { if (PS.gems < n) return false; PS.gems -= n; savePS(); updateCoinsDisplay(); return true; };

function updateCoinsDisplay() {
  document.querySelectorAll('.global-coins').forEach(el => el.textContent = fmtCoins(PS.coins));
  document.querySelectorAll('.global-gems').forEach(el => el.textContent = PS.gems);
}

function fmtCoins(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n).toString();
}

// ===== GET PLAYER =====
window.getActivePlayer = () => {
  const id = PS.activePlayer;
  return PLAYER_DB.find(p => p.id === id) || null;
};

// ===== PACK OPENING =====
function rollRarity(odds) {
  const r = Math.random();
  let acc = 0;
  for (const [rar, prob] of Object.entries(odds)) {
    acc += prob;
    if (r < acc) return rar;
  }
  return 'bronze';
}

function openPack(packId) {
  const pack = PACKS.find(p => p.id === packId);
  if (!pack) return [];
  // Gem pack uses gems instead of coins
  if (pack.gemCost) {
    if (!window.spendGems(pack.gemCost)) return null;
  } else {
    if (!window.spendCoins(pack.cost)) return null; // null = can't afford
  }
  if (window.trackDailyProgress) window.trackDailyProgress('packsOpened', 1);
  const results = [];
  for (let i = 0; i < pack.cards; i++) {
    const rarity = rollRarity(pack.odds);
    const pool = PLAYER_DB.filter(p => p.rarity === rarity);
    const player = pool[Math.floor(Math.random() * pool.length)];
    if (!PS.collection.includes(player.id)) PS.collection.push(player.id);
    results.push(player);
  }
  savePS();
  return results;
}

// ===== MARKET =====
function refreshMarket() {
  const notOwned = PLAYER_DB.filter(p => !PS.collection.includes(p.id));
  const sample = notOwned.sort(() => Math.random()-0.5).slice(0, 20);
  PS.marketListings = sample.map(p => ({ id: p.id, price: marketPrice(p) }));
  PS.marketRefresh = Date.now();
  savePS();
}

function marketPrice(p) {
  const base = { bronze: 5000, silver: 25000, gold: 120000, elite: 600000, legend: 2000000 };
  const variance = 0.8 + Math.random() * 0.4;
  return Math.floor((base[p.rarity] || 5000) * variance);
}

// Gem cost for 90+ OVR players (0 = no gems needed)
function gemCost(p) {
  if (p.ovr >= 98) return 12;
  if (p.ovr >= 95) return 8;
  if (p.ovr >= 92) return 5;
  if (p.ovr >= 90) return 3;
  return 0;
}

function buyFromMarket(playerId) {
  const listing = PS.marketListings.find(l => l.id === playerId);
  if (!listing) return false;
  const p = PLAYER_DB.find(pl => pl.id === playerId);
  const gc = p ? gemCost(p) : 0;
  if (gc > 0) {
    if (!window.spendGems(gc)) return false;
  } else {
    if (!window.spendCoins(listing.price)) return false;
  }
  if (window.trackDailyProgress) window.trackDailyProgress('marketBuys', 1);
  if (!PS.collection.includes(playerId)) PS.collection.push(playerId);
  PS.marketListings = PS.marketListings.filter(l => l.id !== playerId);
  savePS();
  return true;
}

function sellPlayer(playerId) {
  if (!PS.collection.includes(playerId)) return false;
  if (Object.values(PS.squad).includes(playerId)) return false; // can't sell squad players
  if (PS.activePlayer === playerId) return false;
  const p = PLAYER_DB.find(pl => pl.id === playerId);
  const sellPrice = Math.floor(marketPrice(p) * 0.6);
  window.addCoins(sellPrice);
  PS.collection = PS.collection.filter(id => id !== playerId);
  savePS();
  return sellPrice;
}

// ===== CARD HTML =====
function buildCard(player, opts = {}) {
  const r = RARITY[player.rarity];
  const traitHtml = player.traits.map(t => {
    const tr = TRAITS[t];
    return tr ? `<span class="ptrait" title="${tr.desc}">${tr.icon} ${tr.label}</span>` : '';
  }).join('');
  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const size = opts.small ? 'pcard-sm' : '';
  return `
  <div class="pcard ${size} rarity-${player.rarity}" data-id="${player.id}"
       style="--card-glow:${r.glow};--card-color:${r.color}">
    <div class="pcard-header">
      <span class="pcard-ovr">${player.ovr}</span>
      <span class="pcard-pos">${player.pos}</span>
      <span class="pcard-rarity">${r.label}</span>
    </div>
    <div class="pcard-avatar" style="background:${player.color}22;border-color:${player.color}66">
      <span class="pcard-initials" style="color:${player.color}">${initials}</span>
      <span class="pcard-nat">${player.nat}</span>
    </div>
    <div class="pcard-name">${player.name}</div>
    <div class="pcard-team">${player.team}</div>
    <div class="pcard-stats">
      <div class="pstat"><span class="pstat-val">${player.stats.sht}</span><span class="pstat-lbl">SHT</span></div>
      <div class="pstat"><span class="pstat-val">${player.stats.spd}</span><span class="pstat-lbl">SPD</span></div>
      <div class="pstat"><span class="pstat-val">${player.stats.drb}</span><span class="pstat-lbl">DRB</span></div>
      <div class="pstat"><span class="pstat-val">${player.stats.def}</span><span class="pstat-lbl">DEF</span></div>
      <div class="pstat"><span class="pstat-val">${player.stats.phy}</span><span class="pstat-lbl">PHY</span></div>
    </div>
    <div class="pcard-traits">${traitHtml}</div>
  </div>`;
}

// ===== SQUAD SCREEN =====
function renderSquadScreen() {
  const positions = ['PG','SG','SF','PF','C'];
  const posNames = { PG:'Point Guard', SG:'Shooting Guard', SF:'Small Forward', PF:'Power Forward', C:'Center' };
  const collPct = window.getCollectionPct ? window.getCollectionPct() : Math.round((PS.collection.length / PLAYER_DB.length) * 100);
  let html = `<div class="squad-collection-bar">
    📚 Collection: <strong>${PS.collection.length}/${PLAYER_DB.length}</strong>
    <div class="squad-coll-bar-wrap"><div class="squad-coll-bar-fill" style="width:${collPct}%"></div></div>
    <strong>${collPct}%</strong>
  </div>
  <div class="squad-grid">`;
  positions.forEach(pos => {
    const pid = PS.squad[pos];
    const p = pid ? PLAYER_DB.find(pl => pl.id === pid) : null;
    const isActive = PS.activePlayer === pid;
    html += `<div class="squad-slot" data-pos="${pos}">
      <div class="squad-pos-label">${pos}<br><small>${posNames[pos]}</small></div>
      ${p ? buildCard(p, { small: true }) : `<div class="squad-empty" onclick="openPlayerPicker('${pos}')">+ Add ${pos}</div>`}
      ${p ? `<div class="squad-slot-btns">
        <button class="sqbtn ${isActive?'active-btn':''}" onclick="setActivePlayer('${p.id}')">${isActive?'✓ ACTIVE':'Set Active'}</button>
        <button class="sqbtn sqbtn-change" onclick="openPlayerPicker('${pos}')">Change</button>
      </div>` : ''}
    </div>`;
  });
  html += `</div>`;

  // Bench / collection
  const bench = PS.collection.filter(id => !Object.values(PS.squad).includes(id));
  if (bench.length) {
    html += `<h3 class="bench-title">BENCH (${bench.length} players)</h3><div class="bench-row">`;
    bench.forEach(id => {
      const p = PLAYER_DB.find(pl => pl.id === id);
      if (!p) return;
      const sellPrice = Math.floor(marketPrice(p) * 0.6);
      html += `<div class="bench-card-wrap">
        ${buildCard(p, { small: true })}
        <button class="sqbtn sqbtn-sell" onclick="confirmSell('${p.id}','${p.name}',${sellPrice})">Sell 🪙${fmtCoins(sellPrice)}</button>
      </div>`;
    });
    html += `</div>`;
  }
  document.getElementById('squadContent').innerHTML = html;
}

function setActivePlayer(id) {
  PS.activePlayer = id;
  savePS();
  renderSquadScreen();
  updateGameSidebarPlayer();
}

function openPlayerPicker(pos) {
  const available = PS.collection.filter(id => {
    const p = PLAYER_DB.find(pl => pl.id === id);
    return p && p.pos === pos;
  });
  const allPos = PS.collection.map(id => PLAYER_DB.find(p => p.id === id)).filter(Boolean);

  let html = `<h3 style="color:#ff8c00;margin-bottom:16px">Pick ${pos}</h3><div class="picker-grid">`;
  allPos.forEach(p => {
    html += `<div onclick="assignSquad('${pos}','${p.id}')" style="cursor:pointer">${buildCard(p, {small:true})}</div>`;
  });
  if (!allPos.length) html += `<p style="color:#666">No players in collection — buy packs!</p>`;
  html += `</div>`;

  document.getElementById('pickerContent').innerHTML = html;
  document.getElementById('playerPicker').style.display = 'flex';
}

function assignSquad(pos, playerId) {
  // Remove player from any other position they're currently filling
  Object.keys(PS.squad).forEach(p => {
    if (PS.squad[p] === playerId && p !== pos) PS.squad[p] = null;
  });
  PS.squad[pos] = playerId;
  savePS();
  document.getElementById('playerPicker').style.display = 'none';
  renderSquadScreen();
  updateGameSidebarPlayer();
}

function confirmSell(id, name, price) {
  if (!confirm(`Sell ${name} for 🪙${fmtCoins(price)} coins?`)) return;
  const earned = sellPlayer(id);
  if (earned !== false) {
    alert(`Sold! You got 🪙${fmtCoins(earned)}`);
    renderSquadScreen();
  }
}

// ===== PACK STORE SCREEN =====
function renderPackStore() {
  let html = `<div class="pack-store-grid">`;
  PACKS.forEach(pack => {
    const canAfford = PS.coins >= pack.cost;
    const oddsList = Object.entries(pack.odds).filter(([,v])=>v>0)
      .map(([k,v])=>`<span style="color:${RARITY[k].textColor}">${RARITY[k].label} ${Math.round(v*100)}%</span>`).join(' · ');
    html += `
    <div class="pack-card-store ${canAfford?'':'pack-locked'}">
      <div class="pack-icon">${pack.icon}</div>
      <h3 class="pack-name" style="color:${pack.color}">${pack.name}</h3>
      <div class="pack-desc">${pack.desc}</div>
      <div class="pack-odds">${oddsList}</div>
      <div class="pack-cost">🪙 ${fmtCoins(pack.cost)}</div>
      <button class="btn ${canAfford?'btn-primary':'btn-secondary'} pack-buy-btn"
        onclick="buyPack('${pack.id}')">${canAfford?'OPEN PACK':'NOT ENOUGH 🪙'}</button>
    </div>`;
  });
  html += `</div>`;
  document.getElementById('packStoreContent').innerHTML = html;
}

function buyPack(packId) {
  const results = openPack(packId);
  if (results === null) { alert('Not enough coins!'); return; }
  renderPackStore();
  showPackOpening(results);
}

// ===== PACK OPENING ANIMATION =====
function showPackOpening(players) {
  showScreen('packOpening');
  const el = document.getElementById('packOpenCards');
  el.innerHTML = players.map((p, i) => `
    <div class="pack-reveal-slot" id="packSlot${i}">
      <div class="pack-flip-card">
        <div class="pack-flip-front"><div class="pack-back-design">🏀</div></div>
        <div class="pack-flip-back">${buildCard(p)}</div>
      </div>
    </div>`).join('');

  // Reveal one by one
  players.forEach((p, i) => {
    setTimeout(() => {
      const slot = document.getElementById(`packSlot${i}`);
      if (slot) {
        slot.querySelector('.pack-flip-card').classList.add('flipped');
        const r = RARITY[p.rarity];
        slot.style.setProperty('--slot-glow', r.glow);
        if (p.rarity === 'elite' || p.rarity === 'legend') {
          slot.classList.add('rare-reveal');
          playSound('score');
        }
      }
    }, 400 + i * 600);
  });
}

// ===== MARKET SCREEN =====
function renderMarket() {
  if (Date.now() - PS.marketRefresh > 600000) refreshMarket();
  let html = `<div class="market-grid">`;
  PS.marketListings.forEach(listing => {
    const p = PLAYER_DB.find(pl => pl.id === listing.id);
    if (!p) return;
    const owned = PS.collection.includes(p.id);
    const gc = gemCost(p);
    const isGemPlayer = gc > 0;
    const canAfford = isGemPlayer ? PS.gems >= gc : PS.coins >= listing.price;
    const priceHtml = isGemPlayer
      ? `<div class="market-price gem-price">💎 ${gc} Gems</div><div class="market-price-coin">🪙 ${fmtCoins(listing.price)} value</div>`
      : `<div class="market-price">🪙 ${fmtCoins(listing.price)}</div>`;
    html += `
    <div class="market-card ${isGemPlayer ? 'market-gem-card' : ''}">
      ${buildCard(p, { small: true })}
      ${priceHtml}
      <button class="sqbtn ${owned ? 'owned-btn' : canAfford ? 'sqbtn-buy' : ''}"
        onclick="${owned ? '' : `buyMarketPlayer('${p.id}')`}"
        ${owned || !canAfford ? 'disabled' : ''}>
        ${owned ? '✓ OWNED' : canAfford ? (isGemPlayer ? `💎 BUY (${gc})` : 'BUY') : isGemPlayer ? `Need ${gc} 💎` : 'NEED MORE 🪙'}
      </button>
    </div>`;
  });
  html += `</div>`;
  const el = document.getElementById('marketContent') || document.getElementById('storeMarketContent');
  if (el) el.innerHTML = html;
}

function buyMarketPlayer(playerId) {
  if (buyFromMarket(playerId)) {
    renderMarket();
    updateCoinsDisplay();
  } else {
    alert('Not enough coins!');
  }
}

// ===== GAME SIDEBAR PLAYER CARD =====
function updateGameSidebarPlayer() {
  const el = document.getElementById('sidebarPlayerCard');
  if (!el) return;
  const p = window.getActivePlayer();
  if (!p) { el.innerHTML = '<div style="color:#555;font-size:11px">No active player</div>'; return; }
  const r = RARITY[p.rarity];
  el.innerHTML = `
    <div class="sidebar-active-card" style="border-color:${r.color}44">
      <div style="display:flex;align-items:center;gap:8px">
        <span class="sidebar-ovr" style="color:${r.color}">${p.ovr}</span>
        <div>
          <div style="font-size:11px;font-weight:700;color:#fff">${p.name}</div>
          <div style="font-size:9px;color:#666">${p.pos} · ${p.team}</div>
        </div>
        <span class="sidebar-rarity-tag" style="color:${r.textColor};margin-left:auto">${r.label}</span>
      </div>
      <div class="sidebar-mini-traits">${p.traits.map(t=>TRAITS[t]?`<span title="${TRAITS[t].desc}">${TRAITS[t].icon}</span>`:'').join('')}</div>
    </div>`;
}

// ===== INIT =====
window.addEventListener('load', () => {
  loadPS();
  updateCoinsDisplay();
  updateGameSidebarPlayer();
});
