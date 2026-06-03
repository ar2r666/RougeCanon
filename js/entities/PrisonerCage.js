import { state, stats, WEAPONS } from '../config.js';
import { Soldier } from './Soldier.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';

function getWoodColor(seed, x, y) {
    let val = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    let rand = val - Math.floor(val);
    if (rand < 0.18) return '#6d4529'; // Jasne słoje drewna
    if (rand < 0.38) return '#3a2212'; // Ciemne słoje/sęki
    if (rand < 0.6) return '#4d301b';  // Średni brąz
    return '#5c3a21';                  // Baza drewna
}

export class PrisonerCage {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 15;
        this.maxHp = 15;
        this.isDestroyed = false;
        this.radius = 16;
        this.life = 1.0; // Czas dogasania zgliszcz
        
        this.bobY = 0;
        this.walkCycle = Math.random() * 10;
        this.swayIntensity = 0; // Dodatkowy wstrząs przy trafieniu klatki
    }

    update(dt) {
        this.walkCycle += dt * 3;
        this.bobY = Math.sin(this.walkCycle) * 1.5;
        
        // Płynne tłumienie wstrząsu po trafieniu
        if (this.swayIntensity > 0) {
            this.swayIntensity -= dt * 2;
            if (this.swayIntensity < 0) this.swayIntensity = 0;
        }
        
        if (this.isDestroyed) {
            this.life -= dt;
        }
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        
        this.hp -= amount;
        this.swayIntensity = 0.8; // Nadanie gwałtownego, wściekłego kołysania przy trafieniu!
        
        playSound('sfx_shoot_default', 0.04);
        createParticles(this.x, this.y, '#444444', 2, 20); // Iskry żelaznych krat
        createParticles(this.x, this.y, '#5c3a21', 2, 15); // Wióry szubienicy
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDestroyed = true;
            
            playSound('sfx_explosion_default', 0.22); // Masywne pęknięcie metalu
            createParticles(this.x, this.y, '#ffd700', 15, 40); // Burza iskier zamka
            createParticles(this.x, this.y, '#444444', 12, 30); // Odłamki pękających krat
            
            // Uwolnienie żołnierza (Lone Survivor rekrutacja)
            stats.maxSquad++; 
            let newSoldier = new Soldier(this.x, this.y + 10); // Spawn pod klatką
            state.squad.push(newSoldier);
            
            createParticles(this.x, this.y + 10, '#39ff14', 20, 45);
            console.warn(`Ocalono żołnierza: ${newSoldier.name} (${newSoldier.soldierClass})!`);
        }
    }

    draw(ctx) {
        if (this.isDestroyed && this.life <= 0) return;
        
        const step = 2; // Matryca 2x2 px

        // 1. Cień na podłożu dla klatki (pixelowy, eliptyczny, step = 2)
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        const rx = 18;
        const ry = 9;
        const cx = this.x;
        const cy = this.y + 33;
        for (let dy = -ry; dy <= ry; dy += 2) {
            let maxDx = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
            let maxDxP = Math.floor(maxDx / 2) * 2;
            if (maxDxP > 0) {
                ctx.fillRect(Math.floor((cx - maxDxP) / 2) * 2, Math.floor((cy + dy) / 2) * 2, maxDxP * 2, 2);
            }
        }
        ctx.restore();
        
        // 2. Cień na podłożu dla słupa (pixelowy, eliptyczny, step = 2)
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        const pRx = 8;
        const pRy = 4;
        const pCx = this.x - 29;
        const pCy = this.y + 35;
        for (let dy = -pRy; dy <= pRy; dy += 2) {
            let maxDx = pRx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (pRy * pRy)));
            let maxDxP = Math.floor(maxDx / 2) * 2;
            if (maxDxP > 0) {
                ctx.fillRect(Math.floor((pCx - maxDxP) / 2) * 2, Math.floor((pCy + dy) / 2) * 2, maxDxP * 2, 2);
            }
        }
        ctx.restore();
        
        // 3. Rysowanie drewnianej konstrukcji szubienicy ze zróżnicowaną teksturą drewna (proceduralną z seedem)
        ctx.save();
        let sx = Math.floor((this.x - 32) / step) * step;
        let sy = Math.floor((this.y - 45) / step) * step;
        
        // Słup pionowy: 6px x 80px (wydłużony o 10px w dół dla wyższego wiszenia klatki)
        for (let py = 0; py < 80; py += step) {
            for (let px = 0; px < 6; px += step) {
                ctx.fillStyle = getWoodColor(123, px, py);
                ctx.fillRect(sx + px, sy + py, step, step);
            }
        }
        
        // Poprzeczka pozioma: 40px x 6px
        for (let py = 0; py < 6; py += step) {
            for (let px = 0; px < 40; px += step) {
                ctx.fillStyle = getWoodColor(456, px, py);
                ctx.fillRect(sx + px, sy + py, step, step);
            }
        }
        
        // Zastrzał skośny (diagonal brace) w pixelarcie
        ctx.fillStyle = '#3a2212';
        ctx.fillRect(sx + 6, sy + 16, 4, 4);
        ctx.fillStyle = '#4d301b';
        ctx.fillRect(sx + 10, sy + 12, 4, 4);
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(sx + 14, sy + 8, 4, 4);
        ctx.fillStyle = '#3a2212';
        ctx.fillRect(sx + 18, sy + 6, 2, 2);
        
        ctx.restore();

        // 4. Rysowanie małego kopczyka ziemi (wbicie w ziemię) na bazie słupa
        ctx.save();
        const baseCenter = Math.floor((this.x - 29) / step) * step;
        const baseY = Math.floor((this.y + 35) / step) * step;
        
        // Ciemnobrązowa ziemia: szerokość 14, wysokość 4
        ctx.fillStyle = '#3a2212';
        ctx.fillRect(baseCenter - 8, baseY - 2, 16, 4);
        ctx.fillRect(baseCenter - 6, baseY - 4, 12, 2);
        
        // Jaśniejsza ziemia: szerokość 8, wysokość 2
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(baseCenter - 4, baseY - 6, 8, 2);
        ctx.fillRect(baseCenter - 2, baseY - 8, 4, 2);
        
        // Detale i drobne sęki gleby
        ctx.fillStyle = '#1c1008';
        ctx.fillRect(baseCenter - 5, baseY - 2, 2, 2);
        ctx.fillRect(baseCenter + 3, baseY - 4, 2, 2);
        ctx.restore();

        if (!this.isDestroyed) {
            ctx.save();
            
            // Obliczanie dynamicznego kąta kołysania wiatru i wstrząsów trafień
            let windSwing = Math.sin(this.walkCycle * 0.75) * 0.05;
            let impactSwing = Math.sin(this.walkCycle * 14) * this.swayIntensity * 0.18;
            let totalSwing = windSwing + impactSwing;
            
            // Punkt obrotu (hak na poprzeczce): x = 4, y = -38 od poprzeczki
            ctx.translate(this.x + 4, this.y - 38);
            ctx.rotate(totalSwing);
            ctx.translate(-4, 38); // powrót do środka klatki (teraz origin 0,0 jest w tym punkcie!)
            
            // 3. Srebrzysty żelazny łańcuch zawieszenia (rysowany relatywnie)
            ctx.fillStyle = '#757e7a';
            ctx.fillRect(2, -38, 2, 18);
            
            // 4. MITYCZNY, SZCZEGÓŁOWY JENIEC MUNDUROWY (ropes + beret + detale twarzy)
            ctx.save();
            // Animowane oddychanie/bobbing jeńca
            ctx.translate(0, this.bobY);
            
            // Czysta, pikselowa twarz (rysowana relatywnie)
            ctx.fillStyle = '#ffccaa'; 
            ctx.fillRect(-4, -4, 8, 8);
            
            // Ciemnozielony beret wojskowy (skręcony zadziornie na bok)
            ctx.fillStyle = '#1b4a0c'; 
            ctx.fillRect(-5, -6, 10, 3);
            ctx.fillRect(-3, -7, 7, 1);
            
            // Zmierzwione brązowe włosy
            ctx.fillStyle = '#5c3a21';
            ctx.fillRect(-5, -2, 1, 4);
            ctx.fillRect(4, -2, 1, 4);
            
            // Czarne, zmęczone oczy (mrugające co jakiś czas)
            if (Math.floor(this.walkCycle) % 5 !== 0) {
                ctx.fillStyle = '#111111';
                ctx.fillRect(-2, -1, 1, 1);
                ctx.fillRect(1, -1, 1, 1);
            }
            
            // Otarcia i brud na twarzy (ciemnoczerwone piksele blizn)
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(2, 1, 1, 1);
            
            // Mundur Medyka Polowego (Oliwkowa zieleń)
            ctx.fillStyle = '#2b6611';
            ctx.fillRect(-6, 4, 12, 12);
            
            // BRĄZOWE LINY KRĘPUJĄCE JEŃCA ( hostaged & wrapped ropes )
            ctx.fillStyle = '#8b5a2b';
            // Ręce związane z tyłu - liny owijające klatkę piersiową w poprzek
            ctx.fillRect(-6, 7, 12, 2);
            ctx.fillRect(-6, 11, 12, 2);
            // Lina pionowa
            ctx.fillRect(-1, 4, 2, 12);
            
            ctx.restore();
            
            // 5. Zewnętrzny żelazny szkielet klatki wiszącej (Gibbet)
            ctx.fillStyle = '#444444';
            ctx.fillRect(-16, -16, 32, 4); // Górna obręcz
            ctx.fillRect(-16, 16, 32, 4); // Dolna obręcz
            
            // Pionowe żelazne pręty klatki
            ctx.fillStyle = '#333333';
            for (let ox = -12; ox <= 12; ox += 6) {
                ctx.fillRect(ox, -12, 2, 28);
            }
            
            // Rdzawy zamek na środku klatki
            ctx.fillStyle = '#a86f2c';
            ctx.fillRect(-3, 2, 6, 8);
            ctx.fillStyle = '#111111';
            ctx.fillRect(-1, 5, 2, 3);
            
            // Segmentowy pasek HP klatki (widoczny pod klatką przy uszkodzeniach)
            if (this.hp < this.maxHp) {
                let barW = 20;
                let barH = 2;
                let barX = -barW / 2;
                let barY = 24;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY, barW, barH);
                let hpProg = this.hp / this.maxHp;
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(barX, barY, Math.floor(barW * hpProg), barH);
            }
            ctx.restore();
        } else {
            // Zerwany łańcuch i puste zgliszcza klatki wiszącej na szubienicy
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = '#757e7a';
            ctx.fillRect(this.x + 2, this.y - 38, 2, 6); // Urywek łańcucha u góry
            
            // Pęknięte pręty klatki rozrzucone pod szubienicą
            ctx.fillStyle = '#333333';
            ctx.fillRect(this.x - 12, this.y + 16, 10, 2);
            ctx.fillRect(this.x + 4, this.y + 18, 12, 2);
            ctx.restore();
        }
    }
}
