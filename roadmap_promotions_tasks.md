# Harmonogram Wdrożenia Systemu Awansów Żołnierzy (Promotions Roadmap)

Dokument rozkłada wdrożenie pozostałych **23 umiejętności z nieśmiertelników** na 7 czytelnych dni sprintowych. Każdy task składa się z 3 rygorystycznych kroków:
1. **Weryfikacja logiki** (*Sprawdzenie i implementacja mechaniki w silniku `Soldier.js` / `main.js`*)
2. **Testy jednostkowe** (*Wyzwalanie z poziomu panelu debugowania*)
3. **Polishing 16-bit** (*Dobór spójnych kodihexów z `config.js` oraz audio zero-latency z `sfx.js`*)

---

## DZIEŃ 1: Dokończenie Dowódcy (Commander: Radio & Morale LVL 2-3)
**Cel:** Domknięcie wsparcia radiowego oraz ostatecznych Czarnych Blaszek Dowódcy.
* [x] **Task 1.1:** `[comm_a1]` **Nalot** 
  * *Logika:* Powiązanie radia z tradycyjnym wezwaniem bombardowania.
  * *Polishing:* SFX szumu krótkofalówki + zielony celownik dywanowy na ziemi.
* [x] **Task 1.2:** `[comm_a2]` **Nalot dymny** 
  * *Logika:* Radio rzuca zasłonę dymną dającą oddziałowi 50% szans na unik pocisków wroga.
  * *Polishing:* SFX syczącego dymu + rozszerzająca się cząsteczkowa szara chmura maskująca.
* [ ] **Task 1.3:** `[comm_a3]` **Orbitalny Laser Jonowy** *(Black Tag Ultimate)*
  * *Logika:* Wezwanie promienia z kosmosu potężnie rażącego wrogów w obszarze wskaźnika myszy przez 3s.
  * *Polishing:* SFX ciężkiego ładowania energii + błękitno-biały słup plazmy z mignięciem ekranu.
* [x] **Task 1.4:** `[comm_b2]` **Charyzma Lidera** 
  * *Logika:* Wszyscy rekruci w składzie zyskują +1 dodatkowy pasek maksymalnego HP (+100% HP).
  * *Polishing:* Złota obwódka HUD wokół dodanego paska zdrowia każdego wzmocnionego rekruta.
* [x] **Task 1.5:** `[comm_b3]` **Banner Oddziału** *(Black Tag Ultimate)*
  * *Logika:* Ładowanie paska z walki -> 8s nietykalności (0 dmg) i odbijanie pocisków wroga z mocą 200%.
  * *Polishing:* SFX wojskowej fanfary + lśniący złoty bąbel pola siłowego nad całym oddziałem.

---

## DZIEŃ 2: Medyk – Drzewko A (Leczenie Polowe LVL 1-3)
**Cel:** Stworzenie autorytatywnego systemu opieki polowej i reanimacji na linii frontu.
* [ ] **Task 2.1:** `[med_a1]` **Polowy Opatrunek** 
  * *Logika:* Skraca czas trwania krwawienia i podpalenia u sojuszników w składzie o 60%.
  * *Polishing:* Małe zielone krzyżyki uniesione nad rannym rekrutem podczas redukcji statusu debuffa.
* [ ] **Task 2.2:** `[med_a2]` **Transfuzja Krwi** 
  * *Logika:* 30% szans przy zabiciu wroga, że jego pokonane zwłoki zamienią się w apteczkę polową.
  * *Polishing:* SFX soczystego plask + czerwone kropelki krwi zrastające się w ikonę medkitu na gruncie.
* [ ] **Task 2.3:** `[med_a3]` **Defibrylator** *(Black Tag Ultimate)*
  * *Logika:* Dotknięcie zwłok poległego sojusznika natychmiast wskrzesza go z pełnym HP (1 raz na falę).
  * *Polishing:* SFX wyładowania elektrycznego `BZZZT!` + potężny podskok reanimowanego rekruta z zielonym błyskiem.

---

## DZIEŃ 3: Medyk – Drzewko B (Dopalacze & Chemia LVL 1-3)
**Cel:** Wdrożenie stymulantów bojowych oraz oprysków toksycznych.
* [ ] **Task 3.1:** `[med_b1]` **Pervitin** 
  * *Logika:* Bojowe stimy dające pobliskim sojusznikom +30% do szybkostrzelności i prędkości.
  * *Polishing:* SFX syku pneumatycznej strzykawki + żółto-niebieskie cząsteczki pęcherzyków nad głową.
* [ ] **Task 3.2:** `[med_b2]` **Wskrzeszenie Zombie** 
  * *Logika:* 30% szans przy zabiciu wroga na reanimowanie go jako przyjaznego wabika przyciągającego zombie.
  * *Polishing:* SFX upiornego jęku + toksyczna zielona poświata wokół powstałego zwłoka.
* [ ] **Task 3.3:** `[med_b3]` **Chemiczna Chmura** *(Black Tag Ultimate)*
  * *Logika:* Medyk zostawia za sobą żółtą toksyczną chmurę powoli odbierającą życie wrogom, którzy w nią wdepną.
  * *Polishing:* SFX ulatniającego się gazu + gęste opary płożące się po trawie w skali 4x4 px.

