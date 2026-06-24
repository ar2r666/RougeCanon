// --- HIGHT-PERFORMANCE, ZERO-LATENCY WEB AUDIO API SOUND MANAGER ---

// Stan współdzielony globalnie na obiekcie window (rozwiązuje problem z cache na komórkach)
window.audioCtx = window.audioCtx || null;
window.audioBuffers = window.audioBuffers || {};
window.soundCache = window.soundCache || {};
window.lastPrimaryPlayTime = window.lastPrimaryPlayTime || {};

let audioCtx = window.audioCtx;
const audioBuffers = window.audioBuffers;
const soundCache = window.soundCache;
const lastPrimaryPlayTime = window.lastPrimaryPlayTime;
let isMuted = false;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            window.audioCtx = audioCtx;
        }
    }
    // Wznowienie sprzętowego miksera po odblokowaniu przez dotyk użytkownika
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function playSound(soundKey, volume = 0.25) {
    if (isMuted) return;
    
    const now = Date.now();
    let effectiveVolume = volume;
    
    // Blokada zalewania miksera i dławienia wątku audio dla odgłosów strzelających seryjnie w ułamkach sekund
    if (lastPrimaryPlayTime[soundKey] && now - lastPrimaryPlayTime[soundKey] < 85) {
        if (soundKey === 'sfx_shoot_fire' || soundKey === 'sfx_shoot_machinegun') {
            return;
        }
    }
    
    // Utrzymanie zasady maskowania echa dla spójności pola walki
    if (volume > 0.02 && soundKey !== 'sfx_level_up') {
        if (lastPrimaryPlayTime[soundKey] && now - lastPrimaryPlayTime[soundKey] < 120) {
            effectiveVolume = 0.03; 
        } else {
            lastPrimaryPlayTime[soundKey] = now;
        }
    }
    
    const ctx = getAudioContext();
    if (ctx) {
        // Odtwarzanie ze zdekodowanych w pamięci RAM buforów (Brak jakichkolwiek opóźnień)
        if (audioBuffers[soundKey] === undefined) {
            audioBuffers[soundKey] = null; 
            fetch(`Sounds/${encodeURIComponent(soundKey)}.mp3`) // Bezpieczne kodowanie znaków specjalnych takich jak # w nazwach plików audio
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                .then(decodedBuffer => {
                    audioBuffers[soundKey] = decodedBuffer;
                    // Jeśli to pierwsze wywołanie, natychmiast odtwarzamy bufor po zdekodowaniu!
                    playSound(soundKey, volume);
                })
                .catch(err => {
                    // Ciche pominięcie braku pliku
                });
        }
        
        const buffer = audioBuffers[soundKey];
        if (buffer) {
            try {
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                
                const gainNode = ctx.createGain();
                gainNode.gain.value = effectiveVolume;
                
                // Zróżnicowanie tonacji (Pitch Shifting) - pomijane dla okrzyków dowódcy oraz awansów, by zachować stały głos i głośność
                if (volume > 0.02 && soundKey !== 'sfx_commander_war_scream' && soundKey !== 'sfx_level_up') {
                    source.playbackRate.value = 0.85 + Math.random() * 0.35;
                } else {
                    source.playbackRate.value = 1.0;
                }
                
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
                source.start(0); // Wyzwolenie z zerowym opóźnieniem!
            } catch (e) {}
        }
        // ZAWSZE wracamy stąd, jeśli Web Audio API jest obsługiwane. Zapobiega to kosztownemu 
        // i zacinającemu fallbackowi HTML5 Audio na urządzeniach mobilnych podczas strzelania.
        return; 
    }
    
    // Natychmiastowy Fallback do tradycyjnego API, jeśli Web Audio buforuje w tle
    try {
        if (soundCache[soundKey] === undefined) {
            const audio = new Audio(`Sounds/${soundKey}.mp3`);
            audio.onerror = () => { soundCache[soundKey] = null; };
            soundCache[soundKey] = audio;
        }
        const baseAudio = soundCache[soundKey];
        if (baseAudio) {
            const cloned = baseAudio.cloneNode();
            cloned.volume = effectiveVolume;
            if (volume > 0.02 && soundKey !== 'sfx_commander_war_scream' && soundKey !== 'sfx_level_up') {
                cloned.playbackRate = 0.85 + Math.random() * 0.35;
            }
            const p = cloned.play();
            if (p !== undefined) p.catch(e => {});
        }
    } catch (e) {}
}

export function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

export function setMute(muteState) {
    isMuted = muteState;
    return isMuted;
}

export function getMute() {
    return isMuted;
}

export function preloadSounds() {
    const soundsToPreload = [
        'sfx_shoot_default',
        'sfx_shoot_m16',
        'sfx_shoot_machinegun',
        'sfx_shoot_sniper',
        'sfx_shoot_shotgun',
        'sfx_shoot_bazooka',
        'sfx_shoot_turet',
        'sfx_shoot_head',
        'sfx_click',
        'sfx_hit',
        'sfx_crate_destroy',
        'sfx_explosion_default',
        'sfx_shoot_stab',
        'sfx_shoot_mine1',
        'sfx_shoot_mine2',
        'sfx_commander_war_scream'
    ];
    
    // Uruchamiamy ładowanie po krótkiej chwili, aby nie blokować początkowego renderowania strony
    setTimeout(() => {
        const ctx = getAudioContext();
        if (!ctx) return;
        soundsToPreload.forEach(soundKey => {
            if (audioBuffers[soundKey] === undefined) {
                audioBuffers[soundKey] = null;
                fetch(`Sounds/${encodeURIComponent(soundKey)}.mp3`)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                    .then(decodedBuffer => {
                        audioBuffers[soundKey] = decodedBuffer;
                    })
                    .catch(() => {});
            }
        });
    }, 800);
}
