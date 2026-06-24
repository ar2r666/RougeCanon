import { state } from '../config.js';
import { playSound } from '../sfx.js';

export class Particle {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        let angle = Math.random() * Math.PI * 2;
        let s = Math.random() * speed;
        this.vx = Math.cos(angle) * s;
        this.vy = Math.sin(angle) * s;
        this.life = 0.2 + Math.random() * 0.3;
        this.size = Math.random() > 0.55 ? 2 : 1; // Małe piksele cząsteczek
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        // Frustum culling for particles
        const halfW = state.viewport.halfW + 10;
        const halfH = state.viewport.halfH + 10;
        if (Math.abs(this.x - state.camera.x) > halfW || Math.abs(this.y - state.camera.y) > halfH) {
            return;
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

export function createParticles(x, y, color, count, speed) {
    if (state.particles.length > 400) {
        count = Math.floor(count * 0.25);
        if (count === 0 && Math.random() < 0.3) count = 1;
    }
    for (let i = 0; i < count; i++) {
        state.particles.push(new Particle(x, y, color, speed));
    }
}

export function createDirectionalParticles(x, y, color, count, speed, baseAngle, spread = 0.5) {
    if (state.particles.length > 400) {
        count = Math.floor(count * 0.25);
        if (count === 0 && Math.random() < 0.3) count = 1;
    }
    for (let i = 0; i < count; i++) {
        let angle = baseAngle + (Math.random() - 0.5) * spread;
        let s = (0.35 + Math.random() * 0.65) * speed;
        let p = new Particle(x, y, color, speed);
        p.vx = Math.cos(angle) * s;
        p.vy = Math.sin(angle) * s;
        state.particles.push(p);
    }
}

export class CritIndicator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 0.9;
        this.maxLife = 0.9;
        this.vy = -35; 
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Fade out
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        
        // Retro celownik / znacznik krytyczny (fioletowo-czerwony)
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(-1, -1, 3, 3);
        ctx.fillRect(-5, 0, 3, 1);
        ctx.fillRect(3, 0, 3, 1);
        ctx.fillRect(0, -5, 1, 3);
        ctx.fillRect(0, 3, 1, 3);
        
        ctx.restore();
    }
}

export class BattleCryEffect {
    constructor(commander) {
        this.commander = commander;
        this.life = 1.15;
        this.maxLife = 1.15;
        this.x = commander.x;
        this.y = commander.y;
    }

    update(dt) {
        this.life -= dt;
        if (this.commander && this.commander.hp > 0) {
            this.x = this.commander.x;
            this.y = this.commander.y;
        }
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        let elapsed = this.maxLife - this.life;

        // FAZA 1: DWA WYKRZYKNIKI "! !" ORAZ FALE ))) ((( NAD DOWÓDCĄ (0.0s - 0.65s)
        if (elapsed < 0.7) {
            let p = elapsed / 0.7;
            let alpha = Math.max(0, 1 - Math.pow(p, 2));
            ctx.globalAlpha = alpha;

            // 1. Dwa wykrzykniki !! nad głową ('Y' z palety gry)
            let floatY = Math.floor((this.y - 24 - p * 16) / 2) * 2;
            ctx.fillStyle = '#f7d84a';
            // Lewy !
            ctx.fillRect(this.x - 8, floatY, 4, 10);
            ctx.fillRect(this.x - 8, floatY + 12, 4, 4);
            // Prawy !
            ctx.fillRect(this.x + 4, floatY, 4, 10);
            ctx.fillRect(this.x + 4, floatY + 12, 4, 4);

            // 2. Fale akustyczne ))) ((( ('f' z palety gry)
            let waveR = 16 + p * 60;
            ctx.fillStyle = '#ffaa00';
            [-1, 1].forEach(dir => {
                for (let arc = 0; arc < 3; arc++) {
                    let r = waveR - arc * 14;
                    if (r > 8) {
                        for (let step = -2; step <= 2; step++) {
                            let ang = (dir === 1 ? 0 : Math.PI) + step * 0.22;
                            let wx = Math.floor((this.x + Math.cos(ang) * r) / 4) * 4;
                            let wy = Math.floor((this.y + Math.sin(ang) * r * 0.75) / 4) * 4;
                            ctx.fillRect(wx, wy, 4, 8);
                        }
                    }
                }
            });
        }

        // FAZA 2: PLUSIKI + NAD WSZYSTKIMI ŻOŁNIERZAMI W ODDZIALE (0.25s - 1.15s)
        if (elapsed >= 0.25) {
            let p2 = (elapsed - 0.25) / 0.9;
            let alpha2 = Math.max(0, 1 - Math.pow(p2, 1.8));
            ctx.globalAlpha = alpha2;

            if (state.squad) {
                state.squad.forEach(soldier => {
                    if (soldier.hp > 0) {
                        let sy = Math.floor((soldier.y - 22 - p2 * 26) / 2) * 2;
                        let sx = Math.floor(soldier.x / 2) * 2;

                        ctx.fillStyle = '#ff6a00'; // 'O' kanoniczny pomarańczowy gry
                        ctx.fillRect(sx - 2, sy - 6, 4, 12);
                        ctx.fillRect(sx - 6, sy - 2, 12, 4);

                        ctx.fillStyle = '#63130a'; // 'd' ciemna czerwień pod cień
                        ctx.fillRect(sx - 2, sy + 6, 4, 2);
                    }
                });
            }
        }

        ctx.restore();
    }
}

