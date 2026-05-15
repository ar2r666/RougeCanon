import { P, HELMETS, FACES, UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4, WEAPON_LAYERS, ACCESSORIES, CATEGORY_NAMES, state as gameState, stats, customSquadDesign } from './config.js';
import { Soldier } from './entities/Soldier.js';
import { getSoldierSprites } from './sprites.js';

let heroConfigState = {
    helmet: 0,
    face: 10,
    uniform: 11,
    weapon: 0,
    accessory: 0
};

let enemyConfigState = {
    helmet: 10,
    face: 3,
    uniform: 10,
    weapon: 0,
    accessory: 0
};

let weaponConfigState = {
    barrel: 0,
    stock: 0,
    magazine: 0,
    attachment: 0
};

let crateConfigState = {
    base: 0
};

const WEAPON_CATEGORIES = [
    { id: 'barrel', label: 'LUFA (ZASIĘG/ODRZUT)' },
    { id: 'stock', label: 'KOLBA (STABILIZACJA)' },
    { id: 'magazine', label: 'MAGAZYNEK (AMUNICJA)' },
    { id: 'attachment', label: 'AKCESORIA TAKTYCZNE' }
];

const WEAPON_CATEGORY_NAMES = {
    barrel: ["Standardowa", "Wydłużona (+Zasięg)", "Krótka CQB", "Ciężka Wzmocniona", "Tłumik Dźwięku"],
    stock: ["Standardowa", "Lekka Taktyczna", "Ciężka Snajperska", "Składana", "Brak Kolby"],
    magazine: ["Standardowy", "Powiększony Bębnowy", "Szybkie Przeładowanie", "Podwójnie Sprzężony", "Amunicja Smugowa"],
    attachment: ["Brak Akcesoriów", "Celownik Laserowy", "Granatnik", "Uchwyt Pionowy", "Bagnet Bojowy"]
};

const CRATE_CATEGORIES = [
    { id: 'base', label: 'WYGLĄD BAZOWY SKRZYNKI' }
];

const CRATE_CATEGORY_NAMES = {
    base: ["Wojskowa Drewniana", "Stalowy Pancerz", "Złota Skrzynia Zaopatrzeniowa", "Skrzynka Obcych", "Wzmocniony Kompozyt"]
};

let acceptedComponentAnims = {
    helmet: null,
    face: null,
    uniform: null,
    weapon: null,
    accessory: null
};

let currentCreatorTab = 'templates';
let isEditorActive = false;
let editorTarget = 'helmet';
let customAnimGrids = Array(4).fill().map(() => Array(16).fill().map(() => Array(16).fill(' ')));
let currentEditFrame = 0;
let undoStack = [];
let activeColorChar = 'H';
let isDrawing = false;
let selectedCharacterTarget = 'hero';
let animationFrameId = null;

const CATEGORIES = [
    { id: 'helmet', label: 'KASK / HEŁM' },
    { id: 'face', label: 'TWARZ / GŁOWA' },
    { id: 'uniform', label: 'MUNDUR / KORPUS' },
    { id: 'weapon', label: 'BROŃ' },
    { id: 'accessory', label: 'DODATKI SPECJALNE' }
];

