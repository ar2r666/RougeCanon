import { P, HELMETS, FACES, UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4, WEAPON_LAYERS, ACCESSORIES } from './config.js';

// --- SYSTEM RENDEROWANIA W LOCIE I BUFOROWANIA SPRITE'ÓW ---
const spriteCache = {};

export function getSoldierSprites(helmetIdx, faceIdx, uniformIdx, weaponIdx, accessoryIdx = 0) {
    const key = `${helmetIdx}-${faceIdx}-${uniformIdx}-${weaponIdx}-${accessoryIdx}`;
    if (spriteCache[key]) return spriteCache[key];

    const scale = 2; 
    const canvases = [
        document.createElement('canvas'),
        document.createElement('canvas'),
        document.createElement('canvas'),
        document.createElement('canvas')
    ];

    canvases.forEach((c, frame) => {
        c.width = 16 * scale;
        c.height = 16 * scale;
        const cx = c.getContext('2d');

        const drawLayer = (asciiArr) => {
            if (!asciiArr || asciiArr.length === 0) return;
            for (let y = 0; y < 16; y++) {
                if (!asciiArr[y]) continue;
                for (let x = 0; x < 16; x++) {
                    let char = asciiArr[y][x];
                    if (P[char]) {
                        let renderColor = P[char];
                        // Detekcja rasy dla dłoni trzymających broń ('h')
                        if (char === 'h') {
                            // Uwzględnia index 10 (Własna twarz)
                            const HAND_COLORS = ['S', 'L', 'K', 'G', 'S', 'S', 'S', 'g', 'S', 'B', 'S', 'O'];
                            renderColor = P[HAND_COLORS[faceIdx] || 'S'];
                        }
                        cx.fillStyle = renderColor;
                        cx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
            }
        };

        const acc = ACCESSORIES[accessoryIdx];
        if (acc && acc.isBack) drawLayer(acc.art);
        
        const uLayers = [UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4];
        drawLayer(uLayers[frame][uniformIdx]);
        drawLayer(FACES[faceIdx]);
        drawLayer(HELMETS[helmetIdx]);
        
        // Subtelne poruszanie bronią w klatkach wykroku
        cx.save();
        if (frame === 1 || frame === 3) {
            cx.translate(0, scale); // obniżenie broni o 1 piksel
        }
        drawLayer(WEAPON_LAYERS[weaponIdx]);
        cx.restore();
        
        if (acc && !acc.isBack) drawLayer(acc.art);
    });

    spriteCache[key] = canvases;
    return canvases;
}

export function getSoldierBodySprites(helmetIdx, faceIdx, uniformIdx, accessoryIdx = 0) {
    const key = `body-${helmetIdx}-${faceIdx}-${uniformIdx}-${accessoryIdx}`;
    if (spriteCache[key]) return spriteCache[key];

    const scale = 2; 
    const canvases = [
        document.createElement('canvas'),
        document.createElement('canvas'),
        document.createElement('canvas'),
        document.createElement('canvas')
    ];

    canvases.forEach((c, frame) => {
        c.width = 16 * scale;
        c.height = 16 * scale;
        const cx = c.getContext('2d');

        const drawLayer = (asciiArr) => {
            if (!asciiArr || asciiArr.length === 0) return;
            for (let y = 0; y < 16; y++) {
                if (!asciiArr[y]) continue;
                for (let x = 0; x < 16; x++) {
                    let char = asciiArr[y][x];
                    if (P[char]) {
                        let renderColor = P[char];
                        if (char === 'h') {
                            const HAND_COLORS = ['S', 'L', 'K', 'G', 'S', 'S', 'S', 'g', 'S', 'B', 'S', 'O'];
                            renderColor = P[HAND_COLORS[faceIdx] || 'S'];
                        }
                        cx.fillStyle = renderColor;
                        cx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
            }
        };

        const acc = ACCESSORIES[accessoryIdx];
        if (acc && acc.isBack) drawLayer(acc.art);
        
        const uLayers = [UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4];
        drawLayer(uLayers[frame][uniformIdx]);
        drawLayer(FACES[faceIdx]);
        drawLayer(HELMETS[helmetIdx]);
        
        if (acc && !acc.isBack) drawLayer(acc.art);
    });

    spriteCache[key] = canvases;
    return canvases;
}

export function getWeaponSprite(weaponIdx) {
    const key = `weapon-${weaponIdx}`;
    if (spriteCache[key]) return spriteCache[key];
    
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const cx = c.getContext('2d');
    const scale = 2;
    const layer = WEAPON_LAYERS[weaponIdx];
    if (layer) {
        for (let y = 0; y < 16; y++) {
            if (!layer[y]) continue;
            for (let x = 0; x < 16; x++) {
                let char = layer[y][x];
                if (P[char]) {
                    cx.fillStyle = P[char];
                    cx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
    }
    spriteCache[key] = c;
    return c;
}

// --- GENEROWANIE WZORCA TERENU (Jungle Terrain) ---
const terrainCanvas = document.createElement('canvas');
terrainCanvas.width = 64;
terrainCanvas.height = 64;
const tCtx = terrainCanvas.getContext('2d');

for (let i = 0; i < 64; i += 2) {
    for (let j = 0; j < 64; j += 2) {
        const isDark = Math.random() > 0.5;
        tCtx.fillStyle = isDark ? '#4b8522' : '#5a9e29'; // Jungle greens
        tCtx.fillRect(i, j, 2, 2);
        // Add occasional dirt patches
        if (Math.random() > 0.98) {
            tCtx.fillStyle = '#6e5630';
            tCtx.fillRect(i, j, 4, 4);
        }
    }
}
export const terrainPattern = tCtx.createPattern(terrainCanvas, 'repeat');

// --- PERMANENT SPLATTERS CANVAS (Krew i Zwłoki) ---
export let bloodCanvas;
export let bloodCtx;

export function initBloodCanvas() {
    bloodCanvas = document.createElement('canvas');
    bloodCanvas.width = 12000; 
    bloodCanvas.height = 12000;
    bloodCtx = bloodCanvas.getContext('2d');
}

export function clearBloodCanvas() {
    if (bloodCtx && bloodCanvas) {
        bloodCtx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
    }
}

// Inicjalizacja przy załadowaniu modułu
initBloodCanvas();
