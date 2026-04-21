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
// bevat queuen we een 'safe' fallback-search waarin trailing non-alphanumeric
// tekens eraf zijn.
const PROBLEMATIC = /[?*@<>!()[\]\\^=;]/;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const MAX_SEARCH_LENGTH = 250;
// Scheidingsteken tussen paragrafen in de gejoinde documenttekst. `\n` komt
// niet voor in `paragraph.text` (Word scheidt paragrafen zelf), dus we kunnen
// er veilig op splitten bij het terugmappen van token-offsets.
const PARAGRAPH_SEP = "\n";

interface ParagraphMeta {
  startOffset: number;
  length: number;
}

/**
 * Highlight alle DocxTemplater-tags in het document.
 *
 * Belangrijk: we parsen het HELE document als één string (paragrafen gejoined
 * met `\n`), zodat secties die over meerdere paragrafen lopen — bv. `{#zaak}`
 * op pagina 1 en `{/zaak}` op pagina 8 — correct gematcht worden. Daarna
 * mappen we elke token terug naar zijn paragraaf voor de Word-level search.
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

    const texts = paragraphItems.map((p) => p.text ?? "");
    const metas = buildMetas(texts);
    const joined = texts.join(PARAGRAPH_SEP);

    const parsed = parse(joined, {
      delimiters: {
        open: settings.syntax.delimiterOpen,
        close: settings.syntax.delimiterClose,
      },
      allowDiacritics: settings.syntax.allowDiacritics,
      angularParser: settings.syntax.angularParser,
    });

    // Groepeer tokens en issues per paragraaf.
    const tokensByParagraph: TagToken[][] = metas.map(() => []);
    for (const token of parsed.tokens) {
      if (token.kind === "text") continue;
      const pIdx = findParagraph(metas, token.start);
      if (pIdx < 0) continue;
      tokensByParagraph[pIdx].push({
        ...token,
        start: token.start - metas[pIdx].startOffset,
        end: token.end - metas[pIdx].startOffset,
      });
    }

    const issueLocations: IssueLocation[] = parsed.issues.map((issue) => {
      const pIdx = findParagraph(metas, issue.range.start);
      return {
        issue,
        paragraphIndex: Math.max(0, pIdx),
        offsetInParagraph:
          issue.range.start - (pIdx >= 0 ? metas[pIdx].startOffset : 0),
      };
    });

    const errors: HighlightError[] = [];
    let tokensHighlighted = 0;

    for (let pIdx = 0; pIdx < paragraphItems.length; pIdx++) {
      const paragraph = paragraphItems[pIdx];
      const paragraphTokens = tokensByParagraph[pIdx];
      const toHighlight = paragraphTokens.filter(
        (t) => shouldHighlight(t, preset, settings) && t.raw,
      );
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
        try {
          await context.sync();
        } catch {
          /* negeer en volgende proberen */
        }
      }
    }

    return {
      tokensHighlighted,
      issues: parsed.issues,
      issueLocations,
      errors,
    };
  });
}

function buildMetas(texts: string[]): ParagraphMeta[] {
  const metas: ParagraphMeta[] = [];
  let cursor = 0;
  for (const text of texts) {
    metas.push({ startOffset: cursor, length: text.length });
    cursor += text.length + PARAGRAPH_SEP.length;
  }
  return metas;
}

function findParagraph(metas: ParagraphMeta[], globalOffset: number): number {
  for (let i = metas.length - 1; i >= 0; i--) {
    if (metas[i].startOffset <= globalOffset) {
      // Voorkom toewijzing aan separator-positie aan het einde van een paragraaf.
      if (globalOffset <= metas[i].startOffset + metas[i].length) return i;
      if (i === metas.length - 1) return i;
    }
  }
  return -1;
}

async function highlightOneParagraph(
  context: Word.RequestContext,
  paragraph: Word.Paragraph,
  tokens: TagToken[],
  preset: ColorPreset,
  settings: AppSettings,
): Promise<number> {
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
