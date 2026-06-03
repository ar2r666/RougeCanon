import { state } from '../config.js';
import { createParticles } from './Particle.js';
import { bloodCtx } from '../sprites.js';
import { playSound } from '../sfx.js';

const puffCache = {};
function getPuffSprite(color, radius, variantSeed, step, withNoise = false) {
    const r = Math.max(1, Math.round(radius));
    const variant = Math.abs(Math.floor(variantSeed * 10)) % 4;
    const key = `${color}-${r}-${variant}-${step}-${withNoise}`;
    
    if (puffCache[key]) return puffCache[key];
    
    const canvas = document.createElement('canvas');
    const size = Math.ceil(r * 2 + 10);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    const cx = size / 2;
    const cy = size / 2;
    
    for (let dy = -r - 4; dy <= r + 4; dy += step) {
        for (let dx = -r - 4; dx <= r + 4; dx += step) {
            let ang = Math.atan2(dy, dx);
            let irregR = r + Math.sin(ang * 4 + variant) * (r * 0.25);
            if (dx*dx + dy*dy < irregR*irregR) {
                if (withNoise && Math.random() >= 0.85) {
                    continue;
                }
                let px = Math.floor((cx + dx) / step) * step;
                let py = Math.floor((cy + dy) / step) * step;
                ctx.fillRect(px, py, step, step);
            }
        }
    }
    
    puffCache[key] = canvas;
    return canvas;
}

const circleCache = {};
function getCircleSprite(color, radius, step) {
    const r = Math.max(1, Math.round(radius));
    const key = `${color}-${r}-${step}`;
    if (circleCache[key]) return circleCache[key];
    
    const canvas = document.createElement('canvas');
    const size = Math.ceil(r * 2 + 6);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    const cx = size / 2;
    const cy = size / 2;
    
    for (let dy = -r; dy <= r; dy += step) {
        for (let dx = -r; dx <= r; dx += step) {
            if (dx*dx + dy*dy < r*r) {
                let px = Math.floor((cx + dx) / step) * step;
                let py = Math.floor((cy + dy) / step) * step;
                ctx.fillRect(px, py, step, step);
            }
        }
    }
    
    circleCache[key] = canvas;
    return canvas;
}