export function initCreatorUI() {
    const panels = document.getElementById('creator-panels');
    if (!panels) return;
    panels.replaceChildren();

    const catsToUse = selectedCharacterTarget === 'crate' ? CRATE_CATEGORIES : (selectedCharacterTarget === 'weapon' ? WEAPON_CATEGORIES : CATEGORIES);
    const namesToUse = selectedCharacterTarget === 'crate' ? CRATE_CATEGORY_NAMES : (selectedCharacterTarget === 'weapon' ? WEAPON_CATEGORY_NAMES : CATEGORY_NAMES);
    const stateToUse = selectedCharacterTarget === 'crate' ? crateConfigState : (selectedCharacterTarget === 'weapon' ? weaponConfigState : (selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState));

    catsToUse.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-box';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'cat-title';
        titleDiv.textContent = cat.label + ' ';
        
        const valSpan = document.createElement('span');
        valSpan.className = 'val';
        valSpan.id = `creator-lbl-${cat.id}`;
        valSpan.textContent = namesToUse[cat.id][stateToUse[cat.id]] || '';
        titleDiv.appendChild(valSpan);
        div.appendChild(titleDiv);

        const gridDiv = document.createElement('div');
        gridDiv.className = 'creator-grid';
        gridDiv.id = `creator-grid-${cat.id}`;

        const nameList = namesToUse[cat.id];
        for (let i = 0; i < nameList.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-grid' + (i === stateToUse[cat.id] ? ' active' : '');
            btn.textContent = String(i + 1);
            btn.onclick = () => {
                stateToUse[cat.id] = i;
                
                if (selectedCharacterTarget === 'crate') {
                    customSquadDesign.crateSkin = null;
                } else if (selectedCharacterTarget === 'weapon') {
                    customSquadDesign.weaponSkin = null;
                    customSquadDesign.customWeaponIdx = i;
                    
                    let wObj = customSquadDesign.customWeaponConfig || {};
                    const bMap = ['standard', 'long', 'short', 'heavy', 'standard'];
                    const sMap = ['standard', 'light', 'heavy', 'fold', 'none'];
                    const mMap = ['standard', 'extended', 'quick', 'dual', 'tracer'];
                    const aMap = ['none', 'laser', 'launcher', 'grip', 'bayonet'];
                    
                    if (cat.id === 'barrel') wObj.barrel = bMap[i];
                    if (cat.id === 'stock') wObj.stock = sMap[i];
                    if (cat.id === 'magazine') wObj.magazine = mMap[i];
                    if (cat.id === 'attachment') wObj.attachment = aMap[i];
                    
                    customSquadDesign.customWeaponConfig = wObj;
                } else if (selectedCharacterTarget === 'enemy') {
                    if (customSquadDesign.enemy) {
                        customSquadDesign.enemy.customImageSkin = null;
                        customSquadDesign.enemy.helmetIdx = enemyConfigState.helmet;
                        customSquadDesign.enemy.faceIdx = enemyConfigState.face;
                        customSquadDesign.enemy.uniformIdx = enemyConfigState.uniform;
                        customSquadDesign.enemy.accessoryIdx = enemyConfigState.accessory;
                        customSquadDesign.enemy.isCustomized = true;
                    }
                    gameState.enemies.forEach(e => e.customImageSkin = null);
                } else {
                    if (customSquadDesign.hero) {
                        customSquadDesign.hero.customImageSkin = null;
                        customSquadDesign.hero.helmetIdx = heroConfigState.helmet;
                        customSquadDesign.hero.faceIdx = heroConfigState.face;
                        customSquadDesign.hero.uniformIdx = heroConfigState.uniform;
                        customSquadDesign.hero.accessoryIdx = heroConfigState.accessory;
                        customSquadDesign.hero.isCustomized = true;
                    }
                    gameState.squad.forEach(s => s.customImageSkin = null);
                }
                
                creatorUpdateAllGrids();
                creatorLiveSyncToSelected();
            };
            gridDiv.appendChild(btn);
        }
        div.appendChild(gridDiv);
        panels.appendChild(div);
    });
    creatorUpdateAllGrids();
}

export function creatorUpdateAllGrids() {
    const catsToUse = selectedCharacterTarget === 'crate' ? CRATE_CATEGORIES : (selectedCharacterTarget === 'weapon' ? WEAPON_CATEGORIES : CATEGORIES);
    const namesToUse = selectedCharacterTarget === 'crate' ? CRATE_CATEGORY_NAMES : (selectedCharacterTarget === 'weapon' ? WEAPON_CATEGORY_NAMES : CATEGORY_NAMES);
    const stateToUse = selectedCharacterTarget === 'crate' ? crateConfigState : (selectedCharacterTarget === 'weapon' ? weaponConfigState : (selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState));

    catsToUse.forEach(cat => {
        const valLabel = document.getElementById(`creator-lbl-${cat.id}`);
        if (valLabel) {
            valLabel.textContent = namesToUse[cat.id][stateToUse[cat.id]] || '';
        }
        
        const grid = document.getElementById(`creator-grid-${cat.id}`);
        if (grid) {
            Array.from(grid.children).forEach((btn, idx) => {
                btn.className = 'btn-grid' + (idx === stateToUse[cat.id] ? ' active' : '');
            });
        }
    });
}

function creatorLiveSyncToSelected() {
    if (selectedCharacterTarget === 'hero' && customSquadDesign.hero) {
        customSquadDesign.hero.helmetIdx = heroConfigState.helmet;
        customSquadDesign.hero.faceIdx = heroConfigState.face;
        customSquadDesign.hero.uniformIdx = heroConfigState.uniform;
        customSquadDesign.hero.weaponIdx = heroConfigState.weapon;
        customSquadDesign.hero.accessoryIdx = heroConfigState.accessory;
        customSquadDesign.hero.isCustomized = true;
    }
    if (selectedCharacterTarget === 'enemy' && customSquadDesign.enemy) {
        customSquadDesign.enemy.helmetIdx = enemyConfigState.helmet;
        customSquadDesign.enemy.faceIdx = enemyConfigState.face;
        customSquadDesign.enemy.uniformIdx = enemyConfigState.uniform;
        customSquadDesign.enemy.weaponIdx = enemyConfigState.weapon;
        customSquadDesign.enemy.accessoryIdx = enemyConfigState.accessory;
        customSquadDesign.enemy.isCustomized = true;
    }

    if (selectedCharacterTarget === 'weapon') {
        customSquadDesign.customWeaponIdx = customSquadDesign.customWeaponIdx || 0;
    }

    if (gameState.squad) {
        gameState.squad.forEach((soldier, idx) => {
            if (selectedCharacterTarget === 'hero' && customSquadDesign.hero.isCustomized) {
                soldier.helmetIdx = customSquadDesign.hero.helmetIdx;
                soldier.faceIdx = customSquadDesign.hero.faceIdx;
                soldier.uniformIdx = customSquadDesign.hero.uniformIdx;
                soldier.weaponIdx = customSquadDesign.hero.weaponIdx;
                soldier.accessoryIdx = customSquadDesign.hero.accessoryIdx;
                
                let activeSkins = customSquadDesign.heroSkins ? customSquadDesign.heroSkins.filter(Boolean) : [];
                if (activeSkins.length > 0) {
                    soldier.customImageSkin = activeSkins[idx % activeSkins.length];
                } else {
                    soldier.customImageSkin = customSquadDesign.hero.customImageSkin;
                }
            }
            soldier.updateSprites();
        });
    }

    if (gameState.enemies) {
        gameState.enemies.forEach(enemy => {
            if (selectedCharacterTarget === 'enemy' && customSquadDesign.enemy.isCustomized) {
                enemy.helmetIdx = customSquadDesign.enemy.helmetIdx;
                enemy.faceIdx = customSquadDesign.enemy.faceIdx;
                enemy.uniformIdx = customSquadDesign.enemy.uniformIdx;
                enemy.weaponIdx = customSquadDesign.enemy.weaponIdx;
                enemy.accessoryIdx = customSquadDesign.enemy.accessoryIdx;
                enemy.customImageSkin = customSquadDesign.enemy.customImageSkin;
            }
            enemy.updateSprites();
        });
    }
}

