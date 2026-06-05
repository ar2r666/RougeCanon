import { state } from '../config.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';
import { customHelmetImages, customUniformImages } from '../sprites.js';

export class Decoy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 8;     // Zgodnie z życzeniem: 8 punktów życia (kresek)
        this.maxHp = 8;
        this.isDestroyed = false;
        this.radius = 14;
        this.life = 1.0; // Czas rozsypywania słomy po zniszczeniu
    }

    update(dt) {
        if (this.isDestroyed) {
            this.life -= dt;
        }
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        
        this.hp -= amount;
        playSound('sfx_shoot_default', 0.02);
        createParticles(this.x, this.y, '#a18d72', 2, 15); // Drzazgi słomy/beżowe
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDestroyed = true;
            playSound('sfx_explosion_default', 0.15);
            createParticles(this.x, this.y, '#a18d72', 15, 30); // Burza słomy
        }
    }

    draw(ctx) {
        if (this.isDestroyed && this.life <= 0) return;
        
        // Pikselowy, mały cień podłoża wyrównany do siatki 2x2 px
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        let sx = Math.floor(this.x / 2) * 2;
        let sy = Math.floor((this.y + 10) / 2) * 2;
        ctx.fillRect(sx - 8, sy, 16, 2);
        ctx.fillRect(sx - 6, sy - 2, 12, 2);
        ctx.fillRect(sx - 6, sy + 2, 12, 2);
        ctx.fillRect(sx - 2, sy - 4, 4, 2);
        ctx.fillRect(sx - 2, sy + 4, 4, 2);
        ctx.restore();
        
        if (!this.isDestroyed) {
            ctx.save();
            
            // Przesunięcie układu do środka decoya (x, y)
            ctx.translate(this.x, this.y);
            
            // 1. Drewniany krzyż (palik)
            ctx.fillStyle = '#5c3a21'; // Ciemny brąz drewna
            ctx.fillRect(-2, -6, 4, 22); // Pionowy słup
            ctx.fillRect(-14, -2, 28, 3); // Poprzeczka na rękawy
            
            // 2. Rysowanie munduru (uniform_5 lub domyślny podarty zielony mundur)
            let drawnUniform = false;
            if (customUniformImages[4] && customUniformImages[4].complete) {
                // Rysujemy stojący mundur 5 z PNG z przesunięciem do środka
                ctx.drawImage(customUniformImages[4], 0, 0, 256, customUniformImages[4].height, -16, -16, 32, 32);
                drawnUniform = true;
            }
            
            if (!drawnUniform) {
                ctx.fillStyle = '#2b6611'; // Leśna zieleń munduru
                ctx.fillRect(-8, -4, 16, 12);
                ctx.fillStyle = '#5c3a21'; // Łaty na łokciach/brzuchu
                ctx.fillRect(-6, 2, 4, 4);
                ctx.fillRect(3, -1, 3, 3);
            }
            
            // 3. Głowa ze słomy (strach na wróble)
            ctx.fillStyle = '#a18d72'; // Płowa słoma
            ctx.fillRect(-4, -12, 8, 8);
            
            // Guzikowe oczy i zszywane usta stracha
            ctx.fillStyle = '#151515';
            ctx.fillRect(-2, -10, 1, 2);
            ctx.fillRect(1, -10, 1, 2);
            ctx.fillStyle = '#ff3300'; // Czerwona nitka ust
            ctx.fillRect(-2, -6, 4, 1);
            
            // 4. Rysowanie czapki (hat_9.png z lekkim przekrzywieniem o 0.15 rad!)
            ctx.save();
            ctx.translate(0, -11); // Przejście do czubka głowy
            ctx.rotate(0.15);      // Lekkie stylowe przekrzywienie kapelusza
            
            let drawnHat = false;
            if (customHelmetImages[9] && customHelmetImages[9].complete) {
                ctx.drawImage(customHelmetImages[9], 0, 0, 256, customHelmetImages[9].height, -16, -5, 32, 32);
                drawnHat = true;
            }
            
            if (!drawnHat) {
                // Stylowy kapelusz słomkowy jako fallback
                ctx.fillStyle = '#ad911f'; // Brudne złoto
                ctx.fillRect(-10, -2, 20, 2); // Rondo
                ctx.fillRect(-5, -6, 10, 4); // Główka
                ctx.fillStyle = '#63130a'; // Ozdobna czerwona opaska
                ctx.fillRect(-5, -3, 10, 1);
            }
            ctx.restore();
            
            ctx.restore();
            
            // 8-segmentowy pasek HP (matryca 2x2 piksele) w stylu retro nad decoyem
            let blockW = 3;
            let blockH = 2;
            let gap = 1;
            let startX = this.x - (blockW * 8 + gap * 7) / 2;
            let hpY = this.y - 22;
            
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = (i < this.hp) ? '#39ff14' : '#ff0000'; // Neonowy zielony / czerwony
                ctx.fillRect(Math.floor(startX + i * (blockW + gap)), Math.floor(hpY), blockW, blockH);
            }
        } else {
            // Połamana konstrukcja i rozrzucona słoma po zniszczeniu
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = '#a18d72';
            ctx.fillRect(this.x - 12, this.y + 6, 8, 2);
            ctx.fillRect(this.x + 4, this.y + 8, 6, 2);
            ctx.fillStyle = '#5c3a21'; // Połamany kij
            ctx.fillRect(this.x - 1, this.y + 2, 3, 6);
            ctx.restore();
        }
    }
}
