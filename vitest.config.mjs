import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["tests/*.convex.test.ts", "tests/*.ui.test.jsx"] },
});
