import { state, stats, WEAPONS, customSquadDesign } from './config.js';
import { Soldier, clearCorpses } from './entities/Soldier.js';
import { Dog } from './entities/Dog.js';
import { PrisonerCage } from './entities/PrisonerCage.js';
import { EnemyDepot } from './entities/EnemyDepot.js';
import { Enemy } from './entities/Enemy.js';
import { clearBloodCanvas } from './sprites.js';
import { playSound } from './sfx.js';

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
    
    // Generowanie klatki z jeńcem co 3 poziomy przy niepełnym składzie (< 4 żołnierzy)
    state.prisonerCages = state.prisonerCages.filter(pc => !pc.isDestroyed || pc.life > 0);
    state.enemyDepots = [];
    if (state.wave % 3 === 0) {
        let leader = state.squad[0] || { x: state.camera.x, y: state.camera.y };
        let spawnAng = Math.random() * Math.PI * 2;
        
        if (state.squad.length < 4) {
            // Gwarancja spawnowania poza polem widzenia gracza (na podstawie aktualnych wymiarów okna)
            let spawnDist = Math.max(window.innerWidth, window.innerHeight) * 0.55 + 100 + Math.random() * 150;
            let cx = leader.x + Math.cos(spawnAng) * spawnDist;
            let cy = leader.y + Math.sin(spawnAng) * spawnDist;
            cx = Math.max(400, Math.min(11600, cx));
            cy = Math.max(400, Math.min(11600, cy));
            
            let cage = new PrisonerCage(cx, cy);
            state.prisonerCages.push(cage);
            
            // Spawnowanie strażników wokół klatki (stado wrogów gromadzących się wokół ratunku)
            let guardsCount = 5 + Math.floor(state.wave * 1.2);
            for (let i = 0; i < guardsCount; i++) {
                let ang = (i / guardsCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                let dist = 40 + Math.random() * 40;
                let ex = cx + Math.cos(ang) * dist;
                let ey = cy + Math.sin(ang) * dist;
                
                let guard = new Enemy(ex, ey);
                guard.guardingCage = cage;
                state.enemies.push(guard);
                state.enemiesAlive++; // Zwiększenie licznika wrogów do pokonania w fali
            }
        } else {
            // EVENT Szturmu na Magazyn (Squad Size = 4) - Spawnowanie magazynu wroga i bossa
            let spawnDist = 400 + Math.random() * 100; // Dalej dla misji taktycznej
            let cx = leader.x + Math.cos(spawnAng) * spawnDist;
            let cy = leader.y + Math.sin(spawnAng) * spawnDist;
            cx = Math.max(500, Math.min(11500, cx));
            cy = Math.max(500, Math.min(11500, cy));
            
            // Spawnowanie Magazynu i pilnującego go gigantycznego Bossa
            state.enemyDepots.push(new EnemyDepot(cx, cy));
            
            // Zrzucenie Boss-Mutanta tuż obok Magazynu (zwiększamy HP wroga-bossa)
            let boss = new Enemy(cx + 20, cy + 20, 'boss');
            state.enemies.push(boss);
            state.enemiesAlive++; // Dodanie do puli celów fali
            
            // Powiadomienie radiowe
            console.warn("Szturm na Magazyn Wroga! Zniszcz ufortyfikowany betonowy bunkier i pokonaj Bossa!");
        }
    }
    
    updateHUD();
}

