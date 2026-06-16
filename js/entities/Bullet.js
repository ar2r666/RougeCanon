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
        this.bouncesLeft = (state.passiveRicochetActive && !isEnemy && (!weapon || weapon.type !== 'explosive')) ? 3 : 0;
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
        if (!this.isEnemy && t && t.isEnemy) {
            // 4. STRZAŁ W NOGI (50% na czołganie się wroga)
            if (state.passiveKneecapShotActive && Math.random() < 0.5) {
                t.isCrippled = true;
                createParticles(t.x, t.y + 4, '#8b0000', 6, 25);
            }
            // 8. POCISKI ZAPALAJĄCE (Podpalenie na 3 sekundy)
            if (state.passiveIncendiaryActive) {
                t.onFireTimer = 3.0;
            }
        }

        if (this.weapon.type === 'explosive') {
            state.explosions.push(new Explosion(this.x, this.y, 60, this.damage, this.shooter));
            this.life = 0; 
        } else if (this.weapon.type === 'spread' || this.isCrit) {
            // Specjalna zdolność strzelby lub strzału krytycznego Snajpera: kule przechodzą na wylot przez wrogów
            if (!this.hitTargets.has(t)) {
                this.hitTargets.add(t);
                t.takeDamage(this.damage, this.shooter, this.isCrit || false);
                
                if (this.isCrit) {
                     if (state.particles) {
                         state.particles.push(new CritIndicator(t.x, t.y - 12));
                     }
                      let bulletAngle = Math.atan2(this.vy, this.vx);
                      createDirectionalParticles(t.x, t.y, '#ff003c', 35, 180, bulletAngle, 0.65);
                      createParticles(t.x, t.y, '#ffffff', 8, 40);
                      playSound('sfx_shoot_head', 0.65);
                 } else {
                     createParticles(t.x, t.y, '#ffaa00', 2, 35);
                 }

                if (t.hp > 0 && typeof t.applyKnockback === 'function') {
                    let bAng = Math.atan2(this.vy, this.vx);
                    let force = this.isCrit ? 190 : 120;
                    t.applyKnockback(Math.cos(bAng) * force, Math.sin(bAng) * force);
                }
            }
        } else {
            t.takeDamage(this.damage, this.shooter, false);
            
            // Obsługa rykoszetu (Pinball Lufki)
            if (this.bouncesLeft > 0) {
                let nextTarget = null;
                let minDist = 500;
                for (let i = 0; i < state.enemies.length; i++) {
                    let e = state.enemies[i];
                    if (e.hp > 0 && e !== t && !this.hitTargets.has(e)) {
                        let d = Math.hypot(e.x - this.x, e.y - this.y);
                        if (d < minDist) {
                            minDist = d;
                            nextTarget = e;
                        }
                    }
                }

                if (nextTarget) {
                    this.hitTargets.add(t);
                    this.bouncesLeft--;
                    let newAng = Math.atan2(nextTarget.y - this.y, nextTarget.x - this.x);
                    let speed = Math.hypot(this.vx, this.vy);
                    this.vx = Math.cos(newAng) * speed;
                    this.vy = Math.sin(newAng) * speed;
                    this.life = 1.0; // Przedłużamy lot rykoszetu
                    createParticles(this.x, this.y, '#00ffff', 8, 50); // Cyjanowe iskry pinballa
                    playSound('sfx_click', 0.6);
                    return;
                }
            }

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
