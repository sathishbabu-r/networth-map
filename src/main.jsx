import React from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { App } from "./App.jsx";
const url = import.meta.env.VITE_CONVEX_URL;
const root = createRoot(document.getElementById("app"));
if (!url) {
  root.render(
    <p role="alert">
      The app connection is missing. Please configure Convex before starting.
    </p>,
  );
} else {
  const client = new ConvexReactClient(url);
  root.render(
    <ConvexAuthProvider client={client}>
      <App />
    </ConvexAuthProvider>,
  );
}
