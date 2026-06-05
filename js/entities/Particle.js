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
