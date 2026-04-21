---
name: DocCrea Syntax Highlighter — Plan
owner: MainFields (Jasper Bakker)
status: concept, klaar voor handoff naar Claude Code
date: 2026-04-21
---

# DocCrea Syntax Highlighter by MainFields

Een Word-plugin die DocxTemplater-syntaxen in een document zichtbaar kleurt en controleert. Bedoeld voor iedereen die sjablonen maakt met DocxTemplater en die grip wil op waar tags beginnen, eindigen en of ze kloppen.

## 1. Doel

- Duidelijk zien waar DocxTemplater-syntaxen beginnen en eindigen (kleuren per tag-type en per paar).
- Fouten vroeg vangen: ongebalanceerde tags en foute syntax worden gemarkeerd vóórdat je het sjabloon ooit door DocxTemplater haalt.
- Gebruiker heeft zelf controle over het kleurenschema via een zijpaneel.
- Snel voorbeeld-syntaxen in het document kunnen plaatsen (snippets) zodat je niet van buiten hoeft te kopiëren.

## 2. Vastgestelde keuzes

| Onderwerp | Keuze |
|---|---|
| Platform | **Office Add-in (Office.js)**. Werkt op Word Windows, Mac en Word Online. Distribueerbaar via sideload of AppSource. |
| Highlight-trigger | **Op commando** via knop in het Word-lint. *Reminder voor later:* onderzoeken of live-highlighting haalbaar is als optionele modus (zie §9). |
| Validatie in MVP | **Gebalanceerde tags + syntax-fouten**. Data-model validatie (JSON matchen) pas later. |
| Configuratie | **Volledig zijpaneel** waarin gebruiker per tag-type kleuren, markering en aan/uit kan instellen. |

## 3. Welke DocxTemplater-syntaxen ondersteunen we?

Standaard DocxTemplater (zonder modules) dekt onderstaande tag-types. Dit is wat de highlighter minimaal moet herkennen:

- **Placeholder** — `{voornaam}`, `{user.email}`, `{items.length}`
- **Section / loop (open)** — `{#items}`
- **Section / loop (close)** — `{/items}` of `{/}`
- **Inverted section (open)** — `{^items}`
- **Inverted section (close)** — `{/items}` of `{/}`
- **Raw XML** — `{@rawXml}` (rendert ongestripte XML, riskant om mee te werken — verdient opvallende kleur)
- **Partial / include** — `{>partialNaam}`
- **Comment / escape** — afhankelijk van versie; niet meenemen in MVP.

Optioneel voor v1.1 (achter een vinkje in settings):
- **Angular-expressies** — `{user.name | upper}` (als de gebruiker de angular-parser module gebruikt).
- **Custom delimiters** — als DocxTemplater gestart is met andere dan `{` `}`, moet de plugin dat ook aankunnen. In de config-panel komt een veld voor start- en eind-delimiter.

## 4. Functies — MVP (eerste oplevering)

### 4.1 Highlight-knop in het lint

Eén groep in het Word-lint (tab "DocCrea") met drie knoppen:
- **Highlight** — scant het hele document en kleurt alle herkende tags.
- **Clear highlights** — verwijdert alle opgelegde kleuringen (zonder de tekst zelf aan te raken).
- **Instellingen** — opent het zijpaneel.

### 4.2 Kleuren per tag-type

Elke tag-soort krijgt een eigen tekstkleur *en* optioneel een eigen accentkleur (markering/onderlijning). Voor open/close-paren (`{#items}` / `{/items}`) gebruiken we **dezelfde kleur per paar**, zodat je visueel begin en einde aan elkaar kunt koppelen. Bij geneste paren worden per nesting-diepte kleurschakeringen gebruikt (lichter → donkerder) zodat je in één oogopslag ziet welke `{/}` bij welke `{#}` hoort.

**Default-preset bij oplevering: MainFields-huisstijl.** Daarnaast komen er direct drie extra presets mee: *Licht*, *Donker* en *Hoog contrast*. Gebruikers kunnen een eigen preset opslaan bovenop deze vier. De exacte hex-codes voor de MainFields-preset vult Jasper in vóór de eerste build (in `src/core/defaults.ts`). Voorlopig houden we onderstaande rolverdeling aan, te vullen met MainFields-tinten:

