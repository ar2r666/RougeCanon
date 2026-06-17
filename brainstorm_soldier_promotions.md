# 🎖️ BURZA MÓZGÓW: SYSTEM AWANSU I DRZEWKA UMIEJĘTNOŚCI ŻOŁNIERZY

Celem tego dokumentu projektowego jest stworzenie **głębokiej, uzależniającej pętli dopaminowej** (na wzór najlepszych gier roguelite / arcade). Gracz z każdym poziomem żołnierza musi czuć ekscytację z wyboru nowej mechaniki, która drastycznie zmienia synergie oddziału.

---

## 🏛️ ARCHITEKTURA KLAS W GRZE

1. **DOWÓDCA (`COMMANDER`)** – *Taktyka, morale, koordynacja ognia, wezwania wsparcia, przywództwo*
2. **MEDYK (`MEDIC`)** – *Leczenie, stimy bojowe, wskrzeszanie, pancerze chemiczne, bio-hazard*
3. **INŻYNIER (`ENGINEER`)** – *Drony, wieżyczki, pola siłowe, naprawa, wybuchy technologiczne, pułapki*
4. **SNAJPER (`SNIPER`)** – *Precyzja, kamuflaż optyczny, penetracja pancerza, rykoszety, zwiad*
5. **CIĘŻKI STRZELEC (`HEAVY_GUNNER`)** – *Siła ognia, tarcze balistyczne, niszczenie osłon, tryb berserk*

---

## I. 🦅 DOWÓDCA (COMMANDER) — 20 Unikatowych Umiejętności

