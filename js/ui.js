import { state, stats, WEAPONS } from './config.js';
import { Soldier, clearCorpses } from './entities/Soldier.js';
import { Dog } from './entities/Dog.js';
import { clearBloodCanvas } from './sprites.js';

export function spawnSquad() {
    state.squad = [];
    for (let i = 0; i < stats.maxSquad; i++) {
        state.squad.push(new Soldier(state.camera.x + Math.random() * 20, state.camera.y + Math.random() * 20));
    }
}

export function startWave() {
    state.enemiesToSpawn = 10 + Math.floor(state.wave * 5 * 1.2);
    state.enemiesAlive = state.enemiesToSpawn;
    state.enemySpawnTimer = 0;
    state.gameState = 'PLAY';
    document.getElementById('screens').classList.add('hidden');
    document.getElementById('upgradeScreen').classList.add('hidden');
    updateHUD();
}

const UPGRADES = [
    { name: "Nowy Rekrut", desc: "+1 Członek Składu", apply: () => { stats.maxSquad++; state.squad.push(new Soldier(state.camera.x, state.camera.y)); } },
    { name: "Pies Bojowy", desc: "Atakuje cele poza okręgiem", apply: () => { state.companions.push(new Dog(state.camera.x, state.camera.y)); } },
    { name: "Ciężka Amunicja", desc: "+1 Obrażenia", apply: () => stats.damage++ },
    { name: "Adrenalina", desc: "+20% Prędkości", apply: () => stats.speed *= 1.2 },
    { name: "Racje Kawy", desc: "+15% Szybkostrzelności", apply: () => stats.fireRate *= 0.85 },
    { name: "Sokole Oko", desc: "+20% Zasięgu", apply: () => stats.range *= 1.2 },
    { name: "Apteczka", desc: "Leczy Cały Skład", apply: () => { state.squad.forEach(s => s.hp = s.maxHp); } }
];

export function showUpgrades() {
    state.gameState = 'UPGRADE';
    document.getElementById('screens').classList.remove('hidden');
    document.getElementById('upgradeScreen').classList.remove('hidden');
    
    let optionsDiv = document.getElementById('upgradeOptions');
    optionsDiv.innerHTML = '';
    
    // Co 3 fale oferujemy specjalną broń
    if (state.wave % 3 === 0 && state.squad.length > 0) {
        document.getElementById('upgradeTitle').innerText = "ZRZUT ZAOPATRZENIA";
        document.getElementById('upgradeSubtitle').innerText = "PRZYDZIEL NOWĄ BROŃ";
        
        // Wybierz do 3 losowych żyjących żołnierzy
        let randomSoldiers = [...state.squad].sort(() => 0.5 - Math.random()).slice(0, 3);
        let availableWeapons = [WEAPONS.SHOTGUN, WEAPONS.MACHINEGUN, WEAPONS.BAZOOKA];
        
        randomSoldiers.forEach(soldier => {
            let randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
            
            let btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = `${soldier.name} otrzymuje:<br><br><span style="color:${randomWeapon.color}">${randomWeapon.name}</span>`;
            btn.onclick = () => {
                soldier.weapon = randomWeapon;
                soldier.updateSprites(); // Odśwież wygląd postaci nową bronią!
                state.wave++;
                startWave();
            };
            optionsDiv.appendChild(btn);
        });
    } else {
        // Standardowe ulepszenia ogólne
        document.getElementById('upgradeTitle').innerText = "FALA POKONANA";
        document.getElementById('upgradeSubtitle').innerText = "WYBIERZ WSPARCIE";
        
        let shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
        let choices = shuffled.slice(0, 3);

        choices.forEach(choice => {
            let btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = `${choice.name}<div class="upgrade-desc">${choice.desc}</div>`;
            btn.onclick = () => {
                choice.apply();
                state.wave++;
                startWave();
            };
            optionsDiv.appendChild(btn);
        });
    }
}

