import { stats, state, WEAPONS } from '../config.js';
import { createParticles } from './Particle.js';
import { Explosion } from './Explosion.js';

export class Bullet {
    constructor(shooter, x, y, angle, isEnemy, damage, weapon) {
        this.shooter = shooter;
        this.x = x;
        this.y = y;
        // Przyspieszenie pocisków wybuchowych dla potężniejszej dynamiki uderzenia
        let speedMult = (weapon && weapon.type === 'explosive') ? 1.3 : 1.0;
        this.vx = Math.cos(angle) * stats.bulletSpeed * speedMult;
        this.vy = Math.sin(angle) * stats.bulletSpeed * speedMult;
        this.isEnemy = isEnemy;
        this.damage = damage;
        this.weapon = weapon || WEAPONS.DEFAULT;
        this.life = (weapon && weapon.type === 'explosive') ? 1.5 : 1.0; // Zredukowany, optymalny zasięg lotu rakiety
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        
        if (this.weapon.type === 'explosive') {
            let angle = Math.atan2(this.vy, this.vx);
            let tailX = this.x - Math.cos(angle) * 6;
            let tailY = this.y - Math.sin(angle) * 6;
            
            // Generowanie autentycznego, delikatnego dymku w pixelarcie (zróżnicowane szarości)
            if (Math.random() < 0.6) {
                let pColor = Math.random() > 0.5 ? '#cccccc' : (Math.random() > 0.5 ? '#888888' : '#444444');
                createParticles(tailX, tailY, pColor, 1, 15);
            }
            // Subtelna iskra dopalacza
            if (Math.random() < 0.3) {
                createParticles(tailX, tailY, '#ffaa00', 1, 8);
            }
        }

        // Collision
        let targets = this.isEnemy ? state.squad : [...state.enemies, ...(state.crates || [])];
        for (let i = targets.length - 1; i >= 0; i--) {
            let t = targets[i];
            if (t.life <= 0) continue;
            if (Math.hypot(t.x - this.x, t.y - this.y) < t.radius + 2) {
                if (this.weapon.type === 'explosive') {
                    // Zgodnie z wytycznymi: zmniejszenie promienia wybuchu o 50% (do 60px)
                    state.explosions.push(new Explosion(this.x, this.y, 60, this.damage, this.shooter));
                } else {
                    t.takeDamage(this.damage, this.shooter);
                }
                this.life = 0; // Destroy bullet
                break;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.weapon.type === 'explosive') {
            let angle = Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            
            // Zgodnie z instrukcją: rakieta jest bardziej podłużna w doskonałym stylu pixel art
            ctx.imageSmoothingEnabled = false;
            
            // Ciemne lotki stabilizujące
            ctx.fillStyle = '#222222';
            ctx.fillRect(-6, -3, 2, 6);
            
            // Wydłużony, stalowy korpus
            ctx.fillStyle = '#dddddd';
            ctx.fillRect(-4, -1.5, 8, 3);
            
            // Gorąca, czerwona głowica bojowa
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(4, -1.5, 3, 3);
            // Połysk na czubku
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(5, -0.5, 1, 1);
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.weapon.color;
            ctx.fillStyle = this.weapon.color;
            ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        }
        ctx.restore();
    }
}
