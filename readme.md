# Rzut ukośny - projekt z fizyki (WSB-NLU Informatyka) by Dawid Chrzanowski

Działający symulator: https://diwadu.github.io/fizproj/

# Omówienie działania Skryptu

Ten skrypt **rysuje i symuluje rzut ukośny** na podstawie kilku kluczowych parametrów:  
**prędkości** (velocity), **kąta wyrzutu** (angle), **przyspieszenia grawitacyjnego** (g)  
i **kroku czasowego** (dt).

---

### Główne obliczenia fizyczne

W funkcji `simulate()` jest zawarty kluczowy kod:

```js
x = velocity * Math.cos(angle) * t;
y = velocity * Math.sin(angle) * t - 0.5 * g * t * t;
```

który składa ruch ciała w rzucie ukośnym

# Opis projektu oraz użytych technologii

Projekt został napisany w języku JS z użyciem HTML + CSS. Autor jest programistą webowym, więc był to najbardziej praktyczny wybór.
Wszystkie źródła są zapisane w niniejszym repozytorium, które jest publicznie dostępne do wglądu.

## Poniższy opis dotyczy pliku scripts.js, który stanowi serce projektu.

## 1. Sekcja zmiennych globalnych

Znajduje się na początku i zawiera:

- **Odwołania do elementów HTML** (np. `canvas`, suwaki, dropdowny).
- **Zmienne fizyczne** (m.in. `velocity`, `angle`, `g`, `dt`) przechowujące parametry ruchu.
- **Stałe dotyczące rysowania** (`margin`, `maxX`, `maxY`, itp.) i zmienne do skalowania osi (`dynamicScaleX`, `dynamicScaleY`).

Dzięki temu od razu wiadomo, jakich wartości używa symulacja i co będzie modyfikowane w dalszych częściach kodu.

---

## 2. Funkcje pomocnicze

Zawierają głównie:

- **`updateLabels()`**: aktualizuje wyświetlane wartości w interfejsie (prędkość, kąt).
- **Listenery** dla suwaków i dropdownów – wczytują bieżące wartości z interfejsu i odświeżają parametry symulacji.
- **`drawArrow()`**: rysuje grotki (strzałki) na osiach.
- **`drawAxesAndGrid()`**: przelicza maksymalne wartości toru, skalę osi i rysuje siatkę oraz osie.
- **`drawBall()`**: rysuje piłkę (obiekt) w konkretnym punkcie \( (x, y) \) przeskalowanym do \( canvas \).
- **`drawPath()`**: rysuje ślad (trajektorię) łącząc punkty zapisane w tablicy `pathPoints`.
- **`addEnergyDisplays()`**: dodaje do interfejsu paragrafy służące wyświetlaniu energii (potencjalnej, kinetycznej i całkowitej).

---

## 3. Główna pętla symulacji (`simulate()`)

To **serce** kodu. Odpowiada za:

1. **Przeliczenie aktualnego położenia** \((x, y)\) w czasie \( t \) na podstawie podstawowych równań ruchu (uwzględniających prędkość, kąt, przyspieszenie grawitacyjne).
2. **Przeskalowanie** tych współrzędnych do wymiarów \( canvas \).
3. **Rysowanie** obiektu i/lub aktualizacja śladu.
4. **Obliczanie energii** (kinetycznej, potencjalnej, całkowitej) i wyświetlanie jej w interfejsie.
5. **Inkrementację** czasu o \( dt \) w każdej klatce animacji.
6. **Zatrzymanie** symulacji, gdy ciało spadnie na ziemię (tj. \(y <= 0\)).

---

## 4. Obsługa przycisków i inicjalizacja danych

- **`startButton`** – ustawia stan symulacji (`isSimulating = true`) i wywołuje `simulate()`, co rozpoczyna pętlę animacji.
- **`resetButton`** – zatrzymuje animację (`cancelAnimationFrame`) i resetuje wartości (czas, położenie, ślad, skalowanie). Następnie rysuje osie na nowo.
- **Inicjalizacja** na końcu pliku:
  1. Wywołanie `updateLabels()` w celu ujednolicenia wartości na starcie.
  2. Rysowanie siatki i osi (`drawAxesAndGrid()`).
  3. (Opcjonalnie) Dodanie elementów do wyświetlania energii (`addEnergyDisplays()`).

Dzięki temu kod jest spójny: najpierw ładuje wszystkie zmienne, konfiguruje interfejs, ustawia event listenery, a na końcu uruchamia metody rysujące pierwszą siatkę oraz uruchamia obliczanie energii.
