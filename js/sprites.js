import { P, HELMETS, FACES, UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4, WEAPON_LAYERS, ACCESSORIES, CATEGORY_NAMES, make16 } from './config.js';

// --- SYSTEM RENDEROWANIA W LOCIE I BUFOROWANIA SPRITE'ÓW ---
const spriteCache = {};

// Dynamiczne słowniki na wczytywane w locie z dysku grafiki modularne PNG
export const customHelmetImages = {};  // mapuje helmetIdx -> Image
export const customHeadImages = {};    // mapuje faceIdx -> Image
export const customUniformImages = {}; // mapuje uniformIdx -> Image
export const customWeaponImages = {};  // mapuje weaponIdx -> Image

// --- DYNAMICZNY SKANER CZĘŚCI MODULARNYCH (ASSETS DISCOVERY IN RUNTIME) ---
async function checkFileExists(url) {
    const controller = new AbortController();
    // Bezwzględne zabezpieczenie - jeśli lokalny serwer deweloperski zawiesi zapytanie loopback,
    // przerywamy je natychmiast po 500 ms, by nie blokować startu gry!
    const timeoutId = setTimeout(() => controller.abort(), 500);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return false;
        
        const contentType = response.headers.get('Content-Type');
        if (contentType && !contentType.toLowerCase().includes('image')) {
            return false;
        }
        return true;
    } catch (e) {
        clearTimeout(timeoutId);
        return false;
    }
}

export async function discoverCustomAssets() {
    console.log("Rozpoczynam dynamiczne skanowanie modularnych części w grze...");
    
    // 1. Skanowanie czapek / kasków - limit maks. 20
    for (let hIdx = 1; hIdx <= 20; hIdx++) {
        let url = `img/characters/hat_${hIdx}.png`;
        let exists = await checkFileExists(url);
        if (!exists) continue;
        
        if (HELMETS.length <= hIdx) {
            HELMETS.push(make16(["                "], 1));
            CATEGORY_NAMES.helmet.push(`Czapka Bojowa ${hIdx} (hat_${hIdx})`);
        }
        
        let img = new Image();
        img.src = url + `?v=1.2`;
        customHelmetImages[hIdx] = img;
    }
    
    // 2. Skanowanie głów - limit maks. 20
    for (let fIdx = 1; fIdx <= 20; fIdx++) {
        let url = `img/characters/head_${fIdx}.png`;
        let exists = await checkFileExists(url);
        if (!exists) continue;
        
        let idxInState = fIdx - 1;
        if (FACES.length <= idxInState) {
            FACES.push(make16(["                "], 1));
            CATEGORY_NAMES.face.push(`Twarz Własna ${fIdx} (head_${fIdx})`);
        }
        
        let img = new Image();
        img.src = url + `?v=1.2`;
        customHeadImages[idxInState] = img;
    }
    
    // 3. Skanowanie mundurów - limit maks. 20
    for (let uIdx = 1; uIdx <= 20; uIdx++) {
        let url = `img/characters/uniform_${uIdx}.png`;
        let exists = await checkFileExists(url);
        if (!exists) continue;
        
        let idxInState = uIdx - 1;
        if (UNIFORMS_1.length <= idxInState) {
            UNIFORMS_1.push(make16(["                "], 1));
            UNIFORMS_2.push(make16(["                "], 1));
            
            let res3 = make16(["                "], 1);
            res3[13] = "      B         ";
            res3[14] = "     BBB   B    ";
            UNIFORMS_3.push(res3);
            
            let res4 = make16(["                "], 1);
            res4[13] = "          B     ";
            res4[14] = "       B  BBB   ";
            UNIFORMS_4.push(res4);
            
            CATEGORY_NAMES.uniform.push(`Mundur Własny ${uIdx} (uniform_${uIdx})`);
        }
        
        let img = new Image();
        img.src = url + `?v=1.2`;
        customUniformImages[idxInState] = img;
    }

    // 4. Skanowanie broni - limit maks. 20
    for (let wIdx = 1; wIdx <= 20; wIdx++) {
        let url = `img/characters/weapon_${wIdx}.png`;
        let exists = await checkFileExists(url);
        if (!exists) continue;
        
        let idxInState = wIdx - 1;
        if (WEAPON_LAYERS.length <= idxInState) {
            WEAPON_LAYERS.push(make16(["                "], 1));
            CATEGORY_NAMES.weapon.push(`Broń Własna ${wIdx} (weapon_${wIdx})`);
        }
        
        let img = new Image();
        img.src = url + `?v=1.2`;
        customWeaponImages[idxInState] = img;
    }
    
    console.log("Skanowanie modularnych części w grze zakończone!");
}
window.discoverCustomAssets = discoverCustomAssets;

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
                            const HAND_COLORS = ['G', 'L', 'K', 'G', 'G', 'G', 'G', 'K', 'G', 'B', 'G', 'O'];
                            renderColor = P[HAND_COLORS[faceIdx] || 'G'];
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
        if (customUniformImages[uniformIdx] && customUniformImages[uniformIdx].complete) {
            let img = customUniformImages[uniformIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(uLayers[frame][uniformIdx]);
        }
        
        if (customHeadImages[faceIdx] && customHeadImages[faceIdx].complete) {
            let img = customHeadImages[faceIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(FACES[faceIdx]);
        }
        
        if (customHelmetImages[helmetIdx] && customHelmetImages[helmetIdx].complete) {
            let img = customHelmetImages[helmetIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(HELMETS[helmetIdx]);
        }
        
        // Subtelne poruszanie bronią w klatkach wykroku
        cx.save();
        if (frame === 1 || frame === 3) {
            cx.translate(0, scale); // obniżenie broni o 1 piksel
        }
        if (customWeaponImages[weaponIdx] && customWeaponImages[weaponIdx].complete) {
            let img = customWeaponImages[weaponIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(WEAPON_LAYERS[weaponIdx]);
        }
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
                            const HAND_COLORS = ['G', 'L', 'K', 'G', 'G', 'G', 'G', 'K', 'G', 'B', 'G', 'O'];
                            renderColor = P[HAND_COLORS[faceIdx] || 'G'];
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
        if (customUniformImages[uniformIdx] && customUniformImages[uniformIdx].complete) {
            let img = customUniformImages[uniformIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(uLayers[frame][uniformIdx]);
        }
        
        if (customHeadImages[faceIdx] && customHeadImages[faceIdx].complete) {
            let img = customHeadImages[faceIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(FACES[faceIdx]);
        }
        
        if (customHelmetImages[helmetIdx] && customHelmetImages[helmetIdx].complete) {
            let img = customHelmetImages[helmetIdx];
            let fw = (img.width > 256) ? 256 : img.width;
            let sx = (img.width > 256) ? (frame * 256) : 0;
            cx.drawImage(img, sx, 0, fw, img.height, 0, 0, 32, 32);
        } else {
            drawLayer(HELMETS[helmetIdx]);
        }
        
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
    
    if (customWeaponImages[weaponIdx] && customWeaponImages[weaponIdx].complete) {
        let img = customWeaponImages[weaponIdx];
        let fw = (img.width > 256) ? 256 : img.width;
        cx.drawImage(img, 0, 0, fw, img.height, 0, 0, 32, 32);
    } else {
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
