# MainFields DocCrea Syntax Highlighter — Snelstart

## De vier knoppen in het lint

| Knop | Wat doet het? |
|---|---|
| **Highlight** | Scant het hele document en kleurt alle DocxTemplater-tags. Fouten krijgen rood + wavy onderlijning. |
| **Clear** | Zet de kleuring terug (tekst zelf blijft gewoon staan). |
| **Snippets** | Dropdown met kant-en-klare tags om in één klik in te voegen. |
| **Instellingen** | Opent het zijpaneel. |

## Snippets

Klik op **Snippets** in het lint en kies één van:

- **Placeholder** — `{veldnaam}`
- **Loop** — `{#items}…{/items}`
- **Conditie** — `{#als}…{/als}`
- **Inverted** — `{^als}…{/als}`
- **Raw XML** — `{@html}` (waarschuwend oranje gekleurd)
- **Tabelrij-loop** — kant-en-klare rij om te loopen over data

De placeholder-naam staat meteen geselecteerd — begin te typen en hij wordt
vervangen.

## Tabs in het zijpaneel

- **Scan** — druk hier op Highlight, bekijk fouten en spring direct naar de locatie.
- **Kleuren** — kies een preset (MainFields / Licht / Donker / Hoog contrast) of maak een eigen.
- **Syntax** — pas de delimiters aan als je DocxTemplater niet standaard gebruikt.
- **Snippets** — beheer ingebouwde én eigen snippets.
- **Over** — versie-info en contact.

## Tips

- Nested loops krijgen automatisch lichtere schakeringen per diepte, zodat je
  aan de kleur kunt zien welke `{/}` bij welke `{#}` hoort.
- Exporteer je kleuren via de **Exporteer JSON**-knop en deel die met je team.
- Een "wavy" onderlijning is altijd een fout — los hem op vóór je rendert.
