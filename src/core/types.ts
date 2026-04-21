export type TagKind =
  | "placeholder"
  | "section-open"
  | "section-close"
  | "inverted-open"
  | "raw"
  | "partial"
  | "invalid";

export type TokenKind = TagKind | "text";

export interface SourceRange {
  start: number;
  end: number;
}

interface TokenBase extends SourceRange {
  raw: string;
}

export interface TextToken extends TokenBase {
  kind: "text";
}

export interface TagToken extends TokenBase {
  kind: Exclude<TokenKind, "text">;
  name: string;
  depth: number;
  pairId?: string;
  invalidReason?: InvalidReason;
}

export type Token = TextToken | TagToken;

export type InvalidReason =
  | "empty-tag"
  | "unknown-prefix"
  | "invalid-name"
  | "unterminated"
  | "stray-close"
  | "mismatched-close"
  | "unclosed-open";

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: IssueSeverity;
  reason: InvalidReason;
  message: string;
  range: SourceRange;
  raw: string;
}

export interface Delimiters {
  open: string;
  close: string;
}

export interface TokenizeOptions {
  delimiters?: Delimiters;
  allowDiacritics?: boolean;
}

export interface ParseResult {
  tokens: Token[];
  issues: ValidationIssue[];
}
