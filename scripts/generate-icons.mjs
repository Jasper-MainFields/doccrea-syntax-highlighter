#!/usr/bin/env node
/**
 * Genereert placeholder-icons in MainFields-tinten. Vervang door echte
 * MainFields-iconset vóór de eerste publieke release.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { PNG } from "pngjs";

const OUT_DIR = "src/assets/icons";
mkdirSync(OUT_DIR, { recursive: true });

// MainFields huisstijlkleuren (zie logo-SVG).
const TEAL = [0x02, 0x9E, 0x94];
const GRAY = [0x59, 0x59, 0x59];
const MAGENTA = [0xFC, 0x21, 0xD4];

function gen(size, outPath) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      // Gradient van donkergrijs links-boven naar teal rechts-onder.
      const t = (x + y) / (size * 2);
      const r = Math.round(GRAY[0] + (TEAL[0] - GRAY[0]) * t);
      const g = Math.round(GRAY[1] + (TEAL[1] - GRAY[1]) * t);
      const b = Math.round(GRAY[2] + (TEAL[2] - GRAY[2]) * t);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;

      // Magenta-accent diagonaal als "highlighter"-streek, in MainFields-brandkleur.
      if (Math.abs(x - y) < Math.max(1, size / 24)) {
        png.data[idx] = MAGENTA[0];
        png.data[idx + 1] = MAGENTA[1];
        png.data[idx + 2] = MAGENTA[2];
      }
    }
  }
  writeFileSync(outPath, PNG.sync.write(png));
  console.log(`Wrote ${outPath}`);
}

gen(16, `${OUT_DIR}/icon-16.png`);
gen(32, `${OUT_DIR}/icon-32.png`);
gen(64, `${OUT_DIR}/icon-64.png`);
gen(80, `${OUT_DIR}/icon-80.png`);
gen(128, `${OUT_DIR}/icon-128.png`);
