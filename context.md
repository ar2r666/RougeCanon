# Projekt Cannon Rogues - Kontekst Projektu (Context)

Plik śledzi bieżący stan prac, wybrane kierunki architektoniczne oraz najważniejsze decyzje podjęte w trakcie tworzenia gry.

## Aktualny Stan (Status)
- **Faza**: Rozbudowa różnorodności ekosystemu przeciwników.
- **Bieżące osiągnięcie**: Wdrożenie wariantów Elitarnego Zombie (szybszych, mocniejszych mutantów w fioletowych pancerzach ze świecącymi oczami) respiących się po 3. fali.

## Struktura Modułów (Zrealizowana)
- `index.html` – Główny plik ładujący warstwy UI oraz wejściowy moduł `main.js`.
- `css/style.css` – Arkusz stylów, shadery ekranowe, responsywność.
- `js/config.js` – Konfiguracja stałych, definicje palety, tablice ASCII oraz współdzielony stan (`state`) i statystyki (`stats`).
- `js/sprites.js` – Generator grafik z systemem buforowania oraz obsługa trwałego płótna z krwią.
- `js/entities/*.js` – Klasy jednostek (`Soldier`, `Dog`, `Bullet`, `Explosion`, `Particle`).
- `js/ui.js` – Logika interfejsu, ekranów końca fali i ulepszeń.
- `js/input.js` – Detekcja zdarzeń wskaźnika.
- `js/main.js` – Silnik i pętla renderowania klatki.
- `archive/mockup_v1.html` – Zarchiwizowany kod źródłowy dostarczonego prototypu.

## Historia Decyzji
- **2026-05-13**: 
  - Inicjalizacja pustego repozytorium.
  - Otrzymanie i analiza pierwszego mockupu gry.
  - Podjęcie decyzji o podziale na moduły ES6 dla zapewnienia czystości architektonicznej bez wprowadzania zewnętrznych bundlerów.
