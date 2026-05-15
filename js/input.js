import { state, stats } from './config.js';
import { playSound } from './sfx.js';

export function initInput() {
    const joystickZone = document.getElementById('joystickZone');
    if (!joystickZone) return;

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