| Tag-type | Rol in preset |
|---|---|
| Placeholder `{var}` | MainFields primair |
| Section open/close `{#}` `{/}` | MainFields secundair (met nesting-schakering) |
| Inverted `{^}` | Accentkleur paars/violet |
| Raw XML `{@}` | Waarschuwend oranje (omdat deze ongestript wordt gerenderd) |
| Partial `{>}` | Neutraal grijs |
| Ongeldig / fout | Rood + wavy onderlijning |

### 4.3 Validatie

Wanneer je op **Highlight** drukt wordt óók meteen gevalideerd. Twee fouten­categorieën:

**Gebalanceerde tags**
- Openingstag zonder sluiting (of andersom).
- Verkeerd gesloten nesting, bv. `{#a}{#b}{/a}{/b}`.
- Anonieme close `{/}` zonder bijbehorende open.

**Syntax-fouten**
- Onbekend tag-type (bv. `{!iets}`).
- Lege tag `{}` of `{ }`.
- Ongeldige tekens in variabelenaam (spaties, diakritieken afhankelijk van config).
- Ontbrekende haak: `{user.name` of `user.name}`.

Fouten worden op twee plekken getoond:
1. **In het document** — foute tags krijgen een opvallende kleur (standaard rood) + een wavy onderlijning (via Word's `Range.font.underline` of Office.js highlight-mechanisme).
2. **In het zijpaneel** — klikbare lijst "Problemen gevonden" met type fout en een "Ga heen"-knop die naar de betreffende locatie springt (`Range.select()`).

### 4.4 Zijpaneel — Instellingen

Tabs in het task pane:
- **Kleuren** — per tag-type een color picker, schakelaar voor onderlijning/vet, toggle "gebruik nesting-schakeringen".
- **Syntax** — delimiters (standaard `{` en `}`), toggle voor angular-parser, reserveert ruimte voor custom modules.
- **Validatie** — welke checks aan/uit, ernstniveau (waarschuwing vs. fout).
- **Snippets** — beheren van voorbeeldtags (zie 4.5).
- **Over** — versie, MainFields-branding, klikbare verwijzing naar [mainfields.nl](https://www.mainfields.nl) ("Gemaakt door MainFields"), feedback-link.

Config wordt per gebruiker bewaard met `Office.context.roamingSettings` (reist mee met het Office-account), plus een export/import-knop om een `.json` te delen binnen een team.

### 4.5 Voorbeeld-syntaxen invoegen

**Ja, dit kan.** In het zijpaneel komt een **Snippets**-sectie met knoppen per tag-type. Klikken plaatst de tag op de cursorpositie in het document, inclusief een platzhalter-variabele (bv. `{user.naam}`) die meteen geselecteerd is zodat je kunt doortypen.

Standaard set snippets in MVP:
- Placeholder `{veldnaam}`
- Loop `{#items}…{/items}` (inclusief een voorbeeldregel binnen de loop)
- If-section `{#conditie}…{/conditie}`
- Inverted `{^conditie}…{/conditie}`
- Raw XML `{@html}`
- Tabelrij-loop (een kant-en-klaar tabelsjabloon — krachtigste en meest gevraagde use case in DocxTemplater)

Gebruikers kunnen eigen snippets toevoegen via het paneel.

## 5. Later / nice-to-have

Niet in MVP, maar expliciet noteren zodat we er later op terug kunnen:

- **Live highlighting** — reageren op `DocumentChanged`-events in plaats van alleen op knop. Risico: performance bij grote documenten, cursor-gedrag. Mogelijke aanpak: debounced scan van alleen de zichtbare/recent bewerkte paragrafen.
- **"Fix tags across runs"** — detecteren en herstellen van tags die Word intern over meerdere `<w:r>`-runs heeft verdeeld. Dit is een klassieke DocxTemplater-valkuil: je typt `{user.naam}`, per ongeluk wordt één teken anders geformatteerd (spellingscheck, autocorrect, copy-paste), en Word slaat de tag op als drie losse runs. Voor het oog is er niks aan de hand, maar DocxTemplater crasht erop. Onze plugin kan zulke tags herkennen en óf waarschuwen óf automatisch normaliseren (alle runs binnen een tag-bereik dwingen naar één opmaak). **Let op:** dit is iets anders dan geneste tags — `{#zaak}{#deelprocessen}{deelprocesnaam}{/deelprocessen}{/zaak}` is gewoon nesting en wordt al vanaf MVP ondersteund.
- **Data-model validatie** — uploaden van voorbeeld-JSON (of YAML), en dan variabelen in het document matchen tegen de keys. Typo's als `{user.nmae}` worden zichtbaar rood.
- **Kleur-presets** — "Licht", "Donker", "Hoog contrast", "MainFields huisstijl". Gebruiker kan eigen preset opslaan.
- **Documentatie-pop-over** — hover over een tag toont uitleg wat dit type doet.
- **Export naar gerenderd voorbeeld** — test-render met dummy-data zodat je kunt zien of het sjabloon werkt, rechtstreeks vanuit Word.
- **Meertaligheid van de UI** — NL + EN.
- **Angular / custom modules** — full-support voor third-party DocxTemplater modules.

## 6. Technische aanpak

### 6.1 Stack

- **TypeScript + React** voor het zijpaneel (task pane).
- **Office.js** voor interactie met Word.
- **Vite** als build tool (snel, moderne dev-server met HTTPS voor Office sideload).
- **Fluent UI React v9** voor knoppen, pickers, lijsten — voelt native binnen Office.
- **Vitest** voor unit tests van parser + validator.
- **Playwright** voor smoke-tests in Word Online (optioneel).

### 6.2 Parser / tokenizer

Kern van de plugin is een kleine tokenizer die tekst omzet in een reeks tokens: `TEXT`, `OPEN_SECTION`, `CLOSE_SECTION`, `PLACEHOLDER`, `RAW`, `PARTIAL`, `INVERTED`, `INVALID`. Ontwerpcriteria:

- **Puur en sync** — geen Office.js binnenin, alleen strings in, tokens uit. Dat maakt hem volledig unit-testbaar.
- **Robuust tegen fouten** — onvolledige tag produceert een `INVALID`-token, niet een crash.
- **Positie-bewust** — elk token kent z'n start- en eind-offset in de bron-string, nodig om later in Word precies die range te kleuren.

Daarnaast een **matcher** die een tokenreeks inspecteert op balans (stack-based: open pusht, close popt en vergelijkt). De matcher produceert `ValidationIssue`-objecten met location + reden.

### 6.3 Office.js — highlighten

Benadering: per paragraaf de tekst uitlezen, tokenizen, en vervolgens per token een `Range` opzoeken via `paragraph.search(tekstVanToken, …)` of via `getRange()` op character-offsets. De gevonden ranges krijgen `font.color` en eventueel `font.highlightColor`.

Waarschuwing / bekend risico: `search()` in Word API kan subtiel zijn bij speciale tekens (`{`, `}`). Indien nodig uitwijken naar `paragraph.getRange()` + custom splitsen. Dit is een **spike** waarvan het resultaat bepalend is voor uiteindelijke implementatie-snelheid.

### 6.4 Opslag van kleuren en snippets

- Gebruikersvoorkeuren → `Office.context.roamingSettings` (JSON-blob).
- Default-preset → ingebakken in de JS-bundle.
- Export/import → standaard file-download/upload in de browser-context van het task pane.

### 6.5 Projectstructuur (voorstel)

```
doccrea-syntax-highlighter/
├── manifest.xml                # Office Add-in manifest (ribbon + task pane)
├── package.json
├── vite.config.ts
├── src/
│   ├── taskpane/               # React-app voor het zijpaneel
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── panels/
│   │   │   ├── ColorsPanel.tsx
│   │   │   ├── SyntaxPanel.tsx
│   │   │   ├── ValidationPanel.tsx
│   │   │   ├── SnippetsPanel.tsx
│   │   │   └── AboutPanel.tsx
│   │   └── components/
│   ├── commands/               # Ribbon command handlers
│   │   ├── highlight.ts
│   │   ├── clear.ts
│   │   └── openPanel.ts
│   ├── core/                   # Platform-onafhankelijke logic
│   │   ├── tokenizer.ts
│   │   ├── matcher.ts          # balans + validatie
│   │   ├── types.ts
│   │   └── defaults.ts         # default kleuren en snippets
│   ├── word/                   # Office.js wrappers
│   │   ├── applyHighlights.ts
│   │   ├── clearHighlights.ts
│   │   ├── insertSnippet.ts
│   │   └── settings.ts
│   └── assets/
│       └── icons/              # MainFields/DocCrea branding
├── tests/
│   ├── tokenizer.test.ts
│   ├── matcher.test.ts
│   └── fixtures/               # voorbeeld-sjablonen
└── README.md
```

### 6.6 Build, test, distributie

- `npm run dev` → Vite dev-server op HTTPS + `office-addin-debugging` voor sideload in Word.
- `npm run test` → unit tests op parser + validator (deze zijn goud waard — zonder Word draaien).
- `npm run build` → productiebundel.

**Distributie voor eindgebruikers** — zo simpel mogelijk:

1. Gebruiker krijgt een **zip** met:
   - `manifest.xml`
   - `Installeren-in-Word.pdf` (korte handleiding, ½ A4: waar sideload-map staat, manifest erin plaatsen, Word herstarten).
   - `Snelstart.pdf` (kort overzicht van de knoppen + snippets).
2. Word herstart → "DocCrea"-tab staat in het lint.

**Hosting — waarom het niet volledig zonder kan.** Een Office Add-in bestaat uit twee delen: (a) het manifest, dat in de zip zit, en (b) de web-assets van het zijpaneel (HTML/JS/CSS). Office vereist dat de web-assets via HTTPS geladen worden — een lokale bundle meeleveren in de zip werkt in moderne Word-versies niet betrouwbaar. De **eindgebruiker hoeft daar echter niks aan te doen**: MainFields zet de bundle één keer online, het manifest verwijst naar die URL, en de zip blijft klein en identiek voor iedereen.

**Gekozen hosting: GitHub Pages.** Source en deploy leven in dezelfde repo onder de MainFields-organisatie op GitHub. Fase 0 zet een GitHub Actions workflow op die bij elke merge naar `main` de Vite-build doet en naar de `gh-pages`-branch publiceert. HTTPS is standaard, custom domain (bv. `doccrea.mainfields.nl`) kan later eenvoudig toegevoegd worden als we dat willen.

Pas later eventueel AppSource-submission overwegen (voor officiële listing); voor intern + klantgebruik is sideload-zip meer dan voldoende.

## 7. Ribbon en paneel — UI-schets

**Lint-tab "DocCrea"**
```
[ Highlight ]  [ Clear ]  [ Snippets ▾ ]  |  [ Instellingen ]
```

**Zijpaneel (taskpane) — top-navigatie**
```
[ Kleuren ] [ Syntax ] [ Validatie ] [ Snippets ] [ Over ]
```

De **Snippets**-dropdown in het lint is handig om veelgebruikte tags in één klik te plaatsen zonder paneel te openen. Instellingen en uitgebreidere snippet-bibliotheek leven in het paneel.

## 8. Fasering voor Claude Code

Stuur deze fasen als aparte taken naar Claude Code, één per branch/PR — zo blijft elke stap overzichtelijk.

**Fase 0 — Scaffolding (½ dag)**
- Nieuwe GitHub-repo onder de MainFields-organisatie: `doccrea-syntax-highlighter`.
- Yeoman office-add-in generator of Vite+Office template.
- `manifest.xml` met ribbon en task pane, icoon als placeholder; manifest wijst naar `https://mainfields.github.io/doccrea-syntax-highlighter/`.
- Dev-server + sideload werkend in Word Windows én Word Online.
- GitHub Actions workflow: lint + test bij elke PR, deploy naar `gh-pages`-branch bij merge op `main`.
- GitHub Pages aanzetten op de `gh-pages`-branch.

**Fase 1 — Parser + validator (1-2 dagen, zonder Word)**
- `tokenizer.ts`, `matcher.ts`, `types.ts`.
- Volledige unit-test-suite met realistische DocxTemplater-voorbeelden.
- Losse Node-CLI om op een `.docx`-extract te draaien (handig voor debugging).

**Fase 2 — Highlight-knop (2-3 dagen)**
- Ribbon command "Highlight".
- `applyHighlights.ts` — zet parserresultaten om naar Word ranges met kleuren.
- Hardcoded default-kleurenschema.
- "Clear highlights"-knop.

**Fase 3 — Validatie-weergave (1-2 dagen)**
- Foutieve tags krijgen eigen kleur + onderlijning.
- Task pane toont fouten-lijst met "Ga heen"-actie.

**Fase 4 — Configuratiepaneel (2-3 dagen)**
- React task pane met Fluent UI.
- Kleuren-tab, Syntax-tab, Validatie-tab.
- Opslag in `roamingSettings` + export/import JSON.

**Fase 5 — Snippets (1-2 dagen)**
- Snippets-tab in paneel.
- Dropdown in het lint.
- Standaardset + custom beheer.

**Fase 6 — Polish + distributie (1-2 dagen)**
- MainFields/DocCrea branding, iconenset.
- README voor collega's, sideload-instructies.
- Hosted bundle op Azure Static Web Apps (of alternatief).

**Totaal:** ca. 9–15 werkdagen voor een solide MVP, afhankelijk van hoe ruw de Word-API zich gedraagt rondom accolade-search (zie §6.3 spike).

## 9. Open vragen om te checken vóór Claude Code begint

**Resolved (2026-04-21):**
- *Kleuren*: MainFields-huisstijl als default-preset + Licht / Donker / Hoog contrast als extra presets. Exacte hex-codes levert Jasper aan tijdens Fase 0/1.
- *Hosting*: **GitHub Pages**. Source en deploy in dezelfde repo, gratis, HTTPS standaard. De manifest.xml verwijst naar de Pages-URL (bv. `https://mainfields.github.io/doccrea-syntax-highlighter/`). Eindgebruiker krijgt zip met manifest + PDF-handleiding; doet sideload; klaar.
- *Tags over meerdere runs*: dat is iets anders dan geneste tags (nesting wordt vanaf MVP ondersteund). "Fix tags across runs" staat op de roadmap voor v1.1.
- *MainFields-verwijzing*: klikbare link naar mainfields.nl in de "Over"-tab van het zijpaneel.

**Nog open (kunnen ook tijdens de bouw beantwoord worden):**
- Willen we ook `.dotx`-sjablonen ondersteunen (template-only bestanden) of alleen `.docx`?
- Versie-telemetrie (bv. anonieme gebruik-statistieken): wel / niet?
- Wie reviewt de MainFields-huisstijl-kleuren voordat ze als default-preset ingebakken worden?
- Custom domain voor de Pages-URL (bv. `doccrea.mainfields.nl`) of laten we het op `*.github.io`?

## 10. Antwoorden op je drie vragen

> **Kunnen we op bepaalde start/eind-syntaxen automatische kleuren toekennen?**
Ja. De tokenizer herkent elk type tag en koppelt er een kleur aan. Voor open/close-paren gebruiken we dezelfde basiskleur met per nesting-diepte een schakering, zodat je begin en einde bij elkaar kunt zoeken.

> **Kunnen we plugins configureren — dus daar de kleuren beheren?**
Ja. Er komt een zijpaneel met een Kleuren-tab waarin je per tag-type kleur, markering en onderlijning instelt. Config reist mee met je Office-account (`roamingSettings`) en is exporteerbaar als JSON voor team-deling.

> **Kunnen we voorbeeld-syntaxen invoegen in een document?**
Ja. Er komt een Snippets-functie: dropdown in het lint + beheer in het zijpaneel. Snippets worden op de cursorpositie geplaatst, met de variabele-naam vooraf geselecteerd zodat je direct kunt doortypen. Een tabelrij-loop snippet is bijna altijd de handigste.
