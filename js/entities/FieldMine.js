import { state } from '../config.js';
import { Explosion } from './Explosion.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';

export class FieldMine {
    constructor(x, y, placer, isBoobyTrapFlag = false) {
        this.x = x;
        this.y = y;
        this.placer = placer;
        this.isBoobyTrapFlag = isBoobyTrapFlag;
        this.radius = 12;
        this.triggerDist = 24;
        this.isTriggered = false;
        this.life = 40; // Znika po 40 sekundach
        
        // Dioda / Tykanie
        this.ledTimer = 0;
        this.ledBlinkRate = 0.5;
        this.armingTimer = 1.0; // 1 sekunda uzbrajania
    }

    update(dt) {
        if (this.isTriggered) return;
        
        this.life -= dt;
        if (this.life <= 0) {
            this.trigger();
            return;
        }

        if (this.armingTimer > 0) {
            this.armingTimer -= dt;
            return;
        }

        this.ledTimer += dt;
        if (this.ledTimer > this.ledBlinkRate) {
            this.ledTimer = 0;
            playSound('sfx_click', 0.15); // Ciche tykanie
        }

        // Sprawdzanie zbliżenia wrogów
        for (let i = 0; i < state.enemies.length; i++) {
            let e = state.enemies[i];
            if (e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) < this.triggerDist + e.radius) {
                this.trigger();
                break;
            }
        }
    }

    trigger() {
        if (this.isTriggered) return;
        this.isTriggered = true;
        
        if (state.explosions) {
            state.explosions.push(new Explosion(this.x, this.y, 120, 25, this.placer, false, true));
        }
        createParticles(this.x, this.y, '#ff3300', 15, 60);
    }

    draw(ctx) {
        if (this.isTriggered) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.imageSmoothingEnabled = false;

        // Cień pod miną / chorągiewką
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-8, 2, 16, 4);

        if (this.isBoobyTrapFlag) {
            // Mała chorągiewka w zwłokach w stylu Pixel Art (BOOBY TRAP)
            ctx.fillStyle = '#5c3a21'; // Drewniany palik
            ctx.fillRect(-1, -16, 2, 18);
            ctx.fillStyle = '#ff0000'; // Czerwona trójkątna flaga taktyczna
            ctx.beginPath();
            ctx.moveTo(-1, -16);
            ctx.lineTo(9, -11);
            ctx.lineTo(-1, -6);
            ctx.fill();
            // Złoty emblemat (czaszka ostrzegawcza) na fladze
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(1, -12, 2, 2);
        } else {
            // Stalowy talerz miny w stylu Pixel Art (MINER POLOWY)
            ctx.fillStyle = '#4f5d65';
            ctx.fillRect(-7, -3, 14, 6);
            ctx.fillStyle = '#9aa7af';
            ctx.fillRect(-5, -4, 10, 2);

            // Pulsująca dioda LED na środku miny
            let isLedOn = this.armingTimer <= 0 && (this.ledTimer < 0.15);
            ctx.fillStyle = isLedOn ? '#ff0000' : '#330000';
            ctx.fillRect(-1.5, -6, 3, 2);

            if (isLedOn) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-0.5, -5.5, 1, 1);
            }
        }

        ctx.restore();
    }
}
