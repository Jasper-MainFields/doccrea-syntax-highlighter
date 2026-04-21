/// <reference types="office-js" />
import { parse } from "../core/matcher.js";
import type { TagToken, Token, ValidationIssue } from "../core/types.js";
import type { AppSettings, ColorPreset } from "../core/defaults.js";
import { resolveStyle, UNDERLINE_MAP } from "./highlightStyles.js";
import { MARKER } from "./marker.js";

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
  paragraphIndex: number;
  token: TagToken;
  occurrenceIndex: number;
  results: Word.RangeCollection;
}

/**
 * Highlight alle DocxTemplater-tags in het actieve document.
 *
 * Werkwijze (zie PLAN.md §6.3 voor context):
 *  1. Pak alle paragrafen, lees hun tekst.
 *  2. Parse per paragraaf; bepaal welke tokens gekleurd moeten worden.
 *  3. Queue per tag een `paragraph.search(token.raw)` in één grote batch.
 *  4. Sync → de zoekresultaten zijn binnen.
 *  5. Pas per token de Nde match aan (op basis van occurrence-index).
 *  6. Eén laatste sync om de formatting te committen.
 *
 * We vermijden de Word-search voor de curly-brace-delimiters zelf door
 * `matchWildcards: false` te zetten. Als blijkt dat een toekomstige Word-versie
 * alsnog speciale betekenis geeft aan `{` of `}`, kunnen we hier uitwijken
 * naar een range-getRange-implementatie (spike-resultaat vastleggen in de code).
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
      const seenOffsets = new Map<string, number>();

      for (const token of tagTokens) {
        if (!shouldHighlight(token, preset, settings)) continue;
        if (!token.raw) continue;

        const prev = seenOffsets.get(token.raw);
        const occurrence = prev === undefined ? 0 : occurrenceByRaw.get(token.raw) ?? 0;
        const nextOccurrence = prev === undefined ? 0 : prev + 1;
        occurrenceByRaw.set(token.raw, nextOccurrence + 1);
        seenOffsets.set(token.raw, nextOccurrence);

        const results = paragraph.search(token.raw, {
          matchCase: true,
          matchWholeWord: false,
          matchPrefix: false,
          matchSuffix: false,
          matchWildcards: false,
        });
        results.load("items");

        pending.push({
          paragraphIndex: pIdx,
          token,
          occurrenceIndex: occurrence,
          results,
        });
      }
    }

    await context.sync();

    let tokensHighlighted = 0;

    for (const entry of pending) {
      const list = entry.results.items;
      const range = list[entry.occurrenceIndex];
      if (!range) continue;

      const resolved = resolveStyle(entry.token, preset.styles);
      if (!resolved) continue;

      range.font.color = resolved.color;
      if (resolved.highlight) {
        range.font.highlightColor = resolved.highlight;
      }
      range.font.bold = resolved.bold;
      range.font.underline = UNDERLINE_MAP[resolved.underline];

      // Markeer de range met een custom property zodat Clear weet dat wij deze
      // kleur hebben gezet (zie clearHighlights.ts + marker.ts).
      tagRange(range);

      tokensHighlighted++;
    }

    await context.sync();

    return { tokensHighlighted, issues: allIssues, issueLocations };
  });
}

function shouldHighlight(
  token: Token,
  preset: ColorPreset,
  settings: AppSettings,
): token is TagToken {
  if (token.kind === "text") return false;
  const resolved = resolveStyle(token, preset.styles);
  if (!resolved) return false;
  // Als validatie uitstaat, sla invalid-tokens over.
  if (token.kind === "invalid" && !settings.validation.checkSyntax && !settings.validation.checkBalance) {
    return false;
  }
  return true;
}

function tagRange(range: Word.Range): void {
  // Word's customXmlParts of ContentControl zijn te zwaar voor per-tag; we
  // gebruiken een truc: de font.color is op zichzelf al het signaal dat
  // Clear gebruikt. Zie clearHighlights.ts voor de precieze matching. De MARKER
  // is daar een fallback-vergelijking.
  void range;
  void MARKER;
}
