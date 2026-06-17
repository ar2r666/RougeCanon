import { state } from '../config.js';

const bushImg1 = new Image();
bushImg1.src = 'img/Bush_1.png';

const bushImg2 = new Image();
bushImg2.src = 'img/Bush_2.png';

const bushImg3 = new Image();
bushImg3.src = 'img/Bush_3.png';

export class Bush {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = Math.floor(Math.random() * 3) + 1; // Losowanie 1, 2 lub 3
        this.size = 32;
        this.radius = 14;
        this.flipX = Math.random() < 0.5 ? 1 : -1;
        this.swayPhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        let now = Date.now() / 1000;
        this.swayAngle = Math.sin(now * 1.5 + this.swayPhase) * 0.025;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.swayAngle) ctx.rotate(this.swayAngle);
        ctx.scale(this.flipX, 1);
        ctx.imageSmoothingEnabled = false;

        // Cień u podstawy krzewu
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(-10, 10, 20, 4);

        let img = this.type === 1 ? bushImg1 : (this.type === 2 ? bushImg2 : bushImg3);
        if (img && img.complete && img.width > 0) {
            let ratio = img.height / img.width;
            let dw = this.size;
            let dh = this.size * ratio;
            ctx.drawImage(img, -dw / 2, -dh * 0.55, dw, dh);
        } else {
            ctx.fillStyle = '#2d6a4f';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wyraźne, duże kreskówkowe oczy ukrytych bohaterów rysowane na koronie krzaka!
        if (state && state.activeHidingBush === this && state.squadHiddenTimer > 0) {
            let t = Date.now() / 150;
            let isOpen = Math.sin(t) > -0.7; // Oczy otwarte przez większość czasu
            let leader = state.squad && state.squad[0];
            let aim = leader ? leader.aimAngle : 0;
            
            ctx.fillStyle = '#ffffff';
            if (isOpen) {
                // Duże białe oczy 6x6 pikseli
                ctx.fillRect(-8, -9, 6, 6);
                ctx.fillRect(2, -9, 6, 6);
                
                // Ruchome czarne źrenice 2x4 piksele wodzące za celownikiem!
                let aimX = Math.round(Math.cos(aim) * 1.8);
                let aimY = Math.round(Math.sin(aim) * 1.0);
                ctx.fillStyle = '#000000';
                ctx.fillRect(-6 + aimX, -8 + aimY, 2, 4);
                ctx.fillRect(4 + aimX, -8 + aimY, 2, 4);
            } else {
                // Efekt mrugnięcia (zamknięte powieki)
                ctx.fillRect(-8, -6, 6, 2);
                ctx.fillRect(2, -6, 6, 2);
            }
        }

        ctx.restore();

        // Renderowanie interaktywnego podglądu kamuflażu obok krzewu
        if (state && state.camoMasterLevel && state.camoMasterLevel > 0 && state.squad && state.squad.length > 0) {
            let leader = state.squad[0];
            let dist = Math.hypot(this.x - leader.x, this.y - leader.y);
            let isNear = dist < this.radius + 14;

            if (state.activeHidingBush === this && state.squadHiddenTimer > 0) {
                // Pasek progresu ukrywania nad krzakiem wg życzenia
                let barW = 24;
                let barH = 3;
                let bx = this.x - barW / 2;
                let by = this.y - 24;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

                let prog = Math.max(0, Math.min(1, 1.0 - (state.squadHiddenTimer / 2.0)));
                ctx.fillStyle = '#00ffff'; // Neonowy cyan
                ctx.fillRect(bx, by, Math.floor(barW * prog), barH);
            } else if (isNear && (!state.squadBushCooldown || state.squadBushCooldown <= 0) && (!state.squadHiddenTimer || state.squadHiddenTimer <= 0)) {
                // Podpowiedź tekstowa nad krzakiem wg życzenia
                ctx.fillStyle = '#ffffff';
                ctx.font = '6px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText("UKRYJ SIĘ", this.x, this.y - 22);
            }
        }
    }
}
