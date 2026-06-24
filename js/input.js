import { state, stats } from './config.js';
import { playSound } from './sfx.js';
import { updateHUD, triggerActiveSkill } from './ui.js';
import { Decoy } from './entities/Decoy.js';
import { createParticles } from './entities/Particle.js';

export function initInput() {
    const joystickZone = document.getElementById('joystickZone');
    if (!joystickZone) return;

    window.addEventListener('keydown', (e) => {
        state.keys[e.code] = true;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
            state.inputMode = 'keyboard';
        }
        if (state.gameState !== 'PLAY') return;
        
        // Skróty klawiszowe dla aktywnych umiejętności Dowódcy
        if (e.code === 'Space') {
            triggerActiveSkill('comm_a1');
        }
        if (e.code === 'KeyB') {
            triggerActiveSkill('comm_b1');
        }
        if (e.code === 'KeyV') {
            triggerActiveSkill('comm_b3');
        }
        
        // Wyzwalanie klawiszami 1,2,3... wszystkich odblokowanych aktywnych umiejętności i doktryn
        let num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= 9) {
            let commander = state.squad && state.squad.find(s => s.soldierClass === 'COMMANDER' && s.hp > 0);
            let activeSkills = [];
            if (commander) {
                if (commander.hasAirstrike) activeSkills.push('comm_a1');
                if (commander.unlockedSkills && commander.unlockedSkills['comm_a2']) activeSkills.push('comm_a2');
                if (commander.unlockedSkills && commander.unlockedSkills['comm_b1']) activeSkills.push('comm_b1');
                if (commander.unlockedSkills && commander.unlockedSkills['comm_b3']) activeSkills.push('comm_b3');
            }

            if (num <= activeSkills.length) {
                triggerActiveSkill(activeSkills[num - 1]);
            } else {
                let slotIdx = num - 1 - activeSkills.length;
                if (state.tacticalDoctrines && state.tacticalDoctrines[slotIdx]) {
                    let doc = state.tacticalDoctrines[slotIdx];
                    if (doc.charge >= 100) {
                        doc.charge = 0; // zużycie ładunku
                        playSound('sfx_airdrop_start', 0.15); // Specjalny taktyczny jingle
                        
                        // Inicjacja efektu Doktryny
                        if (doc.type === 'airstrike') {
                            state.airstrikeTimer = 3.0; // Nalot
                        } else if (doc.type === 'decoy') {
                            if (!state.decoys) state.decoys = [];
                            state.decoys.push(new Decoy(state.targetPoint.x, state.targetPoint.y));
                            createParticles(state.targetPoint.x, state.targetPoint.y, '#ffff00', 10, 35);
                            console.warn("Aktywowano Wabik: Decoy rozstawiony w punkcie celownika!");
                        }
                        
                        updateHUD(); // Błyskawiczne odświeżenie HUD!
                    } else {
                        playSound('sfx_click', 0.2); // kliknięcie odmowy (nie naładowana)
                    }
                }
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        state.keys[e.code] = false;
    });

    function handlePointer(e) {
        if (state.gameState !== 'PLAY') return;
        
        if (e.type === 'touchstart' || e.type === 'mousedown') {
            playSound('sfx_shoot_default', 0.01);
            state.inputMode = 'pointer';
        }
        
        // Zapobieganie gestom przeglądarki (pull-to-refresh, wstecz/dalej) na urządzeniach mobilnych
        if (e.cancelable && (e.type.startsWith('touch') || e.type.startsWith('pointer'))) {
            e.preventDefault();
        }

        state.isPointerDown = e.type === 'touchstart' || e.type === 'mousedown' || 
                              (e.type === 'touchmove' && state.isPointerDown) || 
                              (e.type === 'mousemove' && state.isPointerDown);
        
        if (e.type === 'touchend' || e.type === 'mouseup') {
            state.isPointerDown = false;
            return;
        }

        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Convert screen coords to world coords using current window dimensions
        let rawX = state.camera.x + (clientX - window.innerWidth / 2);
        let rawY = state.camera.y + (clientY - window.innerHeight / 2);
        
        // Zawsze aktualizujemy celownik myszy w świecie
        state.aimPoint.x = rawX;
        state.aimPoint.y = rawY;

        if (state.aimOnlyMode) {
            // W trybie celowania myszką, kliknięcia/ruchy myszy nie powinny wyznaczać celu ruchu oddziału
            return;
        }
        
        // Ograniczenie punktu docelowego do okręgu pola strzału
        let leaderRef = state.squad[0] || { x: state.camera.x, y: state.camera.y };
        let distTarget = Math.hypot(rawX - leaderRef.x, rawY - leaderRef.y);
        let maxTargetDist = stats.range * 0.85;
        
        if (distTarget > maxTargetDist && maxTargetDist > 0) {
            let angTarget = Math.atan2(rawY - leaderRef.y, rawX - leaderRef.x);
            state.targetPoint.x = leaderRef.x + Math.cos(angTarget) * maxTargetDist;
            state.targetPoint.y = leaderRef.y + Math.sin(angTarget) * maxTargetDist;
        } else {
            state.targetPoint.x = rawX;
            state.targetPoint.y = rawY;
        }
    }

    joystickZone.addEventListener('mousedown', handlePointer);
    joystickZone.addEventListener('mousemove', handlePointer);
    window.addEventListener('mouseup', handlePointer);
    joystickZone.addEventListener('touchstart', handlePointer, { passive: false });
    joystickZone.addEventListener('touchmove', handlePointer, { passive: false });
    window.addEventListener('touchend', handlePointer);
}
