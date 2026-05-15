import { WEAPONS, state, customSquadDesign } from '../config.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';
import { getWeaponSprite } from '../sprites.js';

// Pasek graficzny zniszczenia skrzynki (300x60)
const crateStripImg = new Image();
crateStripImg.src = 'img/crate_destroy.png';

export class Crate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.maxHp = 6; 
        this.hp = this.maxHp; 
        this.life = Infinity; // Skrzynka nie znika samoczynnie z mapy
        this.isDestroyed = false;
        this.isWeaponDropped = false; 
        this.animTimer = 0;
        this.destroyAnimDuration = 0.4;
        this.droppedWeapon = null;
    }

    update(dt) {
        if (this.isDestroyed && !this.isWeaponDropped) {
            this.animTimer += dt;
            if (this.animTimer >= this.destroyAnimDuration) {
                this.isWeaponDropped = true; 
            }
            return;
        }
        
        // Zebranie lewitującej broni po zniszczeniu skrzynki
        if (this.isWeaponDropped) {
            for (let s of state.squad) {
                if (s.hp > 0 && Math.hypot(s.x - this.x, s.y - this.y) < this.radius + s.radius + 4) {
                    if (!s.storedWeapon) {
                        s.storedWeapon = s.weapon;
                    }
                    s.weapon = this.droppedWeapon || WEAPONS.SPECIAL_PLASMA;
                    s.specialWeaponTimer = 15.0;
                    s.updateSprites();
                    
                    playSound('sfx_click', 0.5);
                    let glowColor = s.weapon.color || '#00ffff';
                    createParticles(this.x, this.y, glowColor, 20, 60);
                    this.life = 0; // Zebrana, znika ostatecznie
                    break;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.imageSmoothingEnabled = false;

        if (this.isWeaponDropped) {
            // Delikatny cień pod modelem leżącej broni
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-8, 18, 16, 3);
            
            let activeW = this.droppedWeapon || WEAPONS.SPECIAL_PLASMA;
            let wSprite = getWeaponSprite(activeW.visualIdx);
            if (wSprite) {
                ctx.save();
                let floatY = Math.sin(Date.now() / 150) * 4;
                ctx.translate(0, -20 + floatY);
                
                let glowColor = activeW.color || '#00ffff';
                
                // Surowy efekt glow w pixelarcie
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.25 + Math.sin(Date.now() / 100) * 0.1;
                
                ctx.drawImage(wSprite, -16 - 2, -16, 32, 32);
                ctx.drawImage(wSprite, -16 + 2, -16, 32, 32);
                ctx.drawImage(wSprite, -16, -16 - 2, 32, 32);
                ctx.drawImage(wSprite, -16, -16 + 2, 32, 32);
                ctx.restore();

                // Kwadratowe drobinki aury unoszące się do góry
                ctx.fillStyle = glowColor;
                for (let i = 0; i < 3; i++) {
                    let phase = (Date.now() / 300 + i * 2.1) % Math.PI;
                    let px = Math.floor((Math.sin(phase * 2) * 12) / 2) * 2;
                    let py = Math.floor((-phase * 10) / 2) * 2;
                    ctx.fillRect(px, py, 2, 2);
                }
                
                ctx.drawImage(wSprite, -16, -16, 32, 32);
                ctx.restore();
            }
        } else {
            // Statyczny cień nienaruszonej skrzynki
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-12, 18, 24, 5);
            
            if (customSquadDesign && customSquadDesign.crateSkin && customSquadDesign.crateSkin.complete && customSquadDesign.crateSkin.width > 0 && customSquadDesign.crateSkin.height > 0 && !this.isDestroyed) {
                let fh = customSquadDesign.crateSkin.height;
                let totalF = Math.max(1, Math.round(customSquadDesign.crateSkin.width / fh));
                let liveF = totalF > 1 ? Math.floor(Date.now() / 200) % totalF : 0;
                ctx.drawImage(customSquadDesign.crateSkin, liveF * fh, 0, fh, fh, -16, -14, 32, 32);
            } else if (crateStripImg && crateStripImg.complete && crateStripImg.width > 0) {
                let fw = 60; 
                let fh = 60; 
                let fIdx = 0; 
                
                if (this.isDestroyed) {
                    let progress = this.animTimer / this.destroyAnimDuration;
                    fIdx = 1 + Math.floor(progress * 4);
                    if (fIdx > 4) fIdx = 4;
                }
                
                ctx.drawImage(crateStripImg, fIdx * fw, 0, fw, fh, -20, -14, 40, 40);
            } else {
                ctx.fillStyle = '#8b5a2b';
                ctx.fillRect(-12, -10, 24, 24);
            }
            
            if (!this.isDestroyed && this.hp < this.maxHp) {
                ctx.fillStyle = 'red';
                ctx.fillRect(-12, -28, 24, 3);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-12, -28, 24 * (Math.max(0, this.hp) / this.maxHp), 3);
            }
        }
        
        ctx.restore();
    }

    takeDamage(amount, shooter) {
        if (this.isDestroyed) return;
        this.hp -= amount;
        createParticles(this.x, this.y, '#ffd700', 5, 40);
        playSound('sfx_hit', 0.2);
        
        if (this.hp <= 0) {
            this.isDestroyed = true;
            // Losowanie broni ze skrzynki (Plazma lub Miotacz Ognia)
            this.droppedWeapon = Math.random() > 0.5 ? WEAPONS.SPECIAL_PLASMA : WEAPONS.SPECIAL_FLAMETHROWER;
            
            playSound('sfx_crate_destroy', 0.6);
            let burstColor = this.droppedWeapon ? this.droppedWeapon.color : '#00ffff';
            createParticles(this.x, this.y, burstColor, 25, 80);
        }
    }
}