| Nr | Nazwa Umiejętności | Opis Mechaniki Bojowej | Efekt Dopaminowy / Synergia |
|:---|:---|:---|:---|
| **1** | **Rozkaz: Ogień Zaporowy** | Przez 4 sekundy cały skład strzela o 50% szybciej, ale nie może się poruszać. | Niesamowite uczucie "ściany ołowiu" zatrzymującej szarżującą hordę zombi. |
| **2** | **Napalm Strike** | Wezwanie bombardowania napalmowego wzdłuż linii celowania myszy, zostawia płonącą ziemię na 8s. | Spopielenie całej fali wrogów jednym precyzyjnym wezwaniem radia. |
| **3** | **Charyzmatyczny Lider** | Jeśli Dowódca żyje, pozostali żołnierze regenerują 1 HP co 3 sekundy poza walką. | Gracz zaczyna dbać o życie Lidera jak o największy skarb. |
| **4** | **Przegrupowanie Awaryjne** | Teleportuje cały rozproszony skład natychmiast obok Dowódcy i nadaje im 2s nietykalności. | Ratunek z sytuacji bez wyjścia, gdy rekrut zapodział się we wrogiej bazie. |
| **5** | **Kevlarowy Parasol** | Dowódca rozkłada przed składem energetyczną tarczę taktyczną pochłaniającą 200 pkt obrażeń. | Pozwala bezkarnie szturmować gniazda ciężkich karabinów wroga. |
| **6** | **Oznacz i Zlikwiduj** | Co 10s oznacza najsilniejszego wroga czerwonym laserem; cały skład zadaje mu 2x obrażeń. | Błyskawiczna eliminacja Bossów przy zogniskowanym ogniu zespołu. |
| **7** | **Adrenalina Batalionowa** | Po zabiciu Bossa cały skład zyskuje +40% do prędkości ruchu i przeładowania na 15s. | Tryb god-mode pozwalający oczyścić resztę mapy w mgnieniu oka. |
| **8** | **Radio: Zrzut Zaopatrzenia**| Szansa 15% przy wejściu do nowej fali na zrzut złotej skrzyni z rzadką bronią. | Daje dreszczyk emocji na starcie każdego nowego poziomu fali. |
| **9** | **Żelazna Dyscyplina** | Skład całkowicie ignoruje efekty spowolnienia, odrzutu oraz paniki od wrogich eksplozji. | Oddział idzie jak taran niezależnie od wybuchających beczek. |
| **10**| **Ostatni Bastion** | Gdy Dowódca spadnie do 1 HP, wydaje okrzyk odpychający wrogów na 300px i daje +100% pancerza na 5s.| Dramatyczny zwrot akcji w filmowym stylu "Not today!". |
| **11**| **Formacja Klinowa** | Żołnierze stojący dokładnie za plecami Dowódcy otrzymują -30% obrażeń balistycznych. | Nagroda za świadome, formacyjne pozycjonowanie oddziału myszką. |
| **12**| **Ogień Krzyżowy** | Pocisk Dowódcy, który przecina tor pocisku innego żołnierza składu, wywołuje mini-wybuch plazmy. | Przypadkowe, potężne fajerwerki podczas gęstych wymian ognia. |
| **13**| **Oficer Wywiadu** | Pokazuje trajektorie pocisków wrogich snajperów na 1s przed ich wystrzeleniem. | Gracz czuje się jak taktyczny geniusz wykonujący idealne uniki. |
| **14**| **Łup Wojenny** | Pokonani wrogowie mają 25% szansy na upuszczenie złota do ulepszeń nieśmiertelników. | Przyspiesza pętlę stałego rozwoju metagry. |
| **15**| **Holograficzna Mowa** | Dowódca stawia hologram motywacyjny; wrogowie go atakują, a skład obok ma +25% szans na cios krytyczny.| Synergia odwracania uwagi i egzekucji z flanki. |
| **16**| **Bagnety na Broń!** | Ataki wręcz (nóż/kolba) zadają 400% obrażeń i odzyskują 2 HP za rozczłonkowanie wroga. | Zamienia Dowódcę w rzeźnika w bliskim kontakcie w dżungli. |
| **17**| **Koordynacja Satelitarna**| Zwiększa pole widzenia (oddalenie kamery) o 20% oraz zasięg strzału wszystkich broni o 150px.| Kontrola nad całą mapą przed wejściem w strefę zagrożenia. |
| **18**| **Braterstwo Krwi** | Obrażenia śmiertelne zadane dowolnemu rekrutowi są rozdzielane po równo na wszystkich żyjących. | Zapobiega przypadkowej "na śmierć" utracie pojedynczych jednostek. |
| **19**| **Taktyczny Odwrót** | Podczas chodzenia do tyłu (plecami do celu) skład zyskuje +35% szans na uniknięcie pocisku. | Idealne do kitingu (strzelania podczas wycofywania się przed hordą). |
| **20**| **Doktryna Totalna** | Co 60 sekund odnawia natychmiast wszystkie aktywne cooldowny umiejętności całego zespołu. | Pozwala odpalić dwie super-umiejętności pod rząd na Bossa. |

---

## II. 💉 MEDYK (MEDIC) — 20 Unikatowych Umiejętności