---

## DZIEŃ 4: Inżynier – Drzewko A (Autonomiczne Wieżyczki LVL 1-3)
**Cel:** Rozbudowa stacjonarnej obrony maszynowej i wsparcia kroczącego.
* [ ] **Task 4.1:** `[eng_a1]` **Szybka Naprawa** 
  * *Logika:* Jeśli Inżynier stoi blisko swojej wieżyczki maszynowej, ta pasywnie regeneruje zdrowie.
  * *Polishing:* SFX stukania klucza francuskiego + pomarańczowe plusiki `+` unoszące się nad działkiem.
* [ ] **Task 4.2:** `[eng_a2]` **Recykling** 
  * *Logika:* Zniszczona wieżyczka wyrzuca z siebie losową rzadką broń ze skrzynek zaopatrzeniowych.
  * *Polishing:* SFX rozpadających się zębatek + wyskok lśniącej złotej skrzyni na spadochronie.
* [ ] **Task 4.3:** `[eng_a3]` **Krocząca Wieżyczka** *(Black Tag Ultimate)*
  * *Logika:* Stacjonarna wieżyczka przybiera formę kroczącego robo-psa bojowego podążającego za składem.
  * *Polishing:* SFX mechanicznych kroków mecha + unikalny czworonożny sprite robota z zamontowaną lufą!

---

## DZIEŃ 5: Inżynier – Drzewko B (Gadżety Elektroniczne LVL 1-3)
**Cel:** Zaawansowana wojna elektroniczna i zdalnie sterowane pułapki.
* [ ] **Task 5.1:** `[eng_b1]` **Dron Obrońca** 
  * *Logika:* Latający nad głową dron automatycznie zestrzeliwujący 1 nadlatujący wrogi pocisk co 3s.
  * *Polishing:* SFX bzyczenia wirników + krótka błękitna wiązka lasera przecinająca wrogi pocisk w powietrzu.
* [ ] **Task 5.2:** `[eng_b2]` **Booby Trap** 
  * *Logika:* Pokonani wrogowie mają szansę zamienić się w uzbrojoną minę pułapkę w ciele.
  * *Polishing:* Mrugająca czerwona dioda na zwłokach + odgłos cykania zapalnika czasowego.
* [ ] **Task 5.3:** `[eng_b3]` **RV Kamikadze** *(Black Tag Ultimate)*
  * *Logika:* Co 15s wypuszcza zdalnie sterowany samochodzik krążący i eksplodujący w największej grupie wrogów.
  * *Polishing:* SFX bzyczącego silniczka elektrycznego RC + potężny odrzut odłamkowy po detonacji.

---

## DZIEŃ 6: Snajper – Drzewko A (Balistyka Wyborowa LVL 1-3)
**Cel:** Kinetyczna eliminacja celów opancerzonych i grupy wrogów.
* [ ] **Task 6.1:** `[snip_a1]` **Rykoszet** 
  * *Logika:* Strzał krytyczny Snajpera rykoszetuje bezpośrednio do 1 wroga stojącego obok.
  * *Polishing:* SFX rykoszetującej kuli `PING!` + żółta linia smugowa łamiąca się pod kątem 90 stopni.
* [ ] **Task 6.2:** `[snip_a2]` **Zabójca Olbrzymów** 
  * *Logika:* Zwiększa obrażenia przeciwko wrogim Bossom i Dowódcom o stałe 50%.
  * *Polishing:* Czerwony celownik weryfikacyjny wyrysowany bezpośrednio na korpusie ciężkich jednostek wroga.
* [ ] **Task 6.3:** `[snip_a3]` **Rozrywające Kule** *(Black Tag Ultimate)*
  * *Logika:* Pocisk przy uderzeniu krytycznym wywołuje mini-eksplozję AoE raniącą wrogów obok.
  * *Polishing:* SFX odłamkowej eksplozji + kula ognia 4x4 px w punkcie trafienia.

---

## DZIEŃ 7: Snajper – Drzewko B (Zmysły & Kamuflaż LVL 1-3)
**Cel:** Koordynacja celownicza oddziału i absolutna niewidzialność.
* [ ] **Task 7.1:** `[snip_b1]` **Optyka Laserowa** 
  * *Logika:* Na ekranie rysowany jest czerwony laser celownika. Sojusznicy strzelający do oświetlonego wroga zadają +35% dmg.
  * *Polishing:* Lśniąca czerwona linia lasera przecinająca całą długość mapy.
* [ ] **Task 7.2:** `[snip_b2]` **Instynkt Łowcy** 
  * *Logika:* Potężny bonus +100% obrażeń przeciwko wrogom z HP poniżej 30% (egzekucja).
  * *Polishing:* Pulsowanie czerwonej ikony czaszki nad rannym wrogiem w zasięgu wzroku.
* [ ] **Task 7.3:** `[snip_b3]` **Siatka Żniwiarza** *(Black Tag Ultimate)*
  * *Logika:* Kamuflaż optyczny Snajpera roztacza pole maskujące na rekrutów obok. Kill z ukrycia przedłuża niewidzialność całego oddziału.
  * *Polishing:* SFX aktywacji cyber-kamuflażu `SHHHK!` + błękitno-przezroczysty powidok maskowania na postaciach gracza.
