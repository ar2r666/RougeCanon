import { state, stats, WEAPONS } from './config.js';
import { terrainPattern, bloodCanvas } from './sprites.js';
import { Soldier, corpses } from './entities/Soldier.js';
import { Enemy } from './entities/Enemy.js';
import { Crate } from './entities/Crate.js';
import { gameOver, showUpgrades, updateHUD } from './ui.js';
import { initInput } from './input.js';
import './creator.js';

window.addEventListener('error', function(e) {
    const hud = document.getElementById('errorConsoleHUD');
    const log = document.getElementById('errorLogContent');
    if (hud && log) {
        hud.style.display = 'block';
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.style.borderBottom = '1px dashed #ffaa00';
        div.style.paddingBottom = '5px';
        div.innerHTML = `<strong style="color:#ffcc00">${e.message}</strong><br><span style="color:#aaa">Plik: ${e.filename}:${e.lineno}:${e.colno}</span>`;
        log.prepend(div);
    }
});

window.addEventListener('unhandledrejection', function(e) {
    const hud = document.getElementById('errorConsoleHUD');
    const log = document.getElementById('errorLogContent');
    if (hud && log) {
        hud.style.display = 'block';
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.style.borderBottom = '1px dashed #ffaa00';
        div.style.paddingBottom = '5px';
        div.innerHTML = `<strong style="color:#ffcc00">PROMISE ERROR: ${e.reason}</strong>`;
        log.prepend(div);
    }
});

const afterBurningImg = new Image();
afterBurningImg.src = 'img/after_burning.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Wsparcie dla ekranów mobilnych o wysokim DPI (Retina)
    let dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
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
    
    // Zgodnie z wytycznymi: broń leży bezpośrednio na ziemi bez fizycznej skrzynki
    cr.isDestroyed = true;
    cr.isWeaponDropped = true;
    cr.hp = 0;
    
    state.crates.push(cr);
};

