import { state } from '../config.js';
import { createParticles } from './Particle.js';
import { bloodCtx } from '../sprites.js';
import { playSound } from '../sfx.js';

export class Explosion {
    constructor(x, y, radius, damage, shooter) {
        this.x = x; 
        this.y = y; 
        this.radius = radius; 
        this.damage = damage;
        this.maxLife = 1.5; // Czas trwania (wybuch + fala uderzeniowa + dymiąca plama)
        this.life = this.maxLife;
        
        // Dźwięk wybuchu Bazooki
        playSound('sfx_explode_bazooka', 0.75);
        
        // W konstruktorze tworzymy zbiór 14 stacjonarnych centrów obłoków (puffs), z których wyrośnie jeden pękaty grzyb ognia
        this.puffs = [];
        const puffCount = 14; 
        for (let i = 0; i < puffCount; i++) {
            let angle = (i / puffCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            let dist = (i === 0) ? 0 : this.radius * (0.2 + Math.random() * 0.55); 
            this.puffs.push({
                xOffset: Math.cos(angle) * dist,
                yOffset: Math.sin(angle) * dist,
                baseRadius: (i === 0) ? this.radius * 0.75 : this.radius * (0.35 + Math.random() * 0.25),
                delay: (i === 0) ? 0 : Math.random() * 0.08
            });
        }
        
        // Obrażenia obszarowe (AoE) dla wrogów i skrzynek w promieniu rażenia
        let aoeTargets = [...state.enemies, ...(state.crates || [])];
        for (let t of aoeTargets) {
            if (Math.hypot(t.x - this.x, t.y - this.y) < this.radius) {
                t.takeDamage(this.damage, shooter);
            }
        }

        // Trwałe odciśnięcie poszarpanej, losowej wyrwy w ziemi z porozrzucanymi grudkami gleby i cząstkami wrogów na boki
        if (bloodCtx) {
            bloodCtx.save();
            
            // 1. Czarne/zwęglone jądro samej wyrwy (poszarpane spękania)
            let breachDrops = 25 + Math.floor(Math.random() * 15);
            for (let i = 0; i < breachDrops; i++) {
                let ang = Math.random() * Math.PI * 2;
                let d = Math.random() * (this.radius * 0.45);
                let rx = Math.floor((this.x + Math.cos(ang) * d) / 2) * 2;
                let ry = Math.floor((this.y + Math.sin(ang) * d) / 2) * 2;
                let size = Math.random() > 0.4 ? 4 : 2;
                bloodCtx.fillStyle = Math.random() > 0.5 ? '#0a0500' : '#1a0d00';
                bloodCtx.fillRect(rx, ry, size, size);
            }
            
            // 2. Pikselowa ziemia porozrzucana na boki (piaskowe, brązowe i gliniane grudki)
            let dirtDrops = 45 + Math.floor(Math.random() * 20);
            for (let i = 0; i < dirtDrops; i++) {
                let ang = Math.random() * Math.PI * 2;
                let d = (this.radius * 0.3) + Math.random() * (this.radius * 0.75);
                let rx = Math.floor((this.x + Math.cos(ang) * d) / 2) * 2;
                let ry = Math.floor((this.y + Math.sin(ang) * d) / 2) * 2;
                const DIRT_COLORS = ['#8b5a2b', '#a0522d', '#cd853f', '#5c4d41', '#3b240e'];
                bloodCtx.fillStyle = DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)];
                bloodCtx.fillRect(rx, ry, 2, 2);
            }
            
            // 3. Cząstki i szczątki wrogów (krwiste plamy i szare odłamki pancerza) rozrzucone na boki
            let goreDrops = 35 + Math.floor(Math.random() * 15);
            for (let i = 0; i < goreDrops; i++) {
                let ang = Math.random() * Math.PI * 2;
                let d = (this.radius * 0.2) + Math.random() * (this.radius * 0.85);
                let rx = Math.floor((this.x + Math.cos(ang) * d) / 2) * 2;
                let ry = Math.floor((this.y + Math.sin(ang) * d) / 2) * 2;
                let size = Math.random() > 0.7 ? 4 : 2;
                const GORE_COLORS = ['#8b0000', '#aa0000', '#ff0000', '#444444', '#666666'];
                bloodCtx.fillStyle = GORE_COLORS[Math.floor(Math.random() * GORE_COLORS.length)];
                bloodCtx.fillRect(rx, ry, size, size);
            }
            
            bloodCtx.restore();
        }

