import { state, stats, WEAPONS, customSquadDesign } from './config.js';
import { Soldier, clearCorpses } from './entities/Soldier.js';
import { Dog } from './entities/Dog.js';
import { PrisonerCage } from './entities/PrisonerCage.js';
import { EnemyDepot } from './entities/EnemyDepot.js';
import { Enemy } from './entities/Enemy.js';
import { Decoy } from './entities/Decoy.js';
import { Bush } from './entities/Bush.js';
import { clearBloodCanvas } from './sprites.js';
import { playSound, setMute } from './sfx.js';
import { CLASS_SKILL_TREES } from './promotions.js';

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
    
    const screens = document.getElementById('screens');
    screens.classList.add('hidden');
    screens.classList.remove('upgrade-mode'); 
    document.getElementById('upgradeScreen').classList.add('hidden');
    
    // 7. WABIK DECOY (Spawnuje wabiki na starcie fali zgodnie z poziomem doktryny)
    if (state.passiveDecoyLevel && state.passiveDecoyLevel > 0) {
        for (let i = 0; i < state.passiveDecoyLevel; i++) {
            let leader = state.squad[0] || { x: state.camera.x, y: state.camera.y };
            let ang = (i / state.passiveDecoyLevel) * Math.PI * 2 + Math.random() * 0.5;
            let dist = 60 + Math.random() * 40;
            state.decoys.push(new Decoy(leader.x + Math.cos(ang) * dist, leader.y + Math.sin(ang) * dist));
        }
    } else if (state.passiveDecoyActive) {
        let leader = state.squad[0] || { x: state.camera.x, y: state.camera.y };
        let ang = Math.random() * Math.PI * 2;
        let dist = 60 + Math.random() * 40;
        state.decoys.push(new Decoy(leader.x + Math.cos(ang) * dist, leader.y + Math.sin(ang) * dist));
    }

    // Zarośla dżungli (Mistrz Maskowania - System Klastrów i Zagajników)
    if (!state.bushes || state.bushes.length === 0) {
        state.bushes = [];
        
        // 320 pojedynczych krzewów rozproszonych na całej mapie (12000x12000px)
        for (let i = 0; i < 320; i++) {
            let bx = 400 + Math.random() * 11200;
            let by = 400 + Math.random() * 11200;
            state.bushes.push(new Bush(bx, by));
        }
        
        // 110 małych "zagajników" (klastrów po 2-4 krzewy blisko siebie dla osłony całego składu)
        for (let c = 0; c < 110; c++) {
            let cx = 500 + Math.random() * 11000;
            let cy = 500 + Math.random() * 11000;
            let clusterSize = 2 + Math.floor(Math.random() * 3); // 2, 3 lub 4 krzewy
            state.bushes.push(new Bush(cx, cy));
            for (let k = 1; k < clusterSize; k++) {
                let ang = Math.random() * Math.PI * 2;
                let dist = 28 + Math.random() * 22;
                state.bushes.push(new Bush(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist));
            }
        }
    }
    
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
    { name: "PAS AMUNICJI", desc: "SZYBSZE<br>ŁADOWANIE", apply: () => { 
        state.passiveAmmoBeltLevel = (state.passiveAmmoBeltLevel || 0) + 1;
        state.passiveAmmoBeltActive = true; 
    }},
    { name: "MOCNE NABOJE", desc: "WIĘKSZE<br>OBRAŻENIA", apply: () => stats.damage *= 1.2 },
    { name: "ADRENALINA", desc: "SZYBSZY<br>RUCH", apply: () => stats.speed *= 1.2 },
    { name: "KAMIZELKA", desc: "+ KAMIZELKA<br>KEVLAROWA", apply: () => {
        state.kevlarArmorLevel = Math.min(3, (state.kevlarArmorLevel || 0) + 1);
        state.squad.forEach(s => { s.maxArmor = state.kevlarArmorLevel; s.armor = state.kevlarArmorLevel; });
    }},
    { name: "MISTRZ MASKOWANIA", desc: "UKRYCIE<br>W KRZAKACH", apply: () => { state.camoMasterLevel = Math.min(3, (state.camoMasterLevel || 0) + 1); } }
];