| Nr | Nazwa Umiejętności | Opis Mechaniki Bojowej | Efekt Dopaminowy / Synergia |
|:---|:---|:---|:---|
| **1** | **Nanoboty Regeneracyjne** | Leczenie pasywne Medyka przeskakuje na najbardziej rannego członka składu zielonym promieniem. | Wizualna satysfakcja automatycznej opieki nad oddziałem. |
| **2** | **Bojowy Defibrylator** | Jeśli sojusznik zginie w promieniu 150px, zostaje natychmiast ożywiony z 50% HP (cooldown: 90s). | Uczucie oszukania śmierci w ostatniej milisekundzie. |
| **3** | **Bojowe Stimy (Mieszanka Z)**| Wystrzeliwuje w sojusznika strzykawkę: +80% szybkostrzelności na 6s, po czym zabiera 5 HP. | Ryzykowne dopychanie dps-u na granicy życia i śmierci. |
| **4** | **Chmura Anestezjologiczna**| Medyk upuszcza granat gazowy usypiający wrogów na 4 sekundy w promieniu 180px. | Bezkarny ostrzał uśpionej hordy w wąskim przejścielu. |
| **5** | **Toksyczny Odrzut** | Kałuże krwi pozostawione przez rannych żołnierzy stają się kwasem raniącym wrogów. | Zamiana własnych ran w śmiercionośną pułapkę terenową. |
| **6** | **Polowy Bank Krwi** | Każde podniesione apteczko-pudełko odnawia dodatkowo +50% ładunku paska nieśmiertelnika. | Synergia zbieractwa z odpalaniem doktryn dog-tagów. |
| **7** | **Pancerz Hemostatyczny**| Pierwszy pocisk w klatce w danej fali trafiający Medyka odbija się z powrotem we wroga. | Pasywna tarcza odbijająca śmiertelne strzały snajperów. |
| **8** | **Transfuzja Kinetyczna**| 10% obrażeń zadanych przez broń Medyka leczy najbliższego sojusznika. | Medyk leczy zespól tym mocniej, im agresywniej strzela. |
| **9** | **Kordon Sanitarny** | Roztacza aurę kwarantanny: wrogowie typu Zombie nie mogą podejść bliżej niż 60px. | Bezkładna ochrona przed atakami wręcz potworów. |
| **10**| **Lekarstwo Cud** | Oczyszcza skład ze wszystkich negatywnych statusów (podpalenie, kwas, EMP) co 8s. | Rozwiązuje problem denerwujących debuffów po eksplozjach. |
| **11**| **Pigułka Ostatniej Szansy**| Gdy sojusznik ma zginąć, zamraża go w kuli stazy na 3s (niezniszczalny) i leczy do 100%.| Błogosławieństwo absolutnego ocalenia herosa. |
| **12**| **Dron Zwiadowczo-Medyczny**| Mały dron lata wokół Medyka i automatycznie zestrzeliwuje wrogie pociski lecące w rannych.| Poczucie posiadania osobistego Anioła Stróża nad głową. |
| **13**| **Zastrzyk z Uranem** | Zamienia amunicję Medyka na pociski radioaktywne powodujące rozpad komórkowy wrogów. | Obrażenia rozłożone w czasie roztapiające pancerze czołgów. |
| **14**| **Hipokratesowy Szał** | Im niższe średnie HP całego składu, tym szybszy ruch i regeneracja Medyka (do +100%). | Medyk zamienia się w boga ratownictwa, gdy wszystko się wali. |
| **15**| **Ekstrakt z Krzewu Dżungli**| Medyk stojący w krzaku produkuje darmową apteczkę polową co 12 sekund. | Wykorzystanie nowo wdrożonego systemu 650 krzaków! |
| **16**| **Amputacja Taktyczna** | Cios wręcz Medyka natychmiast odcina kończynę wroga, zmniejszając jego prędkość o 60%. | Okaleczanie elitarnych wrogów, by nie mogli gonić oddziału. |
| **17**| **Znieczulenie Ogólne** | Żołnierze w składzie otrzymują obrażenia z opóźnieniem 3 sekund. | Pozwala wybić wrogów i uleczyć się *zanim* HP faktycznie spadnie! |
| **18**| **Surowica Super-Żołnierza**| Podwaja maksymalne punkty zdrowia wybranego rekruta do końca trwania misji. | Tworzenie niezniszczalnego "tanka" z dowolnego rekruta. |
| **19**| **Gaz Rozweselający** | Wrogowie trafieni granatem medycznym zaczynają tańczyć i strzelać na oślep. | Komiczna, chaotyczna dezorientacja na polu bitwy. |
| **20**| **Autopsja Polowa** | Badanie zwłok elitarnych wrogów daje stały bonus +2% odporności składu na dany typ wroga.| Metaprogresja rosnąca w trakcie czyszczenia mapy świata. |

---

## III. 🔧 INŻYNIER (ENGINEER) — 20 Unikatowych Umiejętności

