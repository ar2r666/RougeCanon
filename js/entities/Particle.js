import { state } from '../config.js';

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

            // 1. Dwa wykrzykniki !! nad głową
            let floatY = Math.floor((this.y - 24 - p * 16) / 2) * 2;
            ctx.fillStyle = '#ffff00';
            // Lewy !
            ctx.fillRect(this.x - 8, floatY, 4, 10);
            ctx.fillRect(this.x - 8, floatY + 12, 4, 4);
            // Prawy !
            ctx.fillRect(this.x + 4, floatY, 4, 10);
            ctx.fillRect(this.x + 4, floatY + 12, 4, 4);

            // 2. Fale akustyczne ))) (((
            let waveR = 16 + p * 60;
            ctx.fillStyle = '#f39c12';
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

                        ctx.fillStyle = '#7cfc00'; // soczysta zieleń morale
                        ctx.fillRect(sx - 2, sy - 6, 4, 12);
                        ctx.fillRect(sx - 6, sy - 2, 12, 4);

                        ctx.fillStyle = '#2b6611'; // kontur/cień
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
