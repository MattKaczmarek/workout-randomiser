# Workout Randomiser

Lekka statyczna PWA do losowania kolejności ćwiczeń mięśni podczas treningu. Aplikacja działa bez backendu, zapisuje dane lokalnie w przeglądarce i może działać offline po instalacji.

## Instalacja na iPhone

1. Otwórz: **https://mattkaczmarek.github.io/workout-randomiser/**
2. W Safari kliknij **Udostępnij** -> **Dodaj do ekranu głównego**.
3. Uruchamiaj aplikację z ikony na ekranie głównym.

## Funkcje

- Losowanie kolejności mięśni głównych.
- Losowe parowanie mięśni dodatkowych z głównymi.
- Reguły wykluczające pary mięśni, które nie mogą wystąpić razem w jednym ćwiczeniu.
- Odznaczanie wykonanych ćwiczeń i przesuwanie ich na dół listy.
- Licznik postępu, ukończonych treningów i daty ostatniego ukończenia.
- Lokalny zapis danych w `localStorage`.
- PWA z service workerem i cache offline.

## Jak używać

1. Dodaj mięśnie główne, np. `klatka`, `plecy`, `nogi`.
2. Opcjonalnie dodaj mięśnie dodatkowe, np. `brzuch`, `biceps`.
3. W sekcji **Nie łącz razem** dodaj pary, które nie mogą pojawić się jako jedno ćwiczenie.
4. Kliknij **Rozpocznij trening**.
5. Odznaczaj wykonane ćwiczenia albo kliknij **Losuj nową kolejność**.

## Struktura

- `index.html` - statyczny layout aplikacji.
- `style.css` - cały wygląd UI, bez zewnętrznych bibliotek.
- `scripts/config.js` - wspólna wersja, nazwy cache i lista assetów PWA.
- `scripts/app.mjs` - obsługa UI, zdarzeń i service workera.
- `scripts/workout.mjs` - czysta logika mięśni, losowania i reguł wykluczeń.
- `scripts/storage.mjs` - zapis/odczyt danych lokalnych.
- `scripts/dom.mjs` - małe helpery DOM.
- `sw.js` - service worker.

## Development

Aplikacja nie wymaga builda.

```bash
python3 -m http.server 8765
```

Testy logiki:

```bash
node --test tests/*.test.mjs
```

Przed deployem podbij wersję w `scripts/config.js`. Service worker używa tej wersji do nazwy cache.
