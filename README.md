# DocCrea Syntax Highlighter

Word-add-in die DocxTemplater-syntaxen in een document kleurt en controleert.
Gemaakt door [MainFields](https://www.mainfields.nl).

## Wat doet het?

- Kleurt alle DocxTemplater-tags (`{var}`, `{#items}…{/items}`, `{^}`, `{@}`, `{>}`)
  per type én per nesting-diepte.
- Markeert ongebalanceerde of foute syntax vóórdat je het sjabloon rendert.
- Laat je kleuren, validatie en snippets beheren in een zijpaneel.
- Voegt voorbeeldsyntaxen in op de cursor (ribbon-menu of paneel).

## Ontwikkelen

### Vereisten

- Node.js 20+ (check met `node -v`)
- Word (Desktop Windows/Mac of Word Online) voor sideload-testen

### Eerste keer

```bash
npm install
# genereer lokale dev-certs voor HTTPS (vereist door Office)
npx office-addin-dev-certs install
```

### Lokaal draaien

```bash
npm run dev
# in een ander terminal-venster:
npm run start         # start Word + sideload van het manifest
```

### Tests

```bash
npm run test          # unit-tests parser + validator
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint
```

### Build

```bash
npm run build         # productiebundel in dist/
```

### Parser-CLI (zonder Word)

Handig om tokens en validatie-issues voor een stuk tekst te inspecteren:

```bash
npm run cli -- path/naar/bestand.txt
# of pipe direct:
echo "{#items}{naam}{/items}" | npm run cli
```

## Distributie

Zie [PLAN.md](PLAN.md) §6.6. De manifest.xml wijst naar
`https://jasper-mainfields.github.io/doccrea-syntax-highlighter/` —
een push naar `main` bouwt via GitHub Actions en publiceert naar GitHub Pages.

Eindgebruikers krijgen een zip met `manifest.xml` + handleidingen;
zij sideloaden het manifest in Word. Zie [docs/Installeren-in-Word.md](docs/Installeren-in-Word.md).

```bash
npm run package:zip   # bouwt dist/sideload/doccrea-syntax-highlighter-sideload.zip
```

### Icons

`npm run generate-icons` maakt placeholder-PNG's in MainFields-tinten. Vervang
de bestanden onder [src/assets/icons/](src/assets/icons/) door de MainFields-iconset
vóór de eerste publieke release.

## Projectstructuur

```
src/
├── taskpane/      # React zijpaneel (Fluent UI)
├── commands/      # Ribbon command handlers (Office.js)
├── core/          # Tokenizer, matcher, types, defaults (puur, testbaar)
├── word/          # Office.js wrappers (highlight, clear, snippets, settings)
└── cli/           # Node-CLI voor parser/validator debugging
tests/             # Vitest suite voor core/
```
