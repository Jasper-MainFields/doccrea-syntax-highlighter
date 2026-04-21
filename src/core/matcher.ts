import type {
  InvalidReason,
  ParseResult,
  TagToken,
  Token,
  ValidationIssue,
} from "./types.js";
import { tokenize } from "./tokenizer.js";
import type { TokenizeOptions } from "./types.js";

interface OpenFrame {
  token: TagToken;
  pairId: string;
}

export function parse(input: string, options: TokenizeOptions = {}): ParseResult {
  const tokens = tokenize(input, options);
  const issues: ValidationIssue[] = [];
  const stack: OpenFrame[] = [];
  let pairCounter = 0;

  for (const token of tokens) {
    if (token.kind === "text") continue;

    if (token.kind === "invalid") {
      issues.push(issueFromInvalid(token));
      continue;
    }

    if (token.kind === "section-open" || token.kind === "inverted-open") {
      const pairId = `pair-${pairCounter++}`;
      token.depth = stack.length;
      token.pairId = pairId;
      stack.push({ token, pairId });
      continue;
    }

    if (token.kind === "section-close") {
      const frame = stack.pop();
      if (!frame) {
        token.kind = "invalid";
        token.invalidReason = "stray-close";
        issues.push(
          buildIssue(token, "stray-close", `Sluitingstag '${token.raw}' heeft geen bijbehorende open-tag.`),
        );
        continue;
      }

      // Anonieme close '{/}' matcht altijd de laatst-geopende.
      if (token.name.length > 0 && token.name !== frame.token.name) {
        issues.push(
          buildIssue(
            token,
            "mismatched-close",
            `Sluitingstag '{/${token.name}}' sluit niet de laatst-geopende '{#${frame.token.name}}'.`,
          ),
        );
        // Markeer beide als fout zodat ze in de UI rood worden.
        token.kind = "invalid";
        token.invalidReason = "mismatched-close";
        frame.token.kind = "invalid";
        frame.token.invalidReason = "unclosed-open";
        continue;
      }

      token.depth = frame.token.depth;
      token.pairId = frame.pairId;
      continue;
    }

    // placeholder / raw / partial — geen stack-effect.
    token.depth = stack.length;
  }

  // Wat overblijft op de stack heeft geen close gekregen.
  for (const frame of stack) {
    frame.token.kind = "invalid";
    frame.token.invalidReason = "unclosed-open";
    issues.push(
      buildIssue(
        frame.token,
        "unclosed-open",
        `Sectie '${frame.token.raw}' wordt nergens afgesloten.`,
      ),
    );
  }

  return { tokens, issues };
}

function issueFromInvalid(token: TagToken): ValidationIssue {
  const reason = token.invalidReason ?? "invalid-name";
  return buildIssue(token, reason, messageFor(reason, token));
}

function buildIssue(token: Token, reason: InvalidReason, message: string): ValidationIssue {
  return {
    severity: "error",
    reason,
    message,
    range: { start: token.start, end: token.end },
    raw: token.raw,
  };
}

function messageFor(reason: InvalidReason, token: TagToken): string {
  switch (reason) {
    case "empty-tag":
      return `Lege tag '${token.raw}'.`;
    case "unknown-prefix":
      return `Onbekend tag-type '${token.raw}'.`;
    case "invalid-name":
      return `Ongeldige naam in '${token.raw}'.`;
    case "unterminated":
      return `Tag begon met '{' maar werd niet afgesloten.`;
    case "stray-close":
      return `Losse sluitingstag '${token.raw}' zonder open.`;
    case "mismatched-close":
      return `Sluitingstag past niet bij de laatst-geopende sectie.`;
    case "unclosed-open":
      return `Open sectie '${token.raw}' wordt niet afgesloten.`;
    default:
      return `Ongeldige tag '${token.raw}'.`;
  }
}