export function initCreatorEditor() {
    const paletteDiv = document.getElementById('creator-palette');
    const gridDiv = document.getElementById('creator-pixel-grid');
    if (!paletteDiv || !gridDiv) return;

    paletteDiv.replaceChildren();
    gridDiv.replaceChildren();

    const eraser = document.createElement('div');
    eraser.className = 'swatch swatch-eraser';
    eraser.textContent = 'X';
    eraser.onclick = () => creatorSetActiveColor(' ', eraser);
    paletteDiv.appendChild(eraser);

    Object.keys(P).forEach(key => {
        if (key === ' ' || key === 'h') return;
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        if (key === activeColorChar) swatch.classList.add('active');
        swatch.style.backgroundColor = P[key];
        swatch.onclick = () => creatorSetActiveColor(key, swatch);
        paletteDiv.appendChild(swatch);
    });

    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const cell = document.createElement('div');
            cell.className = 'pixel-cell';
            cell.dataset.x = String(x);
            cell.dataset.y = String(y);
            gridDiv.appendChild(cell);
        }
    }

    const drawHandler = (e) => {
        let target = e.target;
        if (e.type.startsWith('touch')) {
            const touch = e.touches[0];
            target = document.elementFromPoint(touch.clientX, touch.clientY);
        }
        if (target && target.classList.contains('pixel-cell')) {
            const x = parseInt(target.dataset.x, 10);
            const y = parseInt(target.dataset.y, 10);
            creatorPaintPixel(x, y, target);
        }
    };

    gridDiv.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('pixel-cell')) {
            creatorSaveStateForUndo();
            isDrawing = true;
            drawHandler(e);
        }
    });
    gridDiv.addEventListener('mouseover', (e) => { if (isDrawing) drawHandler(e); });
    window.addEventListener('mouseup', () => { isDrawing = false; });

    gridDiv.addEventListener('touchstart', (e) => {
        e.preventDefault();
        creatorSaveStateForUndo();
        isDrawing = true;
        drawHandler(e);
    }, { passive: false });
    gridDiv.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDrawing) drawHandler(e);
    }, { passive: false });
    window.addEventListener('touchend', () => { isDrawing = false; });
}

function creatorSetActiveColor(char, element) {
    activeColorChar = char;
    document.querySelectorAll('#creator-palette .swatch').forEach(s => s.classList.remove('active'));
    element.classList.add('active');
}

export function creatorSetEditFrame(fIdx) {
    currentEditFrame = fIdx;
    document.querySelectorAll('.editor-toolbar ~ div button[id^="creator-frame-btn-"]').forEach((btn, i) => {
        btn.className = 'btn-action ' + (i === fIdx ? 'success' : 'secondary');
    });
    creatorUpdateEditorGridUI();
}

export function creatorCopyFrameToAll() {
    const src = customAnimGrids[currentEditFrame];
    for (let f = 0; f < 4; f++) {
        if (f !== currentEditFrame) {
            customAnimGrids[f] = src.map(row => [...row]);
        }
    }
    creatorSaveStateForUndo();
    console.warn("Skopiowano klatkę do wszystkich buforów.");
}

export function creatorShiftLayer(direction) {
    creatorSaveStateForUndo();
    let f = currentEditFrame;
    let oldGrid = customAnimGrids[f].map(row => [...row]);
    let newGrid = Array(16).fill().map(() => Array(16).fill(' '));
    
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            let ny = y, nx = x;
            if (direction === 'up') ny = y - 1;
            if (direction === 'down') ny = y + 1;
            if (direction === 'left') nx = x - 1;
            if (direction === 'right') nx = x + 1;
            
            if (ny >= 0 && ny < 16 && nx >= 0 && nx < 16) {
                newGrid[ny][nx] = oldGrid[y][x];
            }
        }
    }
    customAnimGrids[f] = newGrid;
    creatorUpdateEditorGridUI();
    creatorLiveSyncToSelected();
    console.warn(`Przesunięto klatkę ${f + 1} w kierunku: ${direction}`);
}

