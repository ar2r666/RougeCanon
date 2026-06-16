import { stats, state, customSquadDesign } from '../config.js';
import { getSoldierSprites, getSoldierBodySprites, getWeaponSprite, bloodCtx } from '../sprites.js';
import { createParticles } from './Particle.js';
import { corpses } from './Soldier.js';
import { updateHUD, chargeDoctrines } from '../ui.js';
import { CyberZombie } from './CyberZombie.js';

export class Enemy {
    constructor(x, y, forcedType = null) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.isEnemy = true; 
        this.lastShot = 0;   
        
        // Przypisanie zaawansowanych wariantów wrogów na podstawie fali i losowości
        // ... (zostawiamy bez zmian aż do takeDamage)
        let rand = Math.random();
        if (forcedType === 'boss' || (state.wave > 5 && rand < 0.1)) {
            this.type = 'boss';
            this.hp = forcedType === 'boss' ? (40 + state.wave * 10) : (25 + state.wave * 5);
            this.speed = 50;
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

        if (customSquadDesign && customSquadDesign.enemy && customSquadDesign.enemy.isCustomized) {
            this.helmetIdx = customSquadDesign.enemy.helmetIdx;
            this.faceIdx = customSquadDesign.enemy.faceIdx;
            this.uniformIdx = customSquadDesign.enemy.uniformIdx;
            this.weaponIdx = customSquadDesign.enemy.weaponIdx;
            this.accessoryIdx = customSquadDesign.enemy.accessoryIdx;
            this.customImageSkin = this.type === 'standard' ? customSquadDesign.enemy.customImageSkin : ((customSquadDesign.enemyEliteSkin && customSquadDesign.enemyEliteSkin.complete && customSquadDesign.enemyEliteSkin.width > 0) ? customSquadDesign.enemyEliteSkin : customSquadDesign.enemy.customImageSkin);
        }

        // Zindywidualizowane parametry marszu
        this.animFrame = 0;
        this.walkCycle = Math.random() * Math.PI * 2;
        this.animSpeedMult = 0.8 + Math.random() * 0.4;
        this.bobY = 0;
        this.isMoving = false;
        this.facingLeft = false;
        this.guardingCage = null; // Klatka, którą ten wróg ma pilnować
        this.guardTargetX = null;
        this.guardTargetY = null;
        
        this.updateSprites();
    }

