import { state } from '../config.js';
import { createParticles } from './Particle.js';
import { playSound } from '../sfx.js';

const plasmaBeamImg = new Image();
plasmaBeamImg.src = 'img/Plasma_beam.png';

export class PlasmaBeam {
    constructor(startX, startY, initialTarget, damage, shooter) {
        this.points = [{ x: startX, y: startY }];
        this.life = 0.2; // Widoczność wiązki przez 200ms
        this.maxLife = 0.2;
        this.damage = damage;
        this.shooter = shooter;
        
        // Dźwięk dedykowany dla wiązki plazmowej
        playSound('sfx_shoot_plasma', 0.4);
        
        let currentTarget = initialTarget;
        let hitEnemies = new Set();
        
        if (currentTarget) {
            this.points.push({ x: currentTarget.x, y: currentTarget.y });
            currentTarget.takeDamage(this.damage, shooter);
            hitEnemies.add(currentTarget);
            createParticles(currentTarget.x, currentTarget.y, '#00ffff', 15, 80);
            
            // Łańcuchowe przeskakiwanie na kolejnych wrogów (do 5 wrogów łącznie)
            let bounces = 1;
            while (bounces < 5) {
                let nextTarget = null;
                let minDist = 180; // Maksymalny dystans przeskoku lasera
                
                for (let e of state.enemies) {
                    if (e.hp > 0 && !hitEnemies.has(e)) {
                        let d = Math.hypot(e.x - currentTarget.x, e.y - currentTarget.y);
                        if (d < minDist) {
                            minDist = d;
                            nextTarget = e;
                        }
                    }
                }
                
                if (nextTarget) {
                    this.points.push({ x: nextTarget.x, y: nextTarget.y });
                    nextTarget.takeDamage(this.damage, shooter);
                    hitEnemies.add(nextTarget);
                    createParticles(nextTarget.x, nextTarget.y, '#00ffff', 15, 80);
                    currentTarget = nextTarget;
                    bounces++;
                } else {
                    break; // Brak celów w zasięgu rykoszetu
                }
            }
        }
    }

    update(dt) {
        this.life -= dt;
    }

    draw(ctx) {
        if (this.points.length < 2) return;
        
        ctx.save();
        let progress = this.life / this.maxLife;
        
        // Oświetlenie addytywne dające wspaniały blask wiązki
        ctx.globalCompositeOperation = 'lighter';
        ctx.imageSmoothingEnabled = false;
        
        const hasImg = plasmaBeamImg && plasmaBeamImg.complete && plasmaBeamImg.width > 0;
        
        for (let i = 1; i < this.points.length; i++) {
            let p1 = this.points[i - 1];
            let p2 = this.points[i];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.hypot(dx, dy);
            let angle = Math.atan2(dy, dx);
            
            ctx.save();
            ctx.translate(p1.x, p1.y);
            ctx.rotate(angle);
            
            if (hasImg) {
                ctx.globalAlpha = progress;
                // Rysowanie pliku plasma_beam.png rozciągniętego wzdłuż trajektorii
                let beamH = 16; 
                ctx.drawImage(plasmaBeamImg, 0, -beamH / 2, dist, beamH);
            } else {
                // Zastępcza poświata wektorowa
                ctx.strokeStyle = `rgba(0, 255, 255, ${progress * 0.7})`;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(dist, 0);
                ctx.stroke();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${progress})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(dist, 0);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        ctx.restore();
    }
}
