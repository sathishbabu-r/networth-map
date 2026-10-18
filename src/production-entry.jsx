import React from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { App } from "./App.jsx";
import { evaluatorAuthStorage } from "./evaluator-storage.mjs";
import { canonicalLocalAppUrl } from "./local-origin.mjs";
export function mount() {
const url = import.meta.env.VITE_CONVEX_URL;
const canonicalUrl = canonicalLocalAppUrl(window.location.href, import.meta.env.DEV);
if (canonicalUrl) {
  window.location.replace(canonicalUrl);
} else if (!url) {
  const root = createRoot(document.getElementById("app"));
  root.render(
    <p role="alert">
      The app connection is missing. Please configure Convex before starting.
    </p>,
  );
} else {
  const root = createRoot(document.getElementById("app"));
  const client = new ConvexReactClient(url);
  root.render(
    <ConvexAuthProvider client={client} {...evaluatorAuthStorage(window.location.pathname,window.sessionStorage,url)}>
      <App />
    </ConvexAuthProvider>,
  );
}

}
