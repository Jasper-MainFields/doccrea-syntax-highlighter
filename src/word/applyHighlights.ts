/// <reference types="office-js" />
import { parse } from "../core/matcher.js";
import type { TagToken, Token, ValidationIssue } from "../core/types.js";
import type { AppSettings, ColorPreset } from "../core/defaults.js";
import { resolveStyle, UNDERLINE_MAP, type ResolvedStyle } from "./highlightStyles.js";

export interface HighlightOutcome {
  tokensHighlighted: number;
  issues: ValidationIssue[];
  issueLocations: IssueLocation[];
  errors: HighlightError[];
}

export interface IssueLocation {
  issue: ValidationIssue;
  paragraphIndex: number;
  offsetInParagraph: number;
}

export interface HighlightError {
  paragraphIndex: number;
  message: string;
}

// Word search gedraagt zich soms onverwacht op parens, vraagtekens, asterisken
// — zelfs met matchWildcards:false. Voor tokens waarvan de `raw` die tekens
// bevat, queuen we een 'safe' fallback-search waarin trailing/leading
// non-alphanumeric tekens eraf zijn.
const PROBLEMATIC = /[?*@<>!()[\]\\^=;]/;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
// Word's search limiteert op ~255 chars; langere queries faken we via de safe
// variant. In praktijk komen we daar nooit bij DocxTemplater-tags.
const MAX_SEARCH_LENGTH = 250;

/**
 * Highlight alle DocxTemplater-tags in het document.
 *
 * Werkwijze: per paragraaf één sub-run met eigen try/catch. Één corrupte
 * paragraaf breekt dus niet het hele document. Per paragraaf doen we
 * precies één search per UNIEKE raw — meerdere tokens met dezelfde tekst
 * (bv. meerdere `{#zaak}`) hergebruiken die collection.
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
    const errors: HighlightError[] = [];
    let tokensHighlighted = 0;

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
        angularParser: settings.syntax.angularParser,
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
      const toHighlight = tagTokens.filter((t) => shouldHighlight(t, preset, settings) && t.raw);
      if (toHighlight.length === 0) continue;

      try {
        tokensHighlighted += await highlightOneParagraph(
          context,
          paragraph,
          toHighlight,
          preset,
          settings,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`DocCrea: paragraaf ${pIdx} faalde bij highlight:`, message);
        errors.push({ paragraphIndex: pIdx, message });
        // Probeer context weer werkbaar te maken: nieuwe sync na fout.
        try {
          await context.sync();
        } catch {
          // negeer; volgende paragraaf krijgt zijn eigen kans
        }
      }
    }

    return { tokensHighlighted, issues: allIssues, issueLocations, errors };
  });
}

async function highlightOneParagraph(
  context: Word.RequestContext,
  paragraph: Word.Paragraph,
  tokens: TagToken[],
  preset: ColorPreset,
  settings: AppSettings,
): Promise<number> {
  // Eén search per unieke raw. Dezelfde tag kan vaker voorkomen — we tellen
  // occurrences per raw en pakken de Nde match uit de collection.
  interface SearchEntry {
    primary: Word.RangeCollection;
    fallback: Word.RangeCollection | null;
  }
  const searches = new Map<string, SearchEntry>();

  for (const token of tokens) {
    if (searches.has(token.raw)) continue;
    if (token.raw.length > MAX_SEARCH_LENGTH) continue;

    const primary = paragraph.search(token.raw, SEARCH_OPTIONS);
    primary.load("items");

    let fallback: Word.RangeCollection | null = null;
    const safeRaw = makeSafeRaw(token.raw, settings.syntax.delimiterOpen, settings.syntax.delimiterClose);
    if (safeRaw && safeRaw !== token.raw && PROBLEMATIC.test(token.raw)) {
      fallback = paragraph.search(safeRaw, SEARCH_OPTIONS);
      fallback.load("items");
    }

    searches.set(token.raw, { primary, fallback });
  }

  await context.sync();

  // Tweede pas: formatting toepassen. Validatie van kleurwaarden om
  // InvalidArgument-sync-fouten te voorkomen.
  const occurrenceByRaw = new Map<string, number>();
  let applied = 0;

  for (const token of tokens) {
    const occurrence = occurrenceByRaw.get(token.raw) ?? 0;
    occurrenceByRaw.set(token.raw, occurrence + 1);

    const entry = searches.get(token.raw);
    if (!entry) continue;

    const range =
      entry.primary.items?.[occurrence] ??
      entry.fallback?.items?.[occurrence] ??
      null;

    if (!range) {
      console.warn(`DocCrea: geen match in Word voor '${token.raw}' (occurrence ${occurrence})`);
      continue;
    }

    const resolved = resolveStyle(token, preset.styles);
    if (!resolved) continue;

    applyResolved(range, resolved);
    applied++;
  }

  await context.sync();
  return applied;
}

function applyResolved(range: Word.Range, resolved: ResolvedStyle): void {
  if (HEX_COLOR.test(resolved.color)) {
    range.font.color = resolved.color;
  }
  if (resolved.highlight && HEX_COLOR.test(resolved.highlight)) {
    range.font.highlightColor = resolved.highlight;
  } else {
    (range.font as unknown as { highlightColor: string | null }).highlightColor = null;
  }
  range.font.bold = resolved.bold;
  range.font.underline = UNDERLINE_MAP[resolved.underline];
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
 * Strip trailing tekens die Word als wildcards kan interpreteren.
 */
export function makeSafeRaw(raw: string, open: string, close: string): string | null {
  if (!raw.startsWith(open)) return null;
  let end = raw.length;
  while (end > open.length) {
    const ch = raw[end - 1];
    if (ch === close || /[A-Za-z0-9_.-]/.test(ch)) break;
    end--;
  }
  if (end <= open.length) return null;
  return raw.slice(0, end);
}
