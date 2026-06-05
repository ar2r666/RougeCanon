import { stats, state, WEAPONS } from '../config.js';
import { createParticles, createDirectionalParticles, CritIndicator } from './Particle.js';
import { Explosion } from './Explosion.js';
import { playSound } from '../sfx.js';

export class Bullet {
    constructor(shooter, x, y, angle, isEnemy, damage, weapon) {
        this.shooter = shooter;
        this.x = x;
        this.y = y;
        // Szybkie kule ze strzelby (1.8x) oraz rakiety (1.3x). Snajper strzela ekstremalnie szybko (3.6x).
        let speedMult = (weapon && weapon.type === 'explosive') ? 1.3 : ((weapon && weapon.type === 'spread') ? 1.8 : 1.0);
        if (shooter && shooter.soldierClass === 'SNIPER') {
            speedMult = 3.6;
        }
        this.vx = Math.cos(angle) * stats.bulletSpeed * speedMult;
        this.vy = Math.sin(angle) * stats.bulletSpeed * speedMult;
        this.isEnemy = isEnemy;
        this.damage = damage;
        this.weapon = weapon || WEAPONS.DEFAULT;
        this.life = (weapon && weapon.type === 'explosive') ? 1.5 : (shooter && shooter.soldierClass === 'SNIPER' ? 0.6 : 1.0); 
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
        } else if (this.weapon.type === 'spread' || this.isCrit) {
            // Specjalna zdolność strzelby lub strzału krytycznego Snajpera: kule przechodzą na wylot przez wrogów
            if (!this.hitTargets.has(t)) {
                this.hitTargets.add(t);
                t.takeDamage(this.damage, this.shooter, this.isCrit || false);
                
                if (this.isCrit) {
                     // Krytyk / Headshot: znacznik krytyczny + potężna struga krwi w kierunku lotu + błysk + dźwięk headshota
                     if (state.particles) {
                         state.particles.push(new CritIndicator(t.x, t.y - 12));
                     }
                      let bulletAngle = Math.atan2(this.vy, this.vx);
                      createDirectionalParticles(t.x, t.y, '#ff003c', 35, 180, bulletAngle, 0.65); // Szybsza i dłuższa kierunkowa struga krwi!
                      createParticles(t.x, t.y, '#ffffff', 8, 40);  // Biały błysk
                      playSound('sfx_shoot_head', 0.65); // Dźwięk headshota!
                 } else {
                     let splashColor = '#ffaa00';
                     createParticles(t.x, t.y, splashColor, 2, 35);
                 }

                // Zgodnie z wytycznymi: zbalansowany, realistyczny odrzut
                if (t.hp > 0 && typeof t.applyKnockback === 'function') {
                    let bAng = Math.atan2(this.vy, this.vx);
                    let force = this.isCrit ? 190 : 120; // Silniejszy odrzut krytyka
                    t.applyKnockback(Math.cos(bAng) * force, Math.sin(bAng) * force);
                }
            }
        } else {
            t.takeDamage(this.damage, this.shooter, false);
            this.life = 0; 
        }
    }

    draw(ctx) {
        // Frustum culling: check if bullet is visible
        const halfW = state.viewport.halfW + 20;
        const halfH = state.viewport.halfH + 20;
        if (Math.abs(this.x - state.camera.x) > halfW || Math.abs(this.y - state.camera.y) > halfH) {
            return;
        }

        ctx.save();
        if (this.weapon.type === 'explosive') {
            let angle = Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            
            ctx.imageSmoothingEnabled = false;
            
            ctx.fillStyle = '#222222';
            ctx.fillRect(-6, -3, 2, 6);
            
            ctx.fillStyle = '#dddddd';
            ctx.fillRect(-4, -1.5, 8, 3);
            
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(4, -1.5, 3, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(5, -0.5, 1, 1);
        } else if (this.isCrit) {
            // Strzał krytyczny: fioletowa poświata i biały powiększony rdzeń pocisku
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#d03be3';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.weapon.color;
            ctx.fillStyle = this.weapon.color;
            ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        }
        ctx.restore();
    }
}