export function triggerBattleCryEffect(commander) {
    if (!state.auras) state.auras = [];
    state.auras.push(new BattleCryEffect(commander));
}

export class SmokeGrenade {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.z = 15;
        let dist = Math.hypot(targetX - startX, targetY - startY);
        let ang = Math.atan2(targetY - startY, targetX - startX);
        let flightTime = 0.55;
        this.vx = Math.cos(ang) * (dist / flightTime);
        this.vy = Math.sin(ang) * (dist / flightTime);
        this.vz = 110; // grawitacyjne wyrzucenie w górę
        this.life = flightTime;
        this.isDead = false;
        this.rot = 0;
    }

    update(dt) {
        if (this.isDead) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;
        this.vz -= 380 * dt; // grawitacja
        this.rot += dt * 12;
        if (this.z < 0) this.z = 0;
        this.life -= dt;
        if (this.life <= 0) {
            this.isDead = true;
            playSound('sfx_shoot_smoke', 0.45); // SFX eksplozji dymu sfx_shoot_smoke
            if (!state.smokeClouds) state.smokeClouds = [];
            state.smokeClouds.push(new SmokeScreenCloud(this.x, this.y));
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        ctx.save();
        // Cień pod granatem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(this.x, this.y - Math.max(0, this.z));
        ctx.rotate(this.rot);

        // Pixel Art Granat Dymny (referencja w załączniku)
        // Korpus (niebieskoszary cylinder 8x14)
        ctx.fillStyle = '#4f6988';
        ctx.fillRect(-4, -7, 8, 14);
        ctx.fillStyle = '#6784a6';
        ctx.fillRect(-2, -7, 3, 14);

        // Pomarańczowo-żółte pasy
        ctx.fillStyle = '#e86a17';
        ctx.fillRect(-4, -4, 8, 2);
        ctx.fillRect(-4, 3, 8, 2);
        ctx.fillStyle = '#f5a623';
        ctx.fillRect(-2, -4, 3, 2);
        ctx.fillRect(-2, 3, 3, 2);

        // Głowica i zielona łyżka
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-3, -10, 6, 3);
        ctx.fillStyle = '#8ab543';
        ctx.fillRect(1, -11, 4, 8);
        ctx.fillStyle = '#557823';
        ctx.fillRect(3, -10, 2, 6);
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-4, -9, 2, 2);

        ctx.restore();
    }
}

export class SmokeScreenCloud {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 95; // promień dymu
        this.life = 8.0;
        this.maxLife = 8.0;
        this.smokeBlobs = [];
        const grayShades = [
            'rgba(245, 245, 245, 0.75)',
            'rgba(225, 225, 225, 0.8)',
            'rgba(205, 205, 205, 0.85)',
            'rgba(185, 185, 185, 0.88)',
            'rgba(165, 165, 165, 0.9)',
            'rgba(145, 145, 145, 0.92)',
            'rgba(125, 125, 125, 0.92)',
            'rgba(105, 105, 105, 0.94)',
            'rgba(85, 85, 85, 0.95)',
            'rgba(65, 65, 65, 0.95)'
        ];
        for (let i = 0; i < 450; i++) {
            let ang = Math.random() * Math.PI * 2;
            let d = Math.random() * 88;
            this.smokeBlobs.push({
                x: Math.cos(ang) * d,
                y: Math.sin(ang) * d * 0.75,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 10,
                size: 2 + Math.floor(Math.random() * 3), // 2, 3 lub 4 px (drobne retro piksele)
                color: grayShades[Math.floor(Math.random() * grayShades.length)]
            });
        }
    }

    update(dt) {
        this.life -= dt;
        this.smokeBlobs.forEach(b => {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (Math.hypot(b.x, b.y) > this.radius - b.size) {
                b.vx *= -1;
                b.vy *= -1;
            }
        });
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        let ratio = this.life / this.maxLife;
        let alpha = ratio > 0.2 ? Math.min(1, (1 - ratio) * 4.5) : ratio * 5;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        this.smokeBlobs.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(Math.floor(b.x/2)*2, Math.floor(b.y/2)*2, b.size * 2.5, b.size * 2.5);
        });

        ctx.restore();
    }
}

export function triggerSmokeGrenadeThrow(commander) {
    if (!commander) return;
    if (!state.smokeGrenades) state.smokeGrenades = [];
    
    let aimAng = commander.facingLeft ? Math.PI : 0;
    if (state.aimPoint && Math.hypot(state.aimPoint.x - commander.x, state.aimPoint.y - commander.y) < 2000) {
        aimAng = Math.atan2(state.aimPoint.y - commander.y, state.aimPoint.x - commander.x);
    }
    
    let dist1 = 110;
    let dist2 = 145;
    state.smokeGrenades.push(new SmokeGrenade(
        commander.x, commander.y,
        commander.x + Math.cos(aimAng - 0.28) * dist1,
        commander.y + Math.sin(aimAng - 0.28) * dist1
    ));
    state.smokeGrenades.push(new SmokeGrenade(
        commander.x, commander.y,
        commander.x + Math.cos(aimAng + 0.28) * dist2,
        commander.y + Math.sin(aimAng + 0.28) * dist2
    ));
}
