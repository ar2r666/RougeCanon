// --- PALETA KOLORÓW (Zaawansowana paleta z obsługą rasy i detali) ---
export const P = {
    ' ': null,
    'H': '#8bde38', 'G': '#55a828', 'D': '#2b6611', // Zielone
    'S': '#c27a55', 's': '#8f4d2f',                 // Skóra Normalna
    'L': '#f1c27d', 'l': '#c68642',                 // Skóra Blada
    'K': '#8d5524', 'k': '#3c1414',                 // Skóra Ciemna
    'W': '#ffffff', 'B': '#363b3d', 'g': '#a0a8ab', 'C': '#6b7378', // Biały, Czarny, Szare
    'R': '#e35442', 'r': '#ff0000', 'd': '#63130a', // Czerwone
    'c': '#5ea9e8', 'b': '#215bad',                 // Niebieskie
    'Y': '#f7d84a', 'y': '#ad911f',                 // Żółte / Złote
    'O': '#ff6a00', 'f': '#ffaa00',                 // Pomarańczowe / Błysk
    'P': '#ad219d',                                 // Fiolet (Irokez)
    'N': '#151515',                                 // Głęboka Czerń (Oczy, lufa)
    'M': '#6e472d', 'm': '#4a2c19',                 // Brązowe (Drewno, but)
    'E': '#361616',                                 // Oczy
    'h': '#c27a55'                                  // Dłonie (będą dynamicznie podmieniane)
};

export function make16(arr, startRow) {
    let res = Array(16).fill("                ");
    for (let i = 0; i < arr.length; i++) {
        if (startRow + i < 16) res[startRow + i] = (arr[i] + "                ").substring(0, 16);
    }
    return res;
}

// --- DEFINICJE WARSTW SPRITE'ÓW ---
export const HELMETS = [
    make16(["                ", "     HHHHH      ", "     GGGGG      ", "    GGGGGGG     "], 1), // 0: Standard
    make16(["                ", "      RRRR      ", "     RRRRRRO    ", "     dRRRddd    "], 1), // 1: Beret
    make16(["                ", "     ccccc      ", "     bbbbb      ", "    bbbbbbb     "], 1), // 2: ONZ
    make16(["                ", "     MMMMM      ", "     MMMMM      ", "     RRRRR      ", "     d   d      "], 1), // 3: Bandana Rambo
    make16(["                ", "      YYYY      ", "     YYYYYY     ", "     YYYYYYY    "], 1), // 4: Czapka
    make16(["                ", "      WWWW      ", "     BWWWWBB    ", "    BBBBBBB     "], 1), // 5: Oficer
    make16(["      Y Y       ", "     BRRRB      ", "     RRRRR      ", "    R RRR R     ", "    Y     Y     "], 1), // 6: Samuraj
    make16(["        P       ", "       PPP      ", "       PPP      ", "       PPP      "], 1), // 7: Irokez
    make16(["                ", "     WWWWW      ", "    WcccccW     ", "    WccWWcW     ", "    WcccccW     "], 1), // 8: Kosmos
    make16(["                ", "     MMMMM      ", "     MMMMM      ", "     M   M      "], 1), // 9: Włosy
    make16(["                ", "     FFFFF      ", "     RRRRR      ", "    RRRRRRR     "], 1), // 10: Wróg (Czerwony Standard)
    make16(["                ", "     PPPPP      ", "    PPOOOPP     ", "    PPPPPff     "], 1), // 11: Elitarne Zombie (Fioletowy Mutant)
    make16(["                ", "     NNNNN      ", "    NRRRRRN     ", "    NNNNNNN     "], 1), // 12: Hełm Dowódcy Wroga
    make16(["                ", "     fffff      ", "    fYYYYYf     ", "    fffffff     "], 1)  // 13: Pancerz Głowy Bossa
];

