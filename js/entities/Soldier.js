import { stats, state, WEAPONS, NAMES, customSquadDesign } from '../config.js';
import { getSoldierSprites, getSoldierBodySprites, getWeaponSprite, bloodCtx } from '../sprites.js';
import { createParticles, createAuraRing } from './Particle.js';
import { Bullet } from './Bullet.js';
import { PlasmaBeam } from './PlasmaBeam.js';
import { playSound } from '../sfx.js';
import { Explosion } from './Explosion.js';
import { Crate } from './Crate.js';
import { Medkit } from './Medkit.js';
import { Turret } from './Turret.js';
import { FieldMine } from './FieldMine.js';
import { CLASS_SKILL_TREES } from '../promotions.js';

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
    constructor(x, y, classOverride = null) {
        this.x = x;
        this.y = y;
        this.isEnemy = false;
        this.speed = stats.speed;
        this.maxHp = Math.max(1, 3 - (state.passivePervitinLevel || (state.passivePervitinActive ? 1 : 0)));
        this.hp = this.maxHp;
        this.maxArmor = state.kevlarArmorLevel || 0; // 2. KAMIZELKA KEVLAROWA
        this.armor = this.maxArmor;
        this.isHiddenInBush = false; // 4. MISTRZ MASKOWANIA
        this.bushStealthTimer = 0;
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
        this.aimAngle = this.facingLeft ? Math.PI : 0;
        
        this.accessoryIdx = 0;
        this.customImageSkin = null;
        
        this.name = getUniqueName();
        this.kills = 0;
        this.weapon = WEAPONS.DEFAULT;
        this.storedWeapon = null;
        this.specialWeaponTimer = 0;
        this.isPromoted = false;
        
        let squadIndex = state.squad ? state.squad.length : 0;
        let activeClasses = state.squad ? state.squad.map(s => s.soldierClass).filter(Boolean) : [];
        
        let chosenClass = classOverride;
        if (!chosenClass) {
            // Jeśli brak Dowódcy (np. na starcie), pierwszy zyskuje tę klasę
            if (squadIndex === 0 && !activeClasses.includes('COMMANDER')) {
                chosenClass = 'COMMANDER';
            } else if (!activeClasses.includes('MEDIC')) {
                chosenClass = 'MEDIC';
            } else if (!activeClasses.includes('ENGINEER')) {
                chosenClass = 'ENGINEER';
            } else if (!activeClasses.includes('SNIPER')) {
                chosenClass = 'SNIPER';
            } else if (!activeClasses.includes('HEAVY_GUNNER')) {
                chosenClass = 'HEAVY_GUNNER';
            } else {
                // W razie posiadania już wszystkich, następny staje się kolejnym Heavy Gunnerem
                chosenClass = 'HEAVY_GUNNER';
            }
        }
        
        this.soldierClass = chosenClass;
        this.treeALvl = 0;
        this.treeBLvl = 0;
        this.unlockedSkills = {};
        
        if (chosenClass === 'COMMANDER') {
            // DOWÓDCA (Squad Commander) - podlega modyfikacjom z kreatora ADMIN
            let targetCfg = customSquadDesign.hero;
            if (targetCfg && targetCfg.isCustomized) {
                this.helmetIdx = targetCfg.helmetIdx;
                this.faceIdx = targetCfg.faceIdx;
                this.uniformIdx = targetCfg.uniformIdx;
                this.weaponIdx = targetCfg.weaponIdx;
                this.accessoryIdx = targetCfg.accessoryIdx;
                
                if (this.weaponIdx === 0) this.weapon = WEAPONS.DEFAULT; // M16 (Burst)
                else if (this.weaponIdx === 1) this.weapon = WEAPONS.SHOTGUN; // Strzelba
                else if (this.weaponIdx === 2) this.weapon = WEAPONS.RIFLE_GARAND; // M1 Garand (Semi-Auto)
                else if (this.weaponIdx === 3) this.weapon = WEAPONS.HEAVY_SAW; // M249 SAW (Karabin Maszynowy)
                else if (this.weaponIdx === 4) this.weapon = WEAPONS.RIFLE_SMG; // PM Uzi / Pistolet (Rapid)
                else this.weapon = WEAPONS.DEFAULT;
                
                let activeSkins = customSquadDesign.heroSkins ? customSquadDesign.heroSkins.filter(Boolean) : [];
                if (activeSkins.length > 0) {
                    this.customImageSkin = activeSkins[0];
                } else {
                    this.customImageSkin = targetCfg.customImageSkin;
                }
            } else {
                this.helmetIdx = 0;
                this.faceIdx = 6; // Weteran (Broda)
                this.uniformIdx = 0; // Zielony Kamuflaż
                this.weapon = WEAPONS.DEFAULT;
            }
        } else {
            if (chosenClass === 'MEDIC') {
                // MEDYK (Medic) - PM Uzi, Czapka, Mundur Medyka, Plecak Radio
                this.helmetIdx = 4;
                this.faceIdx = 0;
                this.uniformIdx = 4;
                this.accessoryIdx = 5;
                this.weapon = WEAPONS.RIFLE_SMG;
            } else if (chosenClass === 'ENGINEER') {
                // INŻYNIER (Engineer) - Strzelba, Hełm ONZ, Stalowy Pancerz, Tarcza
                this.helmetIdx = 2;
                this.faceIdx = 8;
                this.uniformIdx = 6;
                this.accessoryIdx = 6;
                this.weapon = WEAPONS.SHOTGUN;
            } else if (chosenClass === 'SNIPER') {
                // SNAJPER (Sniper) - M1 Garand, Bandana, Czerń
                this.helmetIdx = 3;
                this.faceIdx = 4;
                this.uniformIdx = 3;
                this.accessoryIdx = 0;
                this.weapon = WEAPONS.RIFLE_GARAND;
            } else if (chosenClass === 'HEAVY_GUNNER') {
                // HEAVY GUNNER (Ciężki Strzelec) - M249 SAW, Irokez, Pustynna, Pas z amunicją
                this.helmetIdx = 7;
                this.faceIdx = 8;
                this.uniformIdx = 1;
                this.accessoryIdx = 9;
                this.weapon = WEAPONS.HEAVY_SAW;
            }
        }
        
        this.updateSprites();
    }

    updateSprites() {
        this.effectiveWIdx = (this.weapon && this.weapon !== WEAPONS.DEFAULT) ? this.weapon.visualIdx : (this.weaponIdx !== undefined ? this.weaponIdx : (customSquadDesign && customSquadDesign.customWeaponIdx !== undefined ? customSquadDesign.customWeaponIdx : 0));
        this.sprites = getSoldierSprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.effectiveWIdx, this.accessoryIdx);
        this.bodySprites = getSoldierBodySprites(this.helmetIdx, this.faceIdx, this.uniformIdx, this.accessoryIdx);
        this.weaponSprite = getWeaponSprite(this.effectiveWIdx);
    }

    getEffectiveFireRate() {
        if (!this.weapon) return stats.fireRate / 1000;
        let fireRate = (stats.fireRate * this.weapon.fireRateMult) / 1000;
        if (state.passiveAmmoBeltLevel && state.passiveAmmoBeltLevel > 0) {
            fireRate *= Math.pow(0.8, state.passiveAmmoBeltLevel); 
        } else if (state.passiveAmmoBeltActive) {
            fireRate *= 0.8; 
        }
        return fireRate;
    }

    update(dt) {
        if (this.hp <= 0) return;
        if (this.isHiddenInBush) {
            this.isMoving = false;
            return;
        }

        if (this.soldierClass === 'COMMANDER' && this.unlockedSkills && this.unlockedSkills['comm_b1']) {
            if (this.battleCryTimer === undefined) this.battleCryTimer = 5.0;
            this.battleCryTimer -= dt;
            if (this.battleCryTimer <= 0) {
                this.battleCryTimer = 30.0;
                state.squadBuffTimer = 6.0;
                playSound('sfx_commander_war_scream', 0.11);
                createAuraRing(this.x, this.y, '#f39c12');
                createParticles(this.x, this.y, '#f39c12', 20, 50);
                console.warn(`[OKRZYK BOJOWY] Dowódca wydał okrzyk dający +35% do prędkości ruchu i strzelania na 6s!`);
            }
        }

        if (this.soldierClass === 'MEDIC') {
            if (this.medkitTimer === undefined) this.medkitTimer = 20.0;
            this.medkitTimer -= dt;
            if (this.medkitTimer <= 0) {
                this.medkitTimer = 20.0;
                if (state.medkits) {
                    let throwAng = Math.random() * Math.PI * 2;
                    let throwDist = 18 + Math.random() * 8;
                    let dropX = this.x + Math.cos(throwAng) * throwDist;
                    let dropY = this.y + Math.sin(throwAng) * throwDist;
                    
                    state.medkits.push(new Medkit(dropX, dropY));
                    playSound('sfx_click', 0.4); 
                    createParticles(dropX, dropY, '#39ff14', 8, 20);
                }
            }
        }

        // --- CECHA INŻYNIERA (Rozstawianie wieżyczki przyciągającej wrogów) ---
        if (this.soldierClass === 'ENGINEER') {
            if (!this.activeTurret || this.activeTurret.isDestroyed) {
                if (this.turretDeployCooldown === undefined) this.turretDeployCooldown = 0;
                if (this.turretDeployCooldown > 0) {
                    this.turretDeployCooldown -= dt;
                } else {
                    this.turretDeployCooldown = 5.0; // 5s cooldown po zniszczeniu przed kolejnym rozstawieniem
                    let turret = new Turret(this.x, this.y + 12, this);
                    this.activeTurret = turret;
                    if (state.decoys) {
                        state.decoys.push(turret);
                        playSound('sfx_crate_destroy', 0.45);
                        createParticles(this.x, this.y + 12, '#00ffff', 15, 30);
                    }
                }
            }
        }

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


        // 4. MISTRZ MASKOWANIA (Koordynowany centralnie dla całego składu w main.js)

        // Flocking oddziału gracza
        let forceX = 0;
        let forceY = 0;
        let flockStrength = state.passiveFlockingBoostActive ? 7.5 : 3; // 1. ZWARTA GRUPA (Ponad 2x siła przyciągania!)
        for (let other of state.squad) {
            if (other !== this) {
                let d = Math.hypot(other.x - this.x, other.y - this.y);
                if (d < 45 && d > 0) { 
                    let push = (45 - d) * flockStrength;
                    let angle = Math.atan2(this.y - other.y, this.x - other.x);
                    forceX += Math.cos(angle) * push;
                    forceY += Math.sin(angle) * push;
                }
            }
        }
        this.x += forceX * dt;
        this.y += forceY * dt;
        
        // 1. Dodatkowe dociąganie do Lidera (ZWARTA GRUPA) dla absolutnej dyscypliny w marszu
        if (state.passiveFlockingBoostActive && this !== state.squad[0] && state.squad[0]) {
            let leader = state.squad[0];
            let d = Math.hypot(leader.x - this.x, leader.y - this.y);
            if (d > 25) {
                let ang = Math.atan2(leader.y - this.y, leader.x - this.x);
                let pull = (d - 25) * 10;
                this.x += Math.cos(ang) * pull * dt;
                this.y += Math.sin(ang) * pull * dt;
            }
        }

        // Aplikacja knockbacku fizycznego na sojusznika (wyhamowanie w dżungli)
        this.kbX = this.kbX || 0;
        this.kbY = this.kbY || 0;
        if (Math.abs(this.kbX) > 1 || Math.abs(this.kbY) > 1) {
            this.x += this.kbX * dt;
            this.y += this.kbY * dt;
            this.kbX *= Math.pow(0.02, dt);
            this.kbY *= Math.pow(0.02, dt);
        }

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

        // 2. BAGNETY (Zbalansowana walka w zwarciu: 2 obrażenia, łagodny odrzut, 1.2s cooldownu)
        if (state.passiveBayonetsActive && state.enemies) {
            this.bayonetCooldown = (this.bayonetCooldown || 0) - dt;
            if (this.bayonetCooldown <= 0) {
                for (let e of state.enemies) {
                    if (e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) < this.radius + e.radius + 5) {
                        e.takeDamage(2 * (state.passiveBayonetsLevel || 1), { kills: 0 }); 
                        createParticles(e.x, e.y, '#ff0000', 6, 35);
                        playSound('sfx_shoot_stab', 0.55);
                        if (typeof e.applyKnockback === 'function') {
                            let ang = Math.atan2(e.y - this.y, e.x - this.x);
                            e.applyKnockback(Math.cos(ang) * 120, Math.sin(ang) * 120); 
                        }
                        this.bayonetCooldown = 1.2; // Indywidualna blokada przed ciągłym spamem
                        break; // Tylko 1 cel na pchnięcie
                    }
                }
            }
        }

        // 3. BOOBY TRAP (30% na założenie miny przy przejściu przez zwłoki)
        if (state.passiveBoobyTrapActive && typeof corpses !== 'undefined' && corpses) {
            this.boobyTrapCooldown = (this.boobyTrapCooldown || 0) - dt;
            if (this.boobyTrapCooldown <= 0) {
                for (let c of corpses) {
                    if (!c.hasBoobyTrap && Math.hypot(c.x - this.x, c.y - this.y) < 18) {
                        c.hasBoobyTrap = true;
                        if (Math.random() < 0.30) {
                            if (state.fieldMines) {
                                state.fieldMines.push(new FieldMine(c.x, c.y, this, true));
                                createParticles(c.x, c.y, '#ffaa00', 10, 30);
                                playSound('sfx_click', 0.5);
                            }
                        }
                        this.boobyTrapCooldown = 0.4;
                        break;
                    }
                }
            }
        }

        // Automatyczny ogień do wrogów, skrzynek, klatek z jeńcami oraz ufortyfikowanych magazynów wroga
        let possibleTargets = [
            ...state.enemies,
            ...(state.crates ? state.crates.filter(c => !c.isDestroyed) : []),
            ...(state.prisonerCages ? state.prisonerCages.filter(c => !c.isDestroyed) : []),
            ...(state.enemyDepots ? state.enemyDepots.filter(d => !d.isDestroyed) : [])
        ];
        let closest = null;
        let baseRange = this.soldierClass === 'SNIPER' ? stats.range * 2.2 : stats.range;
        let minDist = this.weapon.type === 'beam' ? baseRange * 1.5 : (this.weapon.type === 'explosive' ? baseRange * 1.3 : baseRange);
        
        let aimTarget = null;
        if (state.aimOnlyMode) {
            // Szukamy wroga w promieniu 45px od celownika myszy
            let cursorTargets = possibleTargets.filter(e => Math.hypot(e.x - state.aimPoint.x, e.y - state.aimPoint.y) < 45);
            let nearestToCursor = null;
            let minCursorDist = Infinity;
            for (let e of cursorTargets) {
                let d = Math.hypot(e.x - state.aimPoint.x, e.y - state.aimPoint.y);
                if (d < minCursorDist) { minCursorDist = d; nearestToCursor = e; }
            }
            
            // Celujemy zawsze w kierunku wskaźnika myszy
            aimTarget = { x: state.aimPoint.x, y: state.aimPoint.y };
            
            // Strzelamy tylko wtedy, gdy wciśnięty jest przycisk myszy
            if (state.isPointerDown) {
                closest = nearestToCursor || { x: state.aimPoint.x, y: state.aimPoint.y, hp: 9999, takeDamage: () => {} };
            }
        } else {
            // Domyślny tryb: auto-aim na najbliższy cel w zasięgu
            for (let e of possibleTargets) {
                let d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minDist) { minDist = d; closest = e; }
            }
            aimTarget = closest;
        }

        // Płynny obrót w stronę celu celowania
        if (aimTarget) {
            let targetAngle = Math.atan2(aimTarget.y - this.y, aimTarget.x - this.x);
            let diff = targetAngle - this.aimAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            let rotSpeed = this.weapon.type === 'flame' ? 8.5 : 32.0;
            this.aimAngle += diff * rotSpeed * dt;
            
            while (this.aimAngle < -Math.PI) this.aimAngle += Math.PI * 2;
            while (this.aimAngle > Math.PI) this.aimAngle -= Math.PI * 2;
        } else {
            // Płynny powrót do kierunku marszu, jeśli brak celu
            let targetAngle = this.facingLeft ? Math.PI : 0;
            let diff = targetAngle - this.aimAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.aimAngle += diff * 5.0 * dt;
        }

        if (this.lastShot <= 0 && closest) {
            let targetAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
            let aimDiff = targetAngle - this.aimAngle;
            while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;
            while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
            
            // Poczekaj z pociągnięciem za spust, aż lufa zostanie wycelowana w stronę wroga (~14 stopni)
            if (Math.abs(aimDiff) > 0.25) {
                return;
            }
            
            let angle = this.aimAngle;
            let fireRate = this.getEffectiveFireRate();
            let dmg = stats.damage * this.weapon.damageMult;
            
            if (this.weapon.type === 'beam') {
                let dirX = Math.cos(angle);
                let dirY = Math.sin(angle);
                let normX = -Math.sin(angle);
                let normY = Math.cos(angle);
                let shoulderY = this.y - this.bobY + ((this.animFrame === 1 || this.animFrame === 3) ? 3 : 2);
                let startBeamX = this.x + dirX * 16 + normX * 3;
                let startBeamY = shoulderY + dirY * 16 + normY * 3;
                state.bullets.push(new PlasmaBeam(startBeamX, startBeamY, closest, dmg, this));
            } else if (this.weapon.type === 'flame') {
                playSound('sfx_shoot_fire', 0.28); // Podbicie głośności Miotacza Ognia
                
                // Stożkowe rażenie wrogów, skrzynek, klatek i bunkrów w zasięgu lufy
                let flameRange = stats.range * 0.9;
                for (let e of possibleTargets) {
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
                // Zgodnie z dyspozycją: ekstremalnie skupiony wachlarz 7 śrucin o zabójczym kącie rażenia
                const spreadAngles = [-0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15];
                for (let angOffset of spreadAngles) {
                    let bAng = angle + angOffset + (Math.random() - 0.5) * 0.03;
                    state.bullets.push(new Bullet(this, this.x, this.y, bAng, false, dmg, this.weapon));
                }
                playSound('sfx_shoot_shotgun', 0.035);
                
                // Zgodnie z instrukcją: przeładowanie strzelby (wyrzut łuski, odrzut pump) następuje od razu po strzale
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
            } else if (this.weapon.type === 'semi') {
                // Półautomatyczny M1 Garand (Wolny, celny, potężny odrzut i particle łuski)
                let finalDmg = dmg;
                let isCrit = false;
                if (this.soldierClass === 'SNIPER' && Math.random() < 0.40) {
                    finalDmg = dmg * 3;
                    isCrit = true;
                }
                
                let bullet = new Bullet(this, this.x, this.y, angle, false, finalDmg, this.weapon);
                if (isCrit) {
                    bullet.isCrit = true;
                }
                
                if (this.soldierClass === 'SNIPER') {
                    playSound('sfx_shoot_sniper', 0.18); // Jeszcze bardziej ściszona snajperka (0.18)
                } else {
                    playSound('sfx_shoot_default', 0.4);
                }
                
                state.bullets.push(bullet);
                
                let sparkColor = isCrit ? '#d03be3' : '#ffff00';
                createParticles(this.x + Math.cos(angle)*12, this.y + Math.sin(angle)*12, sparkColor, isCrit ? 6 : 2, 40);
                
                // Wyrzut łuski Garanda
                if (typeof bloodCtx !== 'undefined' && bloodCtx) {
                    bloodCtx.save();
                    bloodCtx.fillStyle = '#ffd700';
                    bloodCtx.fillRect(Math.floor((this.x + (this.facingLeft ? 6 : -6)) / 2) * 2, Math.floor((this.y + 6) / 2) * 2, 1, 2);
                    bloodCtx.restore();
                }
            } else if (this.weapon.type === 'burst') {
                // Karabin M16 strzelający seriami po 3 pociski w odstępach
                let burstCount = 0;
                let fireBurst = () => {
                    if (burstCount < 3 && state.squad.includes(this) && this.hp > 0) {
                        // Pobieramy aktualny kąt celowania, aby seria M16 płynnie podążała za obrotem lufy
                        let currentAngle = this.aimAngle;
                        let spreadAng = currentAngle + (this.isLaserFocused ? 0 : (Math.random() - 0.5) * 0.04);
                        state.bullets.push(new Bullet(this, this.x, this.y, spreadAng, false, dmg * 0.8, this.weapon));
                        playSound('sfx_shoot_m16', 0.22); 
                        createParticles(this.x + Math.cos(spreadAng)*10, this.y + Math.sin(spreadAng)*10, '#ffff00', 1, 25);
                        burstCount++;
                        setTimeout(fireBurst, 55); 
                    }
                };
                fireBurst();
            } else if (this.weapon.type === 'rapid') {
                // PM Uzi lub M249 SAW
                let spreadAng = angle + (this.isLaserFocused ? 0 : (Math.random() - 0.5) * 0.3);
                state.bullets.push(new Bullet(this, this.x, this.y, spreadAng, false, dmg, this.weapon));
                if (this.weapon === WEAPONS.RIFLE_SMG) {
                    playSound('sfx_shoot_default', 0.18);
                } else {
                    playSound('sfx_shoot_machinegun', 0.2);
                }
            } else if (this.weapon.type === 'fullauto') {
                // FN FAL
                let spreadAng = angle + (this.isLaserFocused ? 0 : (Math.random() - 0.5) * 0.12);
                state.bullets.push(new Bullet(this, this.x, this.y, spreadAng, false, dmg, this.weapon));
                playSound('sfx_shoot_machinegun', 0.2);
            } else {
                let spreadAng = angle + (this.isLaserFocused ? 0 : (Math.random() - 0.5) * 0.1);
                state.bullets.push(new Bullet(this, this.x, this.y, spreadAng, false, dmg, this.weapon));
                let vol = this.weapon.type === 'explosive' ? 0.3 : 0.08;
                playSound(this.weapon.type === 'explosive' ? 'sfx_shoot_bazooka' : 'sfx_shoot_default', vol);
            }
            
            this.lastShot = fireRate;
            if (this.weapon.type !== 'beam' && this.weapon.type !== 'flame') {
                createParticles(this.x + Math.cos(angle)*10, this.y + Math.sin(angle)*10, this.weapon.color, 1, 30);
            }
        }

        if (this.lastShot > 0) this.lastShot -= dt;
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
        
        // Płynna ewolucja długości strumienia ognia (stopniowe wydłużanie i płynne, realistyczne dogasanie do lufy)
        if (this.weapon && this.weapon.type === 'flame') {
            this.flameStreamDist = this.flameStreamDist || 0;
            let hasTarget = state.enemies.some(e => e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) < stats.range);
            if (this.lastShot > 0 && hasTarget) {
                this.flameStreamDist = Math.min(stats.range, this.flameStreamDist + 1200 * dt);
            } else {
                this.flameStreamDist = Math.max(0, this.flameStreamDist - 900 * dt);
            }
        }
        
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
        if (this.isHiddenInBush) {
            return; // Bohater znika w teksturze krzewu – oczy rysowane są bezpośrednio na koronie w Bush.js!
        }

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - 5, this.y + 10, 10, 2);
        ctx.fillRect(this.x - 7, this.y + 12, 14, 3);
        ctx.fillRect(this.x - 5, this.y + 15, 10, 2);
        ctx.restore();
        
        let recoilX = 0;
        let recoilY = 0;
        let isEffectivelyFacingLeft = Math.abs(this.aimAngle) > Math.PI / 2;
        
        if (this.lastShot > 0 && this.weapon) {
            let fireRate = this.getEffectiveFireRate();
            let timeSinceShot = fireRate - this.lastShot;
            if (timeSinceShot < 0.08) {
                let intensity = 1.2 * (1 - timeSinceShot / 0.08);
                recoilX = -Math.cos(this.aimAngle) * intensity;
                recoilY = -Math.sin(this.aimAngle) * intensity;
            }
        }
        if (this.isReloadingPump > 0) {
            let pumpIntensity = Math.sin((this.isReloadingPump / 0.35) * Math.PI) * 3;
            recoilX += Math.cos(this.aimAngle) * pumpIntensity;
            recoilY += Math.sin(this.aimAngle) * pumpIntensity;
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
            
            let rotAngle = this.aimAngle;
            
            ctx.rotate(rotAngle);
            if (Math.abs(rotAngle) > Math.PI / 2) {
                ctx.scale(1, -1);
            }
            ctx.imageSmoothingEnabled = false;
            
            ctx.drawImage(this.weaponSprite, -16, -16, 32, 32);
            ctx.restore();
        }

        // Natywny system ognia retro: wyśrodkowany bezpośrednio z krawędzi lufy, skalowany w drobniejszej matrycy 4-pikselowej,
        // z towarzyszącym wiecznym, małym płomykiem pilotowym ("pilot light") w stanie gotowości (idle)
        if (this.weapon && this.weapon.type === 'flame' && this.weaponSprite) {
            ctx.save();
            let shoulderY = this.y - this.bobY + ((this.animFrame === 1 || this.animFrame === 3) ? 3 : 2) + recoilY;
            ctx.translate(this.x + recoilX, shoulderY);
            
            let rotAngle = this.aimAngle;
            
            ctx.rotate(rotAngle);
            if (Math.abs(rotAngle) > Math.PI / 2) {
                ctx.scale(1, -1);
            }
            
            ctx.globalCompositeOperation = 'lighter';
            let t = Date.now() / 40;
            this.flameStreamDist = this.flameStreamDist || 0;
            
            // Lufa w lokalnym układzie odniesienia znajduje się dokładnie w punkcie (12, 2.5)
            let tipX = 12;
            let tipY = 2.5;
            
            if (this.flameStreamDist > 15) {
                let maxDist = this.flameStreamDist;
                let step = 2; // Precyzyjny krok 2px budujący zwartą wiązkę w skali retro 2x2 pixel art
                
                // Tworzenie małych dogasających płomieni na ziemi w koordynatach świata
                if (typeof bloodCtx !== 'undefined' && bloodCtx && Math.random() < 0.12) {
                    let dropD = maxDist * (0.25 + Math.random() * 0.7);
                    let worldAngle = rotAngle;
                    let dropX = Math.floor((this.x + recoilX + Math.cos(worldAngle) * dropD + (Math.random() - 0.5) * 24) / 2) * 2;
                    let dropY = Math.floor((shoulderY + Math.sin(worldAngle) * dropD + (Math.random() - 0.5) * 24) / 2) * 2;
                    
                    bloodCtx.save();
                    bloodCtx.fillStyle = 'rgba(25, 15, 8, 0.7)';
                    bloodCtx.fillRect(dropX - 1, dropY - 1, 2, 2);
                    
                    let fuelColors = ['rgba(45, 25, 10, 0.5)', 'rgba(80, 50, 15, 0.4)', 'rgba(15, 10, 5, 0.6)'];
                    for (let j = 0; j < 4; j++) {
                        let sx = dropX + Math.floor((Math.random() - 0.5) * 6);
                        let sy = dropY + Math.floor((Math.random() - 0.5) * 6);
                        bloodCtx.fillStyle = fuelColors[Math.floor(Math.random() * fuelColors.length)];
                        bloodCtx.fillRect(sx, sy, 1, 1);
                    }
                    bloodCtx.restore();
                    
                    if (!state.fuelPools) state.fuelPools = [];
                    if (state.fuelPools.length < 60) {
                        state.fuelPools.push({ x: dropX, y: dropY, life: 1.5, maxLife: 1.5 });
                    }
                }
                
                // Warstwa 1: Zewnętrzna bryła w lokalnych koordynatach obróconej broni
                ctx.fillStyle = '#ff3300';
                ctx.globalAlpha = 0.85;
                for (let d = 0; d < maxDist; d += step) {
                    let p = d / maxDist;
                    let envelope = p < 0.65 ? Math.sin((p / 0.65) * Math.PI / 2) : Math.sin((1 - (p - 0.65) / 0.35) * Math.PI / 2);
                    let size = Math.floor((2 + envelope * 14) / 2) * 2;
                    if (size < 2) size = 2;
                    
                    let w1 = Math.sin(d * 0.1 - t);
                    let w2 = Math.cos(d * 0.3 + t * 1.5) * 0.5;
                    let chaos = Math.sin(d * 1.2 + Math.floor(t * 0.8)) * 0.3;
                    let wave = (w1 + w2 + chaos) * (p * 12);
                    
                    if (p > 0.75 && Math.sin(d * 1.0 + t * 2.7) > 0.1) continue;
                    
                    let px = Math.floor((tipX + d) / 2) * 2;
                    let py = Math.floor((tipY + wave) / 2) * 2;
                    
                    ctx.fillRect(px - size/2, py - size/2, size, size);
                }
                
                // Warstwa 2: Złocisto-pomarańczowy rdzeń
                ctx.fillStyle = '#ff8800';
                ctx.globalAlpha = 0.95;
                let midDist = maxDist * 0.85;
                for (let d = 0; d < midDist; d += step) {
                    let p = d / midDist;
                    let envelope = p < 0.6 ? Math.sin((p / 0.6) * Math.PI / 2) : Math.sin((1 - (p - 0.6) / 0.4) * Math.PI / 2);
                    let size = Math.floor((2 + envelope * 8) / 2) * 2;
                    if (size < 2) size = 2;
                    
                    let w1 = Math.sin(d * 0.12 - t * 1.2);
                    let w2 = Math.sin(d * 0.35 - t * 2.1) * 0.4;
                    let wave = (w1 + w2) * (p * 8);
                    
                    if (p > 0.7 && Math.cos(d * 1.3 + t * 2.0) > 0.25) continue;
                    
                    let px = Math.floor((tipX + d) / 2) * 2;
                    let py = Math.floor((tipY + wave) / 2) * 2;
                    
                    ctx.fillRect(px - size/2, py - size/2, size, size);
                }
                
                // Warstwa 3: Rdzeń paliwowy
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1.0;
                let coreDist = maxDist * 0.45;
                for (let d = 0; d < coreDist; d += step) {
                    let p = d / coreDist;
                    let size = 2;
                    let wave = Math.sin(d * 0.18 - t * 1.8) * (p * 2);
                    
                    let px = Math.floor((tipX + d) / 2) * 2;
                    let py = Math.floor((tipY + wave) / 2) * 2;
                    
                    ctx.fillRect(px - size/2, py - size/2, size, size);
                }
                
                // Warstwa 4: Iskry plazmy retro
                ctx.fillStyle = '#ffffaa';
                ctx.globalAlpha = 0.9;
                for (let i = 0; i < 4; i++) {
                    let phase = (t * 0.4 + i * 1.33) % 1.0;
                    let fd = Math.floor((phase * maxDist) / step) * step;
                    let w1 = Math.sin(fd * 0.1 - t);
                    let w2 = Math.cos(fd * 0.3 + t * 1.5) * 0.5;
                    let wave = (w1 + w2) * (phase * 15) + (i % 2 === 0 ? -4 : 4);
                    
                    let px = Math.floor((tipX + fd) / 2) * 2;
                    let py = Math.floor((tipY + wave) / 2) * 2;
                    
                    ctx.fillRect(px - 1, py - 1, 2, 2);
                }
                ctx.globalAlpha = 1.0;
            } else {
                // Płomyk pilotowy
                let flicker = Math.sin(t * 3.5) * 2;
                let px = Math.floor((tipX + flicker) / 2) * 2;
                let py = Math.floor(tipY / 2) * 2;
                
                ctx.fillStyle = '#0088ff';
                ctx.fillRect(px - 1, py - 1, 2, 2);
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(px, py, 1, 1);
            }
            ctx.restore();
        } else if (this.lastShot > 0 && this.weapon && this.weapon.type !== 'beam' && this.weapon.type !== 'flame' && gunFireImg && gunFireImg.complete && gunFireImg.width > 0) {
            let fireRate = this.getEffectiveFireRate();
            let timeSinceShot = fireRate - this.lastShot;
            if (timeSinceShot < 0.1) {
                let isFacingLeft = Math.abs(this.aimAngle) > Math.PI / 2;
                
                let tipX = this.x + (isFacingLeft ? -10 : 10) + recoilX;
                let tipY = this.y - this.bobY + 3 + recoilY;
                
                ctx.save();
                ctx.translate(tipX, tipY);
                ctx.rotate(this.aimAngle);
                
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

        // Etykieta nazwy
        ctx.fillStyle = 'white';
        ctx.font = '9px "Press Start 2P"'; 
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - 24 - this.bobY);
        
        // Renderowanie 3-segmentowego paska HP (matryca 2x2 piksele) bezpośrednio pod imieniem
        let blockW = 4;
        let blockH = 2;
        let gap = 2;
        let startX = this.x - (blockW * 3 + gap * 2) / 2;
        let hpY = this.y - 19 - this.bobY;
        
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = (i < this.hp) ? '#39ff14' : '#ff0000'; // Neonowy zielony / czerwony
            ctx.fillRect(Math.floor(startX + i * (blockW + gap)), Math.floor(hpY), blockW, blockH);
        }

        // 2. KAMIZELKA KEVLAROWA (Pasek z armorem pod zdrowiem - na początku jeden pasek max 3)
        if (this.maxArmor && this.maxArmor > 0) {
            let armY = hpY + 4; 
            let startArmX = this.x - (blockW * this.maxArmor + gap * (this.maxArmor - 1)) / 2;
            for (let i = 0; i < this.maxArmor; i++) {
                ctx.fillStyle = (i < this.armor) ? '#00ffff' : '#334455'; // Cyan (aktywny) / Ciemny (zużyty)
                ctx.fillRect(Math.floor(startArmX + i * (blockW + gap)), Math.floor(armY), blockW, blockH);
            }
        }



        // Pasek przeładowania strzelby widoczny przez cały cykl od razu po strzale
        if (this.weapon.type === 'spread' && this.lastShot > 0) {
            let barW = 16;
            let barH = 2;
            let bx = this.x - barW / 2;
            let by = this.y - 8 - this.bobY;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(bx, by, barW, barH);
            
            let fireInterval = this.getEffectiveFireRate();
            let prog = Math.max(0, Math.min(1, 1.0 - (this.lastShot / fireInterval)));
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(bx, by, Math.floor(barW * prog), barH);
        }
    }

    applyKnockback(kx, ky) {
        if (state.passiveShrapnelArmorActive) return; // 100% odporności na knockback z pasywu Szrapnelowe Pancerze!
        this.kbX = (this.kbX || 0) + kx;
        this.kbY = (this.kbY || 0) + ky;
    }

    takeDamage(amount) {
        if (this.hp <= 0) return;
        
        // 2. KAMIZELKA KEVLAROWA (Absorpcja obrażeń)
        if (this.armor && this.armor > 0) {
            let absorbed = Math.min(this.armor, amount);
            this.armor -= absorbed;
            amount -= absorbed;
            playSound('sfx_hit', 0.4);
            createParticles(this.x, this.y, '#00ffff', 5, 30);
            if (amount <= 0) return;
        }

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

        corpses.push({ x: this.x, y: this.y, seed: Math.random() * 1000 });
        if (corpses.length > 150) corpses.shift();
        
        // Pasyw Martyrdom (Eksplozywny Odwet): Wybuch + 50% szansy na zrzut Skrzynki Zaopatrzenia
        if (state.passiveMartyrdomActive) {
            state.explosions.push(new Explosion(this.x, this.y, 100, 250, this)); // Wybuch 250 DMG
            
            if (Math.random() < 0.5) {
                if (!state.crates) state.crates = [];
                state.crates.push(new Crate(this.x, this.y));
                console.warn("Martyrdom zrzucił Skrzynkę Zaopatrzenia w miejscu zgonu!");
            }
        }
    }

    applySkillPromotion(treeType) {
        if (!CLASS_SKILL_TREES[this.soldierClass]) return;
        const treeObj = treeType === 'A' ? CLASS_SKILL_TREES[this.soldierClass].treeA : CLASS_SKILL_TREES[this.soldierClass].treeB;
        if (!treeObj) return;
        
        let currentLvl = treeType === 'A' ? this.treeALvl : this.treeBLvl;
        if (currentLvl >= 3) return; // limit 3 poziomów
        
        currentLvl++;
        if (treeType === 'A') this.treeALvl = currentLvl;
        else this.treeBLvl = currentLvl;
        
        let skill = treeObj.skills[currentLvl - 1];
        if (skill) {
            this.unlockedSkills[skill.id] = true;
            console.warn(`[AWANS UMIEJĘTNOŚCI] ${this.name} odblokował: ${skill.name} (${skill.desc})`);
            
            if (skill.id === 'comm_a1') {
                this.hasAirstrike = true;
                this.accessoryIdx = 2;
            } else if (skill.id === 'comm_b2') {
                this.maxHp = (this.maxHp || 3) * 2;
                this.hp = this.maxHp;
            } else if (skill.id === 'snip_a2') {
                this.giantKillerBonus = 0.5;
            } else if (skill.id === 'snip_b2') {
                this.hunterInstinct = true;
            }
            this.updateSprites();
        }
    }
}
