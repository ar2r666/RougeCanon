# Projekt Cannon Rogues - Kontekst Projektu (Context)

Plik śledzi bieżący stan prac, wybrane kierunki architektoniczne oraz najważniejsze decyzje podjęte w trakcie tworzenia gry.

## Aktualny Stan (Status)
- **Faza**: Rozbudowa mechanik rozgrywki i optymalizacja UX/UI.
- **Bieżące osiągnięcie**:
  - Wdrożenie **sterowania klawiaturą (WASD/Strzałki)** z zachowaniem flockingu oddziału.
  - Wdrożenie **trybu celowania myszą (Aim-Only Mode)** odczepiającego ruch od kursora i wprowadzającego manualne strzelanie/celowanie.
  - Ulepszenie fizyki koziołkowania i odbijania się poległych ciał (framerate-independent).
  - Wdrożenie **Półprzezroczystego "Bullet-Time" Decku** ulepszeń: karty wyświetlane są horyzontalnie, posiadają czytelne ikony pixel-art i zwięzłe opisy, a ekran nie ciemnieje (zamiast tego czas gry zwalnia do 4%, tworząc efekt kinowy).

## Struktura Modułów (Zrealizowana)
- `index.html` – Główny plik ładujący warstwy UI oraz wejściowy moduł `main.js`.
- `css/style.css` – Arkusz stylów, efekty winiety/scanlines, style kart ulepszeń i responsywność.
- `js/config.js` – Konfiguracja stałych, definicje palety, tablice ASCII oraz współdzielony stan (`state`) i statystyki (`stats`).
- `js/sprites.js` – Generator grafik z systemem buforowania oraz obsługa trwałego płótna z krwią.
- `js/entities/*.js` – Klasy jednostek (`Soldier`, `Dog`, `Bullet`, `Explosion`, `Particle`, `Medkit`, `Turret`, `Crate`, `PrisonerCage`).
- `js/ui.js` – Logika interfejsu, ekranów ulepszeń w zwolnionym tempie i panelu admina.
- `js/input.js` – Detekcja zdarzeń wskaźnika oraz klawiatury.
- `js/main.js` – Silnik, pętla renderowania klatki oraz obsługa zwolnienia czasu (Bullet-Time).

## Zaległości i Plany (Backlog)
- **Mechanika Jednorękiego Bandyty (Lucky Spin):** Trzymana w odwodzie koncepcja losowania nagród za pomocą rolki slot-maszyny z dźwiękiem monet (np. jako bonusowa skrzynka, nagroda za wyzwanie lub alternatywny tryb gry).
- **Misje Poboczne / Zdarzenia Taktyczne (Hold Territory):** Zdarzenie na mapie polegające na utrzymaniu wyznaczonej strefy przez określony czas (np. ochrona i naprawa nadajnika radiowego przez 30 sekund pod naporem fal wrogów), nagradzane zrzutem specjalnej skrzyni zaopatrzenia.

## Historia Decyzji
- **2026-06-15**:
  - **Decyzja o sterowaniu**: Rozdzielenie ruchu (WASD) od celowania (mysz) jako opcjonalny, profesjonalny tryb sterowania (Aim-Only Mode) sterowany z poziomu debug panelu.
  - **Decyzja o piwocie ulepszeń**: Rezygnacja z zaciemnionego, statycznego ekranu ulepszeń na rzecz efektownego spowolnienia czasu (Bullet-Time) i horyzontalnych, półprzezroczystych kart HUD o minimalnej zawartości tekstu (ikona + krótki komunikat).
- **2026-05-13**: 
  - Inicjalizacja pustego repozytorium.
  - Otrzymanie i analiza pierwszego mockupu gry.
  - Podjęcie decyzji o podziale na moduły ES6 dla zapewnienia czystości architektonicznej bez wprowadzania zewnętrznych bundlerów.
