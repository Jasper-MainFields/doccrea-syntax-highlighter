import type {
  Delimiters,
  InvalidReason,
  TagKind,
  TagToken,
  TextToken,
  Token,
  TokenizeOptions,
} from "./types.js";

const DEFAULT_DELIMITERS: Delimiters = { open: "{", close: "}" };

interface PrefixMap {
  "#": "section-open";
  "/": "section-close";
  "^": "inverted-open";
  "@": "raw";
  ">": "partial";
}

const PREFIX_MAP: PrefixMap = {
  "#": "section-open",
  "/": "section-close",
  "^": "inverted-open",
  "@": "raw",
  ">": "partial",
};

const VALID_PREFIXES = Object.keys(PREFIX_MAP) as (keyof PrefixMap)[];

const NAME_BASIC = /^[A-Za-z_][A-Za-z0-9_.\-[\]]*$/;
const NAME_WITH_DIACRITICS = /^[\p{L}_][\p{L}\p{N}_.\-[\]]*$/u;

export function tokenize(input: string, options: TokenizeOptions = {}): Token[] {
  const delimiters = options.delimiters ?? DEFAULT_DELIMITERS;
  const allowDiacritics = options.allowDiacritics ?? true;
  const angularParser = options.angularParser ?? true;
  const { open, close } = delimiters;

  if (!open || !close) {
    throw new Error("Delimiters moeten niet-lege strings zijn.");
  }

  const tokens: Token[] = [];
  let cursor = 0;
  const len = input.length;

  while (cursor < len) {
    const openIdx = input.indexOf(open, cursor);

    if (openIdx === -1) {
      pushText(tokens, input, cursor, len);
      break;
    }

    if (openIdx > cursor) {
      pushText(tokens, input, cursor, openIdx);
    }

    const contentStart = openIdx + open.length;
    const closeIdx = input.indexOf(close, contentStart);

    if (closeIdx === -1) {
      tokens.push(
        invalidTag(input, openIdx, len, "{?}", {
          reason: "unterminated",
        }),
      );
      cursor = len;
      break;
    }

    const rawContent = input.slice(contentStart, closeIdx);
    const tokenEnd = closeIdx + close.length;
    const raw = input.slice(openIdx, tokenEnd);

    const classified = classify(rawContent, { allowDiacritics, angularParser });
    if (classified.kind === "invalid") {
      tokens.push(
        invalidTag(input, openIdx, tokenEnd, classified.name, {
          reason: classified.reason,
        }),
      );
    } else {
      tokens.push({
        kind: classified.kind,
        name: classified.name,
        raw,
        start: openIdx,
        end: tokenEnd,
        depth: 0,
      });
    }

    cursor = tokenEnd;
  }

  return tokens;
}

function pushText(tokens: Token[], input: string, start: number, end: number): void {
  if (start >= end) return;
  const text: TextToken = {
    kind: "text",
    raw: input.slice(start, end),
    start,
    end,
  };
  tokens.push(text);
}

function invalidTag(
  input: string,
  start: number,
  end: number,
  name: string,
  meta: { reason: InvalidReason },
): TagToken {
  return {
    kind: "invalid",
    name,
    raw: input.slice(start, end),
    start,
    end,
    depth: 0,
    invalidReason: meta.reason,
  };
}

interface ClassifyResultValid {
  kind: Exclude<TagKind, "invalid">;
  name: string;
}

interface ClassifyResultInvalid {
  kind: "invalid";
  name: string;
  reason: InvalidReason;
}

type ClassifyResult = ClassifyResultValid | ClassifyResultInvalid;

interface ClassifyOpts {
  allowDiacritics: boolean;
  angularParser: boolean;
}

/**
 * In angular-parser-modus accepteert DocxTemplater veel bredere content
 * binnen tags: pipes (`{naam|lower}`), argumenten (`{d | date: 'dd-MM'}`),
 * vergelijkingen in secties (`{#status == "Open"}`), typografische quotes,
 * spaties. We laten de name-validatie dan vallen en markeren alleen lege
 * tags of onbekende prefixes als fout.
 */
function classify(content: string, opts: ClassifyOpts): ClassifyResult {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { kind: "invalid", name: "", reason: "empty-tag" };
  }

  const prefix = trimmed[0];

  if (prefix === "/") {
    const name = trimmed.slice(1).trim();
    if (name.length === 0) {
      return { kind: "section-close", name: "" };
    }
    if (!opts.angularParser && !isValidName(name, opts.allowDiacritics)) {
      return { kind: "invalid", name, reason: "invalid-name" };
    }
    return { kind: "section-close", name };
  }

  if (isPrefixChar(prefix)) {
    const name = trimmed.slice(1).trim();
    if (name.length === 0) {
      return { kind: "invalid", name: "", reason: "empty-tag" };
    }
    if (!opts.angularParser && !isValidName(name, opts.allowDiacritics)) {
      return { kind: "invalid", name, reason: "invalid-name" };
    }
    return { kind: PREFIX_MAP[prefix], name };
  }

  // Geen prefix → placeholder.
  if (opts.angularParser) {
    // Accepteer elke niet-lege expression.
    return { kind: "placeholder", name: trimmed };
  }

  if (!allowedLeadingChar(prefix, opts.allowDiacritics)) {
    return { kind: "invalid", name: trimmed, reason: "unknown-prefix" };
  }

  if (!isValidName(trimmed, opts.allowDiacritics)) {
    return { kind: "invalid", name: trimmed, reason: "invalid-name" };
  }

  return { kind: "placeholder", name: trimmed };
}

function isPrefixChar(c: string): c is keyof PrefixMap {
  return (VALID_PREFIXES as string[]).includes(c);
}

function allowedLeadingChar(c: string, allowDiacritics: boolean): boolean {
  if (/[A-Za-z_]/.test(c)) return true;
  if (allowDiacritics && /\p{L}/u.test(c)) return true;
  return false;
}

function isValidName(name: string, allowDiacritics: boolean): boolean {
  const pattern = allowDiacritics ? NAME_WITH_DIACRITICS : NAME_BASIC;
  return pattern.test(name);
}
