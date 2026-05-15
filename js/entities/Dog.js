import { state, P, make16 } from '../config.js';
import { bloodCtx } from '../sprites.js';
import { createParticles } from './Particle.js';
import { corpses } from './Soldier.js';
import { playSound } from '../sfx.js';

// --- Ładowanie arkusza animacji Psa Bojowego (Spritesheet) ---
const dogSpritesheet = new Image();
dogSpritesheet.src = 'img/dog_run.png';

const FRAME_WIDTH = 90;
const FRAME_HEIGHT = 83;
const TOTAL_FRAMES = 6;

// Skala renderowania: oryginalny plik 90x83 jest znacznie większy od żołnierzy (32x32).
// Ustawiamy domyślnie 0.45, aby pies idealnie pasował do skali reszty składu.
// Możesz w każdej chwili zmienić na 1.0, jeśli grafika ma być rysowana w pełnym rozmiarze.
const RENDER_SCALE = 0.405; // zmniejszone o 10%

export class Dog {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 160; // Bardzo szybki
        this.dogState = 'PATROL'; // PATROL, ATTACK, RETURN
        this.targetEnemy = null;
        this.lastBite = 0;
        this.patrolAngle = Math.random() * Math.PI * 2; // Indywidualny kąt krążenia
        
        // Animacja i ślady
        this.animFrame = 0;
        this.walkCycle = Math.random() * Math.PI * 2;
        this.bobY = 0;
        this.bloodyBootsTime = 0;
        this.pawprintTimer = 0;
    }

    update(dt) {
        let oldX = this.x;
        let oldY = this.y;

        // Znajdź środek składu gracza
        let cx = 0, cy = 0;
        if (state.squad.length > 0) {
            state.squad.forEach(s => { cx += s.x; cy += s.y; });
            cx /= state.squad.length;
            cy /= state.squad.length;
        } else {
            cx = state.camera.x;
            cy = state.camera.y;
        }

        if (this.lastBite > 0) this.lastBite -= dt;
        if (this.barkCooldown > 0) this.barkCooldown -= dt;

        // --- WZAJEMNE ODPYCHANIE PSÓW (Flocking Separation) ---
        // Zapobiega niepotrzebnemu grupowaniu się w kłębek
        if (state.companions) {
            for (let other of state.companions) {
                if (other !== this) {
                    let d = Math.hypot(other.x - this.x, other.y - this.y);
                    if (d < 35 && d > 0) {
                        let push = (35 - d) * 5; // Silna siła odpychająca
                        let pushAngle = Math.atan2(this.y - other.y, this.x - other.x);
                        this.x += Math.cos(pushAngle) * push * dt;
                        this.y += Math.sin(pushAngle) * push * dt;
                    }
                }
            }
        }

        // --- MASZYNA STANÓW ---
        if (this.dogState === 'PATROL') {
            // Powolne, płynne krążenie po indywidualnej orbicie wokół dowódcy lub oddziału
            this.patrolAngle += dt * 1.2;
            let orbitTarget = state.squad[0] || { x: cx, y: cy };
            let targetX = orbitTarget.x + Math.cos(this.patrolAngle) * 50;
            let targetY = orbitTarget.y + Math.sin(this.patrolAngle) * 50;
            
            let angleToOrbit = Math.atan2(targetY - this.y, targetX - this.x);
            let distToOrbit = Math.hypot(targetX - this.x, targetY - this.y);

            if (distToOrbit > 15) {
                let moveSpeed = Math.min(this.speed, distToOrbit * 5);
                this.x += Math.cos(angleToOrbit) * moveSpeed * dt;
                this.y += Math.sin(angleToOrbit) * moveSpeed * dt;
            }

            // Wyszukiwanie wroga - inteligentne dobieranie unikalnych, wolnych celów w promieniu 350 pikseli
            let bestEnemy = null;
            let minDist = 350;
            for (let e of state.enemies) {
                if (e.hp > 0) {
                    let dFromSquad = Math.hypot(e.x - cx, e.y - cy);
                    // Sprawdź, czy inny pies już go nie zaatakował
                    let targetedByOther = state.companions.some(c => c !== this && c.targetEnemy === e);
                    // Jeśli cel jest już zajęty, dodaj mu sztuczną karę do dystansu, żeby pies priorytetyzował inne cele
                    let effectiveDist = dFromSquad + (targetedByOther ? 250 : 0);

                    if (effectiveDist < minDist) {
                        minDist = effectiveDist;
                        bestEnemy = e;
                    }
                }
            }

            if (bestEnemy) {
                this.targetEnemy = bestEnemy;
                this.dogState = 'ATTACK';
                this.barkCooldown = this.barkCooldown || 0;
                if (this.barkCooldown <= 0) {
                    this.barkCooldown = 2.5 + Math.random() * 1.5; // 2.5..4 sekundy przerwy przed kolejnym szczeknięciem
                    let variant = Math.floor(Math.random() * 3) + 1;
                    playSound(`sfx_dog_bark#${variant}`, 0.12); // Dyskretne szczekanie cichsze od strzału podstawowego
                }
            }

        } else if (this.dogState === 'ATTACK') {
            if (!this.targetEnemy || this.targetEnemy.hp <= 0) {
                this.dogState = 'RETURN';
                this.targetEnemy = null;
            } else {
                // Błyskawiczna szarża bezpośrednio na cel
                let angle = Math.atan2(this.targetEnemy.y - this.y, this.targetEnemy.x - this.x);
                this.x += Math.cos(angle) * (this.speed * 2.0) * dt; // Zdecydowanie szybszy sprint w ataku
                this.y += Math.sin(angle) * (this.speed * 2.0) * dt;

                let distToEnemy = Math.hypot(this.targetEnemy.x - this.x, this.targetEnemy.y - this.y);
                if (distToEnemy < 14 && this.lastBite <= 0) {
                    // Zgodnie z dyspozycją: cichy atak bez osobnego dźwięku, zachowując krwisty efekt ugryzienia
                    this.targetEnemy.takeDamage(2, { kills: 0 }); 
                    createParticles(this.targetEnemy.x, this.targetEnemy.y, '#ff0000', 8, 50); 
                    createParticles(this.targetEnemy.x, this.targetEnemy.y, '#8b0000', 6, 30); 
                    this.lastBite = 0.4; // Cooldown

                    if (this.targetEnemy.hp <= 0) {
                        this.dogState = 'RETURN';
                        this.targetEnemy = null;
                    }
                }

                // Zabezpieczenie przed ucieczką poza mapę (> 450px od składu) - sprawdzamy, czy cel nadal istnieje
                if (this.targetEnemy && Math.hypot(this.targetEnemy.x - cx, this.targetEnemy.y - cy) > 450) {
                    this.dogState = 'RETURN';
                    this.targetEnemy = null;
                }
            }

        } else if (this.dogState === 'RETURN') {
            // Powrót do właścicieli
            let angle = Math.atan2(cy - this.y, cx - this.x);
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            if (Math.hypot(cx - this.x, cy - this.y) < 45) {
                this.dogState = 'PATROL';
            }
        }

        // --- LOGIKA ANIMACJI I KRWAWYCH ŁAPEK ---
        let distMoved = Math.hypot(this.x - oldX, this.y - oldY);
        if (distMoved / dt > 5) {
            this.walkCycle += dt * 15; // Dostosowana prędkość odtwarzania 6 klatek
            this.animFrame = Math.floor(this.walkCycle) % TOTAL_FRAMES;
            this.bobY = Math.abs(Math.sin(this.walkCycle * 2)) * 2;

            // Zostawianie krwawych odcisków łapek
            if (this.bloodyBootsTime > 0) {
                this.pawprintTimer -= dt;
                if (this.pawprintTimer <= 0) {
                    if (bloodCtx) {
                        bloodCtx.fillStyle = '#a81111';
                        // Łapki są urocze i drobne (2x2 piksele) w przeciwieństwie do masywnych butów
                        let sideOffset = (Math.sin(this.walkCycle) > 0) ? 2 : -2;
                        let fx = Math.floor((this.x + sideOffset) / 2) * 2;
                        let fy = Math.floor((this.y + 4) / 2) * 2;
                        bloodCtx.fillRect(fx, fy, 2, 2);
                    }
                    this.pawprintTimer = 0.1; // Szybsze odciski stóp czworonoga
                }
            }
        } else {
            this.animFrame = 0;
            this.bobY = 0;
        }

        if (this.bloodyBootsTime > 0) {
            this.bloodyBootsTime -= dt;
        } else {
            // Sprawdzanie kolizji z ciałami wrogów
            for (let c of corpses) {
                if (Math.hypot(c.x - this.x, c.y - this.y) < 12) {
                    this.bloodyBootsTime = 2.5;
                    this.pawprintTimer = 0;
                    break;
                }
            }
        }
    }

    draw(ctx) {
        // Dyskretny, pixel-artowy cień pod łapami
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - 4, this.y + 6, 8, 2);
        ctx.fillRect(this.x - 5, this.y + 8, 10, 2);
        ctx.restore();

        // Odbicie lustrzane (Flip) jeśli pies biegnie w lewo
        ctx.save();
        ctx.translate(this.x, this.y - this.bobY);
        // Jeśli atakuje wroga po lewej lub wraca w lewo, obracamy sprite
        let isFacingLeft = false;
        if (this.dogState === 'ATTACK' && this.targetEnemy && this.targetEnemy.x < this.x) {
            isFacingLeft = true;
        } else if (this.dogState === 'RETURN' && state.camera.x < this.x) {
            isFacingLeft = true;
        }

        if (isFacingLeft) {
            ctx.scale(-1, 1);
        }
        
        const dw = FRAME_WIDTH * RENDER_SCALE;
        const dh = FRAME_HEIGHT * RENDER_SCALE;
        const sx = this.animFrame * FRAME_WIDTH;

        // Wycinanie klatki z pliku PNG i skalowanie
        ctx.drawImage(
            dogSpritesheet,
            sx, 0, FRAME_WIDTH, FRAME_HEIGHT,
            -dw / 2, -dh / 2, dw, dh
        );
        ctx.restore();
    }
}
