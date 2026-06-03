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
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        // Frustum culling for particles
        const halfW = window.innerWidth / 2 + 10;
        const halfH = window.innerHeight / 2 + 10;
        if (Math.abs(this.x - state.camera.x) > halfW || Math.abs(this.y - state.camera.y) > halfH) {
            return;
        }

        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
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
