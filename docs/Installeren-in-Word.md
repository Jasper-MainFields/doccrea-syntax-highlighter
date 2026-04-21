# MainFields DocCrea Syntax Highlighter — Installeren in Word

Deze add-in werkt op Word voor Windows, Mac en Word Online. Je hebt hem in drie
minuten geïnstalleerd.

## Wat ga je doen?

1. De DocCrea-zip uitpakken.
2. Het `manifest.xml` in de juiste Office-sideload-map plaatsen.
3. Word opnieuw starten.
4. De nieuwe tab **DocCrea** in het lint gebruiken.

## Windows

1. Druk `Win + R`, typ `%USERPROFILE%\AppData\Roaming\Microsoft\Office\Addins` en bevestig met Enter.
2. Bestaat de map niet? Maak hem aan.
3. Plaats hierin `manifest.xml`.
4. Herstart Word.

## Mac

1. Open Finder → *Ga* → *Ga naar map* (cmd+shift+G).
2. Plak `~/Library/Containers/com.microsoft.Word/Data/Documents/wef` en druk enter.
3. Plaats hierin `manifest.xml` (maak `wef` aan als hij ontbreekt).
4. Herstart Word.

## Word Online

1. Open een document op `word.office.com`.
2. Tabblad *Invoegen* → *Mijn add-ins* → *Een aangepaste add-in uploaden* → selecteer `manifest.xml`.
3. De add-in verschijnt in de sessie.

## Controleren

Open een document. In het lint hoort de tab **DocCrea** te staan met de knoppen
**Highlight**, **Clear**, **Snippets** en **Instellingen**.

Eerste keer gebruiken:

- Druk op **Highlight** om je hele document te scannen en alle tags te kleuren.
- Druk op **Instellingen** om kleuren, delimiters en snippets aan te passen.
- Klik op **Snippets** om een voorbeeld-tag op de cursorpositie te plaatsen.

## Problemen

Werkt er iets niet? Kijk of de URL `https://jasper-mainfields.github.io/doccrea-syntax-highlighter/`
bereikbaar is in je browser. De add-in haalt daar zijn UI-bundle vandaan. Zonder
internet werkt sideload pas nadat je MainFields vraagt om een offline-bundle.

Contact: [mainfields.nl](https://www.mainfields.nl).
