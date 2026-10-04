import test from "node:test";
import assert from "node:assert/strict";
import { canonicalLocalAppUrl } from "../src/local-origin.mjs";

test("localhost uses the configured development origin before sign-in, preserving the return path", () => {
  assert.equal(canonicalLocalAppUrl("http://localhost:5173/?code=fictitious-return", true), "http://127.0.0.1:5173/?code=fictitious-return");
  assert.equal(canonicalLocalAppUrl("http://127.0.0.1:5173/", true), null);
});

test("development origin correction does not redirect production or other apps", () => {
  assert.equal(canonicalLocalAppUrl("http://localhost:5173/", false), null);
  assert.equal(canonicalLocalAppUrl("http://localhost:3000/", true), null);
  assert.equal(canonicalLocalAppUrl("https://example.convex.site/", true), null);
});