function creatorPaintPixel(x, y, cell) {
    customAnimGrids[currentEditFrame][y][x] = activeColorChar;
    cell.style.backgroundColor = activeColorChar === ' ' ? 'transparent' : P[activeColorChar];
}

function creatorUpdateEditorGridUI() {
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const cell = document.querySelector(`#creator-pixel-grid .pixel-cell[data-x="${x}"][data-y="${y}"]`);
            if (cell) {
                const char = customAnimGrids[currentEditFrame][y][x];
                cell.style.backgroundColor = char === ' ' ? 'transparent' : P[char];
            }
        }
    }
}

export function creatorAcceptComponentAnim() {
    acceptedComponentAnims[editorTarget] = customAnimGrids.map(grid => grid.map(row => [...row]));
    creatorLiveSyncToSelected();
    console.warn(`Zaakceptowano ruch klatek dla warstwy: ${editorTarget}`);
}

export function creatorLoadCurrentToEditor() {
    if (acceptedComponentAnims[editorTarget]) {
        customAnimGrids = acceptedComponentAnims[editorTarget].map(grid => grid.map(row => [...row]));
        undoStack = [];
        creatorSaveStateForUndo();
        creatorUpdateEditorGridUI();
        return;
    }

    const stateToUse = selectedCharacterTarget === 'weapon' ? weaponConfigState : (selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState);
    const currentIdx = stateToUse[editorTarget] || 0;
    const uLayers = [UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4];

    for (let f = 0; f < 4; f++) {
        let targetList;
        switch (editorTarget) {
            case 'helmet': targetList = HELMETS; break;
            case 'face': targetList = FACES; break;
            case 'uniform': targetList = uLayers[f]; break;
            case 'weapon': targetList = WEAPON_LAYERS; break;
            case 'accessory': targetList = ACCESSORIES; break;
        }

        let art = targetList ? targetList[currentIdx] : null;
        if (editorTarget === 'accessory' && art) art = art.art;

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                if (art && art[y] && art[y][x]) {
                    customAnimGrids[f][y][x] = art[y][x];
                } else {
                    customAnimGrids[f][y][x] = ' ';
                }
            }
        }
    }
    undoStack = [];
    creatorSaveStateForUndo();
    creatorUpdateEditorGridUI();
}

export function creatorOnTargetChange(val) {
    editorTarget = val;
    creatorLoadCurrentToEditor();
}

export function creatorSaveStateForUndo() {
    undoStack.push(customAnimGrids.map(grid => grid.map(row => [...row])));
    if (undoStack.length > 30) undoStack.shift();
}

export function creatorUndo() {
    if (undoStack.length > 0) {
        customAnimGrids = undoStack.pop();
        creatorUpdateEditorGridUI();
    }
}

export function creatorClearLayer() {
    creatorSaveStateForUndo();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            customAnimGrids[currentEditFrame][y][x] = ' ';
        }
    }
    creatorUpdateEditorGridUI();
}

export function creatorSaveCustomElement() {
    let isEmpty = true;
    for (let r of customAnimGrids[currentEditFrame]) if (r.some(c => c !== ' ')) isEmpty = false;
    
    if (isEmpty) {
        console.warn("Siatka edytora jest pusta.");
        return;
    }

    const artF0 = customAnimGrids[0].map(row => row.join(''));
    const artF1 = customAnimGrids[1].map(row => row.join(''));
    const artF2 = customAnimGrids[2].map(row => row.join(''));
    const artF3 = customAnimGrids[3].map(row => row.join(''));
    
    let targetList, nameList;

    switch (editorTarget) {
        case 'helmet': targetList = HELMETS; break;
        case 'face': targetList = FACES; break;
        case 'uniform': 
            targetList = UNIFORMS_1; 
            UNIFORMS_2.push([...artF1]);
            UNIFORMS_3.push([...artF2]);
            UNIFORMS_4.push([...artF3]);
            break;
        case 'weapon': targetList = WEAPON_LAYERS; break;
        case 'accessory': targetList = ACCESSORIES; break;
    }
    nameList = CATEGORY_NAMES[editorTarget];

    const newIdx = targetList.length;
    nameList.push("Własny Wzorzec " + newIdx);

    if (editorTarget === 'accessory') {
        targetList.push({ isBack: false, art: [...artF0] });
    } else {
        targetList.push([...artF0]);
    }

    if (selectedCharacterTarget === 'hero' && customSquadDesign.hero) customSquadDesign.hero.customImageSkin = null;
    if (selectedCharacterTarget === 'enemy' && customSquadDesign.enemy) customSquadDesign.enemy.customImageSkin = null;
    if (selectedCharacterTarget === 'weapon') customSquadDesign.weaponSkin = null;
    
    if (gameState.squad) gameState.squad.forEach(s => s.customImageSkin = null);
    if (gameState.enemies) gameState.enemies.forEach(e => e.customImageSkin = null);

    const stateToUse = selectedCharacterTarget === 'weapon' ? weaponConfigState : (selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState);
    stateToUse[editorTarget] = newIdx;
    initCreatorUI();
    creatorSwitchTab('templates');
    creatorLiveSyncToSelected();
}

