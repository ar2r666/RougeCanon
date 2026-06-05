import { state } from '../config.js';
import { Explosion } from './Explosion.js';
import { playSound } from '../sfx.js';

export class AirstrikeBomb {
    constructor(targetX, targetY) {
        this.x = targetX;
        this.y = targetY;
        this.z = 380 + Math.random() * 120; 
        this.vz = -450 - Math.random() * 150; 
        this.isDead = false;
        
        playSound('sfx_shoot_fire', 0.05);
    }

    update(dt) {
        if (this.isDead) return;
        
        this.z += this.vz * dt;
        if (this.z <= 0) {
            this.z = 0;
            this.isDead = true;
            
            state.explosions.push(new Explosion(this.x, this.y, 70 + Math.random() * 25, 25, { weapon: { type: 'airstrike' }, kills: 0 }, true));
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        
        ctx.save();
        let progress = Math.max(0.15, 1 - (this.z / 500));
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * progress})`;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 18 * progress, 9 * progress, 0, 0, Math.PI * 2);
        ctx.fill();
        
        let drawY = this.y - this.z;
        ctx.translate(this.x, drawY);
        
        ctx.fillStyle = '#2b6611';
        ctx.fillRect(-4, -12, 8, 20);
        ctx.fillStyle = '#111810';
        ctx.fillRect(-2, -12, 4, 20);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-4, 2, 8, 3);
        
        ctx.fillStyle = '#363b3d';
        ctx.fillRect(-3, 8, 6, 4);
        ctx.fillRect(-1, 12, 2, 3);
        
        ctx.fillStyle = '#111810';
        ctx.fillRect(-8, -16, 16, 4);
        ctx.fillRect(-6, -12, 12, 2);
        
        ctx.restore();
    }
}
