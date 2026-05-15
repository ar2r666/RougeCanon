# Projekt Cannon Rogues - Specyfikacja (Spec)

Plik zawiera szczegółową specyfikację funkcjonalną, opisy mechanik i interfejsu hybrydowej gry łączącej klasykę **Cannon Fodder** z gatunkiem **Vampire Survivors** (Roguelike).

## Założenia Ogólne
- **Nazwa robocza**: Cannon Rogues
- **Klimat**: Retro pixel-art, widok z góry (top-down), dżungla, odniesienia do klasycznych gier na Amigę.
- **Platforma docelowa**: Przeglądarka internetowa (Desktop / Mobile) z natywną obsługą dotyku i gestów.

## Mechaniki Gry
1. **Sterowanie Składem (Flocking)**:
   - Gracz kontroluje nie jedną postać, lecz cały oddział (skład) żołnierzy.
   - Poruszanie odbywa się za pomocą wskazywania celu (mysz / dotyk na strefie joysticka).
   - Żołnierze podążają do celu w formacji wykorzystującej algorytmy miękkiego odpychania (flocking), aby nie wchodzić na siebie.
2. **Walka (Auto-Fire)**:
   - Skład automatycznie wykrywa najbliższych wrogów w zasięgu i prowadzi ogień.
   - Zaimplementowane różne typy uzbrojenia:
     - **Karabin** (Standard)
     - **Strzelba** (Rozrzut, wyższa szybkostrzelność, mniejsze obrażenia)
     - **Minigun** (Bardzo szybki ogień ciągły)
     - **Bazooka** (Pociski wybuchowe o spowolnionym locie, obrażenia obszarowe)
3. **Jednostki Towarzyszące (Companions - Pies Bojowy)**:
   - Gracz może odblokować wsparcie w postaci Psa Bojowego.
   - Pies porusza się swobodnie, wybiegając poza okrąg ochronny oddziału w celu eliminacji pojedynczych wrogów w walce wręcz (gryzienie), po czym posłusznie wraca do właścicieli.
   - Zostawia miniaturowe odciski łap po przejściu przez poległe ciała.
4. **Fale Wrogów, Elita i Roguelike Progression**:
   - Rozgrywka podzielona jest na rosnące w siłę fale (Waves).
   - Standardowi wrogowie (czerwoni) respią się tuż poza ekranem i nacierają na gracza w oparciu o flocking.
   - **Elitarne Zombie (Mutanty)**: Zaczynają respić się po 3. fali (z 35% szansą). Wyróżniają się fioletowym pancerzem, świecącymi na pomarańczowo oczami, trzykrotnie wyższym zdrowiem oraz znacznie szybszym sprintem.
   - Po pokonaniu fali gracz wybiera losowe ulepszenia, a co 3 fale otrzymuje zrzut potężnych broni.

## Ekran i Interfejs (UI/UX)
- **HUD**: Wyświetla bieżącą falę, liczbę pozostałych wrogów oraz stan składu.
- **Shadery i Retro FX**: Zastosowanie warstw z gradientami symulującymi winietę oraz nakładki ze scanlines.
- **Ekrany Stanu**:
  - Menu Główne (Rozpoczęcie misji).
  - Ekran Ulepszeń (Wybór nagrody po fali).
  - Ekran Game Over (Statystyki przetrwania i restart).
- **Panel Administratora (Debug Panel)**:
  - Wysuwana z lewej strony szuflada deweloperska dostępna pod dyskretnym przyciskiem w dolnym lewym rogu ekranu.
  - Umożliwia zatrzymywanie i wznawianie czasu (Aktywna Pauza), natychmiastowe dodawanie żołnierzy, przywoływanie psów bojowych, wymuszanie dowolnego uzbrojenia (Strzelba, Minigun, Bazooka) oraz modyfikację statystyk.
