import { stats, state, WEAPONS, NAMES, customSquadDesign } from '../config.js';
import { getSoldierSprites, getSoldierBodySprites, getWeaponSprite, bloodCtx } from '../sprites.js';
import { createParticles } from './Particle.js';
import { Bullet } from './Bullet.js';
import { PlasmaBeam } from './PlasmaBeam.js';
import { playSound } from '../sfx.js';

const gunFireImg = new Image();
gunFireImg.src = 'img/gun_fire.png';

const flamethrowerImg = new Image();
flamethrowerImg.src = 'img/flamethrow_fire.png';

function getUniqueName() {
    let available = NAMES.filter(n => !state.squad.some(s => s.name === n));
    if (available.length === 0) available = NAMES;
    return available[Math.floor(Math.random() * available.length)];
}

export const corpses = [];

export function clearCorpses() {
    corpses.length = 0;
}

export class Soldier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isEnemy = false;
        this.speed = stats.speed;
        this.hp = 3;
        this.maxHp = 3;
        this.radius = 8;
        this.lastShot = 0;
        
        this.offsetX = (Math.random() - 0.5) * 90; 
        this.offsetY = (Math.random() - 0.5) * 90;
        
        this.animFrame = 0;
        this.walkCycle = Math.random() * Math.PI * 2;
        this.animSpeedMult = 0.8 + Math.random() * 0.4;
        this.bobY = 0;
        this.isMoving = false;
        this.bloodyBootsTime = 0;
        this.footprintTimer = 0;
        
        this.personalSwagger = Math.random() * Math.PI * 2;
        this.swaggerSpeed = 1.5 + Math.random() * 1.5;
        this.facingLeft = false;
        
        this.accessoryIdx = 0;
        this.customImageSkin = null;
        
        this.name = getUniqueName();
        this.kills = 0;
        this.weapon = WEAPONS.DEFAULT;
        this.storedWeapon = null;
        this.specialWeaponTimer = 0;
        
        let targetCfg = customSquadDesign.hero;
        if (targetCfg && targetCfg.isCustomized) {
            this.helmetIdx = targetCfg.helmetIdx;
            this.faceIdx = targetCfg.faceIdx;
            this.uniformIdx = targetCfg.uniformIdx;
            this.weaponIdx = targetCfg.weaponIdx;
            this.accessoryIdx = targetCfg.accessoryIdx;
            
            let activeSkins = customSquadDesign.heroSkins ? customSquadDesign.heroSkins.filter(Boolean) : [];
            if (activeSkins.length > 0) {
                this.customImageSkin = activeSkins[state.squad.length % activeSkins.length];
            } else {
                this.customImageSkin = targetCfg.customImageSkin;
            }
        } else {
            this.helmetIdx = 0;
            this.faceIdx = 10;
            this.uniformIdx = 11;
        }
        
        this.updateSprites();
    }

    updateSprites() {
        this.effectiveWIdx = (this.weapon && this.weapon !== WEAPONS.DEFAULT) ? this.weapon.visualIdx : (this.weaponIdx !== undefined ? this.weaponIdx : (customSquadDesign && customSquadDesign.customWeaponIdx !== undefined ? customSquadDesign.customWeaponIdx : 0));
        this.sprites = getSoldierSprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.effectiveWIdx, this.accessoryIdx);
        this.bodySprites = getSoldierBodySprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.accessoryIdx);
        this.weaponSprite = getWeaponSprite(this.effectiveWIdx);
    }

    update(dt) {
        let oldX = this.x;
        let oldY = this.y;

        this.personalSwagger += dt * this.swaggerSpeed;
        let swayX = Math.cos(this.personalSwagger) * 12;
        let swayY = Math.sin(this.personalSwagger * 0.7) * 12;
        
        let tx = state.targetPoint.x + this.offsetX + swayX;
        let ty = state.targetPoint.y + this.offsetY + swayY;
        let dist = Math.hypot(tx - this.x, ty - this.y);
        
        if (dist > 1) {
            let currentSpeed = Math.min(stats.speed * this.animSpeedMult, dist * 6);
            let angle = Math.atan2(ty - this.y, tx - this.x);
            let finalAngle = angle + Math.sin(this.personalSwagger * 1.3) * 0.15;
            
            let moveX = Math.cos(finalAngle) * currentSpeed * dt;
            this.x += moveX;
            this.y += Math.sin(finalAngle) * currentSpeed * dt;
            
            if (Math.abs(moveX) > 0.2) {
                this.facingLeft = moveX < 0;
            }
        }

        // Flocking oddziału gracza
        let forceX = 0;
        let forceY = 0;
        for (let other of state.squad) {
            if (other !== this) {
                let d = Math.hypot(other.x - this.x, other.y - this.y);
                if (d < 45 && d > 0) { 
                    let push = (45 - d) * 3;
                    let angle = Math.atan2(this.y - other.y, this.x - other.x);
                    forceX += Math.cos(angle) * push;
                    forceY += Math.sin(angle) * push;
                }
            }
        }
        this.x += forceX * dt;
        this.y += forceY * dt;

        // Ograniczenie wyjścia poza pole strzału
        let centerRef = state.squad[0] || { x: state.camera.x, y: state.camera.y };
        if (this === state.squad[0]) centerRef = { x: state.camera.x, y: state.camera.y };
        
        let distFromCenter = Math.hypot(this.x - centerRef.x, this.y - centerRef.y);
        let maxAllowedDist = stats.range - this.radius;
        if (distFromCenter > maxAllowedDist && maxAllowedDist > 0) {
            let clampAngle = Math.atan2(this.y - centerRef.y, this.x - centerRef.x);
            this.x = centerRef.x + Math.cos(clampAngle) * maxAllowedDist;
            this.y = centerRef.y + Math.sin(clampAngle) * maxAllowedDist;
        }

        // Automatyczny ogień do wrogów oraz nienaruszonych skrzynek
        let possibleTargets = [...state.enemies, ...(state.crates ? state.crates.filter(c => !c.isDestroyed) : [])];
        if (this.lastShot <= 0 && possibleTargets.length > 0) {
            let closest = null;
            let minDist = this.weapon.type === 'beam' ? stats.range * 1.5 : (this.weapon.type === 'explosive' ? stats.range * 1.3 : stats.range);
            for (let e of possibleTargets) {
                let d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minDist) { minDist = d; closest = e; }
            }

            if (closest) {
                let angle = Math.atan2(closest.y - this.y, closest.x - this.x);
                let fireRate = (stats.fireRate * this.weapon.fireRateMult) / 1000;
                let dmg = stats.damage * this.weapon.damageMult;
                
                if (this.weapon.type === 'beam') {
                    let startBeamX = this.x + (this.facingLeft ? -10 : 10);
                    let startBeamY = this.y - this.bobY + 3;
                    state.bullets.push(new PlasmaBeam(startBeamX, startBeamY, closest, dmg, this));
                } else if (this.weapon.type === 'flame') {
                    playSound('sfx_shoot_fire', 0.12);
                    
                    // Ciągły strumień płomieni w postaci zagęszczonych cząsteczek ognia
                    for (let p = 0; p < 4; p++) {
                        let pAng = angle + (Math.random() - 0.5) * 0.5;
                        let pDist = 10 + Math.random() * 8;
                        let px = this.x + Math.cos(pAng) * pDist;
                        let py = this.y - this.bobY + Math.sin(pAng) * pDist;
                        let pColor = Math.random() < 0.15 ? '#ffffff' : (Math.random() < 0.55 ? '#ffaa00' : '#ff3300');
                        createParticles(px, py, pColor, 2, 35);
                    }
                    
                    // Stożkowe rażenie wrogów
                    let flameRange = stats.range * 0.9;
                    for (let e of state.enemies) {
                        if (e.hp > 0) {
                            let ed = Math.hypot(e.x - this.x, e.y - this.y);
                            if (ed < flameRange) {
                                let eAng = Math.atan2(e.y - this.y, e.x - this.x);
                                let diff = Math.abs(eAng - angle);
                                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                                if (diff < 0.45) {
                                    e.takeDamage(dmg, this);
                                    if (Math.random() < 0.25) {
                                        createParticles(e.x, e.y, '#ff5500', 1, 15);
                                    }
                                }
                            }
                        }
                    }
                } else if (this.weapon.type === 'spread') {
                    // Zgodnie z dyspozycją: potężny wachlarz 7 śrucin tworzący ścianę ognia
                    const spreadAngles = [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45];
                    for (let angOffset of spreadAngles) {
                        let bAng = angle + angOffset + (Math.random() - 0.5) * 0.08;
                        state.bullets.push(new Bullet(this, this.x, this.y, bAng, false, dmg, this.weapon));
                    }
                    playSound('sfx_shoot_shotgun');
                } else {
                    angle += (Math.random() - 0.5) * (this.weapon.type === 'rapid' ? 0.3 : 0.1); 
                    state.bullets.push(new Bullet(this, this.x, this.y, angle, false, dmg, this.weapon));
                    playSound(this.weapon.type === 'rapid' ? 'sfx_shoot_machinegun' : (this.weapon.type === 'explosive' ? 'sfx_shoot_bazooka' : 'sfx_shoot_default'));
                }
                
                this.lastShot = fireRate;
                if (this.weapon.type !== 'beam' && this.weapon.type !== 'flame') {
                    createParticles(this.x + Math.cos(angle)*10, this.y + Math.sin(angle)*10, this.weapon.color, 1, 30);
                }
            }
        }

        if (this.lastShot > 0) {
            let prevShot = this.lastShot;
            this.lastShot -= dt;
            
            // Odwzorowanie 2-sekundowego cyklu strzelby (1s strzał, 2s przeładowanie)
            if (this.weapon && this.weapon.type === 'spread') {
                if (prevShot > 1.0 && this.lastShot <= 1.0) {
                    this.isReloadingPump = 0.35; 
                    if (typeof bloodCtx !== 'undefined' && bloodCtx) {
                        bloodCtx.save();
                        bloodCtx.fillStyle = '#cc0000';
                        bloodCtx.fillRect(this.x + (this.facingLeft ? 4 : -4), this.y + 6, 3, 2);
                        bloodCtx.fillStyle = '#ffd700';
                        bloodCtx.fillRect(this.x + (this.facingLeft ? 7 : -7), this.y + 6, 1, 2);
                        bloodCtx.restore();
                    }
                    createParticles(this.x + (this.facingLeft ? 5 : -5), this.y, '#ffd700', 3, 25);
                }
            }
        }
        if (this.isReloadingPump > 0) this.isReloadingPump -= dt;
        
        // Odliczanie 15-sekundowego ekwipunku ze skrzynek
        if (this.specialWeaponTimer > 0) {
            this.specialWeaponTimer -= dt;
            if (this.specialWeaponTimer <= 0) {
                this.specialWeaponTimer = 0;
                if (this.storedWeapon) {
                    this.weapon = this.storedWeapon;
                    this.storedWeapon = null;
                    this.updateSprites();
                }
            }
        }

        let distMoved = Math.hypot(this.x - oldX, this.y - oldY);
        let actualSpeed = distMoved / dt;

        if (actualSpeed > 5) {
            this.isMoving = true;
            this.walkCycle += dt * 10 * this.animSpeedMult;
            this.animFrame = Math.floor(this.walkCycle) % 4;
            this.bobY = Math.abs(Math.sin(this.walkCycle * Math.PI)) * 2;
        } else {
            this.isMoving = false;
            this.animFrame = 0;
            this.bobY = 0;
        }

        // Ślady zakrwawionych butów
        if (this.bloodyBootsTime > 0) {
            this.bloodyBootsTime -= dt;
            if (this.isMoving) {
                this.footprintTimer -= dt;
                if (this.footprintTimer <= 0) {
                    if (bloodCtx) {
                        bloodCtx.fillStyle = '#a81111';
                        let sideOffset = (Math.sin(this.walkCycle) > 0) ? 4 : -4;
                        let fx = Math.floor((this.x + sideOffset) / 2) * 2;
                        let fy = Math.floor((this.y + 7) / 2) * 2;
                        bloodCtx.fillRect(fx, fy, 2, 2);
                    }
                    this.footprintTimer = 0.15;
                }
            }
        } else {
            for (let c of corpses) {
                if (Math.hypot(c.x - this.x, c.y - this.y) < 12) {
                    this.bloodyBootsTime = 3.0;
                    this.footprintTimer = 0;
                    break;
                }
            }
        }
        
        // Emisja dymu z popalonych zwłok (wykonujemy raz na klatkę z poziomu lidera)
        if (this === state.squad[0]) {
            for (let c of corpses) {
                if (c.smokeTimer > 0) {
                    c.smokeTimer -= dt;
                    if (Math.random() < 0.25) {
                        createParticles(c.x + (Math.random()-0.5)*12, c.y + (Math.random()-0.5)*12, '#3b240e', 1, 25);
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - 5, this.y + 10, 10, 2);
        ctx.fillRect(this.x - 7, this.y + 12, 14, 3);
        ctx.fillRect(this.x - 5, this.y + 15, 10, 2);
        ctx.restore();
        
        let recoilX = 0;
        let recoilY = 0;
        let isEffectivelyFacingLeft = this.facingLeft;
        let closestForAim = null;
        let minDistAim = Infinity;
        
        let possibleAimTargets = [...state.enemies, ...(state.crates ? state.crates.filter(c => !c.isDestroyed) : [])];
        for (let t of possibleAimTargets) {
            if (t.hp > 0) {
                let d = Math.hypot(t.x - this.x, t.y - this.y);
                if (d < minDistAim) { minDistAim = d; closestForAim = t; }
            }
        }
        
        let maxAimDist = this.weapon && this.weapon.type === 'explosive' ? stats.range * 1.3 : stats.range * 1.5;
        if (closestForAim && minDistAim < maxAimDist) {
            isEffectivelyFacingLeft = closestForAim.x < this.x;
        }
        
        if (this.lastShot > 0 && this.weapon) {
            let fireRate = (stats.fireRate * this.weapon.fireRateMult) / 1000;
            let timeSinceShot = fireRate - this.lastShot;
            if (closestForAim && timeSinceShot < 0.08) {
                let intensity = 1.2 * (1 - timeSinceShot / 0.08);
                let aimAngle = Math.atan2(closestForAim.y - this.y, closestForAim.x - this.x);
                recoilX = -Math.cos(aimAngle) * intensity;
                recoilY = -Math.sin(aimAngle) * intensity;
            }
        }
        if (this.isReloadingPump > 0 && closestForAim) {
            let pumpIntensity = Math.sin((this.isReloadingPump / 0.35) * Math.PI) * 3;
            let aimAngle = Math.atan2(closestForAim.y - this.y, closestForAim.x - this.x);
            recoilX += Math.cos(aimAngle) * pumpIntensity;
            recoilY += Math.sin(aimAngle) * pumpIntensity;
        }

        // 1. Rysowanie ciała (z bufora czystego ciała bez wpieczonego karabinu)
        ctx.save();
        ctx.translate(this.x + recoilX, this.y - this.bobY + recoilY);
        if (isEffectivelyFacingLeft) {
            ctx.scale(-1, 1);
        }
        ctx.imageSmoothingEnabled = false;

        if (this.customImageSkin) {
            let frameHeight = this.customImageSkin.height;
            let totalFrames = Math.max(1, Math.round(this.customImageSkin.width / frameHeight));
            if (totalFrames > 1) {
                let currentFrame = Math.floor(this.walkCycle * 1.5) % totalFrames;
                if (!this.isMoving) currentFrame = 0;
                let sx = currentFrame * frameHeight;
                ctx.drawImage(this.customImageSkin, sx, 0, frameHeight, frameHeight, -16, -16, 32, 32);
            } else {
                ctx.drawImage(this.customImageSkin, -16, -16, 32, 32);
            }
        } else {
            let sprite = (this.bodySprites ? this.bodySprites[this.animFrame] : null) || this.sprites[this.animFrame] || this.sprites[0];
            ctx.drawImage(sprite, -16, -16, 32, 32);
        }
        ctx.restore();

        // 2. Rysowanie obracającego się karabinu skierowanego w stronę wroga
        // Wymuszamy rysowanie na wierzchu broni ze skrzynek (specialWeaponTimer > 0) nawet przy nałożonej własnej skórce!
        if ((!this.customImageSkin || this.specialWeaponTimer > 0) && this.weaponSprite) {
            ctx.save();
            let shoulderY = this.y - this.bobY + ((this.animFrame === 1 || this.animFrame === 3) ? 3 : 2) + recoilY;
            ctx.translate(this.x + recoilX, shoulderY);
            
            let rotAngle = isEffectivelyFacingLeft ? Math.PI : 0;
            if (closestForAim) {
                rotAngle = Math.atan2(closestForAim.y - shoulderY, closestForAim.x - (this.x + recoilX));
            }
            
            ctx.rotate(rotAngle);
            if (Math.abs(rotAngle) > Math.PI / 2) {
                ctx.scale(1, -1);
            }
            ctx.imageSmoothingEnabled = false;
            
            if (this.specialWeaponTimer > 0) {
                // Cybernetyczny blask superbroni
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00ffff';
            }
            
            ctx.drawImage(this.weaponSprite, -16, -16, 32, 32);
            ctx.restore();
        }

        // Natywny system ognia retro: wyśrodkowany bezpośrednio z krawędzi lufy, skalowany w drobniejszej matrycy 4-pikselowej,
        // z towarzyszącym wiecznym, małym płomykiem pilotowym ("pilot light") w stanie gotowości (idle)
        if (this.weapon && this.weapon.type === 'flame' && this.weaponSprite) {
            ctx.save();
            let shoulderY = this.y - this.bobY + ((this.animFrame === 1 || this.animFrame === 3) ? 3 : 2) + recoilY;
            let pivotX = this.x + recoilX;
            let aimAngle = isEffectivelyFacingLeft ? Math.PI : 0;
            if (closestForAim) {
                aimAngle = Math.atan2(closestForAim.y - shoulderY, closestForAim.x - pivotX);
            }
            
            let dirX = Math.cos(aimAngle);
            let dirY = Math.sin(aimAngle);
            let normX = -Math.sin(aimAngle);
            let normY = Math.cos(aimAngle);
            
            // Wylot lufy Miotacza Ognia przesunięty o 15 pikseli wzdłuż wektora celowania od osi ramienia
            let tipX = pivotX + dirX * 15;
            let tipY = shoulderY + dirY * 15;
            
            ctx.globalCompositeOperation = 'lighter';
            let t = Date.now() / 40;
            
            if (this.lastShot > 0 && closestForAim) {
                let maxDist = stats.range;
                let step = 4; // Precyzyjny krok 4px budujący zwartą wiązkę w skali retro pixel art
                
                // Tworzenie małych dogasających płomieni na ziemi, które zostawiają po sobie trwałe, czarne plamy wypalenia
                if (typeof bloodCtx !== 'undefined' && bloodCtx && Math.random() < 0.12) {
                    let dropD = maxDist * (0.25 + Math.random() * 0.7);
                    let dropX = Math.floor((tipX + dirX * dropD + (Math.random() - 0.5) * 24) / 2) * 2;
                    let dropY = Math.floor((tipY + dirY * dropD + (Math.random() - 0.5) * 24) / 2) * 2;
                    
                    // Wypalamy trwale wyłącznie czarną, zwęgloną dziurę w murawie
                    bloodCtx.fillStyle = '#0d0600';
                    bloodCtx.fillRect(dropX - 2, dropY - 2, 4, 4);
                    
                    // Dodajemy animowany płomyk dogasający na wierzchu
                    if (!state.fuelPools) state.fuelPools = [];
                    if (state.fuelPools.length < 60) {
                        state.fuelPools.push({ x: dropX, y: dropY, life: 1.5, maxLife: 1.5 });
                    }
                }
                
                // Warstwa 1: Zewnętrzna bryła
                ctx.fillStyle = '#ff3300';
                for (let d = 0; d < maxDist; d += step) {
                    let p = d / maxDist;
                    let envelope = p < 0.65 ? Math.sin((p / 0.65) * Math.PI / 2) : Math.sin((1 - (p - 0.65) / 0.35) * Math.PI / 2);
                    let size = Math.floor((4 + envelope * 20) / 4) * 4;
                    if (size < 4) size = 4;
                    
                    let w1 = Math.sin(d * 0.1 - t);
                    let w2 = Math.cos(d * 0.3 + t * 1.5) * 0.5;
                    let chaos = Math.sin(d * 1.2 + Math.floor(t * 0.8)) * 0.3;
                    let wave = (w1 + w2 + chaos) * (p * 14);
                    
                    if (p > 0.75 && Math.sin(d * 1.0 + t * 2.7) > 0.1) continue;
                    
                    let cx = tipX + dirX * d + normX * wave;
                    let cy = tipY + dirY * d + normY * wave;
                    
                    let px = Math.floor(cx / 4) * 4;
                    let py = Math.floor(cy / 4) * 4;
                    
                    ctx.globalAlpha = p > 0.7 ? (1 - p) * 3.3 : 1.0;
                    ctx.fillRect(px - size/2, py - size/2, size, size);
                }
                
                // Warstwa 2: Złocisto-pomarańczowy rdzeń
                ctx.fillStyle = '#ff8800';
                let midDist = maxDist * 0.85;
                for (let d = 0; d < midDist; d += step) {
                    let p = d / midDist;
                    let envelope = p < 0.6 ? Math.sin((p / 0.6) * Math.PI / 2) : Math.sin((1 - (p - 0.6) / 0.4) * Math.PI / 2);
                    let size = Math.floor((4 + envelope * 12) / 4) * 4;
                    if (size < 4) size = 4;
                    
                    let w1 = Math.sin(d * 0.12 - t * 1.2);
                    let w2 = Math.sin(d * 0.35 - t * 2.1) * 0.4;
                    let wave = (w1 + w2) * (p * 9);
                    
                    if (p > 0.7 && Math.cos(d * 1.3 + t * 2.0) > 0.25) continue;
                    
                    let cx = tipX + dirX * d + normX * wave;
                    let cy = tipY + dirY * d + normY * wave;
                    
                    let px = Math.floor(cx / 4) * 4;
                    let py = Math.floor(cy / 4) * 4;
                    
                    ctx.globalAlpha = p > 0.65 ? (1 - p) * 2.8 : 1.0;
                    ctx.fillRect(px - size/2, py - size/2, size, size);
                }
                
                // Warstwa 3: Rdzeń paliwowy
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1.0;
                let coreDist = maxDist * 0.45;
                for (let d = 0; d < coreDist; d += step) {
                    let p = d / coreDist;
                    let size = 4;
                    let wave = Math.sin(d * 0.18 - t * 1.8) * (p * 2);
                    
                    let cx = tipX + dirX * d + normX * wave;
                    let cy = tipY + dirY * d + normY * wave;
                    
                    let px = Math.floor(cx / 4) * 4;
                    let py = Math.floor(cy / 4) * 4;
                    
                    ctx.fillRect(px - size/2, py - size/2, size, size);
                }
                
                // Warstwa 4: Iskry plazmy retro
                ctx.fillStyle = '#ffffaa';
                for (let i = 0; i < 4; i++) {
                    let phase = (t * 0.4 + i * 1.33) % 1.0;
                    let fd = Math.floor((phase * maxDist) / step) * step;
                    let w1 = Math.sin(fd * 0.1 - t);
                    let w2 = Math.cos(fd * 0.3 + t * 1.5) * 0.5;
                    let wave = (w1 + w2) * (phase * 15) + (i % 2 === 0 ? -4 : 4);
                    
                    let cx = tipX + dirX * fd + normX * wave;
                    let cy = tipY + dirY * fd + normY * wave;
                    
                    let px = Math.floor(cx / 4) * 4;
                    let py = Math.floor(cy / 4) * 4;
                    
                    ctx.globalAlpha = phase > 0.5 ? (1 - phase) * 2.0 : 1.0;
                    ctx.fillRect(px - 2, py - 2, 4, 4);
                }
            } else {
                // Ciągły, mały płomyk pilotowy ("pilot light") migoczący w spoczynku na krawędzi dyszy
                let flicker = Math.sin(t * 3.5) * 2;
                let px = Math.floor((tipX + normX * flicker) / 4) * 4;
                let py = Math.floor((tipY + normY * flicker) / 4) * 4;
                
                ctx.fillStyle = '#0088ff';
                ctx.fillRect(px - 2, py - 2, 4, 4);
                let ptx = Math.floor((px + dirX * 4) / 2) * 2;
                let pty = Math.floor((py + dirY * 4) / 2) * 2;
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(ptx - 1, pty - 1, 2, 2);
            }
            ctx.restore();
        } else if (this.lastShot > 0 && this.weapon && this.weapon.type !== 'beam' && this.weapon.type !== 'flame' && gunFireImg && gunFireImg.complete && gunFireImg.width > 0) {
            let fireRate = (stats.fireRate * this.weapon.fireRateMult) / 1000;
            let timeSinceShot = fireRate - this.lastShot;
            if (timeSinceShot < 0.1) {
                let closest = null;
                let minDist = Infinity;
                for (let t of state.enemies) {
                    if (t.hp > 0) {
                        let d = Math.hypot(t.x - this.x, t.y - this.y);
                        if (d < minDist) { minDist = d; closest = t; }
                    }
                }
                if (closest) {
                    let aimAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
                    let isFacingLeft = closest.x < this.x;
                    
                    let tipX = this.x + (isFacingLeft ? -10 : 10) + recoilX;
                    let tipY = this.y - this.bobY + 3 + recoilY;
                    
                    ctx.save();
                    ctx.translate(tipX, tipY);
                    ctx.rotate(aimAngle);
                    
                    let fh = gunFireImg.height;
                    let totalFrames = Math.max(1, Math.round(gunFireImg.width / fh));
                    if (totalFrames < 2) totalFrames = 6;
                    
                    let fw = Math.floor(gunFireImg.width / totalFrames);
                    let fIdx = Math.floor((timeSinceShot / 0.1) * totalFrames) % totalFrames;
                    
                    let drawH = 20;
                    let drawW = fw * (drawH / fh);
                    
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(gunFireImg, fIdx * fw, 0, fw, fh, 0, -drawH / 2, drawW, drawH);
                    ctx.restore();
                }
            }
        }

        // Etykieta nazwy i uzbrojenia
        ctx.fillStyle = 'white';
        ctx.font = '9px "Press Start 2P"'; 
        ctx.textAlign = 'center';
        
        let weaponLabel = this.weapon.name !== 'Karabin' ? `[${this.weapon.name}]` : '';
        if (this.specialWeaponTimer > 0) {
            weaponLabel += ` (${Math.ceil(this.specialWeaponTimer)}s)`;
        }
        
        if (this.isReloadingPump > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '7px "Press Start 2P"';
            ctx.fillText('PRZEŁAD.', this.x, this.y - 32 - this.bobY);
        }
        
        if (weaponLabel) {
            ctx.fillStyle = 'white';
            ctx.font = '9px "Press Start 2P"';
            ctx.fillText(this.name, this.x, this.y - 25 - this.bobY);
            ctx.fillStyle = this.weapon.color;
            ctx.font = '7px "Press Start 2P"';
            ctx.fillText(weaponLabel, this.x, this.y - 15 - this.bobY);
        } else {
            ctx.fillStyle = 'white';
            ctx.font = '9px "Press Start 2P"';
            ctx.fillText(this.name, this.x, this.y - 18 - this.bobY);
        }
    }

    takeDamage(amount) {
        if (this.hp <= 0) return;
        this.hp -= amount;
        createParticles(this.x, this.y, '#ff0000', 3, 60);
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (bloodCtx) {
            bloodCtx.save();
            bloodCtx.fillStyle = '#8b0000';
            const drops = 6 + Math.floor(Math.random() * 5);
            for (let i = 0; i < drops; i++) {
                let angle = Math.random() * Math.PI * 2;
                let dist = Math.random() * 6;
                let bx = this.x + Math.cos(angle) * dist;
                let by = this.y + Math.sin(angle) * dist;
                let size = (Math.random() > 0.5) ? 1 : 2;
                bx = Math.floor(bx / 2) * 2;
                by = Math.floor(by / 2) * 2;
                bloodCtx.fillRect(bx, by, size, size);
            }

            let baseSprite = this.sprites[0];
            bloodCtx.translate(this.x, this.y + 4);
            bloodCtx.rotate((Math.random() - 0.5) * 1.2);
            if (baseSprite) {
                bloodCtx.drawImage(baseSprite, -16, -16, 32, 32);
            }

            bloodCtx.fillStyle = '#ff0000';
            for (let i = 0; i < 6; i++) {
                let rx = (Math.random() - 0.5) * 10;
                let ry = (Math.random() - 0.5) * 10;
                rx = Math.floor(rx / 2) * 2;
                ry = Math.floor(ry / 2) * 2;
                bloodCtx.fillRect(rx, ry, 2, 2);
            }
            bloodCtx.restore();
        }

        corpses.push({ x: this.x, y: this.y });
        if (corpses.length > 150) corpses.shift();
    }
}
