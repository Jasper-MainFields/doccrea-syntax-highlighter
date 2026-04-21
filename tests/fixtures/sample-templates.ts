export const LETTER = `Beste {voornaam} {achternaam},

Hierbij ontvangt u {#facturen}
- Factuur {factuurnummer} van {datum} voor {bedrag} euro
{/facturen}

{^facturen}
Er zijn geen openstaande facturen.
{/facturen}

Met vriendelijke groet,
{afzender.naam}
`;

export const NESTED = `{#zaak}
  Naam: {zaak.naam}
  {#zaak.deelprocessen}
    - {naam} ({status})
    {#acties}
      * {beschrijving}
    {/acties}
  {/zaak.deelprocessen}
{/zaak}`;

export const ANONYMOUS_CLOSE = `{#lijst}{item}{/}`;

export const RAW_XML = `{@htmlBlob}`;

export const PARTIAL = `{>header}
{voornaam}
{>footer}`;

export const INVERTED = `{^leeg}er is iets{/leeg}`;

export const CUSTOM_DELIMITERS = `Hallo [[naam]], welkom bij [[bedrijf.naam]].`;

export const DIACRITICS = `{naam.straßenname}`;

export const MIXED_ERRORS = `{#a}{#b}{/a}{/b}`;
