#!/usr/bin/env node
/**
 * Genereert placeholder-icons in MainFields-tinten. Vervang door echte
 * MainFields-iconset vóór de eerste publieke release.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { PNG } from "pngjs";

const OUT_DIR = "src/assets/icons";
mkdirSync(OUT_DIR, { recursive: true });

function gen(size, outPath) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const tealR = 46, tealG = 139, tealB = 139;
      const bgR = 15, bgG = 76, bgB = 129;
      const t = (x + y) / (size * 2);
      const r = Math.round(bgR + (tealR - bgR) * t);
      const g = Math.round(bgG + (tealG - bgG) * t);
      const b = Math.round(bgB + (tealB - bgB) * t);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;

      // Accent-lijn ter suggestie van "highlighter".
      if (Math.abs(x - y) < Math.max(1, size / 24)) {
        png.data[idx] = 255;
        png.data[idx + 1] = 255;
        png.data[idx + 2] = 255;
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
