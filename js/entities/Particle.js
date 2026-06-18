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

export class AuraRing {
    constructor(x, y, color = '#f39c12', maxRadius = 240, duration = 0.85) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.maxRadius = maxRadius;
        this.duration = duration;
        this.life = duration;
        this.radius = 15;
    }
    
    update(dt) {
        this.life -= dt;
        let progress = 1 - (this.life / this.duration);
        let ease = 1 - Math.pow(1 - progress, 3);
        this.radius = 15 + ease * (this.maxRadius - 15);
    }
    
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        let alpha = Math.max(0, (this.life / this.duration) * 0.85);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha * 0.22;
        ctx.fill();
        ctx.restore();
    }
}

export function createAuraRing(x, y, color) {
    if (!state.auras) state.auras = [];
    state.auras.push(new AuraRing(x, y, color));
}