export function creatorSwitchTab(tabName) {
    currentCreatorTab = tabName;
    document.querySelectorAll('.creator-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.creator-tab-content').forEach(c => c.classList.remove('active'));

    const btns = document.querySelectorAll('.creator-tab-btn');
    const contentTmpl = document.getElementById('creator-tab-templates');
    const contentShared = document.getElementById('creator-shared-editor');
    
    const drawInfo = document.getElementById('creator-mode-drawing-info');
    const animControls = document.getElementById('creator-mode-animation-controls');
    const animFooter = document.getElementById('creator-mode-animation-footer');

    if (tabName === 'templates') {
        isEditorActive = false;
        if (btns[0]) btns[0].classList.add('active');
        if (contentTmpl) contentTmpl.classList.add('active');
    } else if (tabName === 'editor') {
        isEditorActive = true;
        if (btns[1]) btns[1].classList.add('active');
        if (contentShared) contentShared.classList.add('active');
        
        if (drawInfo) drawInfo.style.display = 'block';
        if (animControls) animControls.style.display = 'none';
        if (animFooter) animFooter.style.display = 'none';
        
        creatorSetEditFrame(0);
        creatorLoadCurrentToEditor();
    } else if (tabName === 'animation') {
        isEditorActive = true;
        if (btns[2]) btns[2].classList.add('active');
        if (contentShared) contentShared.classList.add('active');
        
        if (drawInfo) drawInfo.style.display = 'none';
        if (animControls) animControls.style.display = 'flex';
        if (animFooter) animFooter.style.display = 'flex';
        
        creatorLoadCurrentToEditor();
    }
}

export function creatorRandomize() {
    const stateToUse = selectedCharacterTarget === 'weapon' ? weaponConfigState : (selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState);
    const catsToUse = selectedCharacterTarget === 'weapon' ? WEAPON_CATEGORIES : CATEGORIES;
    const namesToUse = selectedCharacterTarget === 'weapon' ? WEAPON_CATEGORY_NAMES : CATEGORY_NAMES;
    catsToUse.forEach(cat => {
        stateToUse[cat.id] = Math.floor(Math.random() * namesToUse[cat.id].length);
    });
    creatorUpdateAllGrids();
    creatorLiveSyncToSelected();
}

export function creatorApplyToSquad() {
    creatorLiveSyncToSelected();
}

export function creatorPopulateSelect() {
    const selectEl = document.getElementById('creator-character-select');
    if (!selectEl) return;
    
    // Jeśli przeglądarka automatycznie odtworzyła stan opcji po odświeżeniu, zsynchronizujmy stan wewnętrzny!
    if (selectEl.value && ['hero', 'enemy', 'weapon'].includes(selectEl.value)) {
        selectedCharacterTarget = selectEl.value;
    } else {
        selectedCharacterTarget = 'hero';
        selectEl.value = 'hero';
    }
}

export function creatorSelectCharacter(val) {
    selectedCharacterTarget = val;
    let targetCfg = null;
    if (val === 'hero') targetCfg = customSquadDesign.hero;
    if (val === 'enemy') targetCfg = customSquadDesign.enemy;
    
    if (targetCfg) {
        if (!targetCfg.isCustomized && val === 'enemy') {
            targetCfg.helmetIdx = 10;
            targetCfg.faceIdx = 3;
            targetCfg.uniformIdx = 10;
            targetCfg.accessoryIdx = 0;
            targetCfg.isCustomized = true;
        }
        const stateToSet = val === 'enemy' ? enemyConfigState : heroConfigState;
        stateToSet.helmet = targetCfg.helmetIdx || 0;
        stateToSet.face = targetCfg.faceIdx || 0;
        stateToSet.uniform = targetCfg.uniformIdx || 0;
        stateToSet.accessory = targetCfg.accessoryIdx || 0;
    }
    
    // Dynamiczna zmiana pasków szablonów na opcje uzbrojenia
    initCreatorUI();
    creatorUpdateAllGrids();
    creatorLoadCurrentToEditor();
    creatorLiveSyncToSelected();
}

let terrainPatternPreview = null;

