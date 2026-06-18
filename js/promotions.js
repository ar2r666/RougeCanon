// --- SYSTEM AWANSÓW I DRZEWEK UMIEJĘTNOŚCI ŻOŁNIERZY ---

export const CLASS_SKILL_TREES = {
    COMMANDER: {
        treeA: {
            name: "RADIO",
            skills: [
                { id: "comm_a1", name: "Nalot", desc: "Zyskuje tradycyjny wezwany nalot bombowy z radia." },
                { id: "comm_a2", name: "Nalot dymny", desc: "Wezwanie radia rzuca zasłonę dymną osłaniający oddział." },
                { id: "comm_a3", name: "Orbitalny Laser Jonowy", desc: "Radio ściąga z kosmosu potężny promień lasera jonowego potężnie rażący wrogów w celowniku." }
            ]
        },
        treeB: {
            name: "MORALE",
            skills: [
                { id: "comm_b1", name: "Okrzyk Bojowy", desc: "Co 30s wydaje okrzyk dający +45% do prędkości ruchu i +50% do szybkostrzelności na 6s." },
                { id: "comm_b2", name: "Charyzma Lidera", desc: "Wszyscy żołnierze w składzie zyskują +1 dodatkowy pasek maksymalnego zdrowia (+100% HP)." },
                { id: "comm_b3", name: "Banner Oddziału", desc: "Ładowanie paska z walki: po aktywacji daje 8s całkowitej nietykalności (0 dmg) i odbijanie pocisków wroga z mocą 200%." }
            ]
        }
    },
    MEDIC: {
        treeA: {
            name: "LECZENIE",
            skills: [
                { id: "med_a1", name: "Polowy Opatrunek", desc: "Skraca czas trwania krwawienia i podpalenia u sojuszników w składzie o 60%." },
                { id: "med_a2", name: "Transfuzja Krwi", desc: "30% szans, że pokonane zwłoki wroga zamienią się w apteczkę polową." },
                { id: "med_a3", name: "Defibrylator", desc: "Dotknięcie zwłok poległego sojusznika natychmiast wskrzesza go do walki (raz na falę)." }
            ]
        },
        treeB: {
            name: "DOPALACZE",
            skills: [
                { id: "med_b1", name: "Pervitin", desc: "Bojowe stimy dające pobliskim sojusznikom +30% do szybkostrzelności i prędkości." },
                { id: "med_b2", name: "Wskrzeszenie Zombie", desc: "30% szans przy zabiciu na wskrzeszenie wroga jako przyjaznego wabika przyciągającego zombie." },
                { id: "med_b3", name: "Chemiczna chmura", desc: "Medyk zostawia za sobą żółtą toksyczną chmurę powoli odbierającą życie wrogom, którzy w nią wdepną." }
            ]
        }
    },
    ENGINEER: {
        treeA: {
            name: "WIEŻYCZKI",
            skills: [
                { id: "eng_a1", name: "Szybka naprawa", desc: "Jeśli Inżynier stoi blisko swojej wieżyczki maszynowej, ta pasywnie odzyskuje zdrowie." },
                { id: "eng_a2", name: "Recykling", desc: "Zniszczona wieżyczka wyrzuca z siebie losową rzadką broń ze skrzynek zaopatrzeniowych." },
                { id: "eng_a3", name: "Krocząca Wieżyczka", desc: "Wieżyczka przybiera formę kroczącego robo-psa bojowego towarzyszącego oddziałowi." }
            ]
        },
        treeB: {
            name: "GADŻETY",
            skills: [
                { id: "eng_b1", name: "Dron Obrońca", desc: "Latający nad głową dron automatycznie zestrzeliwujący 1 nadlatujący wrogi pocisk co 3s." },
                { id: "eng_b2", name: "Booby trap", desc: "Pokonani wrogowie mają szansę zamienić się w uzbrojoną minę pułapkę w ciele." },
                { id: "eng_b3", name: "RV Kamikadze", desc: "Co 15s wypuszcza zdalnie sterowany samochodzik krążący wśród wrogów i eksplodujący we wrogach." }
            ]
        }
    },
    SNIPER: {
        treeA: {
            name: "BROŃ",
            skills: [
                { id: "snip_a1", name: "Rykoszet", desc: "Strzał krytyczny Snajpera rykoszetuje bezpośrednio do 1 wroga stojącego obok." },
                { id: "snip_a2", name: "Zabójca Olbrzymów", desc: "Zwiększa obrażenia przeciwko wrogim Bossom i Dowódcom o stałe 50%." },
                { id: "snip_a3", name: "Rozrywające Kule", desc: "Pocisk Snajpera przy uderzeniu krytycznym powoduje mini-eksplozję AoE raniącą wszystkich naokoło." }
            ]
        },
        treeB: {
            name: "ZMYSŁY",
            skills: [
                { id: "snip_b1", name: "Optyka Laserowa", desc: "Na ekranie rysowany jest czerwony laser celownika. Sojusznicy strzelający do oświetlonego wroga zadają mu +35% obrażeń." },
                { id: "snip_b2", name: "Instynkt Łowcy", desc: "Snajper zyskuje potężny bonus +100% obrażeń przeciwko wrogom z HP poniżej 30% (egzekutor)." },
                { id: "snip_b3", name: "Siatka Żniwiarza", desc: "Kamuflaż optyczny Snajpera roztacza pole maskujące na rekrutów obok. Kill z ukrycia przedłuża niewidzialność całego oddziału." }
            ]
        }
    }
};
