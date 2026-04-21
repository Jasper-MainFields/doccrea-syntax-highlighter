#!/usr/bin/env node
/**
 * Bouwt een distributie-zip voor eindgebruikers:
 *   dist/sideload/doccrea-syntax-highlighter-sideload.zip
 * De zip bevat het manifest én de installatie-PDF's. De web-bundle leeft
 * op GitHub Pages en hoeft niet in de zip.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync, cpSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const OUT_DIR = resolve("dist/sideload");
mkdirSync(OUT_DIR, { recursive: true });

const MANIFEST = resolve("manifest.xml");
if (!existsSync(MANIFEST)) {
  console.error("manifest.xml niet gevonden.");
  process.exit(1);
}

const DOCS = resolve("docs");
const STAGING = resolve("dist/sideload-staging");
mkdirSync(STAGING, { recursive: true });
cpSync(MANIFEST, resolve(STAGING, "manifest.xml"));
if (existsSync(DOCS)) {
  cpSync(DOCS, STAGING, { recursive: true });
}

const readme = `MainFields DocCrea Syntax Highlighter — Installatiehandleiding

1. Sluit Word volledig af.
2. Kopieer 'manifest.xml' naar je lokale Office-sideload-map:
   - Windows: druk Win+R, plak %USERPROFILE%\\AppData\\Roaming\\Microsoft\\Office\\Addins en enter.
     Plaats manifest.xml in die map. (Map niet aanwezig? Maak deze aan.)
   - Mac: Finder -> Ga -> Ga naar map -> /Users/<jij>/Library/Containers/com.microsoft.Word/Data/Documents/wef
   - Word Online: gebruik 'Add-ins beheren -> Mijn add-ins -> Een aangepaste add-in uploaden'.
3. Start Word opnieuw.
4. Open een document. In het lint verschijnt de tab 'DocCrea' met Highlight, Clear, Snippets en Instellingen.

Probleem? Kijk in docs/Snelstart.pdf of neem contact op via https://www.mainfields.nl.
`;
writeFileSync(resolve(STAGING, "LEESMIJ.txt"), readme, "utf8");

const zipPath = resolve(OUT_DIR, "doccrea-syntax-highlighter-sideload.zip");
try {
  // Gebruik 'zip' als het bestaat (macOS/Linux); anders fallback naar Node's zlib.
  execSync(`cd "${STAGING}" && zip -rq "${zipPath}" .`);
  console.log(`Zip geschreven: ${zipPath}`);
} catch (err) {
  console.error("Kon zip niet maken:", err);
  process.exit(1);
}