    updateSprites() {
        this.effectiveWIdx = this.weaponIdx !== undefined ? this.weaponIdx : (customSquadDesign && customSquadDesign.customWeaponIdx !== undefined ? customSquadDesign.customWeaponIdx : 0);
        this.sprites = getSoldierSprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.effectiveWIdx, this.accessoryIdx);
        this.bodySprites = getSoldierBodySprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.accessoryIdx);
        this.weaponSprite = getWeaponSprite(this.effectiveWIdx);
    }

    update(dt) {
        if (this.hp <= 0) return; // Gwarancja przerwania aktualizacji martwych jednostek
        let oldX = this.x;
        let oldY = this.y;

        // Podążanie za najbliższym członkiem oddziału lub aktywnym wabikiem (Decoy)
        let closest = null;
        let minDist = Infinity;
        
        let potentialTargets = state.squad.filter(s => !s.isHiddenInBush); // 4. MISTRZ MASKOWANIA (Wrogowie ignorują ukrytych)
        if (state.decoys && state.decoys.length > 0) {
            potentialTargets = [...potentialTargets, ...state.decoys.filter(d => !d.isDestroyed)];
        }
        
        for (let s of potentialTargets) {
            let d = Math.hypot(s.x - this.x, s.y - this.y);
            if (s.isTurret) {
                d *= 0.5; // przyciąga wrogów mocniej (podwójny zasięg agresji)
            }
            if (d < minDist) { minDist = d; closest = s; }
        }

        // Siły pilnowania klatki: jeśli wróg pilnuje klatki, a dowódca/oddział jest daleko, wraca/krąży wokół klatki
        if (this.guardingCage && !this.guardingCage.isDestroyed) {
            if (minDist > 220) {
                // Dynamiczny patrol: wybierz losowy cel w pobliżu klatki i poruszaj się normalnie
                if (this.guardTargetX === null || Math.hypot(this.x - this.guardTargetX, this.y - this.guardTargetY) < 15) {
                    let patAng = Math.random() * Math.PI * 2;
                    let patDist = 30 + Math.random() * 60; // promień patrolowania
                    this.guardTargetX = this.guardingCage.x + Math.cos(patAng) * patDist;
                    this.guardTargetY = this.guardingCage.y + Math.sin(patAng) * patDist;
                }
                closest = { x: this.guardTargetX, y: this.guardTargetY };
            } else {
                // Jeśli gracz podszedł blisko, "budzimy" wroga (zapomina o pilnowaniu)
                this.guardingCage = null;
                this.guardTargetX = null;
                this.guardTargetY = null;
            }
        }

        if (this.isPanicking && this.panicTimer > 0) {
            this.panicTimer -= dt;
            let panicSpeed = this.speed * 1.8;
            let moveX = Math.cos(this.panicAngle) * panicSpeed * dt;
            this.x += moveX;
            this.y += Math.sin(this.panicAngle) * panicSpeed * dt;
            
            if (Math.abs(moveX) > 0.1) {
                this.facingLeft = moveX < 0;
            }
            
            if (this.hp <= 1) this.hp = 1; // Ochrona przed zgonem w trakcie widowiskowej ucieczki
            
            if (this.panicTimer <= 0) {
                this.isPanicking = false;
                this.hp = 0;
                this.die('flame');
            }
        } else if (closest) {
            let angle = Math.atan2(closest.y - this.y, closest.x - this.x);
            this.crawlAngle = angle; 
            let effectiveSpeed = this.isCrippled ? this.speed * 0.15 : this.speed; // 4. STRZAŁ W NOGI (Czołga się w stronę bohatera o 85% wolniej)
            let moveX = Math.cos(angle) * effectiveSpeed * dt;
            this.x += moveX;
            this.y += Math.sin(angle) * effectiveSpeed * dt;

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

        this.kbX = this.kbX || 0;
        this.kbY = this.kbY || 0;
        if (Math.abs(this.kbX) > 1 || Math.abs(this.kbY) > 1) {
            this.x += this.kbX * dt;
            this.y += this.kbY * dt;
            this.kbX *= Math.pow(0.02, dt);
            this.kbY *= Math.pow(0.02, dt);
        }

        if (this.lastShot > 0) this.lastShot -= dt;
        
        // 8. POCISKI ZAPALAJĄCE (Ciągłe obrażenia od ognia)
        if (this.onFireTimer > 0) {
            this.onFireTimer -= dt;
            this.takeDamage(dt * 3, { kills: 0 }); 
            if (Math.random() < 0.45) {
                createParticles(this.x, this.y, '#ff4500', 3, 30);
                createParticles(this.x, this.y - 8, '#222222', 2, 25);
            }
        }

        let distMoved = Math.hypot(this.x - oldX, this.y - oldY);
        let actualSpeed = distMoved / dt;

        if (actualSpeed > 5) {
            this.isMoving = true;
            this.walkCycle += dt * 10 * this.animSpeedMult;
            this.animFrame = Math.floor(this.walkCycle) % 4;
            this.bobY = Math.abs(Math.sin(this.walkCycle * Math.PI)) * (this.type === 'boss' ? 3 : (this.isCrippled ? 0.5 : 2));

            // Zostawianie subtelnego śladu krwi podczas czołgania się (STRZAŁ W NOGI)
            if (this.isCrippled && bloodCtx) {
                if (Math.random() < 0.15) { // Bardzo rzadkie krople (zdecydowanie mniejsza smuga)
                    bloodCtx.fillStyle = '#8b0000';
                    let bx = Math.floor((this.x + (Math.random() - 0.5) * 4) / 2) * 2;
                    let by = Math.floor((this.y + 6 + (Math.random() - 0.5) * 4) / 2) * 2;
                    bloodCtx.fillRect(bx, by, 1, 1);
                }
            }
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
        if (this.isCrippled) {
            ctx.save();
            ctx.translate(this.x, this.y + 6);
            ctx.rotate((this.crawlAngle || 0) + Math.PI / 2);
            // Podłużny, obracający się cień idealnie dopasowany do leżącej sylwetki czołgającego się wroga
            ctx.fillRect(-10 - rOffset, -14 - rOffset, 20 + rOffset*2, 28 + rOffset*2);
            ctx.restore();
        } else {
            ctx.fillRect(this.x - 5 - rOffset, this.y + 10, 10 + rOffset*2, 2);
            ctx.fillRect(this.x - 7 - rOffset, this.y + 12, 14 + rOffset*2, 3);
            ctx.fillRect(this.x - 5 - rOffset, this.y + 15, 10 + rOffset*2, 2);
        }
        ctx.restore();
        
        let drawScale = this.type === 'boss' ? 48 : 32;
        let offsetXY = this.type === 'boss' ? -24 : -16;

        // Transformacja czołgania się (Używa grafiki leżących zwłok obróconych dokładnie głową do bohatera)
        if (this.isCrippled) {
            ctx.save();
            ctx.translate(this.x, this.y + 6); // Obniżone do poziomu gruntu/cienia
            ctx.rotate((this.crawlAngle || 0) + Math.PI / 2); // Głowa wskazuje bezbłędnie w stronę bohatera
            ctx.imageSmoothingEnabled = false;

            let isElite = this.type !== 'standard';
            let customDead = isElite ? 
                ((typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyEliteDeadSkin && customSquadDesign.enemyEliteDeadSkin.complete && customSquadDesign.enemyEliteDeadSkin.width > 0) ? customSquadDesign.enemyEliteDeadSkin : null) :
                ((typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyDeadSkin && customSquadDesign.enemyDeadSkin.complete && customSquadDesign.enemyDeadSkin.width > 0) ? customSquadDesign.enemyDeadSkin : null);

            if (customDead) {
                let sW = Math.min(customDead.width, customDead.height);
                let sH = Math.min(customDead.height, customDead.width);
                ctx.drawImage(customDead, 0, 0, sW, sH, offsetXY, offsetXY, drawScale, drawScale);
            } else {
                let sprite = (this.bodySprites ? this.bodySprites[this.animFrame] : null) || this.sprites[this.animFrame] || this.sprites[0];
                ctx.drawImage(sprite, offsetXY, offsetXY, drawScale, drawScale);
            }
            ctx.restore();
            return;
        }

        // 1. Czyste stojące ciało wroga (Dla normalnego chodu)
        ctx.save();
        ctx.translate(this.x, this.y - this.bobY);
        if (this.facingLeft) {
            ctx.scale(-1, 1);
        }
        ctx.imageSmoothingEnabled = false;

        if (this.customImageSkin && this.customImageSkin.complete && this.customImageSkin.width > 0 && this.customImageSkin.height > 0) {
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
                let fx = this.x - 8 + (i * 2) + Math.sin(t + i) * 2;
                let wave = Math.abs(Math.sin(t * 1.5 + i * 2.1)) * 14;
                let fy = this.y - this.bobY + 8 - wave;
                
                let px = Math.floor(fx / 2) * 2;
                let py = Math.floor(fy / 2) * 2;
                
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(px, py, 2, 2);
                if (wave > 3) {
                    ctx.fillStyle = '#ff8800';
                    ctx.fillRect(px, py + 2, 2, 2);
                }
                if (i % 2 === 0 && wave > 6) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px, py + 4, 2, 2);
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

    applyKnockback(vx, vy) {
        this.kbX = (this.kbX || 0) + vx;
        this.kbY = (this.kbY || 0) + vy;
    }

    takeDamage(amount, shooter, isHeadshot = false) {
        if (this.hp <= 0) return;
        
        if (shooter && shooter.weapon && shooter.weapon.type === 'flame') {
            this.onFireTimer = 0.5;
            if (!this.isPanicking && Math.random() < 0.65 && shooter.x !== undefined) {
                this.isPanicking = true;
                this.panicAngle = Math.atan2(this.y - shooter.y, this.x - shooter.x);
                this.panicTimer = 0.5; // Zredukowany czas ucieczki (krótki, widowiskowy zryw)
            }
        }
        
        if (this.isPanicking && this.panicTimer > 0) {
            this.hp = Math.max(1, this.hp - amount);
            return;
        }
        
        this.hp -= amount;
        createParticles(this.x, this.y, '#ff0000', 3, 60);

        if (isHeadshot && this.hp > 0) {
            // Wróg przetrwał headshot (np. elita/boss), ale krew i tak rozbryzguje się na ziemi!
            if (bloodCtx) {
                bloodCtx.save();
                let shotAngle = shooter ? Math.atan2(this.y - shooter.y, this.x - shooter.x) : Math.random() * Math.PI * 2;
                
                // Mniejsza wersja ciemnego rdzenia
                bloodCtx.fillStyle = '#550000';
                for (let i = 0; i < 15; i++) {
                    let angle = shotAngle + (Math.random() - 0.5) * 0.8;
                    let dist = Math.random() * 8;
                    let bx = Math.floor(this.x + Math.cos(angle) * dist);
                    let by = Math.floor(this.y + 4 + Math.sin(angle) * dist);
                    let pSize = Math.random() > 0.4 ? 1 : 2;
                    bloodCtx.fillRect(bx, by, pSize, pSize);
                }

                // Drobna smuga świeżej krwi mieszanej z jasną czerwienią
                let colors = ['#8a0000', '#d01a1a', '#ff3333'];
                const drops = 25 + Math.floor(Math.random() * 15);
                for (let i = 0; i < drops; i++) {
                    let dist = Math.random() * 35; // krótszy rozbryzg
                    let spread = 0.3 + (dist / 35) * 0.45;
                    let angle = shotAngle + (Math.random() - 0.5) * spread;
                    
                    let ox = (Math.random() - 0.5) * 3;
                    let oy = (Math.random() - 0.5) * 3;
                    let bx = Math.floor(this.x + ox + Math.cos(angle) * dist);
                    let by = Math.floor(this.y + 4 + oy + Math.sin(angle) * dist);
                    let pSize = Math.random() > 0.7 ? 2 : 1;
                    
                    bloodCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    bloodCtx.fillRect(bx, by, pSize, pSize);
                }
                bloodCtx.restore();
            }
        }
        
        if (this.hp <= 0) {
            let deathType = shooter && shooter.weapon ? shooter.weapon.type : 'normal';
            if (isHeadshot) deathType = 'headshot';
            if (this.onFireTimer > 0 || state.passiveIncendiaryActive) deathType = 'flame'; // 8. ZAPALAJĄCE (zwłoki płoną)
            
            this.die(deathType);
            if (shooter && shooter.kills !== undefined) shooter.kills++;
            
            // Ożywianie wroga jako przyjaznego Cyber-Zombie (Nekromancja)
            if (state.passiveNecromancyActive && Math.random() < 0.1) {
                if (state.companions) {
                    state.companions.push(new CyberZombie(this.x, this.y));
                    createParticles(this.x, this.y, '#2ecc71', 15, 60); // Zielony wybuch reanimacji
                }
            }

            chargeDoctrines(); // Ładowanie Doktryn Taktycznych w locie
        }
    }

    die(deathType) {
        let vx = this.kbX || 0;
        let vy = this.kbY || 0;
        let force = Math.hypot(vx, vy);
        if (force < 45) {
            // Domyślny mały odrzut, jeśli śmierć nastąpiła bez knockbacku
            let angle = Math.atan2(this.y - (state.camera ? state.camera.y : this.y), this.x - (state.camera ? state.camera.x : this.x));
            vx = Math.cos(angle) * 75;
            vy = Math.sin(angle) * 75;
        }

        let isScorched = deathType === 'flame' || deathType === 'beam';
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
                    let size = Math.random() > 0.5 ? 1 : 2; // Tylko drobne piksele
                    bloodCtx.fillRect(bx, by, size, size);
                }
                
                bloodCtx.fillStyle = '#1a0d00';
                for (let i = 0; i < 12; i++) {
                    let rx = Math.floor((this.x + (Math.random() - 0.5) * 16) / 2) * 2;
                    let ry = Math.floor((this.y + (Math.random() - 0.5) * 16) / 2) * 2;
                    bloodCtx.fillRect(rx, ry, 2, 2);
                }
                
                createParticles(this.x, this.y, '#3b240e', 10, 40);
                createParticles(this.x, this.y, '#5c4d41', 8, 30);
            } else if (deathType === 'headshot') {
                // Kierunkowy rozbryzg krwi przy headshocie (smuga w kierunku lotu pocisku)
                let shotAngle = Math.atan2(vy, vx);
                
                // 1. Podstawowy ciemny rdzeń wyjściowy przy głowie
                bloodCtx.fillStyle = '#550000'; // Bardzo ciemna krew
                for (let i = 0; i < 40; i++) {
                    let angle = shotAngle + (Math.random() - 0.5) * 0.9;
                    let dist = Math.random() * 12;
                    let bx = Math.floor(this.x + Math.cos(angle) * dist);
                    let by = Math.floor(this.y + 4 + Math.sin(angle) * dist);
                    let pSize = Math.random() > 0.4 ? 1 : 2;
                    bloodCtx.fillRect(bx, by, pSize, pSize);
                }

                // 2. Długa, rozproszona smuga jasnej/świeżej krwi lecąca w kierunku strzału (wydłużona do 75px, mieszana z jasnoczerwonym)
                let colors = ['#8a0000', '#d01a1a', '#ff3333'];
                const drops = 80 + Math.floor(Math.random() * 40);
                for (let i = 0; i < drops; i++) {
                    // Cząsteczki lecą do przodu - im dalej, tym bardziej się rozpraszają
                    let dist = Math.random() * 75; 
                    let spread = 0.25 + (dist / 75) * 0.5; // Stożkowy kształt rozbryzgu
                    let angle = shotAngle + (Math.random() - 0.5) * spread;
                    
                    // Lekki randomowy offset punktu wylotowego (dla różnorodności)
                    let ox = (Math.random() - 0.5) * 4;
                    let oy = (Math.random() - 0.5) * 4;
                    
                    let bx = Math.floor(this.x + ox + Math.cos(angle) * dist);
                    let by = Math.floor(this.y + 4 + oy + Math.sin(angle) * dist);
                    let pSize = Math.random() > 0.7 ? 2 : 1; // Tylko 1 i 2 piksele!
                    
                    bloodCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    bloodCtx.fillRect(bx, by, pSize, pSize);
                }
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
            }
            bloodCtx.restore();
        }

        // --- OKREŚLENIE FIZYKI ŚMIERCI I DODANIE DO TABLICY ---
        let approach = 'slide';
        if (this.type === 'boss' || this.type !== 'standard') {
            approach = 'heavy';
        } else {
            if (deathType === 'explosive') approach = 'bounce';
            else if (deathType === 'headshot') approach = 'spin';
        }

        if (state.dyingBodies) {
            let isSlide = approach === 'slide';
            let tAngle = 0;
            if (isSlide) {
                tAngle = (vx > 0 ? 1 : -1) * (Math.PI / 2 + (Math.random() - 0.5) * 0.5);
            } else if (approach === 'heavy') {
                tAngle = -Math.PI / (5.0 + Math.random() * 2.0);
            } else if (approach === 'bounce') {
                tAngle = -Math.PI / 2.1 + (Math.random() - 0.5) * 0.35;
            }

            state.dyingBodies.push({
                x: this.x,
                y: this.y,
                vx: vx * (isSlide ? 1.4 : (approach === 'bounce' ? 1.3 : 1.0)), // Zwiększony poziomy odrzut przy wybuchu
                vy: vy * (isSlide ? 1.4 : (approach === 'bounce' ? 1.3 : 1.0)),
                bY: 0,
                bVy: approach === 'bounce' ? -320 - Math.random() * 180 : 0, // Zwiększona prędkość pionowa (mocniejszy wyskok)
                angle: 0,
                targetAngle: tAngle,
                spinSpeed: isSlide ? (Math.random() - 0.5) * 12 : (approach === 'spin' ? (vx > 0 ? 15 : -15) : (approach === 'bounce' ? (vx > 0 ? 14 + Math.random() * 8 : -14 - Math.random() * 8) : 0)), // Koziołkowanie w locie przy wybuchu
                timer: approach === 'heavy' ? 0.9 : (approach === 'bounce' ? 1.25 : (isSlide ? 1.1 : 0.65)), // Wydłużony czas życia dla odbijających się ciał, aby dokończyły ruch
                maxTimer: approach === 'heavy' ? 0.9 : (approach === 'bounce' ? 1.25 : (isSlide ? 1.1 : 0.65)),
                crumpleY: 0,
                shake: this.type === 'boss' ? 7 : (approach === 'heavy' ? 4 : 0),
                approach: approach,
                deathType: deathType,
                sprites: this.sprites,
                customImageSkin: this.customImageSkin,
                type: this.type,
                facingLeft: this.facingLeft,
                particles: [],
                draw: function(ctx) {
                    ctx.save();
                    
                    let ox = 0, oy = 0;
                    if (this.approach === 'heavy' && this.shake > 0) {
                        ox = (Math.random() - 0.5) * this.shake;
                        oy = (Math.random() - 0.5) * this.shake;
                    }
                    
                    ctx.translate(this.x + ox, this.y + (this.bY || 0) + oy);
                    ctx.rotate(this.angle);
                    
                    let drawScale = this.type === 'boss' ? 48 : 32;
                    let scaleY = this.approach === 'boss' ? Math.max(0.3, 1.0 - (this.crumpleY / 14)) : 1.0;
                    if (this.approach === 'boss') {
                        ctx.scale(1.2, scaleY);
                    }
                    
                    let baseSprite = this.sprites ? this.sprites[0] : null;
                    let isElite = this.type !== 'standard';
                    let customDead = isElite ? 
                        ((typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyEliteDeadSkin && customSquadDesign.enemyEliteDeadSkin.complete && customSquadDesign.enemyEliteDeadSkin.width > 0) ? customSquadDesign.enemyEliteDeadSkin : (this.customImageSkin && this.customImageSkin.complete && this.customImageSkin.width > 0 ? this.customImageSkin : null)) :
                        ((typeof customSquadDesign !== 'undefined' && customSquadDesign && customSquadDesign.enemyDeadSkin && customSquadDesign.enemyDeadSkin.complete && customSquadDesign.enemyDeadSkin.width > 0) ? customSquadDesign.enemyDeadSkin : (this.customImageSkin && this.customImageSkin.complete && this.customImageSkin.width > 0 ? this.customImageSkin : null));
                    
                    if (customDead && customDead.width > 0 && customDead.height > 0) {
                        let sW = Math.min(customDead.width, customDead.height);
                        let sH = Math.min(customDead.height, customDead.width);
                        ctx.drawImage(customDead, 0, 0, sW, sH, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    } else if (baseSprite) {
                        ctx.drawImage(baseSprite, -drawScale / 2, -drawScale / 2, drawScale, drawScale);
                    }
                    
                    ctx.restore();
                }
            });
        }

        state.enemiesAlive--;
        // Eliminacja synchronicznego wymuszania przebudowy DOM (layout thrashing) w pętli kolizji
    }
}