| Nr | Nazwa Umiejętności | Opis Mechaniki Bojowej | Efekt Dopaminowy / Synergia |
|:---|:---|:---|:---|
| **1** | **Wieżyczka Sentry V2** | Rozkłada automatyczną wieżyczkę maszynową z auto-celowaniem (maks. 2 na mapie). | Budowanie małej obronnej fortecy w środku dżungli. |
| **2** | **Dron Łukowy Tesla** | Latający dron rażący 3 wrogów naraz wyładowaniami elektrycznymi. | Widok błękitnych błyskawic przeskakujących po hordzie wrogów. |
| **3** | **Bariera Hard-Light** | Stawia energetyczną ścianę na 6s zatrzymującą pociski wroga, przepuszczającą nasze strzały.| Jednostronna tarcza dająca bezkarną przewagę ogniową. |
| **4** | **Magnetyczny Kolektor** | Automatycznie przyciąga wszystkie apteczki, amunicję i monety z promienia 400px. | Absolutny koniec z ręcznym bieganiem po każdy drop na mapie. |
| **5** | **Overclocking Broni** | Szybkostrzelność składu rośnie o 35%, ale broń przegrzewa się i blokuje na 1s co 40 strzałów.| Balansowanie na krawędzi maksymalnego dps-u i przegrzania lufy. |
| **6** | **Inteligentne Miny Spider**| Miny polowe zamieniają się w mechaniczne pająki goniące wrogów w promieniu 200px. | Własna armia małych kamikadze czyszcząca okopy wroga. |
| **7** | **EMP Blast** | Wyładowanie niszczące pancerze wrogów cybernetycznych i wyłączające wrogie wieże na 10s.| Błyskawiczny paraliż wrogiej infrastruktury obronnej. |
| **8** | **Fabryka Kieszonkowa** | Co 45 sekund Inżynier drukuje darmowy granat odłamkowy dla każdego w składzie. | Nieskończone zasoby materiałów wybuchowych. |
| **9** | **Pancerz Reaktywny** | Po otrzymaniu ciosu wręcz pancerz Inżyniera wybucha falą plazmy odrzucającą napastnika.| Karze każdego wroga próbującego podejść na wyciągnięcie ręki. |
| **10**| **Wabik Wybuchowy V2** | Ulepsza klasyczne wabiki z doktryn taktycznych: wabiki eksplodują po zniszczeniu. | Zastawianie mądrych pułapek na patrole przeciwnika. |
| **11**| **Przenośny Teleporter** | Stawia tunel wejściowy i wyjściowy; gracz może wchodzić w jeden i wychodzić drugim. | Genialne narzędzie do ucieczki z okrążenia na mapie 12000px. |
| **12**| **Nanitowa Lufa** | Pociski wystrzelone przez Inżyniera niszczą osłony worków z piaskiem jednym strzałem.| Dosłowne burzenie wrogich zasieków i schronów. |
| **13**| **Recykling Złomu** | Zniszczenie wrogiego mecha lub bazy pozostawia pancerne płyty (+30 Armor do podniesienia).| Nagroda za eliminowanie najcięższego sprzętu wroga. |
| **14**| **Działo Railgun** | Rozstawia ciężkie działo magnetyczne przebijające 10 wrogów w jednej linii. | Satysfakcja z "czyszczenia tunelu" jednym gigantycznym laserem. |
| **15**| **Moduł Odrzutu (Dash)** | Buty odrzutowe pozwalające wykonać błyskawiczny odskok po dwukrotnym kliknięciu myszą.| Zwiększenie dynamiki sterowania w stylu gier arcade. |
| **16**| **Sabotaż Amunicji** | Wrogowie mają 15% szansy na zacięcie lufy (samoczynny wybuch ich własnej broni). | Przeciwnicy niszczą sami siebie w połowie wymiany ognia. |
| **17**| **Generator Czarny Kuj** | Rzuca ładunek tworzący czarną dziurę zasysającą wrogów do jednego punktu na 4s. | Idealna synergia pod wezwanie Nalotu lub Miniguna! |
| **18**| **Zasłona Dymno-Nanitowa**| Granat dymny ukrywający skład, który jednocześnie leczy pancerz kinetyczny (+5 pkt/s).| Połączenie kamuflażu z szybkim serwisem pancerzy bojowych. |
| **19**| **Zautomatyzowany Saper**| Pasywnie wykrywa i automatycznie rozbraja wrogie miny polowe z odległości 250px. | Całkowity spokój o schowane w trawie miny przeciwnika. |
| **20**| **Awaryjny Mech Bojowy** | Po utracie pancerza Inżynier wchodzi do mecha bojowego z piłą łańcuchową na 10s. | Epicka transformacja w maszynę zagłady w sytuacji krytycznej. |