export const FACES = [
    make16(["     ssSss      ", "     SESES      ", "     SSSSS      "], 5), // 0: Normalna
    make16(["     llLll      ", "     lElEl      ", "     LLLLL      "], 5), // 1: Blada
    make16(["     kkKkk      ", "     kEkEk      ", "     KKKKK      "], 5), // 2: Ciemna
    make16(["     DDGDD      ", "     DRGRD      ", "     GGGGG      "], 5), // 3: Zombie (Dla Wrogów)
    make16(["     ssSss      ", "     NBNBN      ", "     SSSSS      "], 5), // 4: Okulary
    make16(["     ssSss      ", "     SESES      ", "     SNNNS      "], 5), // 5: Wąsy
    make16(["     ssSss      ", "     SESES      ", "     MMMMM      ", "      MMM       "], 5), // 6: Broda
    make16(["     CgCgC      ", "     ggRgg      ", "     CgCgC      "], 5), // 7: Cyborg
    make16(["     ssNss      ", "     NESEN      ", "     SSSSS      "], 5), // 8: Gniew
    make16(["     BBBBB      ", "     BESEB      ", "     BBBBB      "], 5), // 9: Ninja
    make16(["     ssSss      ", "     SNSNS      ", "     SSsSS      "], 5), // 10: Twarz Własna (z rysunku)
    make16(["     DDGDD      ", "     DOfOD      ", "     GGGGG      "], 5), // 11: Elite Zombie (Świecące pomarańczowe oczy)
    make16(["     CCRCC      ", "     CgCgC      ", "     CCCCC      "], 5), // 12: Twarz Elitarnego Cyborga
    make16(["     NNNNN      ", "     NCCCg      ", "     NNNNN      "], 5)  // 13: Maska Gazowa Wroga
];

export const UNIFORMS_1 = [
    make16(["      DGD       ", "    HGGGDGG     ", "    GGDHGGG     ", "      GGDGG     ", "      GD DG     ", "      B   B     ", "     BB   BB    "], 8), // 0: Kamuflaż
    make16(["      yYy       ", "    LYYyYYL     ", "    YyYYyYY     ", "      YyLYY     ", "      Yy yY     ", "      M   M     ", "     MM   MM    "], 8), // 1: Pustynia
    make16(["      gWg       ", "    WggWgWW     ", "    WWgCCgW     ", "      WggWW     ", "      Wg gW     ", "      g   g     ", "     gg   gg    "], 8), // 2: Śnieg
    make16(["      NBN       ", "    CBNNNCB     ", "    BNNNNNB     ", "      NBNBN     ", "      NB BN     ", "      N   N     ", "     NN   NN    "], 8), // 3: Black Ops
    make16(["      gWg       ", "    WgWRWgW     ", "    WWRRRWW     ", "      WgRWg     ", "      Wg gW     ", "      B   B     ", "     BB   BB    "], 8), // 4: Medyk
    make16(["      BWB       ", "    BBWRWBB     ", "    BNBWRBN     ", "      BNBNB     ", "      NB BN     ", "      B   B     ", "     BB   BB    "], 8), // 5: Garnitur
    make16(["      CgC       ", "    WgCgCgW     ", "    WgCcCgW     ", "      CgCgC     ", "      gC Cg     ", "      g   g     ", "     gg   gg    "], 8), // 6: Pancerz
    make16(["      MmM       ", "    MmYYYmM     ", "    MmYYYmM     ", "      mmmmm     ", "      mM Mm     ", "      M         ", "     MM   B     "], 8), // 7: Pirat
    make16(["      sSs       ", "    SSsSssS     ", "    sSSsSSs     ", "      DDDDD     ", "      dD Dd     ", "      M   M     ", "     MM   MM    "], 8), // 8: Brak koszulki
    make16(["      yYy       ", "    WYyYyYW     ", "    YyYfYyY     ", "      yYyYy     ", "      Yy yY     ", "      y   y     ", "     yy   yy    "], 8), // 9: Złoto
    make16(["      dRd       ", "    FRRRdRR     ", "    RRdFRRR     ", "      RRdRR     ", "      Rd dR     ", "      B   B     ", "     BB   BB    "], 8), // 10: Wróg (Czerwony Mundur)
    make16(["      N N       ", "    CCNNNCC     ", "    SSNNNCC     ", "      NNN       ", "      N N       ", "      N   N     ", "     mm   mm    "], 8), // 11: Mundur Własny (z rysunku)
    make16(["      dPd       ", "    PPPPPdd     ", "    PPdPPPP     ", "      PPdPP     ", "      Pd dP     ", "      B   B     ", "     BB   BB    "], 8), // 12: Elite Zombie Uniform 1
    make16(["      N Y       ", "    NNNNNYY     ", "    NNYNNNN     ", "      NNNNN     ", "      NN NN     ", "      B   B     ", "     BB   BB    "], 8), // 13: Mundur Oficera Wroga
    make16(["      R P       ", "    RRRRRPP     ", "    RRPPRRR     ", "      RRRRR     ", "      RR RR     ", "      B   B     ", "     BB   BB    "], 8)  // 14: Pancerz Bojowy Obcych
];

