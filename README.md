# 🏀 HoopMaster

A browser-based basketball shooting game with 4 game modes, mini-games, power/accuracy controls, and sound effects.

## Play Online
> Deployed link goes here after following the steps below.

## How to Put on GitHub so Anyone Can Play

### Step 1 — Install Git (if you don't have it)
Download from https://git-scm.com and install with default settings.

### Step 2 — Create a GitHub account
Go to https://github.com and sign up (free).

### Step 3 — Create a new repository
1. Click the **+** button (top right) → **New repository**
2. Name it `hoopmaster` (or anything you like)
3. Set it to **Public**
4. Do **NOT** check "Initialize with README" (you already have files)
5. Click **Create repository**

### Step 4 — Push your files
Open a terminal / PowerShell in the `Basketball` folder and run:

```powershell
git init
git add .
git commit -m "Initial commit: HoopMaster basketball game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hoopmaster.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 5 — Enable GitHub Pages (free hosting)
1. Go to your repository on GitHub
2. Click **Settings** → scroll down to **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Branch: `main`, folder: `/ (root)`
5. Click **Save**

After about 60 seconds your game will be live at:
```
https://YOUR_USERNAME.github.io/hoopmaster/
```

Share that link with anyone — no account needed to play!

---

## Game Features
- 4 modes: Classic (10 shots), Time Attack (60s), 3-Point Contest, Survival
- Click & hold to aim, release to shoot — power builds while held
- Accuracy skill slider (sidebar) — turn it down for chaos
- Wind system that changes each shot
- Streak combos with bonus points
- 3 mini-games: Hot Streak, Bank Shot, Alley-Oop
- Procedural sound effects (Web Audio API — no files needed)
- Local leaderboard saved in browser
- Star rating & new high score detection