---

## IV. 🎯 SNAJPER (SNIPER) — 20 Unikatowych Umiejętności

| Nr | Nazwa Umiejętności | Opis Mechaniki Bojowej | Efekt Dopaminowy / Synergia |
|:---|:---|:---|:---|
| **1** | **Rykoszety Śmierci** | Każdy celny strzał w głowę rykoszetuje do 2 kolejnych wrogów znajdujących się obok. | Jeden strzał w głowę zabija trzech przeciwników naraz. |
| **2** | **Kameleon Dżungli** | Nieruchomy Snajper po 2s wchodzi w optyczny kamuflaż 100% (nawet poza krzakami). | Bycie całkowicie niewidzialnym duchem polującym z ukrycia. |
| **3** | **Amunicja AP (Przeciwpancerna)**| Strzały Snajpera ignorują 100% pancerza wroga i zadają obrażenia nieodwracalne. | Snajper zamienia wrogich tanków w papierowe cele. |
| **4** | **Egzekucja Horyzontalna**| Obrażenia Snajpera rosną liniowo wraz z dystansem do celu (do +250% na krawędzi ekranu).| Premia za perfekcyjne celowanie na maksymalny zasięg lufy. |
| **5** | **Zmysł Łowcy** | Gdy obok pojawi się Boss lub Zabójca, ekran krawędziuje się na niebiesko, a czas zwolni o 40%.| Ostrzeżenie przed śmiertelnym niebezpieczeństwem z flanki. |
| **6** | **Paraliż Celownika** | Wróg, w którego celujesz przez 1.5 sekundy bez strzału, zostaje sparaliżowany strachem na 2s.| Kontrola tłumu bez wystrzelenia ani jednego naboju. |
| **7** | **Pociski Dum-Dum** | Trafienie w nogi przeciwnika natychmiast zatrzymuje jego szarżę i wywołuje krwotok. | Uniemożliwia potworom skrócenie dystansu do gracza. |
| **8** | **Optyka Termowizyjna** | Snajper widzi wrogów ukrytych za ścianami bazy, w dymie oraz we wrogich kamuflażach. | Przenikanie wzrokiem przez każdą przeszkodę terenową. |
| **9** | **Strzał Próżniowy** | Pocisk zostawia tunel próżniowy zasysający wrogie pociski i niszczący je w locie. | Strzał snajperski działający jak tarcza anty-balistyczna. |
| **10**| **Pestka w Głowę (Insta-Kill)**| 8% szansy przy strzale w zwykłego wroga na natychmiastową dekapitację niezależnie od HP.| Kasowanie elitarnych jednostek jednym szczęśliwym pociągnięciem. |
| **11**| **Tłumik Dźwięku (Duch)**| Strzały Snajpera nie ściągają uwagi wrogów ze spawnów (nie biegną w kierunku huku). | Cicha eliminacja obozu wroga bez wywoływania alarmu całej mapy.|
| **12**| **Pocisk Śledzący (Smart)**| Pocisk wystrzelony obok celu potrafi skręcić w locie o 45 stopni, by dosięgnąć wroga. | Wybacza drobne błędy celowania myszką podczas szybkiej akcji. |
| **13**| **Zastrzyk Skupienia** | Wciśnięcie PPM spowalnia czas całego świata o 60% na 3 sekundy (cooldown: 30s). | Filmowy bullet-time do perfekcyjnego wycelowania serii headshotów.|
| **14**| **Strzał Przepięciowy** | Trafienie we wrogi generator wywołuje reakcję wysadzającą całą bazę zaopatrzeniową. | Wysadzanie w powietrze połowy ekranu jednym trafnym strzałem. |
| **15**| **Kamuflowany Saper** | Snajper podkładający miny polowe robi to w 100% niewidzialnie dla patroli wroga. | Zastawianie śmiertelnych pułapek tuż przed nosami strażników. |
| **16**| **Górna Półka** | Snajper może wchodzić na dachy bunkrów, zyskując +50% zasięgu i odporność na ciosy wręcz.| Zajmowanie niedostępnych dla zombie pozycji strzeleckich. |
| **17**| **Podwójny Zapłon** | Co 5. wystrzelony pocisk rozdziela się w locie na 3 pociski lecące w wachlarzu. | Zamiana karabinu snajperskiego w precyzyjną strzelbę na dystans.|
| **18**| **Staza Hibernacyjna** | Po otrzymaniu ciosu śmiertelnego przeżywa z 1 HP i zamraża napastnika w bryle lodu. | Druga szansa na przeżycie połączona z unieszkodliwieniem zabójcy.|
| **19**| **Oko Sokoła** | Pasywnie zwiększa szansę na cios krytyczny całego oddziału o stałe 12%. | Globalne wsparcie dps-u dla całego plutonu. |
| **20**| **Balistyka Orbitalna** | Strzał z karabinu snajperskiego przy naładowanych doktrynach przebija mapę na wylot. | Pocisk lecący przez 12000 pikseli niszczący wszystko na swej drodze.|

