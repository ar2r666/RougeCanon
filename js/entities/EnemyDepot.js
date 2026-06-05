import { state, stats } from '../config.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';
import { PrisonerCage } from './PrisonerCage.js';

export class EnemyDepot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 80;
        this.maxHp = 80;
        this.isDestroyed = false;
        this.radius = 32; // Duża barykada fizyczna
        this.life = 1.0; // Czas zgliszcz po wybuchu
        this.spawnedComeback = false;
    }

    update(dt) {
        if (this.isDestroyed) {
            this.life -= dt;
            
            // Comeback Mechanic: Jeśli po zniszczeniu magazynu skład jest niepełny, spawnujemy klatkę z rezerwistą na zgliszczach!
            if (!this.spawnedComeback && state.squad.length < 4) {
                this.spawnedComeback = true;
                // Klatka pojawia się bezpośrednio na gruzach magazynu
                state.prisonerCages.push(new PrisonerCage(this.x, this.y + 10));
                playSound('sfx_shoot_plasma', 0.08);
                console.warn("Comeback Mechanic aktywowane: zrzut klatki rezerwisty na zgliszczach Magazynu!");
            }
            return;
        }
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        
        this.hp -= amount;
        playSound('sfx_shoot_default', 0.04);
        createParticles(this.x, this.y, '#4e5452', 3, 25); // Szary pył betonowy
        createParticles(this.x, this.y, '#7b7b7b', 2, 30); // Iskry stalowych wrót
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDestroyed = true;
            
            // Spektakularny, potężny wybuch Magazynu w retro skali
            playSound('sfx_explosion_default', 0.3);
            createParticles(this.x, this.y, '#ff5500', 30, 60); // Wielki płomień
            createParticles(this.x, this.y, '#333333', 20, 50); // Kłęby dymu
            createParticles(this.x, this.y, '#4e5452', 25, 45); // Betonowy gruz
            
            // Przyznanie Level Up dla wybranego weterana (obsłużone w pętli głównej / UI)
            state.pendingLevelUp = true;
        }
    }

    draw(ctx) {
        if (this.isDestroyed && this.life <= 0) return;
        
        // 1. Masywny cień u podstawy (rzut 3/4, elipsa spłaszczona o 0.55)
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 38, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        const step = 2; // Matryca 2x2 px
        
        if (!this.isDestroyed) {
            // 2. Rysowanie bunkra / ufortyfikowanego magazynu w rzucie 3/4
            ctx.save();
            let bx = Math.floor((this.x - 32) / step) * step;
            let by = Math.floor((this.y - 24) / step) * step;
            
            // Szary korpus żelbetowy
            ctx.fillStyle = '#5a615e';
            ctx.fillRect(bx, by, 64, 40);
            
            // Górny gzyms pancerza
            ctx.fillStyle = '#424745';
            ctx.fillRect(bx - 4, by - 4, 72, 6);
            
            // Masywne stalowe wrota wejściowe na środku
            ctx.fillStyle = '#2d302f';
            ctx.fillRect(bx + 18, by + 12, 28, 28);
            
            // Nity na wrotach (szare punkty 2x2 px)
            ctx.fillStyle = '#757e7a';
            ctx.fillRect(bx + 22, by + 16, 2, 2);
            ctx.fillRect(bx + 40, by + 16, 2, 2);
            ctx.fillRect(bx + 22, by + 32, 2, 2);
            ctx.fillRect(bx + 40, by + 32, 2, 2);
            
            // Worki z piaskiem przed wejściem (pikselowe elipsy beżowe)
            ctx.fillStyle = '#a18d72';
            ctx.fillRect(bx + 6, by + 32, 10, 8);
            ctx.fillRect(bx + 48, by + 32, 10, 8);
            
            ctx.fillStyle = '#7d6d57'; // Cienie worków
            ctx.fillRect(bx + 6, by + 38, 10, 2);
            ctx.fillRect(bx + 48, by + 38, 10, 2);
            
            // Pasek zdrowia Magazynu (widoczny tylko przy uszkodzeniu)
            if (this.hp < this.maxHp) {
                let barW = 40;
                let barH = 3;
                let barX = this.x - barW / 2;
                let barY = this.y - 32;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY, barW, barH);
                
                let hpProg = this.hp / this.maxHp;
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(barX, barY, Math.floor(barW * hpProg), barH);
            }
            ctx.restore();
        } else {
            // Rozrzucone, dymiące zgliszcza betonu i blachy
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = '#2d302f';
            let bx = Math.floor((this.x - 32) / step) * step;
            let by = Math.floor((this.y + 8) / step) * step;
            ctx.fillRect(bx, by, 18, 4);
            ctx.fillRect(bx + 40, by + 2, 20, 4);
            ctx.fillStyle = '#424745';
            ctx.fillRect(bx + 22, by - 2, 14, 4);
            ctx.restore();
        }
    }
}