// --- 9 AUTORYTATYWNYCH DOKTRYN NIESTANDARDOWYCH (User Requested) ---
export const NON_STANDARD_DOCTRINES = [
    { name: "ZWARTA GRUPA", desc: "+ CELNOŚĆ<br>I OBRAŻENIA", apply: () => { 
        state.passiveFlockingBoostLevel = (state.passiveFlockingBoostLevel || 0) + 1;
        state.passiveFlockingBoostActive = true;
        stats.damage *= 1.2;
    }},
    { name: "BAGNET", desc: "DODATKOWE OBRAŻENIA<br>W ZWARCIU", apply: () => { 
        state.passiveBayonetsLevel = (state.passiveBayonetsLevel || 0) + 1;
        state.passiveBayonetsActive = true; 
    }},
    { name: "MINA PUŁAPKA", desc: "30% NA MINĘ<br>W ZWŁOKACH WROGA", apply: () => { state.passiveBoobyTrapActive = true; } },
    { name: "STRZAŁ W NOGI", desc: "50% NA SPOWOLNIENIE<br>WROGA", apply: () => { state.passiveKneecapShotActive = true; } },
    { name: "MINY PIECHOTNE", desc: "ROZSTAWIANIE MINY<br>CO 10 SEKUND", apply: () => { state.passiveFieldMinerActive = true; } },
    { name: "PERVITIN", desc: "-1 HP ZA 2X SZYBSZY<br>OGIEŃ I BIEG", apply: () => { 
        state.passivePervitinLevel = (state.passivePervitinLevel || 0) + 1;
        state.passivePervitinActive = true;
        stats.fireRate *= 0.5;
        stats.speed *= 1.4;
        state.squad.forEach(s => s.maxHp = Math.max(1, (s.maxHp || 3) - 1));
        state.squad.forEach(s => s.hp = Math.min(s.hp, s.maxHp));
    }},
    { name: "WABIK", desc: "SZTUCZNY CEL<br>CO FALĘ (+1/LVL)", apply: () => { 
        state.passiveDecoyLevel = (state.passiveDecoyLevel || 0) + 1;
        state.passiveDecoyActive = true; 
    }},
    { name: "POCISKI ZAPALAJĄCE", desc: "ZAPALAJĄCA AMUNICJA<br>DLA +1 ŻOŁNIERZA", apply: () => { 
        state.passiveIncendiaryLevel = (state.passiveIncendiaryLevel || 0) + 1;
        state.passiveIncendiaryActive = true; 
    }},
    { name: "PIES BOJOWY", desc: "DODATKOWY TOWARZYSZ<br>WALKI", apply: () => { state.companions.push(new Dog(state.camera.x, state.camera.y)); } }
];

let tagCounter = 0;