function getTerrainPattern(ctx) {
    if (terrainPatternPreview) return terrainPatternPreview;
    const tC = document.createElement('canvas');
    tC.width = 128; tC.height = 128;
    const tCtx = tC.getContext('2d');
    for (let i = 0; i < 128; i += 16) {
        for (let j = 0; j < 128; j += 16) {
            // Jaśniejsze tło podglądu dla wyrazistego kontrastu pikseli
            tCtx.fillStyle = Math.random() > 0.5 ? '#6a7073' : '#585e61';
            tCtx.fillRect(i, j, 16, 16);
            if (Math.random() > 0.85) {
                tCtx.fillStyle = '#7b8285';
                tCtx.fillRect(i, j, 16, 16);
            }
        }
    }
    terrainPatternPreview = ctx.createPattern(tC, 'repeat');
    return terrainPatternPreview;
}

function drawCreatorPreviewDirect(context, scale, bobY) {
    if (selectedCharacterTarget === 'crate') {
        context.imageSmoothingEnabled = false;
        if (customSquadDesign.crateSkin) {
            let fh = customSquadDesign.crateSkin.height;
            let totalF = Math.max(1, Math.round(customSquadDesign.crateSkin.width / fh));
            let liveF = totalF > 1 ? Math.floor(Date.now() / 200) % totalF : 0;
            context.drawImage(customSquadDesign.crateSkin, liveF * fh, 0, fh, fh, 0, 0, 256, 256);
        } else {
            const crateSrc = new Image();
            crateSrc.src = 'img/crate_destroy.png';
            if (crateSrc.complete && crateSrc.width > 0) {
                context.drawImage(crateSrc, 0, 0, 60, 60, 16, 16, 224, 224);
            } else {
                context.fillStyle = '#8b5a2b';
                context.fillRect(32, 32, 192, 192);
            }
        }
        return;
    }

    let targetCfg = null;
    if (selectedCharacterTarget === 'hero') targetCfg = customSquadDesign.hero;
    if (selectedCharacterTarget === 'enemy') targetCfg = customSquadDesign.enemy;
    
    if (selectedCharacterTarget === 'weapon' && customSquadDesign.weaponSkin) {
        context.imageSmoothingEnabled = false;
        let fh = customSquadDesign.weaponSkin.height;
        let totalF = Math.max(1, Math.round(customSquadDesign.weaponSkin.width / fh));
        let liveF = totalF > 1 ? Math.floor(Date.now() / 200) % totalF : 0;
        context.drawImage(customSquadDesign.weaponSkin, liveF * fh, 0, fh, fh, 0, 0, 256, 256);
        return;
    }

    if (targetCfg && targetCfg.customImageSkin) {
        context.imageSmoothingEnabled = false;
        let fh = targetCfg.customImageSkin.height;
        let totalF = Math.max(1, Math.round(targetCfg.customImageSkin.width / fh));
        let liveF = totalF > 1 ? Math.floor(Date.now() / 200) % totalF : 0;
        context.drawImage(targetCfg.customImageSkin, liveF * fh, 0, fh, fh, 0, 0, 256, 256);
        return;
    }

    const stateToUse = selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState;
    const wIdxExp = selectedCharacterTarget === 'weapon' ? (customSquadDesign && customSquadDesign.customWeaponIdx !== undefined ? customSquadDesign.customWeaponIdx : 0) : stateToUse.weapon;

    if (!isEditorActive) {
        let hIdx = stateToUse.helmet;
        let fIdx = stateToUse.face;
        let uIdx = stateToUse.uniform;
        if (selectedCharacterTarget === 'enemy' && (!targetCfg || !targetCfg.isCustomized)) {
            hIdx = 10; fIdx = 3; uIdx = 10;
        }
        const cachedCanvases = getSoldierSprites(hIdx, fIdx, uIdx, wIdxExp, stateToUse.accessory);
        if (cachedCanvases && cachedCanvases[0]) {
            context.imageSmoothingEnabled = false;
            let liveF = Math.floor(Date.now() / 200) % 4;
            let drawC = cachedCanvases[liveF] || cachedCanvases[0];
            context.drawImage(drawC, 0, 0, 32, 32, 0, 0, 256, 256);
            return;
        }
    }

    const drawLayer = (asciiArr) => {
        if (!asciiArr || asciiArr.length === 0) return;
        for (let y = 0; y < 16; y++) {
            if (!asciiArr[y]) continue;
            for (let x = 0; x < 16; x++) {
                const char = asciiArr[y][x];
                if (P[char]) {
                    let renderColor = P[char];
                    if (char === 'h') {
                        const HAND_COLORS = ['S', 'L', 'K', 'G', 'S', 'S', 'S', 'g', 'S', 'B', 'S', 'O'];
                        renderColor = P[HAND_COLORS[stateToUse.face] || 'S'];
                    }
                    context.fillStyle = renderColor;
                    context.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
    };

    const acc = ACCESSORIES[stateToUse.accessory];
    
    // W zakładce RYSOWANIE blokujemy ruch, wyświetlając wyłącznie statyczną Klatkę 1 z płótna.
    // W zakładce ANIMACJA odtwarzamy pełen 4-klatkowy cykl ruchu.
    const liveF = currentCreatorTab === 'animation' ? Math.floor(Date.now() / 200) % 4 : 0;
    const uLayers = [UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4];

    const getLayerToDraw = (compKey, defaultLayer) => {
        if (isEditorActive && editorTarget === compKey) return customAnimGrids[liveF];
        if (acceptedComponentAnims[compKey]) return acceptedComponentAnims[compKey][liveF];
        return defaultLayer;
    };

    if (acc && acc.isBack) {
        drawLayer(getLayerToDraw('accessory', acc.art));
    }
    
    let baseU = uLayers[liveF] ? uLayers[liveF][stateToUse.uniform] : UNIFORMS_1[stateToUse.uniform];
    drawLayer(getLayerToDraw('uniform', baseU));
    drawLayer(getLayerToDraw('face', FACES[stateToUse.face]));
    drawLayer(getLayerToDraw('helmet', HELMETS[stateToUse.helmet]));
    
    context.save();
    if (liveF === 1 || liveF === 3) context.translate(0, scale);
    drawLayer(getLayerToDraw('weapon', WEAPON_LAYERS[wIdxExp]));
    context.restore();
    
    if (acc && !acc.isBack) {
        drawLayer(getLayerToDraw('accessory', acc.art));
    }
}

function creatorLoop() {
    const canvas = document.getElementById('creator-previewCanvas');
    if (canvas && gameState.gameState === 'CREATOR') {
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = getTerrainPattern(ctx);
        ctx.fillRect(0, 0, 256, 256);
        
        drawCreatorPreviewDirect(ctx, 16, 0);
    }
    animationFrameId = requestAnimationFrame(creatorLoop);
}

export function creatorExportImage() {
    const tempC = document.createElement('canvas');
    tempC.width = 256; 
    tempC.height = 256;
    const tempCtx = tempC.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    
    drawCreatorPreviewDirect(tempCtx, 16, 0);
    
    const link = document.createElement('a');
    link.download = 'moj_zolnierz_cannon.png';
    link.href = tempC.toDataURL('image/png');
    link.click();
}

export function creatorUploadSkin(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        console.warn("Wskazany plik nie jest obrazem.");
        return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
        if (selectedCharacterTarget === 'hero') {
            if (customSquadDesign.hero) {
                customSquadDesign.hero.customImageSkin = img;
                customSquadDesign.hero.isCustomized = true;
            }
            gameState.squad.forEach(soldier => soldier.customImageSkin = img);
        }
        if (selectedCharacterTarget === 'enemy') {
            if (customSquadDesign.enemy) {
                customSquadDesign.enemy.customImageSkin = img;
                customSquadDesign.enemy.isCustomized = true;
            }
            gameState.enemies.forEach(enemy => enemy.customImageSkin = img);
        }
        if (selectedCharacterTarget === 'weapon') {
            customSquadDesign.weaponSkin = img;
        }
        if (selectedCharacterTarget === 'crate') {
            customSquadDesign.crateSkin = img;
        }
        creatorUpdateAllGrids();
        if (inputEl) inputEl.value = '';
    };
    img.src = url;
}

let previousGameState = 'MENU';

export function showCreatorScreen() {
    previousGameState = gameState.gameState;
    gameState.gameState = 'CREATOR';
    document.getElementById('screens').classList.remove('hidden');
    
    const elMenu = document.getElementById('mainMenu');
    const elUpgr = document.getElementById('upgradeScreen');
    const elOver = document.getElementById('gameOverScreen');
    const elCreat = document.getElementById('creatorScreen');
    
    if (elMenu) elMenu.classList.add('hidden');
    if (elUpgr) elUpgr.classList.add('hidden');
    if (elOver) elOver.classList.add('hidden');
    if (elCreat) elCreat.classList.remove('hidden');

    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.classList.remove('open');

    creatorPopulateSelect();
    creatorSelectCharacter(selectedCharacterTarget);
    initCreatorEditor();
    
    if (!animationFrameId) {
        creatorLoop();
    }
}

export function hideCreatorScreen() {
    gameState.gameState = previousGameState === 'CREATOR' ? 'PLAY' : previousGameState;
    const elCreat = document.getElementById('creatorScreen');
    if (elCreat) elCreat.classList.add('hidden');
    
    if (gameState.gameState === 'PLAY') {
        document.getElementById('screens').classList.add('hidden');
    } else {
        if (gameState.gameState === 'MENU') {
            const elMenu = document.getElementById('mainMenu');
            if (elMenu) elMenu.classList.remove('hidden');
        } else if (gameState.gameState === 'UPGRADE') {
            const elUpgr = document.getElementById('upgradeScreen');
            if (elUpgr) elUpgr.classList.remove('hidden');
        } else if (gameState.gameState === 'GAMEOVER') {
            const elOver = document.getElementById('gameOverScreen');
            if (elOver) elOver.classList.remove('hidden');
        }
    }
}

window.showCreatorScreen = showCreatorScreen;
window.hideCreatorScreen = hideCreatorScreen;
window.creatorSwitchTab = creatorSwitchTab;
window.creatorRandomize = creatorRandomize;
window.creatorExportImage = creatorExportImage;
window.creatorOnTargetChange = creatorOnTargetChange;
window.creatorUndo = creatorUndo;
window.creatorClearLayer = creatorClearLayer;
window.creatorSaveCustomElement = creatorSaveCustomElement;
window.creatorApplyToSquad = creatorApplyToSquad;
window.creatorSelectCharacter = creatorSelectCharacter;
window.creatorUploadSkin = creatorUploadSkin;
window.creatorSetEditFrame = creatorSetEditFrame;
window.creatorCopyFrameToAll = creatorCopyFrameToAll;
window.creatorShiftLayer = creatorShiftLayer;
window.creatorAcceptComponentAnim = creatorAcceptComponentAnim;

export function creatorExportAnimationPng() {
    const tempC = document.createElement('canvas');
    tempC.width = 128; 
    tempC.height = 32;
    const tempCtx = tempC.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    
    for (let f = 0; f < 4; f++) {
        const singleC = document.createElement('canvas');
        singleC.width = 32;
        singleC.height = 32;
        const sCtx = singleC.getContext('2d');
        sCtx.imageSmoothingEnabled = false;
        
        const drawL = (asciiArr) => {
            if (!asciiArr || asciiArr.length === 0) return;
            for (let y = 0; y < 16; y++) {
                if (!asciiArr[y]) continue;
                for (let x = 0; x < 16; x++) {
                    const char = asciiArr[y][x];
                    if (P[char]) {
                        const stateToUseExp = selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState;
                        let renderColor = P[char];
                        if (char === 'h') {
                            const HAND_COLORS = ['S', 'L', 'K', 'G', 'S', 'S', 'S', 'g', 'S', 'B', 'S', 'O'];
                            renderColor = P[HAND_COLORS[stateToUseExp.face] || 'S'];
                        }
                        sCtx.fillStyle = renderColor;
                        sCtx.fillRect(x * 2, y * 2, 2, 2);
                    }
                }
            }
        };
        
        const stateToUseExp = selectedCharacterTarget === 'enemy' ? enemyConfigState : heroConfigState;
        const wIdxExpVal = customSquadDesign && customSquadDesign.customWeaponIdx !== undefined ? customSquadDesign.customWeaponIdx : 0;
        const acc = ACCESSORIES[stateToUseExp.accessory];
        const uLayers = [UNIFORMS_1, UNIFORMS_2, UNIFORMS_3, UNIFORMS_4];
        
        const getExportL = (cKey, defL) => {
            if (isEditorActive && editorTarget === cKey) return customAnimGrids[f];
            if (acceptedComponentAnims[cKey]) return acceptedComponentAnims[cKey][f];
            return defL;
        };

        if (acc && acc.isBack) {
            drawL(getExportL('accessory', acc.art));
        }
        
        let baseExpU = uLayers[f] ? uLayers[f][stateToUseExp.uniform] : UNIFORMS_1[stateToUseExp.uniform];
        drawL(getExportL('uniform', baseExpU));
        drawL(getExportL('face', FACES[stateToUseExp.face]));
        drawL(getExportL('helmet', HELMETS[stateToUseExp.helmet]));
        
        sCtx.save();
        if (f === 1 || f === 3) sCtx.translate(0, 2);
        drawL(getExportL('weapon', WEAPON_LAYERS[wIdxExpVal]));
        sCtx.restore();
        
        if (acc && !acc.isBack) {
            drawL(getExportL('accessory', acc.art));
        }
        
        tempCtx.drawImage(singleC, f * 32, 0);
    }
    
    const link = document.createElement('a');
    let targetName = selectedCharacterTarget;
    link.download = `${targetName}_custom.png`;
    link.href = tempC.toDataURL('image/png');
    link.click();
}
window.creatorExportAnimationPng = creatorExportAnimationPng;

// --- AUTOMATYCZNY PRELOADER SKÓREK Z DYSKU (Auto-Loader) ---
function preloadHeroSkins() {
    if (!customSquadDesign || !customSquadDesign.hero) return;
    customSquadDesign.heroSkins = [];
    
    function updateSquadSkins() {
        if (gameState.squad && customSquadDesign.heroSkins.length > 0) {
            gameState.squad.forEach((s, idx) => {
                let activeSkins = customSquadDesign.heroSkins.filter(Boolean);
                if (activeSkins.length > 0) {
                    s.customImageSkin = activeSkins[idx % activeSkins.length];
                }
            });
            creatorUpdateAllGrids();
        }
    }

    const img1 = new Image();
    img1.onload = () => {
        customSquadDesign.heroSkins[0] = img1;
        customSquadDesign.hero.customImageSkin = img1;
        customSquadDesign.hero.isCustomized = true;
        updateSquadSkins();
    };
    img1.src = 'img/hero_1.png';

    const img2 = new Image();
    img2.onload = () => {
        customSquadDesign.heroSkins[1] = img2;
        customSquadDesign.hero.isCustomized = true;
        updateSquadSkins();
    };
    img2.src = 'img/hero_2.png';
}

// Uruchomienie preloadera przy starcie modułu
preloadHeroSkins();
