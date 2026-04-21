/// <reference types="office-js" />
import { tokenize } from "../core/tokenizer.js";
import type { AppSettings } from "../core/defaults.js";
import type { TagToken } from "../core/types.js";

export interface ClearOutcome {
  cleared: number;
}

/**
 * Reset alle tag-ranges terug naar Word-default-formatting.
 * Per paragraaf een eigen try/catch zodat één probleem-paragraaf de rest
 * niet sloopt. Zelfde one-search-per-unique-raw strategie als applyHighlights.
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

    let cleared = 0;

    for (let pIdx = 0; pIdx < paragraphItems.length; pIdx++) {
      const paragraph = paragraphItems[pIdx];
      const text = paragraph.text ?? "";
      if (text.trim().length === 0) continue;

      try {
        cleared += await clearOneParagraph(context, paragraph, text, settings);
      } catch (err) {
        console.warn(`DocCrea: paragraaf ${pIdx} faalde bij clear:`, err);
        try {
          await context.sync();
        } catch {
          // negeer en ga door
        }
      }
    }

    return { cleared };
  });
}

async function clearOneParagraph(
  context: Word.RequestContext,
  paragraph: Word.Paragraph,
  text: string,
  settings: AppSettings,
): Promise<number> {
  const tokens = tokenize(text, {
    delimiters: {
      open: settings.syntax.delimiterOpen,
      close: settings.syntax.delimiterClose,
    },
    allowDiacritics: settings.syntax.allowDiacritics,
    angularParser: settings.syntax.angularParser,
  });

  const tagTokens = tokens.filter((t): t is TagToken => t.kind !== "text" && !!t.raw);
  if (tagTokens.length === 0) return 0;

  const searches = new Map<string, Word.RangeCollection>();
  for (const token of tagTokens) {
    if (searches.has(token.raw)) continue;
    if (token.raw.length > 250) continue;
    const r = paragraph.search(token.raw, {
      matchCase: true,
      matchWholeWord: false,
      matchPrefix: false,
      matchSuffix: false,
      matchWildcards: false,
    });
    r.load("items");
    searches.set(token.raw, r);
  }

  await context.sync();

  const occurrenceByRaw = new Map<string, number>();
  let cleared = 0;

  for (const token of tagTokens) {
    const occurrence = occurrenceByRaw.get(token.raw) ?? 0;
    occurrenceByRaw.set(token.raw, occurrence + 1);

    const results = searches.get(token.raw);
    const range = results?.items?.[occurrence];
    if (!range) continue;

    resetFontToAuto(range);
    cleared++;
  }

  await context.sync();
  return cleared;
}

/**
 * Reset tekstkleur + markering. `"#000000"` (zwart) als tekstkleur — Word Mac
 * weigert `"Automatic"` / `""`. Voor markering gebruikt Office.js expliciet
 * `null` om de highlight weg te halen (niet beschikbaar in TS-types).
 */
function resetFontToAuto(range: Word.Range): void {
  range.font.color = "#000000";
  (range.font as unknown as { highlightColor: string | null }).highlightColor = null;
  range.font.bold = false;
  range.font.underline = "None" as Word.UnderlineType;
}