export const UNIFORMS_2 = [
    make16(["      DGD       ", "    HGGGDGG     ", "    GGDHGGG     ", "      GGDGG     ", "       GDG      ", "       B B      ", "      BB BB     "], 8),
    make16(["      yYy       ", "    LYYyYYL     ", "    YyYYyYY     ", "      YyLYY     ", "       YyY      ", "       M M      ", "      MM MM     "], 8),
    make16(["      gWg       ", "    WggWgWW     ", "    WWgCCgW     ", "      WggWW     ", "       WgW      ", "       g g      ", "      gg gg     "], 8),
    make16(["      NBN       ", "    CBNNNCB     ", "    BNNNNNB     ", "      NBNBN     ", "       NBN      ", "       N N      ", "      NN NN     "], 8),
    make16(["      gWg       ", "    WgWRWgW     ", "    WWRRRWW     ", "      WgRWg     ", "       WgW      ", "       B B      ", "      BB BB     "], 8),
    make16(["      BWB       ", "    BBWRWBB     ", "    BNBWRBN     ", "      BNBNB     ", "       NBN      ", "       B B      ", "      BB BB     "], 8),
    make16(["      CgC       ", "    WgCgCgW     ", "    WgCcCgW     ", "      CgCgC     ", "       gCg      ", "       g g      ", "      gg gg     "], 8),
    make16(["      MmM       ", "    MmYYYmM     ", "    MmYYYmM     ", "      mmmmm     ", "       mMm      ", "       M B      ", "      MM BB     "], 8),
    make16(["      sSs       ", "    SSsSssS     ", "    sSSsSSs     ", "      DDDDD     ", "       dDd      ", "       M M      ", "      MM MM     "], 8),
    make16(["      yYy       ", "    WYyYyYW     ", "    YyYfYyY     ", "      yYyYy     ", "       YyY      ", "       y y      ", "      yy yy     "], 8),
    make16(["      dRd       ", "    FRRRdRR     ", "    RRdFRRR     ", "      RRdRR     ", "       RdR      ", "       B B      ", "      BB BB     "], 8),
    make16(["      N N       ", "    CCNNNCC     ", "    SSNNNCC     ", "      NNN       ", "       N        ", "       N N      ", "      mm mm     "], 8), // 11: Mundur Własny (krok)
    make16(["      dPd       ", "    PPPPPdd     ", "    PPdPPPP     ", "      PPdPP     ", "       PdP      ", "       B B      ", "      BB BB     "], 8), // 12: Elite Zombie Uniform 2
    make16(["      N Y       ", "    NNNNNYY     ", "    NNYNNNN     ", "      NNNNN     ", "       NNN      ", "       B B      ", "      BB BB     "], 8), // 13: Mundur Oficera Wroga (krok)
    make16(["      R P       ", "    RRRRRPP     ", "    RRPPRRR     ", "      RRRRR     ", "       RRR      ", "       B B      ", "      BB BB     "], 8)  // 14: Pancerz Bojowy Obcych (krok)
];

export const UNIFORMS_3 = UNIFORMS_1.map(u => {
    let res = [...u];
    // Zmodyfikuj wiersze nóg (wiersz 13 i 14 na siatce 16x16) dla kroku lewą nogą
    res[13] = "      B         ";
    res[14] = "     BBB   B    ";
    return res;
});

