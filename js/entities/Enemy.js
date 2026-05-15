import { stats, state, customSquadDesign } from '../config.js';
import { getSoldierSprites, getSoldierBodySprites, getWeaponSprite, bloodCtx } from '../sprites.js';
import { createParticles } from './Particle.js';
import { corpses } from './Soldier.js';
import { updateHUD } from '../ui.js';

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.isEnemy = true; 
        this.lastShot = 0;   
        
        // Przypisanie zaawansowanych wariantów wrogów na podstawie fali i losowości
        let rand = Math.random();
        if (state.wave > 5 && rand < 0.1) {
            this.type = 'boss';
            this.hp = 25 + state.wave * 5;
            this.speed = 45;
            this.radius = 12;
            this.helmetIdx = 13; // Pancerz Głowy Bossa
            this.faceIdx = 12;   // Twarz Elitarnego Cyborga
            this.uniformIdx = 14; // Pancerz Bojowy Obcych
        } else if (state.wave > 4 && rand < 0.25) {
            this.type = 'commander';
            this.hp = 10 + state.wave * 2;
            this.speed = 80;
            this.helmetIdx = 12; // Hełm Dowódcy Wroga
            this.faceIdx = 8;    // Gniewne spojrzenie
            this.uniformIdx = 13; // Mundur Oficera Wroga
        } else if (state.wave > 3 && rand < 0.5) {
            this.type = 'elite';
            this.hp = 4 + Math.floor(state.wave * 1.0);
            this.speed = 115 + state.wave * 7;
            this.helmetIdx = 11; 
            this.faceIdx = 11;   
            this.uniformIdx = 12; 
        } else {
            this.type = 'standard';
            this.hp = 1 + Math.floor(state.wave * 0.5);
            this.speed = 60 + state.wave * 5;
            this.helmetIdx = 10; 
            this.faceIdx = 3;    
            this.uniformIdx = 10; 
        }
        
        this.maxHp = this.hp;
        this.accessoryIdx = 0;
        this.customImageSkin = null;

        // Wzorzec niestandardowy wroga z panelu Creator posiada bezwzględny priorytet
        if (customSquadDesign && customSquadDesign.enemy && customSquadDesign.enemy.isCustomized) {
            this.helmetIdx = customSquadDesign.enemy.helmetIdx;
            this.faceIdx = customSquadDesign.enemy.faceIdx;
            this.uniformIdx = customSquadDesign.enemy.uniformIdx;
            this.weaponIdx = customSquadDesign.enemy.weaponIdx;
            this.accessoryIdx = customSquadDesign.enemy.accessoryIdx;
            this.customImageSkin = customSquadDesign.enemy.customImageSkin;
        }

        // Zindywidualizowane parametry marszu
        this.animFrame = 0;
        this.walkCycle = Math.random() * Math.PI * 2;
        this.animSpeedMult = 0.8 + Math.random() * 0.4;
        this.bobY = 0;
        this.isMoving = false;
        this.facingLeft = false;
        
        this.updateSprites();
    }

    updateSprites() {
        this.effectiveWIdx = this.weaponIdx !== undefined ? this.weaponIdx : (customSquadDesign && customSquadDesign.customWeaponIdx !== undefined ? customSquadDesign.customWeaponIdx : 0);
        this.sprites = getSoldierSprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.effectiveWIdx, this.accessoryIdx);
        this.bodySprites = getSoldierBodySprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.accessoryIdx);
        this.weaponSprite = getWeaponSprite(this.effectiveWIdx);
    }

    update(dt) {
        let oldX = this.x;
        let oldY = this.y;

        // Podążanie za najbliższym członkiem oddziału gracza
        let closest = null;
        let minDist = Infinity;
        for (let s of state.squad) {
            let d = Math.hypot(s.x - this.x, s.y - this.y);
            if (d < minDist) { minDist = d; closest = s; }
        }

        if (this.isPanicking && this.panicTimer > 0) {
            this.panicTimer -= dt;
            let panicSpeed = this.speed * 2.8;
            let moveX = Math.cos(this.panicAngle) * panicSpeed * dt;
            this.x += moveX;
            this.y += Math.sin(this.panicAngle) * panicSpeed * dt;
            
            if (Math.abs(moveX) > 0.1) {
                this.facingLeft = moveX < 0;
            }
            
            // W trakcie paniki utrzymujemy wroga przy 1 punkcie życia, aby zdążył widowiskowo przebiec w płomieniach!
            if (this.hp <= 1) this.hp = 1;
            
            if (this.panicTimer <= 0) {
                this.isPanicking = false;
                this.hp = 0;
                this.die('flame');
            }
        } else if (closest) {
            let angle = Math.atan2(closest.y - this.y, closest.x - this.x);
            let moveX = Math.cos(angle) * this.speed * dt;
            this.x += moveX;
            this.y += Math.sin(angle) * this.speed * dt;

            if (Math.abs(moveX) > 0.1) {
                this.facingLeft = moveX < 0;
            }

            // Flocking - rozdzielanie jednostek na polu walki
            let forceX = 0;
            let forceY = 0;
            for (let other of state.enemies) {
                if (other !== this) {
                    let d = Math.hypot(other.x - this.x, other.y - this.y);
                    let sepDist = this.type === 'boss' ? 45 : 35;
                    if (d < sepDist && d > 0) { 
                        let push = (sepDist - d) * 3;
                        let pushAngle = Math.atan2(this.y - other.y, this.x - other.x);
                        forceX += Math.cos(pushAngle) * push;
                        forceY += Math.sin(pushAngle) * push;
                    }
                }
            }
            this.x += forceX * dt;
            this.y += forceY * dt;

            // Walka wręcz (Melee)
            if (minDist < (this.type === 'boss' ? 20 : 15) && this.lastShot <= 0) {
                let dmgAmount = this.type === 'boss' ? 3 : (this.type === 'commander' ? 2 : 1);
                closest.takeDamage(dmgAmount, this);
                this.lastShot = this.type === 'boss' ? 1.5 : 1.0;
            }
        }

        if (this.lastShot > 0) this.lastShot -= dt;
        if (this.onFireTimer > 0) this.onFireTimer -= dt;

        let distMoved = Math.hypot(this.x - oldX, this.y - oldY);
        let actualSpeed = distMoved / dt;

        if (actualSpeed > 5) {
            this.isMoving = true;
            this.walkCycle += dt * 10 * this.animSpeedMult;
            this.animFrame = Math.floor(this.walkCycle) % 4;
            this.bobY = Math.abs(Math.sin(this.walkCycle * Math.PI)) * (this.type === 'boss' ? 3 : 2);
        } else {
            this.isMoving = false;
            this.animFrame = 0;
            this.bobY = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        let rOffset = this.type === 'boss' ? 4 : 0;
        ctx.fillRect(this.x - 5 - rOffset, this.y + 10, 10 + rOffset*2, 2);
        ctx.fillRect(this.x - 7 - rOffset, this.y + 12, 14 + rOffset*2, 3);
        ctx.fillRect(this.x - 5 - rOffset, this.y + 15, 10 + rOffset*2, 2);
        ctx.restore();
        
        // 1. Czyste ciało wroga
        ctx.save();
        ctx.translate(this.x, this.y - this.bobY);
        if (this.facingLeft) {
            ctx.scale(-1, 1);
        }

        ctx.imageSmoothingEnabled = false;
        let drawScale = this.type === 'boss' ? 48 : 32;
        let offsetXY = this.type === 'boss' ? -24 : -16;

        if (this.customImageSkin) {
            let fh = this.customImageSkin.height;
            let totalFrames = Math.max(1, Math.round(this.customImageSkin.width / fh));
            if (totalFrames > 1) {
                let currentFrame = Math.floor(this.walkCycle * 1.5) % totalFrames;
                if (!this.isMoving) currentFrame = 0;
                let sx = currentFrame * fh;
                ctx.drawImage(this.customImageSkin, sx, 0, fh, fh, offsetXY, offsetXY, drawScale, drawScale);
            } else {
                ctx.drawImage(this.customImageSkin, offsetXY, offsetXY, drawScale, drawScale);
            }
        } else {
            let sprite = (this.bodySprites ? this.bodySprites[this.animFrame] : null) || this.sprites[this.animFrame] || this.sprites[0];
            ctx.drawImage(sprite, offsetXY, offsetXY, drawScale, drawScale);
        }
        ctx.restore();

        // 2. Obracający się model broni
        if (!this.customImageSkin && this.weaponSprite) {
            ctx.save();
            let closestHero = null;
            let minDist = Infinity;
            for (let s of state.squad) {
                let d = Math.hypot(s.x - this.x, s.y - this.y);
                if (d < minDist) { minDist = d; closestHero = s; }
            }
            
            let shoulderY = this.y - this.bobY + ((this.animFrame === 1 || this.animFrame === 3) ? 3 : 2);
            ctx.translate(this.x, shoulderY);
            
            let rotAngle = this.facingLeft ? Math.PI : 0;
            if (closestHero && minDist < 150) {
                rotAngle = Math.atan2(closestHero.y - shoulderY, closestHero.x - this.x);
            }
            
            ctx.rotate(rotAngle);
            if (Math.abs(rotAngle) > Math.PI / 2) {
                ctx.scale(1, -1);
            }
            ctx.imageSmoothingEnabled = false;
            let drawScale = this.type === 'boss' ? 48 : 32;
            let offsetXY = this.type === 'boss' ? -24 : -16;
            ctx.drawImage(this.weaponSprite, offsetXY, offsetXY, drawScale, drawScale);
            ctx.restore();
        }

        // Potężne, gęste płomienie trawiące całą sylwetkę wroga (w biegu paniki lub przed śmiercią)
        if (this.onFireTimer > 0 || this.isPanicking) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            let t = Date.now() / 40;
            for (let i = 0; i < 8; i++) {
                let fx = this.x - 12 + (i * 3) + Math.sin(t + i) * 4;
                let wave = Math.abs(Math.sin(t * 1.4 + i * 2.1)) * 16;
                let fy = this.y - this.bobY + 12 - wave;
                
                let px = Math.floor(fx / 2) * 2;
                let py = Math.floor(fy / 2) * 2;
                
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(px, py, 4, 4);
                if (wave > 4) {
                    ctx.fillStyle = '#ff8800';
                    ctx.fillRect(px + 1, py + 2, 2, 4);
                }
                if (i % 2 === 0 && wave > 8) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px + 1, py + 6, 2, 2);
                }
            }
            ctx.restore();
        }

        // Pasek zdrowia wroga
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 10, this.y - 12 - this.bobY, 20, 3);
            ctx.fillStyle = '#7cfc00';
            ctx.fillRect(this.x - 10, this.y - 12 - this.bobY, 20 * (this.hp/this.maxHp), 3);
        }
    }

    takeDamage(amount, shooter) {
        if (this.hp <= 0) return;
        
        if (shooter && shooter.weapon && shooter.weapon.type === 'flame') {
            this.onFireTimer = 0.5;
            if (!this.isPanicking && Math.random() < 0.65 && shooter.x !== undefined) {
                this.isPanicking = true;
                this.panicAngle = Math.atan2(this.y - shooter.y, this.x - shooter.x);
                this.panicTimer = 1.2;
            }
        }
        
        if (this.isPanicking && this.panicTimer > 0) {
            this.hp = Math.max(1, this.hp - amount);
            return;
        }
        
        this.hp -= amount;
        createParticles(this.x, this.y, '#ff0000', 3, 60);
        
        if (this.hp <= 0) {
            let deathType = shooter && shooter.weapon ? shooter.weapon.type : 'normal';
            this.die(deathType);
            if (shooter && shooter.kills !== undefined) shooter.kills++;
        }
    }

    die(deathType) {
        let isScorched = deathType === 'beam' || deathType === 'flame';
        if (bloodCtx) {
            bloodCtx.save();
            
            if (isScorched) {
                bloodCtx.fillStyle = '#1a0d00';
                const drops = 8 + Math.floor(Math.random() * 6);
                for (let i = 0; i < drops; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = Math.random() * 12;
                    let bx = Math.floor((this.x + Math.cos(angle) * dist) / 2) * 2;
                    let by = Math.floor((this.y + Math.sin(angle) * dist) / 2) * 2;
                    let size = Math.random() > 0.5 ? 2 : 4;
                    bloodCtx.fillRect(bx, by, size, size);
                }
                
                let baseSprite = this.sprites[0];
                bloodCtx.translate(this.x, this.y + 4);
                bloodCtx.rotate((Math.random() - 0.5) * 1.2);
                let drawScale = this.type === 'boss' ? 48 : 32;
                let customDead = (typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyDeadSkin && customSquadDesign.enemyDeadSkin.complete && customSquadDesign.enemyDeadSkin.width > 0) ? customSquadDesign.enemyDeadSkin : (this.customImageSkin && this.customImageSkin.complete && this.customImageSkin.width > 0 ? this.customImageSkin : null);
                
                if (customDead && customDead.height > 0) {
                    let fh = customDead.height;
                    bloodCtx.drawImage(customDead, 0, 0, fh, fh, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    bloodCtx.save();
                    bloodCtx.globalCompositeOperation = 'source-atop';
                    bloodCtx.fillStyle = 'rgba(15, 7, 0, 0.85)';
                    bloodCtx.fillRect(-drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    bloodCtx.restore();
                } else if (baseSprite) {
                    bloodCtx.drawImage(baseSprite, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    bloodCtx.save();
                    bloodCtx.globalCompositeOperation = 'source-atop';
                    bloodCtx.fillStyle = 'rgba(15, 7, 0, 0.85)';
                    bloodCtx.fillRect(-drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    bloodCtx.restore();
                }
                
                bloodCtx.fillStyle = deathType === 'beam' ? '#00ffff' : '#ff5500';
                for (let i = 0; i < 4; i++) {
                    let rx = Math.floor((Math.random() - 0.5) * 8 / 2) * 2;
                    let ry = Math.floor((Math.random() - 0.5) * 8 / 2) * 2;
                    bloodCtx.fillRect(rx, ry, 2, 2);
                }
                
                createParticles(this.x, this.y, '#3b240e', 10, 40);
                createParticles(this.x, this.y, '#5c4d41', 8, 30);
            } else {
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
                let drawScale = this.type === 'boss' ? 48 : 32;
                let customDead = (typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyDeadSkin && customSquadDesign.enemyDeadSkin.complete && customSquadDesign.enemyDeadSkin.width > 0) ? customSquadDesign.enemyDeadSkin : (this.customImageSkin && this.customImageSkin.complete && this.customImageSkin.width > 0 ? this.customImageSkin : null);
                
                if (customDead && customDead.height > 0) {
                    let fh = customDead.height;
                    bloodCtx.drawImage(customDead, 0, 0, fh, fh, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                } else if (baseSprite) {
                    bloodCtx.drawImage(baseSprite, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                }

                bloodCtx.fillStyle = '#ff0000';
                for (let i = 0; i < 6; i++) {
                    let rx = (Math.random() - 0.5) * 10;
                    let ry = (Math.random() - 0.5) * 10;
                    rx = Math.floor(rx / 2) * 2;
                    ry = Math.floor(ry / 2) * 2;
                    bloodCtx.fillRect(rx, ry, 2, 2);
                }
            }
            bloodCtx.restore();
        }

        corpses.push({ x: this.x, y: this.y, isScorched: isScorched, deathType: deathType, smokeTimer: isScorched ? 3.0 : 0, animTimer: 0 });
        if (corpses.length > 150) corpses.shift();

        state.enemiesAlive--;
        updateHUD();
    }
}
