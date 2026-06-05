import { state } from '../config.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';

export class Medkit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.life = 15.0; // Znika po 15 sekundach
        this.isCollected = false;
        this.collectDelay = 0.15; // 0.15 sekundy opóźnienia zanim można podnieść apteczkę
    }

    update(dt) {
        this.life -= dt;
        if (this.isCollected || this.life <= 0) return;

        if (this.collectDelay > 0) {
            this.collectDelay -= dt;
            return;
        }

        // Kolizja z członkami oddziału (leczenie składu przy zebraniu)
        for (let s of state.squad) {
            if (s.hp > 0 && Math.hypot(s.x - this.x, s.y - this.y) < this.radius + s.radius) {
                this.isCollected = true;
                
                // Przywracamy 1 HP każdemu żyjącemu członkowi składu
                state.squad.forEach(member => {
                    if (member.hp > 0) {
                        member.hp = Math.min(member.maxHp, member.hp + 1);
                    }
                });

                playSound('sfx_click', 0.6); // Dźwięk podniesienia
                createParticles(this.x, this.y, '#39ff14', 15, 30); // Zielone cząsteczki zdrowia
                break;
            }
        }
    }

    draw(ctx) {
        if (this.isCollected || this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Migotanie (fading out) przed zniknięciem (poniżej 3 sekund)
        if (this.life < 3.0) {
            let blink = Math.floor(this.life * 10) % 2;
            if (blink === 0) {
                ctx.restore();
                return;
            }
        }

        // 1. Cień na podłożu
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(-6, 4, 12, 2);

        // 2. Apteczka (Biała skrzynka)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -4, 12, 8);

        // 3. Czerwony Krzyż
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(-1, -3, 2, 6);
        ctx.fillRect(-3, -1, 6, 2);

        ctx.restore();
    }
}
