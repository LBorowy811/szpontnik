# Projekt – Instrukcja uruchomienia

Aby poprawnie uruchomić projekt, wykonaj poniższe kroki konfiguracyjne.

-------------------------------------------------------
1. Utworzenie pliku `.env`
   lub (skorzystaj z obecnego rozwiązania tymczasowego -> 2.)
(2). Zmień nazwę obecnie istniejącego pliku "konfiguracja_pliku_env.txt" na samo ".env" (bez zmian w pliku), przejdź do kroku nr 3.
-------------------------------------------------------

W katalgu "backend" utwórz plik:

.env

i umieść w nim poniższe zmienne środowiskowe:

```
ACCESS_TOKEN_SECRET='TWÓJ_WYGENEROWANY_KLUCZ'
NODE_ENV=development
```
-------------------------------------------------------
2. Generowanie ACCESS_TOKEN_SECRET
-------------------------------------------------------

Aby wygenerować unikalny klucz, użyj Node.js:

1. Otwórz terminal.
2. Uruchom Node:
   ```node```
3. Wpisz komendę:
   ```require('crypto').randomBytes(64).toString('hex')```
4. Skopiuj wygenerowany klucz i wklej go do pliku `.env` w miejsce ```'TWÓJ_WYGENEROWANY_KLUCZ'```.

-------------------------------------------------------
3. Instalacja zależności
-------------------------------------------------------

1. Otwórz terminal.
2. Przejdź do katalogu backend.
3. Uruchom polecenie: 
   ```
   npm install; npm start
   ```
4. Otwórz nowe okno terminalu.
5. Przejdź do katalogu frontend.
6. Uruchom polecenie:
   ```
   npm install; npm run dev
   ```
-------------------------------------------------------
4. Uruchomienie aplikacji
-------------------------------------------------------

W terminalu, w którym został uruchomiony frontend, wciśnij lewym przyciskiem myszy trzymając lewy control - adres ``` Network / Localhost ```

-------------------------------------------------------
Dodatkowe informacje
-------------------------------------------------------

# w najblizszej przyszlosci dodac rozszerzone README -> opis endpointow, technologie, struktura projektu
