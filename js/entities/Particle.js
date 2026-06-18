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
    constructor(x, y, color = '#f39c12', maxRadius = 220, duration = 0.8) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.maxRadius = maxRadius;
        this.duration = duration;
        this.life = duration;
        this.radius = 12;
    }
    
    update(dt) {
        this.life -= dt;
        let progress = 1 - (this.life / this.duration);
        let ease = 1 - Math.pow(1 - progress, 2);
        this.radius = 12 + ease * (this.maxRadius - 12);
    }
    
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        let progress = 1 - (this.life / this.duration);
        let alpha = Math.max(0, 1 - progress);
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        // Generowanie klasycznego retro Pixel Art Ring (siatka skokowa 4x4px)
        let r = this.radius;
        let steps = Math.floor(Math.PI * 2 * r / 10);
        steps = Math.max(20, Math.min(56, steps));
        
        for (let i = 0; i < steps; i++) {
            let angle = (i / steps) * Math.PI * 2;
            let px = this.x + Math.cos(angle) * r;
            let py = this.y + Math.sin(angle) * r * 0.85; // perspektywa 2D top-down
            
            px = Math.floor(px / 4) * 4;
            py = Math.floor(py / 4) * 4;
            
            ctx.fillRect(px, py, 4, 4);
        }
        
        ctx.restore();
    }
}

export function createAuraRing(x, y, color) {
    if (!state.auras) state.auras = [];
    state.auras.push(new AuraRing(x, y, color));
}