export function gameOver() {
    state.gameState = 'GAMEOVER';
    document.getElementById('screens').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('survivalStats').innerText = `PRZETRWAŁEŚ ${state.wave - 1} FAL`;
}

let waveEl, enemiesEl, squadEl;
let lastDisplayedWave = -1;
let lastDisplayedEnemies = -1;
let lastDisplayedSquad = -1;

export function updateHUD() {
    if (!waveEl) waveEl = document.getElementById('waveDisplay');
    if (!enemiesEl) enemiesEl = document.getElementById('enemiesDisplay');
    if (!squadEl) squadEl = document.getElementById('squadDisplay');

    if (waveEl && lastDisplayedWave !== state.wave) {
        waveEl.innerText = `FALA ${state.wave}`;
        lastDisplayedWave = state.wave;
    }
    if (enemiesEl && lastDisplayedEnemies !== state.enemiesAlive) {
        enemiesEl.innerText = `WROGOWIE: ${state.enemiesAlive}`;
        lastDisplayedEnemies = state.enemiesAlive;
    }
    if (squadEl && lastDisplayedSquad !== state.squad.length) {
        squadEl.innerText = `SKŁAD: ${state.squad.length}`;
        lastDisplayedSquad = state.squad.length;
    }
}

export function startGame() {
    state.wave = 1;
    Object.assign(stats, { maxSquad: 3, damage: 1, fireRate: 800, range: 180, speed: 100, bulletSpeed: 300 });
    clearBloodCanvas();
    clearCorpses();
    state.camera.x = 6000;
    state.camera.y = 6000;
    state.targetPoint.x = 6000;
    state.targetPoint.y = 6000;
    state.bullets = [];
    state.enemies = [];
    state.particles = [];
    state.explosions = [];
    state.companions = [];
    spawnSquad();
    startWave();
}

export function resetGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGame();
}

// Udostępnienie globalnie dla zdarzeń onclick w pliku HTML
window.startGame = startGame;
window.resetGame = resetGame;

// --- FUNKCJE PANELU ADMINISTRATORA (Debug/Admin Panel) ---
export function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

export function togglePause() {
    state.isPaused = !state.isPaused;
    const btn = document.querySelector('.pause-btn');
    if (btn) {
        btn.innerText = state.isPaused ? "WZNIÓW GRĘ" : "PAUZA / WZNIÓW";
    }
}

export function adminSpawnRecruit() {
    stats.maxSquad++;
    state.squad.push(new Soldier(state.camera.x, state.camera.y));
    // Wymuś odświeżenie interfejsu
    lastDisplayedSquad = -1;
    updateHUD();
}

export function adminSpawnDog() {
    state.companions.push(new Dog(state.camera.x, state.camera.y));
}

export function adminGiveWeapon(weaponKey) {
    if (!state.squad || state.squad.length === 0) return;
    let targetWeapon = WEAPONS[weaponKey] || WEAPONS.DEFAULT;
    
    // Zgodnie z wytycznymi: przydzielamy broń pojedynczo za każdym kliknięciem kolejnemu żołnierzowi
    let targetSoldier = state.squad.find(s => s.weapon !== targetWeapon);
    if (!targetSoldier) targetSoldier = state.squad[0];
    
    if (targetSoldier) {
        targetSoldier.weapon = targetWeapon;
        targetSoldier.specialWeaponTimer = 0; 
        targetSoldier.storedWeapon = null; 
        targetSoldier.updateSprites();
    }
}

export function adminApplyUpgrade(statKey) {
    if (statKey === 'damage') stats.damage++;
    else if (statKey === 'speed') stats.speed *= 1.2;
    else if (statKey === 'heal') {
        state.squad.forEach(s => s.hp = s.maxHp);
    }
}

// Rejestracja w obiekcie window
window.toggleAdminPanel = toggleAdminPanel;
window.togglePause = togglePause;
window.adminSpawnRecruit = adminSpawnRecruit;
window.adminSpawnDog = adminSpawnDog;
window.adminGiveWeapon = adminGiveWeapon;
window.adminApplyUpgrade = adminApplyUpgrade;