---

## V. 🛡️ CIĘŻKI STRZELEC (HEAVY GUNNER) — 20 Unikatowych Umiejętności

| Nr | Nazwa Umiejętności | Opis Mechaniki Bojowej | Efekt Dopaminowy / Synergia |
|:---|:---|:---|:---|
| **1** | **Rozgrzana Lufa** | Im dłużej trzymasz strzał, tym szybszy ogień (do +150%), pociski stają się zapalające. | Zamiana lufy miniguna w plujący ogniem wulkan ołowiu. |
| **2** | **Tarcza Jugger** | Ciężki Strzelec idzie z przodu z tytanową tarczą pochłaniającą 80% obrażeń od frontu. | Możliwość fizycznego taranowania wrogiego ostrzału z karabinów. |
| **3** | **Zubożony Uran** | Pociski z Miniguna odpychają wrogów o 15px z każdym trafieniem (Ściana Ołowiu). | Potwory próbujące szarżować są dosłownie spychane do tyłu. |
| **4** | **Szał Berserkera** | Gdy HP spadnie poniżej 30%, staje się odporny na zachwianie i zadaje 2x obrażeń. | Strzelec staje się najgroźniejszą bestią tuż przed śmiercią. |
| **5** | **Taśma Nieskończoności**| Szansa 25% przy każdym strzale, że nie zużyje naboju z bębna amunicyjnego. | Radość z ciągłego strzelania bez frustrującego przeładowania. |
| **6** | **Człowiek-Czołg** | Może taranować i niszczyć drewniane zasieki oraz małych wrogów samym swym ciałem. | Dosłowne rozjeżdżanie przeszkód na mapie w biegu. |
| **7** | **Amunicja Flak** | Co 10. pocisk z Miniguna wybucha w powietrzu chmurą odłamków raniących dookoła. | Ciągłe mikro-eksplozje zamieniające dżunglę w piekło odłamków. |
| **8** | **Chłodzenie Azotem** | Przeładowanie broni emituje falę mrozu zamrażającą wrogów dookoła na 2s. | Zamienia moment bezbronności (przeładowanie) w obronną pułapkę. |
| **9** | **Tytanowy Kastet** | Atak wręcz odrzuca wroga na 200px i zadaje mu obrażenia równe 30% maks. HP wroga.| Odrzucenie Bossa na drugi koniec ekranu jednym potężnym ciosem. |
| **10**| **Ołowiany Deszcz** | Po kucnięciu rozkłada trójnóg: rozrzut broni spada do 0, a penetracja rośnie o 100%.| Zamiana strzelca w stacjonarny laser zagłady o ogromnej celności. |
| **11**| **Ryczący Potwór** | Huk wystrzałów z Miniguna pasywnie obniża celność wrogów na ekranie o 20%. | Efekt psychologiczny ogłuszający i depozycjonujący przeciwników. |
| **12**| **Kamizelka EOD** | Ciężki Strzelec jest w 100% odporny na obrażenia od wybuchów (min, bomb, beczek). | Bieganie po polu minowym bez utraty ani jednego punktu zdrowia. |
| **13**| **Adrenalina Rzeźnika** | Każdy rozczłonkowany wróg odnawia Ciężkiemu Strzelcowi 3 pkt pancerza kinetycznego.| Im gęstsza rzeź, tym twardszy pancerz bohatera. |
| **14**| **Moduł Plazmowy** | Możliwość przełączenia Miniguna w tryb Miotacza Plazmy spalającego w bliskim kontakcie.| Opcja stopienia hordy, która zdołała podejść pod samą tarczę. |
| **15**| **Żelazne Płuca** | Strzelec może biegać z ciężką bronią bez żadnych kar do prędkości ruchu oddziału. | Usunięcie największej wady klasy (spowolnienia zespołu). |
| **16**| **Huk Soniczny** | Naciśnięcie spacji wyzwala falę uderzeniową z bębna niszczącą wrogie pociski w locie.| Awaryjne czyszczenie powietrza przed nawałnicą rakiet z bazooka. |
| **17**| **Podwójny Bęben** | Magazynek mieści 200 strzałów zamiast 100, a czas przeładowania skraca się o 25%.| Podwojenie czasu ciągłego prowadzenia ognia zaporowego. |
| **18**| **Gatling Laser** | Po zabiciu 50 wrogów broń strzela ciągłym czerwonym promieniem lasera przez 6s. | Nagroda za utrzymanie wysokiej serii zabójstw w dżungli. |
| **19**| **Żywy Bunkier** | Gdy Strzelec stoi w miejscu, sojusznicy za jego plecami otrzymują 0 obrażeń balistycznych.| Tworzenie mobilnej barykady dla rannych sojuszników. |
| **20**| **Prowokator EMP** | Przyciąga ogień wrogów na siebie; każde trafienie weń ładuje bombę EMP na jego plecach.| Obrażenia wroga ładują potężną eksplozję zwrotną. |