function buildDogTagCard(title, desc, onClick, isBlackTag = false) {
    tagCounter++;
    const maskId = `tag-mask-${tagCounter}`;
    
    const card = document.createElement('div');
    card.className = isBlackTag ? 'upgrade-card black-tag' : 'upgrade-card';
    
    let tagBg = isBlackTag ? '#1e272c' : '#9aa7af';
    let tagHighlight = isBlackTag ? '#f39c12' : '#ffffff';
    let tagShadow = isBlackTag ? '#11181b' : '#4f5d65';
    
    // Zawsze jeden losowy róg jest delikatnie naderwany (0: TL, 1: TR, 2: BR, 3: BL)
    const tornCorner = Math.floor(Math.random() * 4);
    
    let maskCutouts = '';
    let tornFractureRim = '';
    
    if (tornCorner === 0) { // Top-Left
        maskCutouts = `
            <rect x="0" y="22" width="9" height="7" fill="#000000" />
            <rect x="0" y="29" width="6" height="5" fill="#000000" />
            <rect x="0" y="34" width="3" height="4" fill="#000000" />
        `;
        tornFractureRim = `
            <!-- Rant pęknięcia TL -->
            <rect x="9" y="22" width="1" height="7" fill="#000000" />
            <rect x="6" y="29" width="3" height="1" fill="#000000" />
            <rect x="6" y="30" width="1" height="4" fill="#000000" />
            <rect x="3" y="34" width="3" height="1" fill="#000000" />
            <rect x="3" y="35" width="1" height="3" fill="#000000" />
            
            <rect x="10" y="23" width="1" height="6" fill="#ffffff" />
            <rect x="7" y="30" width="1" height="4" fill="#ffffff" />
            <rect x="4" y="35" width="1" height="3" fill="#ffffff" />
        `;
    } else if (tornCorner === 1) { // Top-Right
        maskCutouts = `
            <rect x="31" y="22" width="9" height="7" fill="#000000" />
            <rect x="34" y="29" width="6" height="5" fill="#000000" />
            <rect x="37" y="34" width="3" height="4" fill="#000000" />
        `;
        tornFractureRim = `
            <!-- Rant pęknięcia TR -->
            <rect x="30" y="22" width="1" height="7" fill="#000000" />
            <rect x="31" y="29" width="3" height="1" fill="#000000" />
            <rect x="33" y="30" width="1" height="4" fill="#000000" />
            <rect x="34" y="34" width="3" height="1" fill="#000000" />
            <rect x="36" y="35" width="1" height="3" fill="#000000" />
            
            <rect x="29" y="23" width="1" height="6" fill="#4f5d65" />
            <rect x="32" y="30" width="1" height="4" fill="#4f5d65" />
            <rect x="35" y="35" width="1" height="3" fill="#4f5d65" />
        `;
    } else if (tornCorner === 2) { // Bottom-Right
        maskCutouts = `
            <rect x="31" y="78" width="9" height="7" fill="#000000" />
            <rect x="34" y="73" width="6" height="5" fill="#000000" />
            <rect x="37" y="69" width="3" height="4" fill="#000000" />
        `;
        tornFractureRim = `
            <!-- Rant pęknięcia BR -->
            <rect x="30" y="78" width="1" height="7" fill="#000000" />
            <rect x="31" y="77" width="3" height="1" fill="#000000" />
            <rect x="33" y="73" width="1" height="4" fill="#000000" />
            <rect x="34" y="72" width="3" height="1" fill="#000000" />
            <rect x="36" y="69" width="1" height="3" fill="#000000" />
            
            <rect x="29" y="78" width="1" height="6" fill="#4f5d65" />
            <rect x="32" y="73" width="1" height="4" fill="#4f5d65" />
            <rect x="35" y="69" width="1" height="3" fill="#4f5d65" />
        `;
    } else if (tornCorner === 3) { // Bottom-Left
        maskCutouts = `
            <rect x="0" y="78" width="9" height="7" fill="#000000" />
            <rect x="0" y="73" width="6" height="5" fill="#000000" />
            <rect x="0" y="69" width="3" height="4" fill="#000000" />
        `;
        tornFractureRim = `
            <!-- Rant pęknięcia BL -->
            <rect x="9" y="78" width="1" height="7" fill="#000000" />
            <rect x="6" y="77" width="3" height="1" fill="#000000" />
            <rect x="6" y="73" width="1" height="4" fill="#000000" />
            <rect x="3" y="72" width="3" height="1" fill="#000000" />
            <rect x="3" y="69" width="1" height="3" fill="#000000" />
            
            <rect x="10" y="78" width="1" height="6" fill="#ffffff" />
            <rect x="7" y="73" width="1" height="4" fill="#ffffff" />
            <rect x="4" y="69" width="1" height="3" fill="#ffffff" />
        `;
    }

    card.innerHTML = `
        <svg class="unified-dogtag-svg" viewBox="0 0 40 88" width="160" height="352">
            <defs>
                <!-- Wzór łańcuszka kulkowego 16-bit w skali 2x2px -->
                <pattern id="bead-pattern-${tagCounter}" x="0" y="0" width="3" height="4" patternUnits="userSpaceOnUse">
                    <!-- Pionowy czarny łącznik -->
                    <rect x="1" y="0" width="1" height="1" fill="#1b2225" />
                    <rect x="1" y="3" width="1" height="1" fill="#1b2225" />
                    <!-- Srebrna kuleczka militarna -->
                    <rect x="0.5" y="1" width="2" height="2" fill="#000000" />
                    <rect x="0" y="1.5" width="3" height="1" fill="#000000" />
                    <rect x="0.5" y="1.5" width="2" height="1" fill="#9aa7af" />
                    <rect x="0.5" y="1.25" width="0.5" height="0.5" fill="#ffffff" />
                    <rect x="2" y="2" width="0.5" height="0.5" fill="#4f5d65" />
                </pattern>
                
                <!-- Maska do wycięcia naderwanego rogu -->
                <mask id="${maskId}">
                    <rect x="0" y="0" width="40" height="88" fill="#ffffff" />
                    ${maskCutouts}
                </mask>
            </defs>
            
            <!-- 1. ŁAŃCUSZEK KULKOWY (Zwisający od y=0 do y=21, wchodzący w dziurkę blachy) -->
            <rect x="18.5" y="0" width="3" height="21" fill="url(#bead-pattern-${tagCounter})" />
            
            <!-- 2. ZMASKAWANY NIEŚMIERTELNIK (Plate body od y=18 do y=84) -->
            <g mask="url(#${maskId})">
                <!-- Czarny zewnętrzny schodkowy kontur -->
                <rect x="0" y="25" width="40" height="56" fill="#000000" />
                <rect x="1" y="23" width="38" height="60" fill="#000000" />
                <rect x="2" y="22" width="36" height="62" fill="#000000" />
                <!-- Szyjka / dzyndzel u góry -->
                <rect x="14" y="18" width="12" height="5" fill="#000000" />

                <!-- Stalowe wypełnienie (Srebro lub Carbon) -->
                <rect x="1" y="26" width="38" height="54" fill="${tagBg}" class="tag-silver-fill" />
                <rect x="2" y="24" width="36" height="58" fill="${tagBg}" class="tag-silver-fill" />
                <rect x="3" y="23" width="34" height="60" fill="${tagBg}" class="tag-silver-fill" />
                <!-- Wypełnienie dzyndzla -->
                <rect x="15" y="19" width="10" height="4" fill="${tagBg}" class="tag-silver-fill" />

                <!-- Pixel Art Oświetlenie krawędzi (Biel lub Złoto) -->
                <rect x="1" y="26" width="1" height="54" fill="${tagHighlight}" />
                <rect x="2" y="24" width="1" height="2" fill="${tagHighlight}" />
                <rect x="3" y="23" width="34" height="1" fill="${tagHighlight}" />
                <rect x="15" y="19" width="10" height="1" fill="${tagHighlight}" />
                <rect x="15" y="20" width="1" height="3" fill="${tagHighlight}" />

                <!-- Wewnętrzny Pixel Art Cień (Ciemny Szary lub Głęboka Czerń) -->
                <rect x="38" y="26" width="1" height="54" fill="${tagShadow}" />
                <rect x="37" y="80" width="1" height="2" fill="${tagShadow}" />
                <rect x="3" y="82" width="35" height="1" fill="${tagShadow}" />
                <rect x="24" y="20" width="1" height="3" fill="${tagShadow}" />
                
                <!-- Wycięta stalowa dziurka w dzyndzlu na łańcuszek -->
                <rect x="17" y="20" width="6" height="3" fill="#000000" />
                <rect x="17" y="23" width="6" height="1" fill="#ffffff" />
            </g>
            
            <!-- Ranty pęknięcia po naderwanym rogu (nanoszone na wierzch) -->
            ${tornFractureRim}
        </svg>

        <!-- Warstwa z napisami umieszczona dokładnie na blachach -->
        <div class="dogtag-content">
            ${title ? `<div class="upgrade-card-title">${title}</div>` : ''}
            ${title ? `<div class="upgrade-card-desc">${desc}</div>` : `<div class="upgrade-card-title" style="margin-bottom:0;">${desc}</div>`}
        </div>
    `;
    
    card.onclick = onClick;
    return card;
}

