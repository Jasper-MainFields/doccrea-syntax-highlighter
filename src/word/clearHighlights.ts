/// <reference types="office-js" />
import { tokenize } from "../core/tokenizer.js";
import type { AppSettings } from "../core/defaults.js";
import type { TagToken } from "../core/types.js";

export interface ClearOutcome {
  cleared: number;
}

/**
 * Reset alle DocxTemplater-tag-ranges naar Word's default-formatting.
 *
 * We herparsen per paragraaf om exact dezelfde ranges te vinden als
 * `applyHighlights` gebruikte. Daarna zetten we color/highlight/bold/underline
 * terug op `null`-achtige waarden zodat Word de stijl van de underlying
 * paragraaf weer gebruikt. We laten andere formatting (bv. door de gebruiker
 * zelf toegepast) intact — Clear raakt alleen de properties aan die wij zetten.
 */
export async function clearHighlights(settings: AppSettings): Promise<ClearOutcome> {
  return Word.run(async (context) => {
    const body = context.document.body;
    const paragraphs = body.paragraphs;
    paragraphs.load("items");
    await context.sync();

    const paragraphItems = paragraphs.items;
    for (const p of paragraphItems) p.load("text");
    await context.sync();

    interface Pending {
      token: TagToken;
      results: Word.RangeCollection;
      occurrenceIndex: number;
    }
    const pending: Pending[] = [];

    for (const paragraph of paragraphItems) {
      const text = paragraph.text ?? "";
      if (text.trim().length === 0) continue;

      const tokens = tokenize(text, {
        delimiters: {
          open: settings.syntax.delimiterOpen,
          close: settings.syntax.delimiterClose,
        },
        allowDiacritics: settings.syntax.allowDiacritics,
      });

      const occurrenceByRaw = new Map<string, number>();
      for (const token of tokens) {
        if (token.kind === "text") continue;
        if (!token.raw) continue;

        const occurrence = occurrenceByRaw.get(token.raw) ?? 0;
        occurrenceByRaw.set(token.raw, occurrence + 1);

        const results = paragraph.search(token.raw, {
          matchCase: true,
          matchWholeWord: false,
          matchPrefix: false,
          matchSuffix: false,
          matchWildcards: false,
        });
        results.load("items");
        pending.push({ token: token as TagToken, results, occurrenceIndex: occurrence });
      }
    }

    await context.sync();

    let cleared = 0;
    for (const entry of pending) {
      const range = entry.results.items[entry.occurrenceIndex];
      if (!range) continue;
      resetFontToAuto(range);
      cleared++;
    }

    await context.sync();
    return { cleared };
  });
}

/**
 * Reset de properties die DocCrea kan zetten terug naar Word-default.
 * `"Automatic"` is Word's eigen term voor "auto/inherit tekstkleur".
 * Voor `highlightColor` verwacht Office.js expliciet `null` (niet `""` of
 * "No Color") om de markering te verwijderen — de TypeScript-types kennen dat
 * niet dus een bewuste cast.
 */
function resetFontToAuto(range: Word.Range): void {
  range.font.color = "Automatic";
  (range.font as unknown as { highlightColor: string | null }).highlightColor = null;
  range.font.bold = false;
  range.font.underline = "None" as Word.UnderlineType;
}
