import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function readDevCerts() {
  try {
    const certDir = join(homedir(), ".office-addin-dev-certs");
    return {
      key: readFileSync(join(certDir, "localhost.key")),
      cert: readFileSync(join(certDir, "localhost.crt")),
    };
  } catch {
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const devCerts = readDevCerts();

  return {
    plugins: [react()],
    base: isProd ? "/doccrea-syntax-highlighter/" : "/",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          taskpane: resolve(__dirname, "src/taskpane/index.html"),
          commands: resolve(__dirname, "src/commands/commands.html"),
        },
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      https: devCerts,
      host: "localhost",
    },
    preview: {
      port: 3000,
      strictPort: true,
      https: devCerts,
    },
  };
});
