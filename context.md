# Projekt Cannon Rogues - Kontekst Projektu (Context)

Plik śledzi bieżący stan prac, wybrane kierunki architektoniczne oraz najważniejsze decyzje podjęte w trakcie tworzenia gry.

## Aktualny Stan (Status)
- **Faza**: Rozbudowa mechanik rozgrywki, doktryn taktycznych i optymalizacja UX/UI.
- **Bieżące osiągnięcie**:
  - Wdrożenie **sterowania klawiaturą (WASD/Strzałki)** z zachowaniem flockingu oddziału.
  - Wdrożenie **trybu celowania myszą (Aim-Only Mode)** odczepiającego ruch od kursora.
  - Wdrożenie **Wojskowych Nieśmiertelników (Dog Tags)** z góry ekranu w czystym stylu Retro Pixel Art.
  - Całkowity rewizjonizm standardowych doktryn oraz **9 Autorytatywnych Doktryn Niestandardowych** z "Czarnego Rynku" (np. Wabik, Pociski Zapalające, Pies Bojowy z 5 HP, Miny Pułapki).
  - Wdrożenie autorskiego ekosystemu **3 krzewów dżungli PNG (Bush_1, Bush_2, Bush_3)** w ścisłej siatce 16x16 px (wymiar 32x32 px).
  - Interaktywna mechanika **Ukrycia w Krzakach (Mistrz Maskowania)** aktywowana klawiszem `[SPACJA]` nad zaroślami: postacie znikają przyczepione do środka tekstury krzewu, nad drzewkiem rośnie pasek postępu 2s, wrogowie bezwładnie rozchodzą się na boki, a w liściach mrugają retro kreskówkowe oczy 6x6 px z wodzącymi źrenicami!

## Struktura Modułów (Zrealizowana)
- `index.html` – Główny plik ładujący warstwy UI oraz wejściowy moduł `main.js`.
- `css/style.css` – Arkusz stylów, efekty winiety/scanlines, style kart ulepszeń i responsywność.
- `js/config.js` – Konfiguracja stałych, definicje palety, tablice ASCII oraz współdzielony stan (`state`) i statystyki (`stats`).
- `js/sprites.js` – Generator grafik z systemem buforowania oraz obsługa trwałego płótna z krwią.
- `js/entities/*.js` – Klasy jednostek (`Soldier`, `Dog`, `Bullet`, `Explosion`, `Particle`, `Medkit`, `Turret`, `Crate`, `PrisonerCage`, `Bush`).
- `js/ui.js` – Logika interfejsu, ekranów ulepszeń (nieśmiertelników) i panelu admina.
- `js/input.js` – Detekcja zdarzeń wskaźnika oraz klawiatury.
- `js/main.js` – Silnik, pętla renderowania klatki oraz obsługa spowolnienia czasu (Bullet-Time).

## Zaległości i Plany (Backlog)
- **Animacja Czołgania (Crawling Animation):** Do dopracowania płynniejsza, dedykowana animacja ruchu czołgających się wrogów po trafieniu w nogi (obecnie wykorzystywana jest statyczna poza zwłok).
- **Paski Arcade (Retro Stat Bars):** Odłożone do wdrożenia w menu pauzy graficzne wskaźniki (paski/gwiazdki) pokazujące graczowi dokładny poziom rozwoju statystyk oddziału po zatrzymaniu gry.
- **Mechanika Jednorękiego Bandyty (Lucky Spin):** Trzymana w odwodzie koncepcja losowania nagród za pomocą rolki slot-maszyny z dźwiękiem monet.
- **Misje Poboczne / Zdarzenia Taktyczne (Hold Territory):** Zdarzenie na mapie polegające na utrzymaniu wyznaczonej strefy (np. ochrona i naprawa nadajnika radiowego przez 30 sekund pod naporem fal wrogów), nagradzane zrzutem potężnej skrzyni zaopatrzenia.

## Historia Decyzji
- **2026-06-17**:
  - **Ustandardowienie Doktryn**: Skrócenie tekstów na srebrnych blaszkach wyłącznie do `desc` oraz usunięcie ulepszeń Skupienie i Kawa Polowa.
  - **Złota Zasada Skali 16x16**: Wdrożenie kanonicznej zasady renderowania grafik eksportowanych z PixelArt Creatora w wymiarze stanowiącym ścisłą wielokrotność siatki retro (32x32 px).
  - **Koordynowany Kamuflaż**: Przeniosłem animację oczu w zaroślach bezpośrednio na warstwę obiektu `Bush`, by wyeliminować zjawisko przykrywania liści głębią Y.
- **2026-06-15**:
  - **Decyzja o sterowaniu**: Rozdzielenie ruchu (WASD) od celowania (mysz) jako opcjonalny, profesjonalny tryb sterowania (Aim-Only Mode) sterowany z poziomu debug panelu.
  - **Decyzja o piwocie ulepszeń**: Rezygnacja z zaciemnionego, statycznego ekranu ulepszeń na rzecz horyzontalnych kart HUD o minimalnej zawartości tekstu.
- **2026-05-13**: 
  - Inicjalizacja pustego repozytorium.
  - Otrzymanie i analiza pierwszego mockupu gry.
  - Podjęcie decyzji o podziale na moduły ES6 dla zapewnienia czystości architektonicznej.
