import { state, stats } from './config.js';
import { playSound } from './sfx.js';
import { updateHUD } from './ui.js';
import { Decoy } from './entities/Decoy.js';
import { createParticles } from './entities/Particle.js';

export function initInput() {
    const joystickZone = document.getElementById('joystickZone');
    if (!joystickZone) return;

    window.addEventListener('keydown', (e) => {
        if (state.gameState !== 'PLAY') return;
        
        // Tradycyjny Nalot (z gry)
        if (e.code === 'Space') {
            let radioMan = state.squad.find(s => s.hasAirstrike);
            if (radioMan) {
                radioMan.hasAirstrike = false;
                radioMan.accessoryIdx = 0;
                radioMan.updateSprites();
                playSound('sfx_click', 0.7);
                state.airstrikeTimer = 3.0;
            }
        }
        
        // Skróty [1], [2], [3]... dla Doktryn Taktycznych z ekwipunku
        let num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= 9) {
            let slotIdx = num - 1;
            if (state.tacticalDoctrines && state.tacticalDoctrines[slotIdx]) {
                let doc = state.tacticalDoctrines[slotIdx];
                if (doc.charge >= 100) {
                    doc.charge = 0; // zużycie ładunku
                    playSound('sfx_airdrop_start', 0.15); // Specjalny taktyczny jingle
                    
                    // Inicjacja efektu Doktryny
                    if (doc.type === 'airstrike') {
                        state.airstrikeTimer = 3.0; // Nalot
                    } else if (doc.type === 'decoy') {
                        // Spawnowanie fizycznego wabika w punkcie marszu gracza
                        if (!state.decoys) state.decoys = [];
                        state.decoys.push(new Decoy(state.targetPoint.x, state.targetPoint.y));
                        createParticles(state.targetPoint.x, state.targetPoint.y, '#ffff00', 10, 35); // iskry zrzutu
                        console.warn("Aktywowano Wabik: Decoy rozstawiony w punkcie celownika!");
                    }
                    
                    updateHUD(); // Błyskawiczne odświeżenie HUD!
                } else {
                    playSound('sfx_click', 0.2); // kliknięcie odmowy (nie naładowana)
                }
            }
        }
    });

    function handlePointer(e) {
        if (state.gameState !== 'PLAY') return;
        
        if (e.type === 'touchstart' || e.type === 'mousedown') {
            playSound('sfx_shoot_default', 0.01);
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