export const UNIFORMS_4 = UNIFORMS_1.map(u => {
    let res = [...u];
    // Zmodyfikuj wiersze nóg dla kroku prawą nogą
    res[13] = "          B     ";
    res[14] = "       B  BBB   ";
    return res;
});

export const WEAPON_LAYERS = [
    make16(["    CBBBBBBN    ", "   CC h   h     "], 10), // 0: Zaktualizowany, Masywny Karabin (z rysunku)
    make16(["   MMMMgBBBB    ", "      h   h     "], 10), // 1: Strzelba
    make16(["       B        ", "  BBBBBBBBBBBBBB", "      h   h     "], 9), // 2: Snajperka
    make16(["        CC      ", "  BBBBBBBBBBBf  ", "      h CCh     "], 9), // 3: Minigun
    make16(["          BBBg  ", "          h     "], 10), // 4: Pistolet
    make16(["         G      ", "  BBBBBBRRRRRf  ", "      h  BB     "], 9),  // 5: Bazooka
    make16(["          Mgg   ", "          h     "], 10), // 6: Nóż Bojowy
    make16(["       Y        ", "  BBBBRRROOOOf  ", "    B h   h     "], 9), // 7: Miotacz Ognia
    make16(["         B      ", "   BBBgggggg    ", "    h    Bh     "], 9), // 8: Piła Spalinowa
    make16(["          MMMMM ", "          h  MMR"], 10), // 9: Przepychacz do rur
    make16(["       P        ", "  BBBBccccPPPPPf", "    c h   h     "], 9), // 10: Miotacz Plazmy
    make16(["        GG      ", "  BBBBBBGGGGGGf ", "      h GGh     "], 9)  // 11: Ciężkie Działo Obcych
];

export const ACCESSORIES = [
    { isBack: true,  art: [] }, 
    { isBack: true,  art: make16(["  DDD           ", " DDDDD          ", " DDDDD          ", "  DDD           "], 7) }, 
    { isBack: true,  art: make16(["  ggg           ", " ggCgg          ", " ggCgg          ", "  O O           "], 7) }, 
    { isBack: true,  art: make16(["   RRR          ", "  RRRRR         ", "  RRRRR         ", "  RRRRR         ", "   RRR          "], 8) }, 
    { isBack: false, art: make16(["            C f "], 6) }, 
    { isBack: true,  art: make16(["  B             ", "  B             ", "  B             ", "  g             "], 2) }, 
    { isBack: false, art: make16(["         B      ", "        BBB     ", "        BBB     ", "         B      "], 8) }, 
    { isBack: false, art: make16(["   RR           ", "   RYR          ", "   rR           "], 4) }, 
    { isBack: false, art: make16(["      YYYY      ", "     Y    Y     "], 0) }, 
    { isBack: false, art: make16(["      Y         ", "       Y        ", "        Y       ", "         Y      "], 9) } 
];

export const CATEGORY_NAMES = {
    helmet: [
        "Standardowy", "Czerwony Beret", "Niebieski (ONZ)", "Bandana Rambo", 
        "Czapka z Daszkiem", "Czapka Oficera", "Hełm Samuraja", "Różowy Irokez", 
        "Hełm Kosmiczny", "Brak (Włosy)", "Wróg (Standard)", "Elitarne Zombie",
        "Hełm Dowódcy Wroga", "Pancerz Głowy Bossa"
    ],
    face: [
        "Normalna", "Blada Cera", "Ciemna Cera", "Zakażony Zombie", 
        "Okulary Przeciwsłoneczne", "Złoczyńca (Wąsy)", "Weteran (Broda)", 
        "Cyborg (Oko Laser)", "Gniewne Spojrzenie", "Maska Ninja", 
        "Twarz Własna", "Oczy Zmutowane", "Twarz Elitarnego Cyborga", "Maska Gazowa Wroga"
    ],
    uniform: [
        "Zielony Kamuflaż", "Pustynna Burza", "Zimowy Śnieg", "Black Ops (Czerń)", 
        "Medyk Polowy", "Garnitur Agenta", "Stalowy Pancerz", "Pirat (Płaszcz)", 
        "Brak Koszulki", "Złota Zbroja", "Wróg (Czerwony)", "Mundur Własny", 
        "Zbroja Mutanta", "Mundur Oficera Wroga", "Pancerz Bojowy Obcych"
    ],
    weapon: [
        "Karabin Szturmowy", "Strzelba Pompka", "Karabin Snajperski", "Karabin Maszynowy", 
        "Pistolet", "Wyrzutnia Rakiet", "Nóż Bojowy", "Miotacz Ognia", 
        "Piła Spalinowa", "Przepychacz do rur", "Miotacz Plazmy", "Ciężkie Działo Obcych"
    ],
    accessory: [
        "Brak Dodatku", "Plecak Wojskowy", "Plecak Odrzutowy", "Czerwona Peleryna", 
        "Cygaro Szefa", "Radio (Plecak)", "Tarcza Ochronna", "Papuga na Ramieniu", 
        "Święta Aureola", "Pas z Amunicją"
    ]
};