// --- PĘTLA AKTUALIZACJI LOGIKI (Update) ---
function update(dt) {
    if (state.gameState !== 'PLAY') return;
    if (state.isPaused) return; // Aktywna pauza - pominie logikę, zostawi renderowanie klatki

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

    // Spawn Enemies outside camera view
    if (state.enemiesToSpawn > 0) {
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
    if (state.crates && state.crateSpawnTimer !== undefined) {
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

    // Update Entities
    state.squad.forEach(s => s.update(dt));
    state.companions.forEach(c => c.update(dt));
    state.enemies.forEach(e => e.update(dt));
    state.bullets.forEach(b => b.update(dt));
    state.particles.forEach(p => p.update(dt));
    state.explosions.forEach(ex => ex.update(dt));
    if (state.crates) state.crates.forEach(cr => cr.update(dt));
    
    if (typeof corpses !== 'undefined' && corpses) {
        corpses.forEach(c => {
            if (c.deathType === 'flame') {
                c.animTimer = (c.animTimer || 0) + dt;
            }
        });
    }
    
    if (state.fuelPools) {
        state.fuelPools.forEach(f => f.life -= dt);
        state.fuelPools = state.fuelPools.filter(f => f.life > 0);
    }

    // Clean dead entities
    let startEnemies = state.enemies.length;
    state.enemies = state.enemies.filter(e => e.hp > 0);
    state.squad = state.squad.filter(s => s.hp > 0);
    state.bullets = state.bullets.filter(b => b.life > 0);
    state.particles = state.particles.filter(p => p.life > 0);
    state.explosions = state.explosions.filter(ex => ex.life > 0);
    if (state.crates) state.crates = state.crates.filter(cr => cr.life > 0);

    if (state.enemies.length !== startEnemies || state.squad.length === 0) {
        updateHUD();
    }

    // Wave End Check
    if (state.enemiesToSpawn <= 0 && state.enemiesAlive <= 0) {
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
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();
    ctx.translate(window.innerWidth / 2 - state.camera.x, window.innerHeight / 2 - state.camera.y);

    // Fill terrain pattern (only what's visible roughly)
    if (terrainPattern) {
        ctx.fillStyle = terrainPattern;
        ctx.fillRect(state.camera.x - window.innerWidth / 2, state.camera.y - window.innerHeight / 2, window.innerWidth, window.innerHeight);
    }

    // Draw Blood & Corpses layer
    if (bloodCanvas) {
        // Optymalizacja VRAM: zamiast przesyłać całą 576MB teksturę 12000x12000 co klatkę, renderujemy tylko widoczny obszar kamery
        let vpW = window.innerWidth + 200;
        let vpH = window.innerHeight + 200;
        let sx = Math.max(0, Math.min(bloodCanvas.width - vpW, Math.floor(state.camera.x - window.innerWidth / 2 - 100)));
        let sy = Math.max(0, Math.min(bloodCanvas.height - vpH, Math.floor(state.camera.y - window.innerHeight / 2 - 100)));
        
        ctx.drawImage(bloodCanvas, sx, sy, vpW, vpH, sx, sy, vpW, vpH);
    }

    // Zastąpienie celownika dyskretnym wskaźnikiem ruchu
    if (state.gameState === 'PLAY') {
        drawWaypoint(state.targetPoint.x, state.targetPoint.y);
    }

    // Draw Entities (sort by Y for basic depth)
    let renderables = [...state.squad, ...state.companions, ...state.enemies, ...(state.crates || [])].sort((a, b) => a.y - b.y);
    
    state.explosions.forEach(ex => ex.draw(ctx));
    state.particles.forEach(p => p.draw(ctx));
    state.bullets.forEach(b => b.draw(ctx));
    renderables.forEach(r => r.draw(ctx));
    
    // Dopalanie się zwłok oraz rozlanego paliwa w surowej, precyzyjnej estetyce retro 2x2 pixel art
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let t = Date.now() / 40;
    
    if (typeof corpses !== 'undefined' && corpses) {
        corpses.forEach(c => {
            if (c.deathType === 'flame' && c.animTimer !== undefined) {
                let maxDuration = 3.5; // Zgodnie z instrukcją: długie dopalanie przez 3.5 sekundy
                if (c.animTimer < maxDuration) {
                    let fade = Math.max(0, Math.min(1, 1.0 - (c.animTimer / maxDuration)));
                    ctx.globalAlpha = fade;
                    
                    for (let i = 0; i < 8; i++) {
                        let fx = c.x - 10 + (i * 3);
                        let wave = Math.abs(Math.sin(t + (i * 1.3))) * (12 * fade);
                        let fy = c.y + 4 - wave;
                        
                        let px = Math.floor(fx / 2) * 2;
                        let py = Math.floor(fy / 2) * 2;
                        
                        ctx.fillStyle = '#ff3300';
                        ctx.fillRect(px, py, 2, 2);
                        if (wave > 2) {
                            ctx.fillStyle = '#ff8800';
                            ctx.fillRect(px, py + 2, 2, 2);
                        }
                        if (i % 2 === 0 && wave > 5) {
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(px, py + 4, 2, 2);
                        }
                    }
                }
            }
        });
    }
    
    // Dynamiczne, małe dogasające płomienie na ziemi osadzone nad czarnymi plamami wypalenia
    if (state.fuelPools && state.fuelPools.length > 0) {
        state.fuelPools.forEach((f, idx) => {
            let fade = Math.max(0, Math.min(1, f.life / (f.maxLife || 1.5)));
            ctx.globalAlpha = fade;
            
            let px = Math.floor(f.x / 2) * 2;
            let py = Math.floor(f.y / 2) * 2;
            
            // Wysokość płomyka maleje proporcjonalnie w miarę dogasania
            let height = Math.floor((Math.abs(Math.sin(t * 1.3 + idx * 2.3)) * 4 + 4) * fade / 2) * 2;
            if (height < 2) height = 2;
            
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(px - 2, py - height, 4, height + 2);
            
            if (fade > 0.25) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(px - 1, py - height + 1, 2, height - 1);
            }
        });
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

requestAnimationFrame(loop);
