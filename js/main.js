import { state, stats, WEAPONS } from './config.js';
import { terrainPattern, bloodCanvas, bloodCtx, discoverCustomAssets } from './sprites.js';
import { Soldier, corpses } from './entities/Soldier.js';
import { Enemy } from './entities/Enemy.js';
import { Crate } from './entities/Crate.js';
import { PrisonerCage } from './entities/PrisonerCage.js';
import { EnemyDepot } from './entities/EnemyDepot.js';
import { Decoy } from './entities/Decoy.js';
import { Explosion } from './entities/Explosion.js';
import { AirstrikeBomb } from './entities/AirstrikeBomb.js';
import { FieldMine } from './entities/FieldMine.js';
import { createParticles } from './entities/Particle.js';
import { gameOver, showUpgrades, updateHUD, startGame } from './ui.js?v=1.0.5';
import { initInput } from './input.js';
import { preloadSounds } from './sfx.js?v=1.0.6';

const afterBurningImg = new Image();
afterBurningImg.src = 'img/after_burning.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function resize() {
    state.viewport.width = window.innerWidth;
    state.viewport.height = window.innerHeight;
    state.viewport.halfW = state.viewport.width / 2;
    state.viewport.halfH = state.viewport.height / 2;
    
    // Wsparcie dla ekranów mobilnych o wysokim DPI (Retina)
    let dpr = window.devicePixelRatio || 1;
    canvas.width = state.viewport.width * dpr;
    canvas.height = state.viewport.height * dpr;
    ctx.scale(dpr, dpr);
}

window.addEventListener('resize', resize);
resize();

// Zainicjowanie obsługi wejścia (Input) po załadowaniu DOM
initInput();

window.adminSpawnCrate = (type) => {
    if (!state.crates) state.crates = [];
    let leader = state.squad[0] || { x: state.camera.x, y: state.camera.y };
    let ang = Math.random() * Math.PI * 2;
    let dist = stats.range * 0.5 + Math.random() * 30; // Bliżej gracza
    let cr = new Crate(leader.x + Math.cos(ang)*dist, leader.y + Math.sin(ang)*dist);
    if (type === 'PLASMA') cr.droppedWeapon = WEAPONS.SPECIAL_PLASMA;
    if (type === 'FLAME') cr.droppedWeapon = WEAPONS.SPECIAL_FLAMETHROWER;
    if (type === 'AIRSTRIKE') cr.droppedWeapon = WEAPONS.SPECIAL_AIRSTRIKE;
    
    // Zgodnie z wytycznymi: broń leży bezpośrednio na ziemi bez fizycznej skrzynki
    cr.isDestroyed = true;
    cr.isWeaponDropped = true;
    cr.hp = 0;
    
    state.crates.push(cr);
};

