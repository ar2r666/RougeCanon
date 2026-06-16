# Projekt Cannon Rogues - Specyfikacja (Spec)

Plik zawiera szczegółową specyfikację funkcjonalną, opisy mechanik i interfejsu hybrydowej gry łączącej klasykę **Cannon Fodder** z gatunkiem **Vampire Survivors** (Roguelike).

## Założenia Ogólne
- **Nazwa robocza**: Cannon Rogues
- **Klimat**: Retro pixel-art, widok z góry (top-down), dżungla, odniesienia do klasycznych gier na Amigę.
- **Platforma docelowa**: Przeglądarka internetowa (Desktop / Mobile) z natywną obsługą dotyku i gestów.

## Żelazne Zasady Estetyki i Architektury Wizualnej (Pillars of Visual System)
Aby zachować bezwzględną spójność i najwyższą jakość wizualną gry, każdy element graficzny, proceduralny oraz silnikowy musi dożywotnio przestrzegać trzech fundamentalnych reguł:

1. **Rygorystyczna Matryca Pikselowa (Siatka 2x2 px)**:
   - Każdy zasób w grze (sprite'y postaci 32x32 px, kafelki podłoża, napisy UI, klastry dymu, ognia oraz cząsteczki) musi być renderowany ze ścisłą rozdzielczością wirtualną **2x2 piksele ekranowe** (gdzie 1 piksel gry = dokładnie kwadrat 2x2 na ekranie, `step = 2`).
   - Kategorycznie zabrania się stosowania niespójnych rozdzielczości, mieszania gęstości tekseli oraz używania wielkich, surowych bloków (np. 4x4 czy 8x8 px) niszczących harmonię pixel artu.

2. **Perspektywa Izometryczna 3/4 (3/4 Elevation Angle)**:
   - Gra wykorzystuje rzut z lotu ptaka z kątem uniesienia (3/4 elevation). Wszelkie pionowe struktury (postacie, drzewa, skrzynki oraz w szczególności **kolumny wybuchów i dymu**) muszą wypiętrzać się wzdłuż osi Z świata (w górę ekranu wzdłuż ujemnej osi Y).
   - Obiekty płaskie i ślady na podłożu (kratery po bombach, plamy krwi, cienie) muszą być spłaszczone izometrycznie na osi Y o współczynnik `~0.55` do `0.6`, tworząc naturalne elipsy wpisane w grunt. Zabrania się generowania płaskich okręgów 360 stopni w płaszczyźnie ekranu.

3. **Absolutna Płynność 60 FPS i Ciągła Dynamika**:
   - Wszystkie obliczenia fizyczne, ruchy obłoków, rozszerzanie kraterów, odrzut odłamków i zmiany przezroczystości muszą zachodzić w sposób ciągły w każdej klatce renderowania (`dt` w 60 FPS). Przejścia stanów i gradacja barw (Color Grading ze stygnięcia) muszą być idealnie płynne.
   - Wyklucza się stosowanie skokowych, kanciastych przeskoków klatkowych (stop-motion), z wyjątkiem dedykowanych, wyizolowanych wariantów demonstracyjnych.

## Mechaniki Gry
1. **Sterowanie Składem (Flocking)**:
   - Gracz kontroluje nie jedną postać, lecz cały oddział (skład) żołnierzy.
   - Poruszanie odbywa się za pomocą wskazywania celu (mysz / dotyk na strefie joysticka).
   - Żołnierze podążają do celu w formacji wykorzystującej algorytmy miękkiego odpychania (flocking), aby nie wchodzić na siebie.
2. **Walka (Auto-Fire & Zbrojownia Karabinów)**:
   - Skład automatycznie wykrywa najbliższych wrogów w zasięgu i prowadzi ogień.
   - **Zbrojownia Karabinów Podstawowych (Weapons Arsenal)**: Gracz może wyposażyć swoich żołnierzy przed misją (lub w locie przy rekrutacji) w jeden z trzech unikalnych karabinów:
     - **Karabin M16 (Szturmowy)**: Strzela precyzyjnymi seriami po 3 pociski (Burst Fire, interwał 55ms, lekki rozrzut).
     - **M1 Garand (Wyborowy)**: Wolny, półautomatyczny ogień (Semi-Auto) o ogromnej sile rażenia pojedynczego pocisku, wysokim zasięgu i zrzucie fizycznej łuski na ziemię.
     - **FN FAL (Bojowy)**: W pełni automatyczny (Full-Auto) karabin siejący zniszczenie z odczuwalnym rozrzutem kątowym, doskonały na krótki dystans.
   - Zaimplementowane ciężkie uzbrojenie (ze skrzynek / zrzutów):
     - **Strzelba** (Rozrzut, wyższa szybkostrzelność, mniejsze obrażenia)
     - **Minigun** (Bardzo szybki ogień ciągły)
     - **Bazooka** (Pociski wybuchowe o spowolnionym locie, obrażenia obszarowe)

## 3. Nowy System Progresji (Tryb Lone Survivor i Eventy Co 3 Poziomy)
Gra wdraża dynamiczną, modularną pętlę rekrutacji polowej, która wyklucza nudne menu ulepszeń na rzecz starć na mapie:
- **Start z jednym żołnierzem (Lone Survivor)**: Gracz zaczyna z jednym strzelcem, a kolejnych towarzyszy ratuje w ferworze walki.
- **Misje Ratunkowe (Poziom < 4)**: Co 3 fale na mapie generuje się klatka więzienna. Jej rozbicie pod ostrzałem rekrutuje losową klasę (*Medyk, Inżynier, Snajper, Heavy Gunner*). Aby zapobiec losowości, wdrożono *kontrolowany draft bez powtórzeń* (pierwsze 4 ocalenia dają dokładnie po jednym przedstawicielu każdej klasy).
- **Atak na Magazyn i Level Up (Poziom = 4)**: Po osiągnięciu pełnego składu (squad cap = 4), co kolejne 3 poziomy oddział szturmuje Magazyn wroga z walką z bossem. Wygrana nagradza gracza punktem **LEVEL UP** dla wybranego weterana, odblokowując legendarne cechy z jego drzewka rozwoju (np. Defibrylacja u Medyka, Podwójne Wieżyczki CKM u Inżyniera, 40% szans na krytyk u Snajpera).
- **Koło Ratunkowe (Comeback Mechanic)**: Jeśli w trakcie walki w Magazynie zginie nam weteran, po wygranej możemy uwolnić z klatki słabszego *Rezerwistę* o 1. poziomie, co zabezpiecza skład przed zniszczeniem fali.

## 4. Jednostki Towarzyszące (Companions - Pies Bojowy)
   - Gracz może odblokować wsparcie w postaci Psa Bojowego.
   - Pies porusza się swobodnie, wybiegając poza okrąg ochronny oddziału w celu eliminacji pojedynczych wrogów w walce wręcz (gryzienie), po czym posłusznie wraca do właścicieli.
   - Zostawia miniaturowe odciski łap po przejściu przez poległe ciała.

4. **Fale Wrogów, Elita i Roguelike Progression**:
   - Rozgrywka podzielona jest na rosnące w siłę fale (Waves).
   - Standardowi wrogowie (czerwoni) respią się tuż poza ekranem i nacierają na gracza w oparciu o flocking.
   - **Elitarne Zombie (Mutanty)**: Zaczynają respić się po 3. fali (z 35% szansą). Wyróżniają się fioletowym pancerzem, świecącymi na pomarańczowo oczami, trzykrotnie wyższym zdrowiem oraz znacznie szybszym sprintem.
   - Po pokonaniu fali gracz wybiera ulepszenia na półprzezroczystym decku kart w zwolnionym tempie (Bullet-Time), a co 3 fale otrzymuje zrzut potężnych broni.

## 5. Zdarzenia Taktyczne - Misja Obrony Terenu (Hold Territory / Repair Transmitter)
W trakcie rozgrywki na mapie może wygenerować się specjalna misja poboczna (event):
- **Cel:** Naprawa uszkodzonego Nadajnika Radiowego wroga.
- **Mechanika:** Gracz musi odnaleźć nadajnik na mapie i oddelegować swój oddział do oznaczonego okręgu wokół niego.
- **Utrzymanie pozycji:** Aby dokończyć naprawę, oddział musi pozostać wewnątrz strefy przez łącznie **30 sekund**. Licznik postępu zatrzymuje się, jeśli wewnątrz okręgu nie ma żadnego członka oddziału.
- **Wzrost napięcia:** W trakcie naprawy częstotliwość natarcia fal przeciwników wokół nadajnika drastycznie rośnie, sprawdzając zdolności obronne i zgranie oddziału.
- **Nagroda:** Po pomyślnym ukończeniu naprawy, nadajnik emituje potężny impuls odpychający wrogów, a obok spada legendarna skrzynia zaopatrzenia zawierająca rzadkie bronie lub unikalne modyfikacje.

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
