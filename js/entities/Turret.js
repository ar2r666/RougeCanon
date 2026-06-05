import { state, stats, WEAPONS } from '../config.js';
import { Bullet } from './Bullet.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';

export class Turret {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner; // inżynier
        this.hp = 15; // solidne życie
        this.maxHp = 15;
        this.isDestroyed = false;
        this.isTurret = true;
        this.radius = 12;
        
        // --- MECHANIKA BURSTU (SERII) DLA CKM ---
        this.fireTimer = 0;
        this.fireInterval = 1.4; // Cooldown między seriami (1.4s)
        this.isBursting = false;
        this.burstTimer = 0;
        this.burstInterval = 0.07; // Odstęp między pociskami w serii (70ms)
        this.bulletsFiredInBurst = 0;
        this.burstSize = 6; // Ilość naboi w jednej serii
        
        this.aimAngle = 0;
        this.life = 1.0; // animacja rozpadu po zniszczeniu
    }

    update(dt) {
        if (this.isDestroyed) {
            this.life -= dt;
            if (this.life <= 0) {
                // Gdy wieżyczka zostanie całkowicie zniszczona, informujemy właściciela (Inżyniera)
                if (this.owner) {
                    this.owner.activeTurret = null;
                }
            }
            return;
        }

        // Znajdź najbliższego wroga w zasięgu 180px
        let closestEnemy = null;
        let minDist = 180;
        for (let e of state.enemies) {
            if (e.hp > 0) {
                let dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closestEnemy = e;
                }
            }
        }

        if (closestEnemy) {
            // Obróć wieżyczkę w stronę wroga
            let targetAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
            // Płynny obrót lufy
            let angleDiff = targetAngle - this.aimAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.aimAngle += angleDiff * 0.15;

            // Obsługa serii (Burst)
            if (this.isBursting) {
                this.burstTimer += dt;
                if (this.burstTimer >= this.burstInterval) {
                    this.burstTimer = 0;
                    this.shoot(closestEnemy);
                    this.bulletsFiredInBurst++;
                    if (this.bulletsFiredInBurst >= this.burstSize) {
                        this.isBursting = false;
                        this.fireTimer = 0; // Rozpocznij odliczanie cooldownu serii
                    }
                }
            } else {
                this.fireTimer += dt;
                if (this.fireTimer >= this.fireInterval) {
                    this.isBursting = true;
                    this.burstTimer = 0;
                    this.bulletsFiredInBurst = 0;
                    playSound('sfx_shoot_turet', 0.08); // Cichszy dźwięk serii (0.08) odtwarzany raz na serię!
                }
            }
        } else {
            // Bez wrogów: powolny obrót dekoracyjny
            this.aimAngle += dt * 0.5;
            this.isBursting = false;
        }
    }

    shoot(target) {
        let dmg = 0.8 * stats.damage; // 80% obrażeń bazowych
        // Tworzymy pocisk wieżyczki
        let bAng = this.aimAngle + (Math.random() - 0.5) * 0.05;
        // Wystrzał lufy z przesunięciem
        let muzzleX = this.x + Math.cos(this.aimAngle) * 14;
        let muzzleY = this.y - 6 + Math.sin(this.aimAngle) * 14;

        state.bullets.push(new Bullet(this, muzzleX, muzzleY, bAng, false, dmg, { color: '#ffff00', name: 'Wieżyczka CKM' }));
        createParticles(muzzleX, muzzleY, '#ffaa00', 2, 25);
        
        // Dym z lufy
        createParticles(muzzleX, muzzleY, '#eeeeee', 1, 10);

        // --- CECHA INŻYNIERA: WYRZUCANIE MAŁYCH ŁUSEK ---
        let ejectAngle = this.aimAngle + Math.PI + (Math.random() - 0.5) * 0.5;
        let evx = Math.cos(ejectAngle) * (25 + Math.random() * 15);
        let evy = Math.sin(ejectAngle) * (20 + Math.random() * 15) - 45; // łuk w górę i w bok
        if (state.particles) {
            state.particles.push(new CasingParticle(this.x, this.y - 6, evx, evy));
        }
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        this.hp -= amount;
        playSound('sfx_hit', 0.15);
        createParticles(this.x, this.y, '#6b7378', 3, 20); // Szare metalowe iskry

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDestroyed = true;
            playSound('sfx_explosion_default', 0.35);
            createParticles(this.x, this.y, '#ff5500', 15, 50); // Wybuch ognia
        }
    }

    draw(ctx) {
        if (this.isDestroyed && this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Cień na ziemi
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-10, 8, 20, 3);

        if (!this.isDestroyed) {
            // 2. Podstawa trójnożna metalowa (ciemny szary)
            ctx.fillStyle = '#363b3d';
            // Lewa noga
            ctx.fillRect(-8, 0, 4, 8);
            // Prawa noga
            ctx.fillRect(4, 0, 4, 8);
            // Pionowy wspornik
            ctx.fillRect(-2, -4, 4, 10);

            // 3. Obrotowy CKM (Wzór ciężkiego karabinu z użebrowaniem na lufie)
            ctx.save();
            ctx.translate(0, -6);
            ctx.rotate(this.aimAngle);

            // Obudowa CKM (korpus metalowy)
            ctx.fillStyle = '#2b3033'; 
            ctx.fillRect(-8, -4, 11, 7);
            ctx.fillStyle = '#4f5559'; // Stalowa pokrywa zamka
            ctx.fillRect(-8, -4, 11, 1);
            ctx.fillStyle = '#5ea9e8'; // Błękitny wskaźnik statusu
            ctx.fillRect(-3, -2, 2, 2);

            // Lufa (gruba, czarna z żeberkami chłodzącymi)
            ctx.fillStyle = '#151515';
            ctx.fillRect(3, -2, 11, 3);
            
            // Żeberka chłodzenia (pionowe paski)
            ctx.fillStyle = '#363b3d';
            ctx.fillRect(5, -3, 1, 5);
            ctx.fillRect(8, -3, 1, 5);
            ctx.fillRect(11, -3, 1, 5);

            // Muszka na końcu lufy
            ctx.fillStyle = '#8a9396';
            ctx.fillRect(13, -4, 1, 2);
            
            ctx.restore();

            ctx.restore(); // Wyjście z translacji wieżyczki

            // 4. Pasek HP wieżyczki
            let blockW = 2;
            let blockH = 2;
            let gap = 1;
            let startX = this.x - (blockW * 8 + gap * 7) / 2;
            let hpY = this.y - 18;

            let segments = Math.ceil((this.hp / this.maxHp) * 8);
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = (i < segments) ? '#00ffff' : '#ff0000'; // Turkusowy / Czerwony
                ctx.fillRect(Math.floor(startX + i * (blockW + gap)), Math.floor(hpY), blockW, blockH);
            }
        } else {
            // Rozpadające się szczątki
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = '#363b3d';
            ctx.fillRect(-6, 4, 4, 2);
            ctx.fillRect(2, 6, 3, 2);
            ctx.restore();
            ctx.restore();
        }
    }
}

// Klasa małych łusek wyrzucanych przez CKM
class CasingParticle {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 0.6;
        this.maxLife = 0.6;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 280 * dt; // Grawitacja ciągnie łuskę na ziemię
        this.life -= dt;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.fillStyle = '#f7d84a'; // Mosiądz/złoto
        ctx.fillRect(this.x, this.y, 2, 1);
    }
}
