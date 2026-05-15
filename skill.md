# Projekt Cannon Rogues - Wytyczne i Standardy (Skill)

Plik dokumentuje standardy techniczne, wypracowane wzorce oraz unikalne rozwiązania wdrożone w architekturze gry.

## Technologie i Wzorce Projektowe
- **Architektura**: Vanilla JS, natywny podział na moduły ES6 (`import`/`export`).
- **Silnik Renderujący**: HTML5 Canvas 2D Context z zachowaniem ostrego renderowania pikseli (`image-rendering: pixelated`).
- **Wzorce Projektowe**:
  - **Central Shared Store**: Plik `config.js` eksportuje współdzielony obiekt stanu (`state`) oraz referencyjny obiekt statystyk (`stats`), co umożliwia ich modyfikację z poziomu dowolnego zaimportowanego modułu.
  - **Encapsulation**: Logika poszczególnych bytów (Żołnierz, Pocisk, Eksplozja) wydzielona jest do odrębnych klas w podkatalogu `js/entities/`.

## Kluczowe Implementacje Techniczne
1. **Proceduralne Generowanie Sprite'ów i Dynamiczne Warianty**:
   - Grafika postaci generowana jest w locie na podstawie tablic zdefiniowanych w ASCII.
   - Wdrożono wzorzec **Dynamic Template Swapping** – poszczególne instancje wrogów w zależności od progu fali i losowości mogą przyjmować alternatywne indeksy wyglądu (np. warianty Elitarne w fioletowych pancerzach z osobnym zestawem statystyk).
   - Zastosowano mechanizm **Sprite Caching** na elementach offscreen canvas, co eliminuje narzut na rysowanie pikseli co klatkę.
2. **Algorytmy Stadne (Flocking) i Niezależne SI (Companions)**:
   - Żołnierze korzystają z sił odpychających, trzymając się blisko wskaźnika formacji.
   - Wdrożono niezależne jednostki asystujące (Pies bojowy w `Dog.js`) oparte o w pełni autonomiczną maszynę stanów (`PATROL`, `ATTACK`, `RETURN`), pozwalającą im na swobodne opuszczanie okręgu formacji i podejmowanie decyzji o samotnej eliminacji celów.
3. **Trwałe Ślady na Tle (Persistent Splatters) i Mikro-animacje**:
   - Na trwałym podkładzie `bloodCanvas` rysowane są na stałe ciała poległych wrogów oraz zredukowane plamy krwi.
   - Wdrożono system śledzenia brudnych stóp: postacie przechodzące po ciałach odziedziczają czasowy stan zostawiania powiększonych odblasków stóp (4x4 px dla żołnierzy, 2x2 px dla psów) idealnie zsynchronizowanych z cyklem chodu.
4. **Shadery CSS i Nakładki Interfejsu**:
   - Post-processing realizowany przez wydajne nakładki czystego CSS (radialne gradienty winiety i scanlines) z atrybutem `pointer-events: none`.
   - Wdrożono wzorzec **Developer Drawer Overlay** – zwijaną z lewej strony boczną szufladę ułatwiającą testy w locie bez trwałego zaśmiecania małych ekranów mobilnych.
5. **Aktywna Pauza Silnika (Active Pause)**:
   - Pętla `update(dt)` pomija przeliczanie logiki ruchu i kolizji, gdy ustawiona jest flaga `state.isPaused = true`, ale silnik nadal wykonuje funkcję `draw()`. Pozwala to graczom i deweloperom na swobodny podgląd zamrożonego pola bitwy.
6. **Rygorystyczny Cykl Archiwizacji i Wersjonowania (Git/GitHub Workflow)**:
   - **BEZWZGLĘDNA REGUŁA PROCESOWA**: Po każdych większych zmianach architektonicznych, dodaniu mechanik lub pomyślnym ukończeniu sesji roboczej, agent prowadzący repozytorium ma obowiązek zaktualizować lokalne repozytorium (`git add . && git commit -m "..."`), zaoferować wypchnięcie zmian do GitHuba (`git push origin main`) oraz przypomnieć o tym użytkownikowi.
