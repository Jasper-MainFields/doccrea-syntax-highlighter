/// <reference types="office-js" />
import { parse } from "../core/matcher.js";
import type { TagToken, Token, ValidationIssue } from "../core/types.js";
import type { AppSettings, ColorPreset } from "../core/defaults.js";
import { resolveStyle, UNDERLINE_MAP } from "./highlightStyles.js";

export interface HighlightOutcome {
  tokensHighlighted: number;
  issues: ValidationIssue[];
  issueLocations: IssueLocation[];
}

export interface IssueLocation {
  issue: ValidationIssue;
  paragraphIndex: number;
  offsetInParagraph: number;
}

interface PendingApplication {
  token: TagToken;
  occurrenceIndex: number;
  primary: Word.RangeCollection;
  fallback: Word.RangeCollection | null;
}

// Word search gedraagt zich soms onverwacht op parens, vraagtekens, asterisken
// — zelfs met matchWildcards:false. Voor tokens waarvan de `raw` die tekens
// bevat, queuen we een 'safe' fallback-search waarin trailing/leading
// non-alphanumeric tekens eraf zijn. Dan kleurt in elk geval het herkenbare
// deel van de tag, zodat de gebruiker hem in het document ziet.
const PROBLEMATIC = /[?*@<>!()[\]\\^=;]/;

/**
 * Highlight alle DocxTemplater-tags in het actieve document.
 *
 * Werkwijze (zie PLAN.md §6.3):
 *  1. Lees alle paragrafen en hun tekst.
 *  2. Parse per paragraaf met onze eigen tokenizer.
 *  3. Queue per tag een `paragraph.search(raw)` + optionele fallback.
 *  4. Sync.
 *  5. Kies de beste gevonden range en pas styling toe.
 *  6. Laatste sync om te committen.
 */
export async function applyHighlights(
  settings: AppSettings,
  preset: ColorPreset,
): Promise<HighlightOutcome> {
  return Word.run(async (context) => {
    const body = context.document.body;
    const paragraphs = body.paragraphs;
    paragraphs.load("items");
    await context.sync();

    const paragraphItems = paragraphs.items;
    for (const p of paragraphItems) p.load("text");
    await context.sync();

    const allIssues: ValidationIssue[] = [];
    const issueLocations: IssueLocation[] = [];
    const pending: PendingApplication[] = [];

    for (let pIdx = 0; pIdx < paragraphItems.length; pIdx++) {
      const paragraph = paragraphItems[pIdx];
      const text = paragraph.text ?? "";
      if (text.trim().length === 0) continue;

      const parsed = parse(text, {
        delimiters: {
          open: settings.syntax.delimiterOpen,
          close: settings.syntax.delimiterClose,
        },
        allowDiacritics: settings.syntax.allowDiacritics,
      });

      for (const issue of parsed.issues) {
        allIssues.push(issue);
        issueLocations.push({
          issue,
          paragraphIndex: pIdx,
          offsetInParagraph: issue.range.start,
        });
      }

      const tagTokens = parsed.tokens.filter((t): t is TagToken => t.kind !== "text");
      const occurrenceByRaw = new Map<string, number>();

      for (const token of tagTokens) {
        if (!shouldHighlight(token, preset, settings)) continue;
        if (!token.raw) continue;

        const occurrence = occurrenceByRaw.get(token.raw) ?? 0;
        occurrenceByRaw.set(token.raw, occurrence + 1);

        const primary = paragraph.search(token.raw, SEARCH_OPTIONS);
        primary.load("items");

        let fallback: Word.RangeCollection | null = null;
        const safeRaw = makeSafeRaw(token.raw, settings.syntax.delimiterOpen, settings.syntax.delimiterClose);
        if (safeRaw && safeRaw !== token.raw && PROBLEMATIC.test(token.raw)) {
          fallback = paragraph.search(safeRaw, SEARCH_OPTIONS);
          fallback.load("items");
        }

        pending.push({ token, occurrenceIndex: occurrence, primary, fallback });
      }
    }

    await context.sync();

    let tokensHighlighted = 0;

    for (const entry of pending) {
      const primaryHits = entry.primary.items;
      const range = primaryHits[entry.occurrenceIndex]
        ?? entry.fallback?.items?.[entry.occurrenceIndex]
        ?? null;

      if (!range) {
        console.warn(
          "DocCrea: kon tag niet vinden in Word-document:",
          entry.token.raw,
        );
        continue;
      }

      const resolved = resolveStyle(entry.token, preset.styles);
      if (!resolved) continue;

      range.font.color = resolved.color;
      if (resolved.highlight) {
        range.font.highlightColor = resolved.highlight;
      } else {
        // Office.js verwacht null (niet "" of "No Color") om een highlight te
        // verwijderen. De TypeScript-types kennen dat alleen als string —
        // daarom een bewuste cast. Zonder dit krijgt Highlight een
        // InvalidArgument op tokens zonder gewenste markering.
        setHighlightNull(range);
      }
      range.font.bold = resolved.bold;
      range.font.underline = UNDERLINE_MAP[resolved.underline];

      tokensHighlighted++;
    }

    await context.sync();

    return { tokensHighlighted, issues: allIssues, issueLocations };
  });
}

function setHighlightNull(range: Word.Range): void {
  (range.font as unknown as { highlightColor: string | null }).highlightColor = null;
}

const SEARCH_OPTIONS: Word.SearchOptions | { [k: string]: boolean } = {
  matchCase: true,
  matchWholeWord: false,
  matchPrefix: false,
  matchSuffix: false,
  matchWildcards: false,
};

function shouldHighlight(
  token: Token,
  preset: ColorPreset,
  settings: AppSettings,
): token is TagToken {
  if (token.kind === "text") return false;
  const resolved = resolveStyle(token, preset.styles);
  if (!resolved) return false;
  if (
    token.kind === "invalid" &&
    !settings.validation.checkSyntax &&
    !settings.validation.checkBalance
  ) {
    return false;
  }
  return true;
}

/**
 * Levert een kortere, 'veilige' variant van de tag-string voor Word search.
 * Strip trailing non-woord tekens die Word als wildcards kan interpreteren
 * (bv. `)` in `{/Foutt)`). Zolang het open-delimiter nog aan het begin staat
 * kleurt de gebruiker dan in elk geval het herkenbare deel van de tag.
 */
export function makeSafeRaw(raw: string, open: string, close: string): string | null {
  if (!raw.startsWith(open)) return null;
  // Drop trailing tekens die geen veilige tag-naam-chars of de close-delimiter
  // zijn. `[`/`]` mogen in valide namen voorkomen ({items[0]}) maar als ze
  // TRAILING zijn (na een misvormde tag) moeten ze er juist af.
  let end = raw.length;
  while (end > open.length) {
    const ch = raw[end - 1];
    if (ch === close || /[A-Za-z0-9_.-]/.test(ch)) break;
    end--;
  }
  if (end <= open.length) return null;
  const stripped = raw.slice(0, end);
  return stripped;
}