const UPGRADES = [
    { name: "Pas z Amunicją", desc: "+25% szybszego przeładowania całego składu", apply: () => { state.passiveAmmoBeltActive = true; } },
    { name: "Eksplozywny Odwet", desc: "Granat po zgonie weterana + 50% szans na skrzynię", apply: () => { state.passiveMartyrdomActive = true; } },
    { name: "Szrapnelowe Pancerze", desc: "Redukcja 100% AoE z kamikadze i brak odrzutu", apply: () => { state.passiveShrapnelArmorActive = true; } },
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
    
    // Awans poziomu (Level Up) po szturmie na Magazyn
    if (state.pendingLevelUp && state.squad.length > 0) {
        document.getElementById('upgradeTitle').innerText = "ZGLISZCZA MAGAZYNU";
        document.getElementById('upgradeSubtitle').innerText = "WYBIERZ SPECJALISTĘ DO AWANSU";
        
        state.squad.forEach(soldier => {
            let btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = `AWANSUJ: ${soldier.name} [${soldier.soldierClass || 'REKRUT'}]<div class="upgrade-desc">+1 Max HP, +20% Szybkostrzelności, Awans na Oficera!</div>`;
            btn.onclick = () => {
                soldier.maxHp = (soldier.maxHp || 3) + 1;
                soldier.hp = soldier.maxHp; // Pełne leczenie przy awansie
                soldier.baseDamage = (soldier.baseDamage || 1) + 1;
                soldier.isPromoted = true; // Odblokowanie unikalnej legendarnej cechy!
                
                // Wizualny awans na Oficera (Czapka oficerska = index 5)
                soldier.helmetIdx = 5;
                soldier.updateSprites();
                
                state.pendingLevelUp = false;
                state.wave++;
                startWave();
            };
            optionsDiv.appendChild(btn);
        });
        return;
    }
    
    // Co 3 fale oferujemy specjalną broń (zrzut)
    if (state.wave % 3 === 0 && state.squad.length > 0) {
        document.getElementById('upgradeTitle').innerText = "ZRZUT ZAOPATRZENIA";
        document.getElementById('upgradeSubtitle').innerText = "PRZYDZIEL NOWĄ BROŃ";
        
        // Wybierz do 3 losowych żyjących żołnierzy
        let randomSoldiers = [...state.squad].sort(() => 0.5 - Math.random()).slice(0, 3);
        let availableWeapons = [WEAPONS.SHOTGUN, WEAPONS.HEAVY_SAW, WEAPONS.BAZOOKA];
        
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
    
    // Dynamiczna aktualizacja slotów Doktryn Taktycznych w HUD
    let doctrinesEl = document.getElementById('doctrinesDisplay');
    if (doctrinesEl) {
        doctrinesEl.innerHTML = '';
        if (state.tacticalDoctrines && state.tacticalDoctrines.length > 0) {
            state.tacticalDoctrines.forEach((doc, idx) => {
                let div = document.createElement('div');
                let isReady = doc.charge >= 100;
                div.className = `doctrine-slot${isReady ? ' ready' : ''}`;
                
                let chargeText = isReady ? 'GOTOWA' : `${Math.floor(doc.charge)}%`;
                div.innerHTML = `<span>[${idx + 1}] ${doc.name.toUpperCase()}</span> <span>${chargeText}</span>`;
                doctrinesEl.appendChild(div);
            });
        } else {
            let div = document.createElement('div');
            div.className = 'doctrine-slot';
            div.innerHTML = '<span>BRAK DOKTRYN</span>';
            doctrinesEl.appendChild(div);
        }
    }
}

export function chargeDoctrines() {
    if (!state.tacticalDoctrines || state.tacticalDoctrines.length === 0) return;
    
    // +2.5% ładunku za każdego zabitego wroga
    let gain = 2.5;
    state.tacticalDoctrines.forEach(doc => {
        if (doc.charge < 100) {
            doc.charge = Math.min(100, doc.charge + gain);
        }
    });
    
    updateHUD();
}

export function startGame() {
    state.wave = 1;
    Object.assign(stats, { maxSquad: 1, damage: 1, fireRate: 800, range: 180, speed: 100, bulletSpeed: 300 });
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
    state.medkits = [];
    state.airstrikeTimer = 0;
    state.airstrikeBombTimer = 0;
    state.airstrikeBombs = [];
    state.prisonerCages = [];
    state.enemyDepots = [];
    state.decoys = [];
    state.pendingLevelUp = false;
    
    // Reset flag pasywów drużyny na start misji
    state.passiveShrapnelArmorActive = false;
    state.passiveAmmoBeltActive = false;
    state.passiveMartyrdomActive = false;
    
    // Domyślne Doktryny Taktyczne na start misji do testowania pod klawiszami [1] i [2]
    state.tacticalDoctrines = [
        { name: 'Nalot Dywanowy', type: 'airstrike', charge: 35 }, // Start z lekkim ładunkiem
        { name: 'Wabik Decoy', type: 'decoy', charge: 60 }
    ];
    
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

export function adminGiveAirstrike() {
    if (!state.squad || state.squad.length === 0) return;
    let targetSoldier = state.squad.find(s => !s.hasAirstrike);
    if (!targetSoldier) targetSoldier = state.squad[0];
    if (targetSoldier) {
        targetSoldier.hasAirstrike = true;
        targetSoldier.accessoryIdx = 5; // Radio plecak
        targetSoldier.updateSprites();
    }
}

export function adminUploadSkin(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    
    const img = new Image();
    img.onload = () => {
        // Nadpisanie skórki u wszystkich żyjących weteranów
        state.squad.forEach(soldier => {
            soldier.customImageSkin = img;
        });
        // Zapis w customSquadDesign, by nowo ratowani weterani też dziedziczyli skórkę!
        if (!customSquadDesign.hero) customSquadDesign.hero = {};
        customSquadDesign.hero.customImageSkin = img;
        customSquadDesign.hero.isCustomized = true;
        
        console.warn("Pomyślnie wczytano Twoją własną, retro skórkę PNG z PixelArt creatora!");
        if (inputEl) inputEl.value = '';
    };
    img.src = URL.createObjectURL(file);
}

export function adminPromoteSquad() {
    if (!state.squad || state.squad.length === 0) return;
    state.squad.forEach(s => {
        s.isPromoted = true;
        s.helmetIdx = 5; // Czapka oficerska
        s.maxHp = (s.maxHp || 3) + 1;
        s.hp = s.maxHp;
        s.baseDamage = (s.baseDamage || 1) + 1;
        s.updateSprites();
    });
    playSound('sfx_click', 0.6);
}

// Rejestracja w obiekcie window
window.toggleAdminPanel = toggleAdminPanel;
window.togglePause = togglePause;
window.adminSpawnRecruit = adminSpawnRecruit;
window.adminSpawnDog = adminSpawnDog;
window.adminGiveWeapon = adminGiveWeapon;
window.adminApplyUpgrade = adminApplyUpgrade;
window.adminGiveAirstrike = adminGiveAirstrike;
window.adminUploadSkin = adminUploadSkin;
window.adminPromoteSquad = adminPromoteSquad;
window.chargeDoctrines = chargeDoctrines;
