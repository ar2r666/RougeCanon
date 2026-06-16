import { state } from '../config.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';

export class CyberZombie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 100; // Wolniejszy, bardziej wytrzymały od psa
        this.hp = 20;     // Przyzwoity friendly tank
        this.maxHp = 20;
        this.radius = 12;
        this.targetEnemy = null;
        this.lastClaw = 0;
        
        // Animacja
        this.walkCycle = Math.random() * Math.PI * 2;
        this.facingLeft = false;
        this.bobY = 0;
    }

    update(dt) {
        if (this.hp <= 0) return;
        
        if (this.lastClaw > 0) this.lastClaw -= dt;

        // --- WZAJEMNE ODPYCHANIE (Flocking Separation) ---
        if (state.companions) {
            for (let other of state.companions) {
                if (other !== this) {
                    let d = Math.hypot(other.x - this.x, other.y - this.y);
                    if (d < 24 && d > 0) {
                        let push = (24 - d) * 4;
                        let pushAng = Math.atan2(this.y - other.y, this.x - other.x);
                        this.x += Math.cos(pushAng) * push * dt;
                        this.y += Math.sin(pushAng) * push * dt;
                    }
                }
            }
        }

        // Wyszukiwanie najbliższego wroga w promieniu 400px
        let bestEnemy = null;
        let minDist = 400;
        for (let i = 0; i < state.enemies.length; i++) {
            let e = state.enemies[i];
            if (e.hp > 0) {
                let d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minDist) {
                    minDist = d;
                    bestEnemy = e;
                }
            }
        }

        if (bestEnemy) {
            this.targetEnemy = bestEnemy;
            let ang = Math.atan2(bestEnemy.y - this.y, bestEnemy.x - this.x);
            this.facingLeft = Math.cos(ang) < 0;
            
            this.x += Math.cos(ang) * this.speed * dt;
            this.y += Math.sin(ang) * this.speed * dt;
            
            this.walkCycle += dt * 12;
            this.bobY = Math.abs(Math.sin(this.walkCycle)) * 2;

            // Atak szponami
            if (minDist < this.radius + bestEnemy.radius + 4 && this.lastClaw <= 0) {
                bestEnemy.takeDamage(4, { kills: 0 });
                createParticles(bestEnemy.x, bestEnemy.y, '#2ecc71', 8, 45); // Toksyczna zieleń
                playSound('sfx_click', 0.5);
                this.lastClaw = 0.6;
            }
        } else {
            // W przypadku braku wrogów, powoli spaceruje w stronę lidera oddziału
            let leader = state.squad[0];
            if (leader) {
                let d = Math.hypot(leader.x - this.x, leader.y - this.y);
                if (d > 40) {
                    let ang = Math.atan2(leader.y - this.y, leader.x - this.x);
                    this.facingLeft = Math.cos(ang) < 0;
                    this.x += Math.cos(ang) * (this.speed * 0.6) * dt;
                    this.y += Math.sin(ang) * (this.speed * 0.6) * dt;
                    this.walkCycle += dt * 8;
                    this.bobY = Math.abs(Math.sin(this.walkCycle)) * 1.5;
                } else {
                    this.bobY = 0;
                }
            }
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;
        
        ctx.save();
        // Cień
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - 6, this.y + 10, 12, 2);
        
        ctx.translate(this.x, this.y - this.bobY);
        if (this.facingLeft) {
            ctx.scale(-1, 1);
        }
        
        // --- PROJEKT GRAFICZNY CYBER-ZOMBIE (Pixel Art Rysowany na Żywo) ---
        // Ciało (podarte fioletowe szaty)
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(-6, -6, 12, 14);
        
        // Zgniłozielona głowa
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(-5, -16, 10, 10);
        
        // Cyber-Lśniące czerwone oko (Terminator vibe)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(1, -13, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, -12, 1, 1);

        // Wyciągnięte do przodu zielone ręce zombie
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(6, -4, 6, 4);

        // Pasek HP nad głową Cyber-Zombie
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(-10, -22, 20, 3);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(-10, -22, Math.max(0, (this.hp / this.maxHp) * 20), 3);
        }
        
        ctx.restore();
    }
}