---

## VI. 🌀 10 UMIEJĘTNOŚCI "OUTSIDE THE BOX" (Szalone synergie łamiące mechaniki gier)

Te umiejętności przekraczają standardowe drzewka klasowe – nadają grze unikatową tożsamość *viralową*, o której gracze będą opowiadać na Discordzie.

1. **👾 Duch w Maszynie (`GLITCH_HACK`)**  
   * **Mechanika**: Raz na misję gracz może kliknąć myszą w dowolnego elitarnego przeciwnika lub Bossa i **przeprogramować jego kod**. Wróg staje się sojusznikiem walczącym u naszego boku do końca fali.
   * **Dopamina**: Przejęcie wrogiego czołgu lub mecha i obrócenie jego dział przeciwko hordzie zombie.

2. **🎰 Kasyno Życia i Śmierci (`COIN_FLIP`)**  
   * **Mechanika**: Co 30 sekund gra rzuca w tle wirtualną monetą: 
     * *Reszka* = Cały skład dostaje +100% HP i darmowe bombardowanie z powietrza. 
     * *Orzeł* = Skład traci 50% HP, ale broń zadaje **300% obrażeń krytycznych** przez kolejne 15s.
   * **Dopamina**: Ekstremalny hazard typu *High Risk - High Reward*.

3. **⏪ Przycisk Cofania Czasu (`BACKSPACE_REWIND`)**  
   * **Mechanika**: W momencie całkowitej śmierci oddziału gracz ma 2 sekundy na wciśnięcie klawisza `BACKSPACE`. Czas gry cofa się o 5 sekund na taśmie wideo (z zachowaniem zdobytej wiedzy o pułapkach i pozycjach wroga).
   * **Dopamina**: Uczucie posiadania "supermocy montażysty filmowego".

4. **🎨 Płótno Malarza Krwi (`BLOOD_ECONOMY`)**  
   * **Mechanika**: Każdy piksel krwi namalowany na mapie generuje +0.01% do stałego mnożnika monet. Gdy krew pokryje >40% widocznego ekranu, odpala się **Krwawy Deszcz** leczący oddział do pełna.
   * **Dopamina**: Zamiana mrocznej rzeźni w opłacalny mechanizm ekonomiczny gier roguelite.