// --- DANE BRONI I IMION ---
export const NAMES = ['Jools', 'Jops', 'Stoo', 'RJ', 'Ubik', 'CJ', 'Biker', 'Phil', 'Matt', 'Rich', 'Mike', 'Rob'];

export const WEAPONS = {
    DEFAULT: { name: 'Karabin', fireRateMult: 1, damageMult: 1, color: '#ffff00', type: 'normal', visualIdx: 0 },
    SHOTGUN: { name: 'Strzelba', fireRateMult: 4.0, damageMult: 1.4, color: '#ffaa00', type: 'spread', visualIdx: 1 }, // Zsynchronizowane 2.0s (strzał + przeładowanie)
    MACHINEGUN: { name: 'Karabin Masz.', fireRateMult: 0.12, damageMult: 0.75, color: '#ffdd00', type: 'rapid', visualIdx: 3 },
    BAZOOKA: { name: 'Bazooka', fireRateMult: 3.0, damageMult: 4, color: '#ff5500', type: 'explosive', visualIdx: 5 },
    SPECIAL_PLASMA: { name: 'Plazma', fireRateMult: 0.35, damageMult: 3, color: '#00ffff', type: 'beam', visualIdx: 10 },
    SPECIAL_FLAMETHROWER: { name: 'Miotacz Ognia', fireRateMult: 0.05, damageMult: 1.5, color: '#ff4500', type: 'flame', visualIdx: 7 }
};

// --- WSPÓŁDZIELONY STAN GRY (Central State) ---
export const stats = {
    maxSquad: 3,
    damage: 1,
    fireRate: 800, // ms between shots
    range: 200,
    speed: 120,    // pixels per sec
    bulletSpeed: 300
};

export const customSquadDesign = {
    hero: {
        name: 'Główny Bohater',
        helmetIdx: 0,
        faceIdx: 10,
        uniformIdx: 11,
        accessoryIdx: 0,
        customImageSkin: null,
        isCustomized: false
    },
    enemy: {
        name: 'Wróg',
        helmetIdx: 10,
        faceIdx: 3,
        uniformIdx: 10,
        accessoryIdx: 0,
        customImageSkin: null,
        isCustomized: false
    },
    weaponSkin: null,
    customWeaponIdx: 0,
    customWeaponConfig: {},
    crateSkin: null
};

export const state = {
    gameState: 'MENU', // MENU, PLAY, UPGRADE, GAMEOVER
    wave: 1,
    enemiesToSpawn: 0,
    enemySpawnTimer: 0,
    enemiesAlive: 0,
    camera: { x: 6000, y: 6000 },
    targetPoint: { x: 6000, y: 6000 },
    isPointerDown: false,
    squad: [],
    enemies: [],
    bullets: [],
    particles: [],
    explosions: [],
    crates: [],
    crateSpawnTimer: 15,
    companions: [], // Towarzysze wybiegający poza okrąg (np. Psy)
    isPaused: false // Flaga wstrzymania aktualizacji logiki (aktywna pauza)
};