// --- PĘTLA AKTUALIZACJI LOGIKI (Update) ---
function update(dt) {
    if (state.gameState !== 'PLAY' && state.gameState !== 'UPGRADE') return;
    if (state.isPaused) return; // Aktywna pauza - pominie logikę, zostawi renderowanie klatki
    
    if (state.gameState === 'UPGRADE') {
        dt = dt * 0.04; // Zwolnienie czasu (Bullet-Time)
    }

    // --- OBSŁUGA KLAWIATURY (WASD / Strzałki) ---
    if (state.inputMode === 'keyboard') {
        let kx = 0;
        let ky = 0;
        if (state.keys['KeyW'] || state.keys['ArrowUp']) ky -= 1;
        if (state.keys['KeyS'] || state.keys['ArrowDown']) ky += 1;
        if (state.keys['KeyA'] || state.keys['ArrowLeft']) kx -= 1;
        if (state.keys['KeyD'] || state.keys['ArrowRight']) kx += 1;
        
        let leader = state.squad[0];
        if (leader) {
            if (kx !== 0 || ky !== 0) {
                // Normalizujemy wektor kierunku
                let len = Math.hypot(kx, ky);
                kx /= len;
                ky /= len;
                
                // Ustawiamy cel ruchu z przodu przed dowódcą
                state.targetPoint.x = leader.x + kx * stats.range * 0.85;
                state.targetPoint.y = leader.y + ky * stats.range * 0.85;
            } else {
                // Gdy brak aktywnych klawiszy, zatrzymujemy oddział w miejscu dowódcy
                state.targetPoint.x = leader.x;
                state.targetPoint.y = leader.y;
            }
        }
    }

    // Camera follow squad center
    if (state.squad.length > 0) {
        let cx = 0, cy = 0;
        state.squad.forEach(s => { cx += s.x; cy += s.y; });
        cx /= state.squad.length;
        cy /= state.squad.length;
        // Smooth camera follow
        state.camera.x += (cx - state.camera.x) * 5 * dt;
        state.camera.y += (cy - state.camera.y) * 5 * dt;
    } else {
        gameOver();
        return;
    }

    if (state.squadBuffTimer > 0) state.squadBuffTimer -= dt;

    if (state.airstrikeTimer > 0) {
        state.airstrikeTimer -= dt;
        state.airstrikeBombTimer = (state.airstrikeBombTimer || 0) - dt;
        if (state.airstrikeBombTimer <= 0) {
            state.airstrikeBombTimer = 0.12 + Math.random() * 0.06;
            let bx, by;
            let valid = false;
            let visibleEnemies = state.enemies.filter(e => e.hp > 0 && Math.hypot(e.x - state.camera.x, e.y - state.camera.y) < window.innerWidth * 0.6);
            
            for (let attempt = 0; attempt < 10; attempt++) {
                if (visibleEnemies.length > 0 && Math.random() < 0.75) {
                    let targetEnemy = visibleEnemies[Math.floor(Math.random() * visibleEnemies.length)];
                    bx = targetEnemy.x + (Math.random() - 0.5) * 60;
                    by = targetEnemy.y + (Math.random() - 0.5) * 60;
                } else {
                    bx = state.camera.x + (Math.random() - 0.5) * (window.innerWidth * 0.85);
                    by = state.camera.y + (Math.random() - 0.5) * (window.innerHeight * 0.85);
                }
                
                let tooClose = false;
                if (state.airstrikeBombs && state.airstrikeBombs.some(b => Math.hypot(b.x - bx, b.y - by) < 100)) tooClose = true;
                if (state.explosions && state.explosions.some(ex => ex.isAirstrike && Math.hypot(ex.x - bx, ex.y - by) < 100)) tooClose = true;
                
                if (!tooClose) {
                    valid = true;
                    break;
                }
            }
            if (valid) {
                if (!state.airstrikeBombs) state.airstrikeBombs = [];
                state.airstrikeBombs.push(new AirstrikeBomb(bx, by));
            }
        }
    }

    // Spawn Enemies outside camera view
    if (state.gameState === 'PLAY' && state.enemiesToSpawn > 0) {
        state.enemySpawnTimer -= dt;
        if (state.enemySpawnTimer <= 0) {
            let angle = Math.random() * Math.PI * 2;
            let dist = Math.max(window.innerWidth, window.innerHeight) / 2 + 50; // spawn just offscreen
            let ex = state.camera.x + Math.cos(angle) * dist;
            let ey = state.camera.y + Math.sin(angle) * dist;
            
            // Poszerzone limity korespondujące z płótnem 12000x12000px
            ex = Math.max(200, Math.min(11800, ex));
            ey = Math.max(200, Math.min(11800, ey));

            state.enemies.push(new Enemy(ex, ey));
            state.enemiesToSpawn--;
            state.enemySpawnTimer = 0.5 - Math.min(0.4, state.wave * 0.05); 
        }
    }

    // Spawnowanie skrzynek na mapie
    if (state.gameState === 'PLAY' && state.crates && state.crateSpawnTimer !== undefined) {
        state.crateSpawnTimer -= dt;
        if (state.crateSpawnTimer <= 0) {
            let ang = Math.random() * Math.PI * 2;
            let dist = stats.range + 100 + Math.random() * 150;
            let cx = state.camera.x + Math.cos(ang) * dist;
            let cy = state.camera.y + Math.sin(ang) * dist;
            cx = Math.max(300, Math.min(11700, cx));
            cy = Math.max(300, Math.min(11700, cy));
            
            if (state.crates.length < 3) {
                state.crates.push(new Crate(cx, cy));
            }
            state.crateSpawnTimer = 40 + Math.random() * 20; 
        }
    }

    // Obsługa min stawianych przez Lidera (Saper Lider)
    if (state.gameState === 'PLAY' && state.passiveFieldMinerActive && state.squad.length > 0) {
        state.fieldMinerTimer = (state.fieldMinerTimer || 0) - dt;
        if (state.fieldMinerTimer <= 0) {
            let leader = state.squad[0];
            if (leader && state.fieldMines) {
                state.fieldMines.push(new FieldMine(leader.x, leader.y, leader));
            }
            state.fieldMinerTimer = 10.0; // Co 10 sekund zostawia minę na trawie
        }
    }

    // 4. MISTRZ MASKOWANIA (Aktywacja spacji nad krzakiem, pasek progresu, 2s ukrycia)
    if (state.gameState === 'PLAY' && state.camoMasterLevel && state.camoMasterLevel > 0 && state.bushes && state.squad.length > 0) {
        if (state.squadBushCooldown > 0) state.squadBushCooldown -= dt;
        
        let leader = state.squad[0];
        let nearBush = state.bushes.find(b => Math.hypot(b.x - leader.x, b.y - leader.y) < b.radius + 14);
        
        if (state.squadHiddenTimer > 0) {
            state.squadHiddenTimer -= dt;
            if (state.activeHidingBush) {
                let hb = state.activeHidingBush;
                state.squad.forEach((s, idx) => { 
                    s.isHiddenInBush = true; 
                    s.isMoving = false;
                    s.x = hb.x + (idx % 2 === 0 ? -3 : 3) * idx;
                    s.y = hb.y + (idx > 1 ? 3 : -2);
                });
                if (state.targetPoint) { state.targetPoint.x = hb.x; state.targetPoint.y = hb.y; }
            }
            
            if (state.squadHiddenTimer <= 0) {
                state.squadHiddenTimer = 0;
                state.activeHidingBush = null;
                state.squad.forEach(s => s.isHiddenInBush = false);
                state.squadBushCooldown = Math.max(4, 9.0 - state.camoMasterLevel * 1.5); // lvl 1: 7.5s, lvl 2: 6s, lvl 3: 4.5s
            }
        } else if (nearBush && (state.squadBushCooldown <= 0 || !state.squadBushCooldown)) {
            // Aktywacja spacji obok krzewu
            if (state.keys && state.keys['Space']) {
                state.squadHiddenTimer = 2.0;
                state.activeHidingBush = nearBush;
                state.squad.forEach((s, idx) => { 
                    s.isHiddenInBush = true; 
                    s.isMoving = false;
                    s.x = nearBush.x + (idx % 2 === 0 ? -3 : 3) * idx;
                    s.y = nearBush.y + (idx > 1 ? 3 : -2);
                });
            } else {
                state.squad.forEach(s => s.isHiddenInBush = false);
            }
        } else {
            state.squad.forEach(s => s.isHiddenInBush = false);
        }
    }

    // Update Entities
    for (let i = 0; i < state.squad.length; i++) state.squad[i].update(dt);
    for (let i = 0; i < state.companions.length; i++) state.companions[i].update(dt);
    state.companions = state.companions.filter(c => !c.isDead && (c.hp === undefined || c.hp > 0));
    for (let i = 0; i < state.enemies.length; i++) state.enemies[i].update(dt);
    for (let i = 0; i < state.bullets.length; i++) state.bullets[i].update(dt);
    for (let i = 0; i < state.particles.length; i++) state.particles[i].update(dt);
    for (let i = 0; i < state.explosions.length; i++) state.explosions[i].update(dt);
    if (state.auras) { for (let i = 0; i < state.auras.length; i++) state.auras[i].update(dt); }
    if (state.bushes) {
        for (let i = 0; i < state.bushes.length; i++) state.bushes[i].update(dt);
    }
    if (state.crates) {
        for (let i = 0; i < state.crates.length; i++) state.crates[i].update(dt);
    }
    if (state.fieldMines) {
        for (let i = state.fieldMines.length - 1; i >= 0; i--) {
            state.fieldMines[i].update(dt);
            if (state.fieldMines[i].isTriggered) {
                state.fieldMines.splice(i, 1);
            }
        }
    }
    if (state.prisonerCages) {
        for (let i = 0; i < state.prisonerCages.length; i++) state.prisonerCages[i].update(dt);
    }
    if (state.enemyDepots) {
        for (let i = 0; i < state.enemyDepots.length; i++) state.enemyDepots[i].update(dt);
    }
    if (state.decoys) {
        for (let i = 0; i < state.decoys.length; i++) state.decoys[i].update(dt);
    }
    if (state.medkits) {
        for (let i = 0; i < state.medkits.length; i++) state.medkits[i].update(dt);
    }
    if (state.airstrikeBombs) {
        for (let i = 0; i < state.airstrikeBombs.length; i++) state.airstrikeBombs[i].update(dt);
    }
    
    if (typeof corpses !== 'undefined' && corpses) {
        for (let i = 0; i < corpses.length; i++) {
            let c = corpses[i];
            if (c.deathType === 'flame') {
                c.animTimer = (c.animTimer || 0) + dt;
            }
        }
    }
    
    if (state.fuelPools) {
        for (let i = 0; i < state.fuelPools.length; i++) {
            state.fuelPools[i].life -= dt;
        }
        state.fuelPools = state.fuelPools.filter(f => f.life > 0);
    }

    // --- AKTUALIZACJA FIZYKI CIAŁ WROGÓW (Dying Bodies) ---
    if (state.dyingBodies) {
        for (let i = 0; i < state.dyingBodies.length; i++) {
            let b = state.dyingBodies[i];
            b.timer -= dt;

            // Ruch z oporem (tarciem)
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            if (b.approach === 'slide') {
                b.vx *= Math.pow(0.93, dt * 60);
                b.vy *= Math.pow(0.93, dt * 60);
                let progress = Math.min(1.0, 1.0 - (b.timer / b.maxTimer));
                let eased = Math.sin(progress * Math.PI / 2); // Płynne przechylanie bez nagłych przeskoków i nawrotów
                b.angle = b.targetAngle * eased;
            } else if (b.approach === 'spin') {
                b.vx *= Math.pow(0.88, dt * 60);
                b.vy *= Math.pow(0.88, dt * 60);
                b.angle += b.spinSpeed * dt;
                b.spinSpeed *= Math.pow(0.90, dt * 60);
            } else if (b.approach === 'bounce') {
                // Gdy w powietrzu (b.bY < 0), tarcie powietrza jest znikome. Na ziemi tarcie jest znaczące.
                let airResistance = b.bY < 0 ? 0.985 : 0.60;
                b.vx *= Math.pow(airResistance, dt * 60);
                b.vy *= Math.pow(airResistance, dt * 60);
                
                b.bY += b.bVy * dt;
                b.bVy += 1600 * dt; // Znacznie większa grawitacja dla poczucia ciężaru ciała (upada szybciej)
                
                if (b.bY >= 0) {
                    b.bY = 0;
                    b.bVy = -b.bVy * 0.40; // Odbicie od ziemi (damped bounce)
                    if (Math.abs(b.bVy) < 30) b.bVy = 0;
                    
                    // Przy uderzeniu o ziemię: wytracenie rotacji i płynne wyrównanie do leżenia płasko
                    b.spinSpeed *= Math.pow(0.4, dt * 60);
                    let angleDiff = b.targetAngle - b.angle;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    b.angle += angleDiff * (1 - Math.pow(0.75, dt * 60));
                } else {
                    // W powietrzu: dynamiczne koziołkowanie ciała
                    b.angle += b.spinSpeed * dt;
                    b.spinSpeed *= Math.pow(0.985, dt * 60);
                }
            } else if (b.approach === 'heavy') {
                b.vx *= Math.pow(0.83, dt * 60);
                b.vy *= Math.pow(0.83, dt * 60);
                b.shake *= Math.pow(0.86, dt * 60);
                b.angle += (b.targetAngle - b.angle) * (1 - Math.pow(0.85, dt * 60)); // Płynne pochylenie ciężkiego pancerza
                if (Math.random() < 0.25 && Math.abs(b.vx) > 3) {
                    createParticles(b.x, b.y + 10, '#8a9396', 1, 15); // szary pył pancerza
                }
            }

            // --- SMUGA KRWI: Zostawianie śladu krwi na ziemi podczas ślizgu ---
            if (bloodCtx && b.deathType !== 'flame' && b.deathType !== 'beam' && Math.hypot(b.vx, b.vy) > 8) {
                if (Math.random() < 0.75) {
                    bloodCtx.fillStyle = b.deathType === 'headshot' ? '#660000' : '#8b0000'; // ciemniejsza dla headshota
                    let pSize = Math.random() > 0.5 ? 2 : 1; // Bardzo malutkie piksele
                    let ox = (Math.random() - 0.5) * 4;
                    let oy = (Math.random() - 0.5) * 4;
                    bloodCtx.fillRect(b.x + ox, b.y + 6 + oy, pSize, pSize);
                }
            }

            // Gdy czas dobiegnie końca, wypalamy ciało w tło
            if (b.timer <= 0) {
                if (bloodCtx) {
                    bloodCtx.save();
                    
                    let baseSprite = b.sprites ? b.sprites[0] : null;
                    bloodCtx.translate(b.x, b.y + 4);
                    
                    // Zachowanie kąta z końca ślizgu/ragdolla (zapobiega niepłynnemu przeskokowi stanu)
                    let finalAngle = b.angle;
                    bloodCtx.rotate(finalAngle);
                    
                    let drawScale = b.type === 'boss' ? 48 : 32;
                    let isElite = b.type !== 'standard';
                    let customDead = isElite ? 
                        ((typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyEliteDeadSkin && customSquadDesign.enemyEliteDeadSkin.complete && customSquadDesign.enemyEliteDeadSkin.width > 0) ? customSquadDesign.enemyEliteDeadSkin : (b.customImageSkin && b.customImageSkin.complete && b.customImageSkin.width > 0 ? b.customImageSkin : null)) :
                        ((typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyDeadSkin && customSquadDesign.enemyDeadSkin.complete && customSquadDesign.enemyDeadSkin.width > 0) ? customSquadDesign.enemyDeadSkin : (b.customImageSkin && b.customImageSkin.complete && b.customImageSkin.width > 0 ? b.customImageSkin : null));
                    
                    if (customDead && customDead.width > 0 && customDead.height > 0) {
                        let sW = Math.min(customDead.width, customDead.height);
                        let sH = Math.min(customDead.height, customDead.width);
                        bloodCtx.drawImage(customDead, 0, 0, sW, sH, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    } else if (baseSprite) {
                        bloodCtx.drawImage(baseSprite, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    }
                    
                    bloodCtx.fillStyle = '#8b0000'; // Realistyczna krew
                    let woundCount = b.type === 'boss' ? 12 : (b.deathType === 'headshot' ? 8 : 4);
                    for (let w = 0; w < woundCount; w++) {
                        let rx = Math.floor(((Math.random() - 0.5) * (drawScale * 0.5)) / 2) * 2;
                        let ry = Math.floor(((Math.random() - 0.5) * (drawScale * 0.5)) / 2) * 2;
                        let pSize = Math.random() > 0.5 ? 2 : 1; // Małe piksele 1-2
                        bloodCtx.fillRect(rx, ry, pSize, pSize);
                    }
                    bloodCtx.restore();
                }

                if (typeof corpses !== 'undefined' && corpses) {
                    let isScorched = b.deathType === 'flame' || b.deathType === 'beam';
                    corpses.push({ x: b.x, y: b.y, isScorched: isScorched, deathType: b.deathType, smokeTimer: isScorched ? 3.0 : 0, animTimer: 0, seed: Math.random() * 1000 });
                    if (corpses.length > 150) corpses.shift();
                }
            }
        }
        state.dyingBodies = state.dyingBodies.filter(b => b.timer > 0);
    }

    // Clean dead entities
    let startEnemies = state.enemies.length;
    state.enemies = state.enemies.filter(e => e.hp > 0);
    state.squad = state.squad.filter(s => s.hp > 0);
    state.bullets = state.bullets.filter(b => b.life > 0);
    state.particles = state.particles.filter(p => p.life > 0);
    state.explosions = state.explosions.filter(ex => ex.life > 0);
    if (state.auras) state.auras = state.auras.filter(a => a.life > 0);
    if (state.crates) state.crates = state.crates.filter(cr => cr.life > 0);
    if (state.prisonerCages) state.prisonerCages = state.prisonerCages.filter(pc => !pc.isDestroyed || pc.life > 0);
    if (state.enemyDepots) state.enemyDepots = state.enemyDepots.filter(ed => !ed.isDestroyed || ed.life > 0);
    if (state.decoys) state.decoys = state.decoys.filter(dec => !dec.isDestroyed || dec.life > 0);
    if (state.medkits) state.medkits = state.medkits.filter(m => !m.isCollected && m.life > 0);
    if (state.airstrikeBombs) state.airstrikeBombs = state.airstrikeBombs.filter(b => !b.isDead);

    if (state.enemies.length !== startEnemies || state.squad.length === 0) {
        updateHUD();
    }

    // Wave End Check
    if (state.gameState === 'PLAY' && state.enemiesToSpawn <= 0 && state.enemiesAlive <= 0) {
        showUpgrades();
    }
}

// Delikatny znacznik celu marszu (zastępuje agresywny celownik)
function drawWaypoint(x, y) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
    ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
    ctx.stroke();
}

// --- RENDEROWANIE KLATKI (Draw) ---
function draw() {
    // Clear & Draw repeating background relative to camera
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

    ctx.save();
    ctx.translate(state.viewport.halfW - state.camera.x, state.viewport.halfH - state.camera.y);

    // Fill terrain pattern (only what's visible roughly)
    if (terrainPattern) {
        ctx.fillStyle = terrainPattern;
        ctx.fillRect(state.camera.x - state.viewport.halfW, state.camera.y - state.viewport.halfH, state.viewport.width, state.viewport.height);
    }

    // Draw Blood & Corpses layer
    if (bloodCanvas) {
        // Optymalizacja VRAM: zamiast przesyłać całą 576MB teksturę 12000x12000 co klatkę, renderujemy tylko widoczny obszar kamery
        let vpW = state.viewport.width + 200;
        let vpH = state.viewport.height + 200;
        let sx = Math.max(0, Math.min(bloodCanvas.width - vpW, Math.floor(state.camera.x - state.viewport.halfW - 100)));
        let sy = Math.max(0, Math.min(bloodCanvas.height - vpH, Math.floor(state.camera.y - state.viewport.halfH - 100)));
        
        ctx.drawImage(bloodCanvas, sx, sy, vpW, vpH, sx, sy, vpW, vpH);
    }

    // Zastąpienie celownika dyskretnym wskaźnikiem ruchu
    if (state.gameState === 'PLAY') {
        drawWaypoint(state.targetPoint.x, state.targetPoint.y);
    }

    // Draw Entities (sort by Y for basic depth) - Optymalizacja: unikamy kopiowania wielkiej tablicy co klatkę
    let visibleRenderables = [];
    const halfW = state.viewport.halfW + 64;
    const halfH = state.viewport.halfH + 64;
    
    const addVisible = (arr) => {
        if (!arr) return;
        for (let i = 0; i < arr.length; i++) {
            let r = arr[i];
            if (Math.abs(r.x - state.camera.x) < halfW && Math.abs(r.y - state.camera.y) < halfH) {
                visibleRenderables.push(r);
            }
        }
    };

    addVisible(state.squad);
    addVisible(state.companions);
    addVisible(state.enemies);
    addVisible(state.dyingBodies);
    addVisible(state.crates);
    addVisible(state.bushes);
    addVisible(state.fieldMines);
    addVisible(state.prisonerCages);
    addVisible(state.enemyDepots);
    addVisible(state.decoys);
    addVisible(state.medkits);
    addVisible(state.airstrikeBombs);

    visibleRenderables.sort((a, b) => {
        let ay = a.y + (a.isHiddenInBush ? 20 : 0);
        let by = b.y + (b.isHiddenInBush ? 20 : 0);
        return ay - by;
    });
    
    for (let i = 0; i < state.explosions.length; i++) state.explosions[i].draw(ctx);
    for (let i = 0; i < state.particles.length; i++) state.particles[i].draw(ctx);
    if (state.auras) { for (let i = 0; i < state.auras.length; i++) state.auras[i].draw(ctx); }
    for (let i = 0; i < state.bullets.length; i++) state.bullets[i].draw(ctx);
    for (let i = 0; i < visibleRenderables.length; i++) visibleRenderables[i].draw(ctx);
    
    // Dopalanie się zwłok oraz rozlanego paliwa w surowej, precyzyjnej estetyce retro 2x2 pixel art
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let t = Date.now() / 40;
    
    if (typeof corpses !== 'undefined' && corpses) {
        const corpseCullW = window.innerWidth / 2 + 50;
        const corpseCullH = window.innerHeight / 2 + 50;
        for (let idx = 0; idx < corpses.length; idx++) {
            let c = corpses[idx];
            if (c.deathType === 'flame' && c.animTimer !== undefined) {
                let maxDuration = 3.5; // Zgodnie z instrukcją: długie dopalanie przez 3.5 sekundy
                if (c.animTimer < maxDuration) {
                    // Frustum culling for burning corpses
                    if (Math.abs(c.x - state.camera.x) > corpseCullW || Math.abs(c.y - state.camera.y) > corpseCullH) {
                        continue;
                    }
                    let fade = Math.max(0, Math.min(1, 1.0 - (c.animTimer / maxDuration)));
                    ctx.globalAlpha = fade;
                    
                    let seed = c.seed || 0;
                    for (let i = 0; i < 10; i++) {
                        let s1 = Math.sin(seed + i * 2.3);
                        let s2 = Math.cos(seed * 1.7 + i * 3.1);
                        let fx = c.x + Math.floor(s1 * 12);
                        let baseWave = Math.abs(Math.sin(t * (0.8 + Math.abs(s2) * 0.4) + seed + i * 1.7));
                        let wave = baseWave * (14 * fade) + Math.floor(s2 * 3);
                        let fy = c.y + 6 + Math.floor(s2 * 4) - wave;
                        
                        let px = Math.floor(fx / 2) * 2;
                        let py = Math.floor(fy / 2) * 2;
                        
                        ctx.fillStyle = '#ff3300';
                        ctx.fillRect(px, py, 2, 2);
                        if (wave > 3) {
                            ctx.fillStyle = '#ff8800';
                            ctx.fillRect(px, py + 2, 2, 2);
                        }
                        if (i % 2 === 0 && wave > 6) {
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(px, py + 4, 2, 2);
                        }
                    }
                }
            }
        }
    }
    
    // Dynamiczne, małe dogasające płomienie na ziemi osadzone nad czarnymi plamami wypalenia
    if (state.fuelPools && state.fuelPools.length > 0) {
        const fuelCullW = window.innerWidth / 2 + 20;
        const fuelCullH = window.innerHeight / 2 + 20;
        for (let idx = 0; idx < state.fuelPools.length; idx++) {
            let f = state.fuelPools[idx];
            if (Math.abs(f.x - state.camera.x) > fuelCullW || Math.abs(f.y - state.camera.y) > fuelCullH) {
                continue;
            }
            let fade = Math.max(0, Math.min(1, f.life / (f.maxLife || 1.5)));
            ctx.globalAlpha = fade;
            
            let px = Math.floor(f.x / 2) * 2;
            let py = Math.floor(f.y / 2) * 2;
            
            // Wysokość płomyka maleje proporcjonalnie w miarę dogasania
            let height = Math.floor((Math.abs(Math.sin(t * 1.3 + idx * 2.3)) * 4 + 4) * fade / 2) * 2;
            if (height < 2) height = 2;
            
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(px - 1, py - height, 2, height + 1);
            
            if (fade > 0.25) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(px, py - height + 1, 1, height - 1);
            }
        }
    }
    ctx.restore();

    // Draw Player range indicator (subtle)
    if (state.squad.length > 0 && state.gameState === 'PLAY') {
        let leader = state.squad[0];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(leader.x, leader.y, stats.range, 0, Math.PI*2);
        ctx.stroke();
    }

    ctx.restore();

    // Uratowanie Jeńca: off-screen wskaźnik kierunkowy i odległość (HUD)
    if (state.gameState === 'PLAY' && state.prisonerCages && state.prisonerCages.length > 0) {
        let cage = state.prisonerCages.find(c => !c.isDestroyed);
        if (cage) {
            let screenX = window.innerWidth / 2 - state.camera.x + cage.x;
            let screenY = window.innerHeight / 2 - state.camera.y + cage.y;
            
            // Rysujemy strzałkę tylko jeśli klatka jest poza granicami widocznego ekranu z marginesem 40px
            if (screenX < 40 || screenX > window.innerWidth - 40 || screenY < 40 || screenY > window.innerHeight - 40) {
                let ang = Math.atan2(cage.y - state.camera.y, cage.x - state.camera.x);
                let halfW = window.innerWidth / 2 - 40;
                let halfH = window.innerHeight / 2 - 40;
                let ax = window.innerWidth / 2 + Math.cos(ang) * halfW;
                let ay = window.innerHeight / 2 + Math.sin(ang) * halfH;
                
                let distMeters = Math.floor(Math.hypot(cage.x - state.camera.x, cage.y - state.camera.y) / 10);
                
                // Obliczanie pozycji dymku (cofnięty od krawędzi ekranu)
                let bubbleX = ax - Math.cos(ang) * 15;
                let bubbleY = ay - Math.sin(ang) * 15;
                
                ctx.save();
                
                // Rysowanie delikatnego trójkątnego wskaźnika kierunku (ogonek dymku)
                ctx.fillStyle = '#ffffff';
                
                ctx.beginPath();
                let baseAngle1 = ang + Math.PI / 2;
                let baseAngle2 = ang - Math.PI / 2;
                ctx.moveTo(bubbleX + Math.cos(baseAngle1) * 6, bubbleY + Math.sin(baseAngle1) * 6);
                ctx.lineTo(ax, ay); // wierzchołek na krawędzi ekranu
                ctx.lineTo(bubbleX + Math.cos(baseAngle2) * 6, bubbleY + Math.sin(baseAngle2) * 6);
                ctx.closePath();
                ctx.fill();
                
                // Rysowanie retro dymku dialogowego (kanciasty prostokąt)
                let rectW = 54;
                let rectH = 18;
                let rx = bubbleX - rectW / 2;
                let ry = bubbleY - rectH / 2;
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(rx, ry, rectW, rectH);
                
                // Napis "Help!" w środku dymku
                ctx.fillStyle = '#e35442'; // Czerwony retro alarm
                ctx.font = '8px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("Help!", bubbleX, bubbleY + 1);
                ctx.restore();
                
                // Tekst odległości poniżej lub powyżej dymku
                ctx.save();
                ctx.fillStyle = '#39ff14';
                ctx.font = '8px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 3;
                ctx.shadowColor = '#39ff14';
                let textY = bubbleY + 20;
                if (ay > window.innerHeight - 50) {
                    textY = bubbleY - 20;
                }
                ctx.fillText(`${distMeters}m`, bubbleX, textY);
                ctx.restore();
            }
        }
    }

    // Szturm na Magazyn: off-screen wskaźnik kierunkowy (kolor czerwony ostrzegawczy)
    if (state.gameState === 'PLAY' && state.enemyDepots && state.enemyDepots.length > 0) {
        let depot = state.enemyDepots.find(d => !d.isDestroyed);
        if (depot) {
            let screenX = window.innerWidth / 2 - state.camera.x + depot.x;
            let screenY = window.innerHeight / 2 - state.camera.y + depot.y;
            
            if (screenX < 40 || screenX > window.innerWidth - 40 || screenY < 40 || screenY > window.innerHeight - 40) {
                let ang = Math.atan2(depot.y - state.camera.y, depot.x - state.camera.x);
                let halfW = window.innerWidth / 2 - 40;
                let halfH = window.innerHeight / 2 - 40;
                let ax = window.innerWidth / 2 + Math.cos(ang) * halfW;
                let ay = window.innerHeight / 2 + Math.sin(ang) * halfH;
                
                let distMeters = Math.floor(Math.hypot(depot.x - state.camera.x, depot.y - state.camera.y) / 10);
                
                ctx.save();
                ctx.fillStyle = '#ff3300'; // Neonowa czerwień
                ctx.strokeStyle = '#ff3300';
                ctx.lineWidth = 2;
                
                ctx.translate(ax, ay);
                ctx.rotate(ang);
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-6, -5);
                ctx.lineTo(-6, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                
                ctx.save();
                ctx.fillStyle = '#ff3300';
                ctx.font = '8px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#ff3300';
                ctx.fillText(`CEL: ${distMeters}m`, ax, ay - 12);
                ctx.restore();
            }
        }
    }
}

// --- GŁÓWNA PĘTLA (Loop) ---
let lastTime = 0;
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (dt > 0.1) dt = 0.1; // clamp dt

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// Zgodnie z wytycznymi: gra uruchamia się natychmiastowo, ale dopiero po pełnym załadowaniu struktury DOM
async function initApp() {
    await discoverCustomAssets();
    if (typeof resize === 'function') resize();
    preloadSounds(); // Asynchroniczne załadowanie wszystkich plików audio na starcie
    startGame();
    requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