        // Efektowne odłamki cząsteczek
        createParticles(x, y, '#ff5500', 35, 150);
        createParticles(x, y, '#3b240e', 20, 80); 
    }

    update(dt) { 
        this.life -= dt; 
        
        // Unoszenie się dymiących stróżek z krateru
        if (Math.random() < 0.4) {
            createParticles(this.x + (Math.random()-0.5)*24, this.y + (Math.random()-0.5)*24, Math.random() > 0.5 ? '#3b240e' : '#5c4d41', 1, 15);
        }
    }

    draw(ctx) {
        let activeTime = this.maxLife - this.life;
        let blastDuration = 0.35; 
        
        // 1. Rysowanie zwartej, pękatej chmury wybuchu w czystym stylu retro pixel art
        if (activeTime < blastDuration) {
            ctx.save();
            let progress = activeTime / blastDuration;
            
            // Obłoki szybko rosną, a pod koniec kurczą się i dymią
            let scale = progress < 0.25 ? (progress / 0.25) : Math.sin((1 - progress)/0.75 * Math.PI / 2);
            
            let outerColor = progress < 0.6 ? '#ff3300' : '#332211'; 
            let midColor   = progress < 0.5 ? '#ff8800' : '#883311';
            let coreColor  = progress < 0.3 ? '#ffff00' : '#ff5500';
            let hotColor   = '#ffffff';
            
            const step = 4; // Twarda siatka 4-pikselowa tworząca wyraziste, masywne zaokrąglenia retro
            
            ctx.fillStyle = outerColor;
            for (let puff of this.puffs) {
                if (activeTime < puff.delay) continue;
                let puffProg = (activeTime - puff.delay) / (blastDuration - puff.delay);
                if (puffProg > 1.0) continue;
                
                let pScale = puffProg < 0.2 ? (puffProg / 0.2) : Math.sin((1 - puffProg)/0.8 * Math.PI / 2);
                let r = puff.baseRadius * pScale;
                let cx = this.x + puff.xOffset;
                let cy = this.y + puff.yOffset - (puffProg * 24); // Chmury dymu unoszą się w górę
                
                for (let dy = -r; dy <= r; dy += step) {
                    for (let dx = -r; dx <= r; dx += step) {
                        if (dx*dx + dy*dy < r*r) {
                            let px = Math.floor((cx + dx) / step) * step;
                            let py = Math.floor((cy + dy) / step) * step;
                            ctx.fillRect(px, py, step, step);
                        }
                    }
                }
            }
            
            if (progress < 0.75) {
                ctx.fillStyle = midColor;
                for (let puff of this.puffs) {
                    if (activeTime < puff.delay) continue;
                    let puffProg = (activeTime - puff.delay) / (blastDuration - puff.delay);
                    let r = puff.baseRadius * scale * 0.75;
                    let cx = this.x + puff.xOffset;
                    let cy = this.y + puff.yOffset - (puffProg * 16);
                    
                    for (let dy = -r; dy <= r; dy += step) {
                        for (let dx = -r; dx <= r; dx += step) {
                            if (dx*dx + dy*dy < r*r) {
                                let px = Math.floor((cx + dx) / step) * step;
                                let py = Math.floor((cy + dy) / step) * step;
                                ctx.fillRect(px, py, step, step);
                            }
                        }
                    }
                }
            }
            
            if (progress < 0.5) {
                ctx.fillStyle = coreColor;
                for (let puff of this.puffs) {
                    if (activeTime < puff.delay) continue;
                    let r = puff.baseRadius * scale * 0.5;
                    let cx = this.x + puff.xOffset;
                    let cy = this.y + puff.yOffset;
                    
                    for (let dy = -r; dy <= r; dy += step) {
                        for (let dx = -r; dx <= r; dx += step) {
                            if (dx*dx + dy*dy < r*r) {
                                let px = Math.floor((cx + dx) / step) * step;
                                let py = Math.floor((cy + dy) / step) * step;
                                ctx.fillRect(px, py, step, step);
                            }
                        }
                    }
                }
            }
            
            if (progress < 0.2) {
                ctx.fillStyle = hotColor;
                let r = this.radius * scale * 0.45;
                for (let dy = -r; dy <= r; dy += step) {
                    for (let dx = -r; dx <= r; dx += step) {
                        if (dx*dx + dy*dy < r*r) {
                            let px = Math.floor((this.x + dx) / step) * step;
                            let py = Math.floor((this.y + dy) / step) * step;
                            ctx.fillRect(px, py, step, step);
                        }
                    }
                }
            }
            ctx.restore();
        }
        
        // 2. Zgodnie z wytycznymi: lekka fala uderzeniowa dodana wyłącznie dla subtelnego efektu wizualnego
        if (activeTime < 0.35) {
            ctx.save();
            let swProgress = activeTime / 0.35;
            let swRadius = this.radius * 1.1 * swProgress;
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * (1 - swProgress)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, swRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}