5. **🐕 Kontrola Pieska (`GOOD_BOY_OVERRIDE`)**  
   * **Mechanika**: Gracz może wcisnąć `TAB` i przejąć bezpośrednie sterowanie nad bojowym Owczarkiem Niemieckim (Psem). Gracz biega psem z prędkością 350%, rozszarpując gardła wrogów od tyłu, podczas gdy reszta składu prowadzi ogień automatyczny sterowany przez AI.
   * **Dopamina**: Zmiana perspektywy z taktycznej strzelanki w dynamiczną zręcznościówkę arcade.

6. **🥔 Gorący Kartofel (`BOUNCY_GRENADE`)**  
   * **Mechanika**: Wrogowie odrzucają rzucony przez gracza granat w kierunku innego wroga, który odrzuca go dalej – granat rośnie i zwiększa moc z każdym odbiciem, aż wysadzi w powietrze połowę fali.
   * **Dopamina**: Patrzenie w napięciu, jak ping-pongowa bomba osiąga rozmiary atomowe.

7. **🦾 Pakt z Cyber-Szatanem (`CYBER_DEMON_ARM`)**  
   * **Mechanika**: Żołnierz oddaje ramię pod radykalną cyber-amputację. Traci bezpowrotnie możliwość leczenia apteczkami polowymi, ale jego ręka zamienia się w działko plazmowe strzelające promieniem przenikającym przez wszystkie obiekty i ściany na mapie.
   * **Dopamina**: Trwałe poświęcenie obrony na rzecz absolutnej potęgi niszczycielskiej.

8. **🦋 Efekt Motyla (`CROSSOVER_CHAOS`)**  
   * **Mechanika**: Każdy zabity przeciwnik ma 0.5% szansy na zespawnowanie losowego, kultowego obiektu z innej retro-gry (np. zielonej rury z Mario wypluwającej złote monety, gwiazdki nietykalności lub czołgu z *Metal Slug*).
   * **Dopamina**: Element czystej, nostalgicznej niespodzianki w każdej rundzie.

9. **💳 Kredyt u Handlarza Bronią (`BLACK_MARKET_DEBT`)**  
   * **Mechanika**: Gracz może kupować ulepszenia na ujemnym saldzie (zadłużenie). Jeśli nie spłaci długu w ciągu dwóch poziomów fal, na mapie zaczynają polować na niego elitarni Cyber-Komornicy z katanami.
   * **Dopamina**: Balansowanie na krawędzi bankructwa dla zdobycia legendarnej broni na fali 2.

10. **🌌 Czwarte Wymiarowe Działo (`PORTAL_MONITOR`)**  
    * **Mechanika**: Pocisk wystrzelony w krawędź ekranu monitora nie znika, lecz **wylatuje po przeciwnej stronie monitora** (np. strzał w lewą krawędź wylatuje z prawej krawędzi trafiając wrogów w plecy).
    * **Dopamina**: Wykorzystanie krawędzi okna przeglądarki jako elementu geometrii taktycznej.

---

## 💡 PODSUMOWANIE PROJEKTOWE: JAK TO WDZIĄĆ DO GRY?

Aby wciągnąć gracza na setki godzin:
1. **Zasada 3 Kart**: Przy awansie żołnierza na wyższy poziom graczowi wyświetlają się **3 losowe karty umiejętności z powyższych tabel**. 
2. **Synergie klasowe**: Gracz zaczyna główkować: *"Jeśli wezmę Medykowi Pancerz Hemostatyczny odbijający pociski, a Ciężkiemu Strzelcowi Prowokatora EMP... stworzę niezniszczalny bastion!"*.
3. **Rzadkość (Rarity)**: Umiejętności "Outside the Box" pojawiają się w kartach awansu jako **Złote Karty Legendarne** (szansa ok. 5%), wywołując u gracza euforię przy odblokowaniu.