export class Explosion {
    constructor(x, y, radius, damage, shooter, isAirstrike = false) {
        this.x = x; 
        this.y = y; 
        this.radius = radius; 
        this.damage = damage;
        this.isAirstrike = isAirstrike;
        this.maxLife = isAirstrike ? 2.0 : 1.5; 
        this.life = this.maxLife;
        this.craterTimer = 0;
        
        if (isAirstrike) {
            playSound('sfx_shoot_bazooka', 0.85);
            playSound('sfx_crate_destroy', 0.9);
        } else {
            playSound('sfx_explode_bazooka', 0.75);
        }
        
        const activeChoice = localStorage.getItem('cannon_explosion_style') || '5_A';
        const [activeStyle, activeAnim] = activeChoice.includes('_') ? activeChoice.split('_') : [activeChoice, 'A'];
        this.activeStyle = activeStyle;
        this.activeAnim = activeAnim;
        
        // Zgodnie z poleceniem: wizualny rozmiar wybuchu i słupa obniżony o 50%
        const visualRadius = this.radius * 0.5;
        
        this.groundPuffs = [];
        let gpCount = (activeStyle === '1' ? 24 : (activeStyle === '8' ? 20 : 12)) + Math.floor(Math.random() * 6);
        let spreadMult = (activeStyle === '1' ? 2.2 : (activeStyle === '2' ? 0.8 : 1.4));
        for (let i = 0; i < gpCount; i++) {
            let spread = (Math.random() - 0.5) * (visualRadius * spreadMult);
            this.groundPuffs.push({
                xOffset: spread,
                yOffset: (Math.random() - 0.5) * 6,
                baseRadius: visualRadius * (0.25 + Math.random() * 0.2),
                speedX: (spread > 0 ? 1 : -1) * (40 + Math.random() * 50),
                delay: Math.random() * 0.05
            });
        }

        this.pillarPuffs = [];
        let pLayers = (activeStyle === '2' ? 22 : (activeStyle === '7' ? 10 : (activeStyle === '9' ? 20 : 15))) + Math.floor(Math.random() * 6);
        let pHeightMult = (activeStyle === '2' ? 2.2 : (activeStyle === '1' ? 0.8 : 1.2));
        const pillarHeight = visualRadius * pHeightMult * (isAirstrike ? 1.3 : 1.0); 
        
        for (let i = 0; i < pLayers; i++) {
            let hRatio = i / pLayers;
            let vOffset = -hRatio * pillarHeight;
            let hWidthMult = (activeStyle === '2' ? 0.5 : (activeStyle === '1' ? 1.9 : (activeStyle === '3' ? 1.1 : (activeStyle === '7' ? 1.4 : 1.2))));
            let hWidth = (hRatio > 0.5 ? (0.7 + (hRatio - 0.5)*1.3) : 0.85) * visualRadius * hWidthMult * (isAirstrike ? 1.35 : 1.0);
            let spreadX = (Math.random() - 0.5) * hWidth;
            
            let puffR = (hRatio > 0.5 ? (0.55 + Math.random()*0.35) : (0.35 + Math.random()*0.3)) * (activeStyle === '7' ? 1.3 : 0.8) * visualRadius;
            
            let pDelay = hRatio * 0.1;
            if (activeStyle === '9' && activeAnim === 'B' && (i % 3 === 0)) {
                pDelay += 0.25; 
            }
            
            this.pillarPuffs.push({
                xOffset: spreadX,
                yOffset: vOffset,
                baseRadius: puffR,
                riseSpeed: (activeStyle === '2' ? 70 : 40) * (0.5 + hRatio),
                delay: pDelay,
                chaosX: (Math.random() - 0.5) * 10,
                chaosY: (Math.random() - 0.5) * 10
            });
        }

        this.debris = [];
        let debrisCount = (isAirstrike ? 25 : 15) + Math.floor(Math.random() * 10);
        for (let i = 0; i < debrisCount; i++) {
            let ang = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.8;
            let speed = (isAirstrike ? 200 : 140) + Math.random() * 320;
            this.debris.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 10,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                size: Math.random() > 0.6 ? 4 : 2,
                color: ['#3b240e', '#5c3826', '#1c1008', '#ffd700'][Math.floor(Math.random() * 4)],
                life: 0.3 + Math.random() * 0.5
            });
        }
        
        // Obrażenia obszarowe
        for (let t of state.enemies) {
            let dist = Math.hypot(t.x - this.x, t.y - this.y);
            if (dist < this.radius) {
                let angle = Math.atan2(t.y - this.y, t.x - this.x);
                let knockSpeed = (isAirstrike ? 700 : 550) * (1 - dist / (this.radius * 1.2)); 
                if (t.applyKnockback) {
                    t.applyKnockback(Math.cos(angle) * knockSpeed, Math.sin(angle) * knockSpeed);
                }
                t.takeDamage(this.damage, shooter);
            }
        }
        if (state.crates) {
            for (let t of state.crates) {
                if (t.isDestroyed) continue;
                let dist = Math.hypot(t.x - this.x, t.y - this.y);
                if (dist < this.radius) {
                    let angle = Math.atan2(t.y - this.y, t.x - this.x);
                    let knockSpeed = (isAirstrike ? 700 : 550) * (1 - dist / (this.radius * 1.2)); 
                    if (t.applyKnockback) {
                        t.applyKnockback(Math.cos(angle) * knockSpeed, Math.sin(angle) * knockSpeed);
                    }
                    t.takeDamage(this.damage, shooter);
                }
            }
        }

        createParticles(this.x, this.y, '#ff5500', isAirstrike ? 60 : 40, isAirstrike ? 240 : 180);
        createParticles(this.x, this.y, '#333333', isAirstrike ? 50 : 35, isAirstrike ? 160 : 120); 
    }

    update(dt) { 
        this.life -= dt; 
        this.craterTimer += dt;
        
        if (this.craterTimer < 0.2 && bloodCtx) {
            let craterProg = this.craterTimer / 0.2;
            bloodCtx.save();
            let craterR = this.radius * 0.5 * (this.isAirstrike ? 1.65 : 1.45); // Skalowanie krateru o 50%
            let outerShades = ['#2b170b', '#3a2212', '#4c2d18', '#3d2314', '#5c3826', '#402010'];
            let coreShades = ['#050201', '#0a0502', '#000000', '#0f0804', '#150a03', '#1c1008'];
            
            let dropBatch = 80 + Math.floor(Math.random() * 40);
            for (let i = 0; i < dropBatch; i++) {
                let ang = Math.random() * Math.PI * 2;
                let maxD = Math.pow(Math.random(), 0.7) * craterR;
                let currentD = maxD < craterR * 0.4 ? maxD : maxD * Math.sin(craterProg * Math.PI / 2);
                let rx = Math.floor((this.x + Math.cos(ang) * currentD) / 2) * 2;
                let ry = Math.floor((this.y + Math.sin(ang) * currentD * 0.55) / 2) * 2;
                let pSize = Math.random() > 0.65 ? 2 : 1;
                let shadePool = maxD < craterR * 0.5 ? coreShades : outerShades;
                bloodCtx.fillStyle = shadePool[Math.floor(Math.random() * shadePool.length)];
                bloodCtx.fillRect(rx, ry, pSize, pSize);
            }
            bloodCtx.restore();
        }
        
        for (let d of this.debris) {
            if (d.life > 0) {
                d.x += d.vx * dt;
                d.y += d.vy * dt;
                d.vx *= Math.pow(0.85, dt * 60);
                d.vy *= Math.pow(0.85, dt * 60);
                d.life -= dt;
            }
        }

        if (Math.random() < 0.45) {
            createParticles(this.x + (Math.random()-0.5)*32, this.y + (Math.random()-0.5)*32, Math.random() > 0.5 ? '#333333' : '#5c3826', 1, 20);
        }
    }

    draw(ctx) {
        // Frustum culling: check if explosion is visible
        const halfW = window.innerWidth / 2 + this.radius * 2;
        const halfH = window.innerHeight / 2 + this.radius * 2;
        if (Math.abs(this.x - state.camera.x) > halfW || Math.abs(this.y - state.camera.y) > halfH) {
            return;
        }

        let activeTime = this.maxLife - this.life;
        let blastDuration = this.isAirstrike ? 0.65 : 0.5; 
        
        for (let d of this.debris) {
            if (d.life > 0) {
                ctx.fillStyle = d.color;
                ctx.fillRect(Math.floor(d.x/2)*2, Math.floor(d.y/2)*2, d.size, d.size);
            }
        }

        if (activeTime < blastDuration) {
            ctx.save();
            let rawProgress = Math.min(1, activeTime / blastDuration);
            let progress = rawProgress;
            
            // Wariant 2A: Stop-Motion (Skokowa animacja klatkowa - 8 klatek)
            if (this.activeStyle === '5' && this.activeAnim === 'A') {
                progress = Math.floor(rawProgress * 8) / 8;
            }
            
            let scale = progress < 0.2 ? (progress / 0.2) : Math.sin((1 - progress)/0.8 * Math.PI / 2);
            let animAlpha = progress < 0.8 ? 1.0 : Math.max(0, (1 - progress) / 0.2);
            
            const step = (this.activeStyle === '5' ? 4 : 2); 
            
            ctx.globalAlpha = animAlpha * 0.8;
            for (let puff of this.groundPuffs) {
                if (activeTime < puff.delay) continue;
                let pProg = (activeTime - puff.delay) / (blastDuration - puff.delay);
                let cx = this.x + puff.xOffset + (puff.speedX * pProg * 0.5);
                
                // Wariant 1B: Termiczny ciąg wciągający dym z powrotem do środka
                if (this.activeStyle === '1' && this.activeAnim === 'B' && pProg > 0.25) {
                    cx += (pProg - 0.25) * (this.radius * 0.7) * (puff.xOffset > 0 ? -1 : 1);
                }
                
                let cy = this.y + puff.yOffset;
                let baseR = puff.baseRadius * scale * (1 + pProg * 0.3);
                
                let groundPuffSprite = getPuffSprite('rgba(90, 50, 30, 0.85)', baseR, puff.xOffset, step, true);
                ctx.drawImage(groundPuffSprite, Math.floor(cx - groundPuffSprite.width / 2), Math.floor(cy - groundPuffSprite.height / 2));
            }

            ctx.globalAlpha = animAlpha * 0.9;
            const activeStyle = this.activeStyle;
            const STYLE_PALETTES = {
                '0': { fire1: '#ff1100', fire2: '#ff7700', core: '#ffff00', smk1: '#111111', smk2: '#333333' },
                '1': { fire1: '#e35442', fire2: '#ff8800', core: '#ffffcc', smk1: '#221e24', smk2: (this.isAirstrike ? '#7a505d' : '#8e6371') },
                '2': { fire1: '#cc1100', fire2: '#ff4500', core: '#ffaa00', smk1: '#080808', smk2: '#1c1c1c' },
                '3': { fire1: '#0055ff', fire2: '#00aaff', core: '#d4ffff', smk1: '#121829', smk2: '#25314f' },
                '4': { fire1: '#22aa00', fire2: '#55ff00', core: '#ccffaa', smk1: '#152415', smk2: '#2a422a' },
                '5': { fire1: '#880000', fire2: '#dd1100', core: '#ff6600', smk1: '#1c1515', smk2: '#382b2b' },
                '6': { fire1: '#c97a1e', fire2: '#f7be25', core: '#fff4d4', smk1: '#291e15', smk2: '#4a3728' },
                '7': { fire1: '#ad219d', fire2: '#e84195', core: '#ffbde0', smk1: '#1c0d1a', smk2: '#381c34' },
                '8': { fire1: '#aa5533', fire2: '#dd8855', core: '#ffeecc', smk1: '#2d2a26', smk2: '#4f4a43' },
                '9': { fire1: '#8a2be2', fire2: '#da70d6', core: '#ffffff', smk1: '#130b1c', smk2: '#2a1b3d' }
            };
            const pal = STYLE_PALETTES[activeStyle] || STYLE_PALETTES['1'];

            for (let puff of this.pillarPuffs) {
                if (activeTime < puff.delay) continue;
                let puffProg = (activeTime - puff.delay) / (blastDuration - puff.delay);
                let currentScale = scale * (1 + puffProg * 0.25);
                let baseR = puff.baseRadius * currentScale;
                
                let rawX = puff.xOffset * (1 + puffProg*0.2);
                let rawY = puff.yOffset - (puffProg * puff.riseSpeed);
                
                // Wariant 3B: Ciężka inercja (wyhamowanie w gęstym powietrzu)
                if (this.activeStyle === '8' && this.activeAnim === 'B') {
                    rawY = puff.yOffset - Math.pow(puffProg, 0.45) * (puff.riseSpeed * 0.55);
                }
                // Wariant 4A: Turbulencje wiatru (falowanie horyzontalne)
                if (this.activeStyle === '9' && this.activeAnim === 'A') {
                    rawX += Math.sin(activeTime * 14 + puff.yOffset) * (this.radius * 0.22) * puffProg;
                }
                
                let cx = rawX + this.x; 
                let cy = rawY + this.y;
                
                let fillColor, hlColor;
                if (progress < 0.18) {
                    fillColor = '#ffffff';
                    hlColor = pal.core;
                } else if (progress < 0.45) {
                    let isBottom = (puff.yOffset / -(this.radius * (this.isAirstrike ? 1.4 : 1.1))) < 0.35;
                    fillColor = isBottom ? pal.fire1 : pal.fire2;
                    hlColor = pal.core;
                } else if (progress < 0.75) {
                    let fadeToSmoke = (progress - 0.45) / 0.3;
                    fillColor = fadeToSmoke < 0.5 ? pal.fire1 : pal.smk2;
                    hlColor = fadeToSmoke < 0.5 ? pal.fire2 : pal.smk1;
                } else {
                    fillColor = pal.smk2;
                    hlColor = pal.smk1;
                }
                
                // Wariant 2B: Arcade Strobe (błyskawiczne migotanie na biało w fazie ognia)
                if (this.activeStyle === '5' && this.activeAnim === 'B' && progress < 0.45 && (Math.floor(activeTime * 28) % 2 === 0)) {
                    fillColor = '#ffffff'; hlColor = '#ffcc00';
                }
                
                // Draw base puff using cached sprite
                let baseSprite = getPuffSprite(fillColor, baseR, puff.chaosX, step, false);
                ctx.drawImage(baseSprite, Math.floor(cx - baseSprite.width / 2), Math.floor(cy - baseSprite.height / 2));
                
                // Draw highlight puff using cached sprite
                let hlSprite = getPuffSprite(hlColor, baseR * 0.75, puff.chaosY, step, false);
                ctx.drawImage(hlSprite, Math.floor(cx + 2 - hlSprite.width / 2), Math.floor(cy - 2 - hlSprite.height / 2));
            }

            // Wariant 3A: Fala uderzeniowa (Sonic Boom ring)
            if (this.activeStyle === '8' && this.activeAnim === 'A' && activeTime < 0.25) {
                ctx.save();
                let sbProg = activeTime / 0.25;
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - sbProg)})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.radius * 1.4 * sbProg, this.radius * 0.8 * sbProg, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            
            if (progress < 0.35) {
                let hotAlpha = Math.min(1, (1 - progress/0.35) * 2);
                ctx.globalAlpha = animAlpha * hotAlpha;
                ctx.fillStyle = pal.core;
                let coreR = this.radius * 0.5 * scale * 0.45;
                
                let coreSprite = getCircleSprite(pal.core, coreR, step);
                ctx.drawImage(coreSprite, Math.floor(this.x - coreSprite.width / 2), Math.floor(this.y - coreSprite.height / 2));
            }
            ctx.restore();
        }
        
        if (activeTime < 0.35) {
            ctx.save();
            let swProgress = activeTime / 0.35;
            let swRadius = this.radius * 0.5 * 1.1 * swProgress;
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * (1 - swProgress)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, swRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

