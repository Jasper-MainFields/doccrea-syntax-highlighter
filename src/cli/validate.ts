#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parse } from "../core/matcher.js";
import type { Token } from "../core/types.js";

function readInput(): string {
  const arg = process.argv[2];
  if (arg) return readFileSync(arg, "utf8");
  if (process.stdin.isTTY) {
    console.error("Geef een bestandsnaam mee of pipe tekst via stdin.");
    console.error("Voorbeeld: npm run cli -- voorbeeld.txt");
    process.exit(2);
  }
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (buf += chunk));
  return new Promise<string>((res) => process.stdin.on("end", () => res(buf))) as unknown as string;
}

async function main(): Promise<void> {
  const input = await Promise.resolve(readInput());
  const result = parse(input);

  console.log(`Tokens: ${result.tokens.length}, Issues: ${result.issues.length}\n`);

  for (const t of result.tokens) printToken(t);

  if (result.issues.length > 0) {
    console.log("\n--- Issues ---");
    for (const i of result.issues) {
      console.log(`  [${i.severity}] ${i.reason} @ ${i.range.start}-${i.range.end}: ${i.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\nGeen issues gevonden ✓");
  }
}

function printToken(t: Token): void {
  if (t.kind === "text") {
    const preview = t.raw.length > 40 ? `${t.raw.slice(0, 40)}…` : t.raw;
    console.log(`  text   @ ${t.start}-${t.end} "${preview.replace(/\n/g, "\\n")}"`);
    return;
  }
  const depth = t.depth ? ` depth=${t.depth}` : "";
  const pair = t.pairId ? ` pair=${t.pairId}` : "";
  const reason = t.invalidReason ? ` reason=${t.invalidReason}` : "";
  console.log(`  ${t.kind.padEnd(14)} @ ${t.start}-${t.end} name="${t.name}"${depth}${pair}${reason}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
