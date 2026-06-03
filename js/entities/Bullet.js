import { stats, state, WEAPONS } from '../config.js';
import { createParticles } from './Particle.js';
import { Explosion } from './Explosion.js';

export class Bullet {
    constructor(shooter, x, y, angle, isEnemy, damage, weapon) {
        this.shooter = shooter;
        this.x = x;
        this.y = y;
        // Szybkie kule ze strzelby (1.8x) oraz rakiety (1.3x)
        let speedMult = (weapon && weapon.type === 'explosive') ? 1.3 : ((weapon && weapon.type === 'spread') ? 1.8 : 1.0);
        this.vx = Math.cos(angle) * stats.bulletSpeed * speedMult;
        this.vy = Math.sin(angle) * stats.bulletSpeed * speedMult;
        this.isEnemy = isEnemy;
        this.damage = damage;
        this.weapon = weapon || WEAPONS.DEFAULT;
        this.life = (weapon && weapon.type === 'explosive') ? 1.5 : 1.0; 
        this.hitTargets = new Set(); // Bufor celów przebitych na wylot
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
        if (this.isEnemy) {
            for (let i = state.squad.length - 1; i >= 0; i--) {
                let t = state.squad[i];
                if (t.hp <= 0) continue;
                if (Math.hypot(t.x - this.x, t.y - this.y) < t.radius + 2) {
                    this.handleCollision(t);
                    if (this.life <= 0) return;
                }
            }
        } else {
            // Check enemies
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                let t = state.enemies[i];
                if (t.hp <= 0) continue;
                if (Math.hypot(t.x - this.x, t.y - this.y) < t.radius + 2) {
                    this.handleCollision(t);
                    if (this.life <= 0) return;
                }
            }
            // Check crates
            if (state.crates) {
                for (let i = state.crates.length - 1; i >= 0; i--) {
                    let t = state.crates[i];
                    if (t.life <= 0 || t.isDestroyed) continue;
                    if (Math.hypot(t.x - this.x, t.y - this.y) < t.radius + 2) {
                        this.handleCollision(t);
                        if (this.life <= 0) return;
                    }
                }
            }
            // Check prisonerCages
            if (state.prisonerCages) {
                for (let i = state.prisonerCages.length - 1; i >= 0; i--) {
                    let t = state.prisonerCages[i];
                    if (t.life <= 0 || t.isDestroyed) continue;
                    if (Math.hypot(t.x - this.x, t.y - this.y) < t.radius + 2) {
                        this.handleCollision(t);
                        if (this.life <= 0) return;
                    }
                }
            }
            // Check enemyDepots
            if (state.enemyDepots) {
                for (let i = state.enemyDepots.length - 1; i >= 0; i--) {
                    let t = state.enemyDepots[i];
                    if (t.life <= 0 || t.isDestroyed) continue;
                    if (Math.hypot(t.x - this.x, t.y - this.y) < t.radius + 2) {
                        this.handleCollision(t);
                        if (this.life <= 0) return;
                    }
                }
            }
        }
    }

    handleCollision(t) {
        if (this.weapon.type === 'explosive') {
            state.explosions.push(new Explosion(this.x, this.y, 60, this.damage, this.shooter));
            this.life = 0; 
        } else if (this.weapon.type === 'spread') {
            // Specjalna zdolność strzelby: kule przechodzą na wylot przez wrogów (Penetration / Piercing)
            if (!this.hitTargets.has(t)) {
                this.hitTargets.add(t);
                t.takeDamage(this.damage, this.shooter);
                createParticles(t.x, t.y, '#ffaa00', 2, 35);
                
                // Zgodnie z wytycznymi: zbalansowany, realistyczny odrzut dla strzelby
                if (t.hp > 0 && typeof t.applyKnockback === 'function') {
                    let bAng = Math.atan2(this.vy, this.vx);
                    t.applyKnockback(Math.cos(bAng) * 120, Math.sin(bAng) * 120);
                }
            }
        } else {
            t.takeDamage(this.damage, this.shooter);
            this.life = 0; 
        }
    }

    draw(ctx) {
        // Frustum culling: check if bullet is visible
        const halfW = window.innerWidth / 2 + 20;
        const halfH = window.innerHeight / 2 + 20;
        if (Math.abs(this.x - state.camera.x) > halfW || Math.abs(this.y - state.camera.y) > halfH) {
            return;
        }

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
