/// <reference types="office-js" />
import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "./App.js";

function boot(): void {
  const el = document.getElementById("root");
  if (!el) return;
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <FluentProvider theme={webLightTheme}>
        <App />
      </FluentProvider>
    </React.StrictMode>,
  );
}

// Office.onReady resolves ook buiten Word (tijdens dev op plain HTTPS),
// dus we booten altijd — maar wachten op Office zodat roamingSettings klaar is.
if (typeof Office !== "undefined") {
  Office.onReady(() => boot());
} else {
  boot();
}