export function showUpgrades() {
    state.gameState = 'UPGRADE';
    const screens = document.getElementById('screens');
    screens.classList.remove('hidden');
    screens.classList.add('upgrade-mode');
    document.getElementById('upgradeScreen').classList.remove('hidden');
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.classList.remove('open');
    
    let optionsDiv = document.getElementById('upgradeOptions');
    optionsDiv.innerHTML = '';
    
    // Awans poziomu (Level Up) po szturmie na Magazyn
    if (state.pendingLevelUp && state.squad.length > 0) {
        state.squad.forEach(soldier => {
            const card = buildDogTagCard(
                soldier.name,
                `★ AWANS NA OFICERA`,
                () => {
                    soldier.maxHp = (soldier.maxHp || 3) + 1;
                    soldier.hp = soldier.maxHp;
                    soldier.baseDamage = (soldier.baseDamage || 1) + 1;
                    soldier.isPromoted = true;
                    soldier.helmetIdx = 5;
                    soldier.updateSprites();
                    
                    state.pendingLevelUp = false;
                    state.wave++;
                    startWave();
                }
            );
            optionsDiv.appendChild(card);
        });
        return;
    }
    
    // Co 3 fale oferujemy do wyboru jeden z 3 niestandardowych dogtagów ("Outside the Box")
    if (state.wave % 3 === 0 && state.squad.length > 0) {
        let shuffledBlack = [...NON_STANDARD_DOCTRINES].sort(() => 0.5 - Math.random());
        let blackMarketOptions = shuffledBlack.slice(0, 3);
        
        blackMarketOptions.forEach(option => {
            const card = buildDogTagCard(
                option.name,
                option.desc,
                () => {
                    option.apply();
                    state.wave++;
                    startWave();
                },
                true // isBlackTag = true
            );
            optionsDiv.appendChild(card);
        });
    } else {
        let shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
        let choices = shuffled.slice(0, 3);

        choices.forEach(choice => {
            const card = buildDogTagCard(
                null,
                choice.desc,
                () => {
                    choice.apply();
                    state.wave++;
                    startWave();
                }
            );
            optionsDiv.appendChild(card);
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

export function adminSetSound(enabled) {
    setMute(!enabled);
    const onBtn = document.getElementById('adminSoundOnBtn');
    const offBtn = document.getElementById('adminSoundOffBtn');
    if (onBtn && offBtn) {
        if (enabled) {
            onBtn.style.background = '#2b6611';
            onBtn.style.color = '#fff';
            onBtn.style.borderColor = '#8bde38';
            onBtn.style.fontWeight = 'bold';
            
            offBtn.style.background = '#1a1a1a';
            offBtn.style.color = '#777';
            offBtn.style.borderColor = '#444';
            offBtn.style.fontWeight = 'normal';
            playSound('sfx_click', 0.6);
        } else {
            onBtn.style.background = '#1a1a1a';
            onBtn.style.color = '#777';
            onBtn.style.borderColor = '#444';
            onBtn.style.fontWeight = 'normal';
            
            offBtn.style.background = '#8e1c1c';
            offBtn.style.color = '#fff';
            offBtn.style.borderColor = '#f75c5c';
            offBtn.style.fontWeight = 'bold';
        }
    }
}

export function showSoldierPromotionScreen(soldier) {
    if (!soldier || !CLASS_SKILL_TREES[soldier.soldierClass]) return;
    
    state.gameState = 'UPGRADE';
    const screens = document.getElementById('screens');
    screens.classList.remove('hidden');
    screens.classList.add('upgrade-mode');
    document.getElementById('upgradeScreen').classList.remove('hidden');
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.classList.remove('open');
    
    let titleEl = document.getElementById('upgradeTitle');
    let subEl = document.getElementById('upgradeSubtitle');
    if (titleEl) { titleEl.innerText = `AWANS: ${soldier.name.toUpperCase()}`; titleEl.classList.remove('hidden'); }
    if (subEl) { subEl.innerText = `KLASA: ${soldier.soldierClass} (WYBIERZ DRZEWKO ROZWOJU)`; subEl.classList.remove('hidden'); }
    
    let optionsDiv = document.getElementById('upgradeOptions');
    optionsDiv.innerHTML = '';
    
    const trees = CLASS_SKILL_TREES[soldier.soldierClass];
    
    // Drzewko A
    if (soldier.treeALvl < 3) {
        let nextSkillA = trees.treeA.skills[soldier.treeALvl];
        let isBlack = (soldier.treeALvl === 2);
        const cardA = buildDogTagCard(
            `DRZEWKO A: ${trees.treeA.name}`,
            `★ LVL ${soldier.treeALvl + 1}: ${nextSkillA.name.toUpperCase()}<br><span style="font-size:7px; font-weight:normal; display:block; margin-top:6px; line-height:1.4;">${nextSkillA.desc}</span>`,
            () => {
                soldier.applySkillPromotion('A');
                closePromotionScreen();
            },
            isBlack
        );
        optionsDiv.appendChild(cardA);
    } else {
        const cardA = buildDogTagCard(
            `DRZEWKO A: ${trees.treeA.name}`,
            `★ MAKSYMALNY POZIOM<br><span style="font-size:7px; font-weight:normal; display:block; margin-top:6px; color:#777;">Opanowane do perfekcji!</span>`,
            () => {},
            false
        );
        cardA.style.opacity = '0.45';
        cardA.style.cursor = 'default';
        optionsDiv.appendChild(cardA);
    }
    
    // Drzewko B
    if (soldier.treeBLvl < 3) {
        let nextSkillB = trees.treeB.skills[soldier.treeBLvl];
        let isBlack = (soldier.treeBLvl === 2);
        const cardB = buildDogTagCard(
            `DRZEWKO B: ${trees.treeB.name}`,
            `★ LVL ${soldier.treeBLvl + 1}: ${nextSkillB.name.toUpperCase()}<br><span style="font-size:7px; font-weight:normal; display:block; margin-top:6px; line-height:1.4;">${nextSkillB.desc}</span>`,
            () => {
                soldier.applySkillPromotion('B');
                closePromotionScreen();
            },
            isBlack
        );
        optionsDiv.appendChild(cardB);
    } else {
        const cardB = buildDogTagCard(
            `DRZEWKO B: ${trees.treeB.name}`,
            `★ MAKSYMALNY POZIOM<br><span style="font-size:7px; font-weight:normal; display:block; margin-top:6px; color:#777;">Opanowane do perfekcji!</span>`,
            () => {},
            false
        );
        cardB.style.opacity = '0.45';
        cardB.style.cursor = 'default';
        optionsDiv.appendChild(cardB);
    }
}

function closePromotionScreen() {
    document.getElementById('screens').classList.add('hidden');
    document.getElementById('upgradeScreen').classList.add('hidden');
    state.gameState = 'PLAY';
    playSound('sfx_airdrop_start', 0.4);
}

export function adminLvlUpRecruit() {
    if (!state.squad || state.squad.length === 0) return;
    // Szukamy pierwszego żyjącego żołnierza z dostępnym awansem
    let cand = state.squad.find(s => CLASS_SKILL_TREES[s.soldierClass] && (s.treeALvl < 3 || s.treeBLvl < 3));
    if (!cand) cand = state.squad[0];
    if (cand && CLASS_SKILL_TREES[cand.soldierClass]) {
        showSoldierPromotionScreen(cand);
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
    if (statKey === 'damage') stats.damage *= 1.2;
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

export function adminToggleControlMode() {
    state.aimOnlyMode = !state.aimOnlyMode;
    const btn = document.getElementById('adminToggleControlModeBtn');
    if (btn) {
        btn.innerText = state.aimOnlyMode ? "TRYB: CELOWANIE MYSZKĄ" : "TRYB: RUCH MYSZKĄ";
    }
    
    // Zresetuj celownik ruchu do pozycji lidera, aby uniknąć automatycznego chodzenia do starego celu
    let leader = state.squad[0];
    if (leader) {
        state.targetPoint.x = leader.x;
        state.targetPoint.y = leader.y;
    }
    playSound('sfx_click', 0.6);
}

export function adminRespawnSoldier(className) {
    let spawnX = state.camera.x;
    let spawnY = state.camera.y;
    if (state.squad && state.squad.length > 0) {
        spawnX = state.squad[0].x;
        spawnY = state.squad[0].y;
    }
    
    // Czyszczenie składu bez wywoływania Game Over w tej samej klatce (ponieważ natychmiast dodamy nowego żołnierza)
    state.squad = [];
    stats.maxSquad = 1;
    
    const newSoldier = new Soldier(spawnX, spawnY, className);
    state.squad.push(newSoldier);
    
    state.camera.x = spawnX;
    state.camera.y = spawnY;
    
    // Zresetuj celownik ruchu i celownik myszy do pozycji nowego żołnierza
    state.targetPoint.x = spawnX;
    state.targetPoint.y = spawnY;
    state.aimPoint.x = spawnX;
    state.aimPoint.y = spawnY;
    
    lastDisplayedSquad = -1;
    updateHUD();
    playSound('sfx_click', 0.6);
}

// Rejestracja w obiekcie window
window.toggleAdminPanel = toggleAdminPanel;
window.togglePause = togglePause;
window.adminSetSound = adminSetSound;
window.adminLvlUpRecruit = adminLvlUpRecruit;
window.adminSpawnRecruit = adminSpawnRecruit;
window.adminSpawnDog = adminSpawnDog;
window.adminGiveWeapon = adminGiveWeapon;
window.adminApplyUpgrade = adminApplyUpgrade;
window.adminGiveAirstrike = adminGiveAirstrike;
window.adminUploadSkin = adminUploadSkin;
window.adminPromoteSquad = adminPromoteSquad;
window.adminToggleControlMode = adminToggleControlMode;
window.adminRespawnSoldier = adminRespawnSoldier;
window.showUpgrades = showUpgrades;
window.chargeDoctrines = chargeDoctrines;

// --- Funkcja testowa Niestandardowych Doktryn (Dla panelu debug) ---
export function testCustomDoctrinesScreen() {
    state.gameState = 'UPGRADE';
    const screens = document.getElementById('screens');
    screens.classList.remove('hidden');
    screens.classList.add('upgrade-mode');
    document.getElementById('upgradeScreen').classList.remove('hidden');
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.classList.remove('open');
    
    let optionsDiv = document.getElementById('upgradeOptions');
    optionsDiv.innerHTML = '';

    let shuffledBlack = [...NON_STANDARD_DOCTRINES].sort(() => 0.5 - Math.random());
    let blackMarketOptions = shuffledBlack.slice(0, 3);
    
    blackMarketOptions.forEach(option => {
        const card = buildDogTagCard(
            option.name,
            option.desc,
            () => {
                option.apply();
                state.wave++;
                startWave();
            },
            true // isBlackTag = true
        );
        optionsDiv.appendChild(card);
    });
}
window.testCustomDoctrinesScreen = testCustomDoctrinesScreen;
