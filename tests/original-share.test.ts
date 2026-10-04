import { describe, expect, it } from "vitest";
import { buildMapShareText } from "../src/original-map/networth-share";

describe("buildMapShareText", () => {
  it("describes one assessed action and one review area", () => {
    expect(buildMapShareText(1, 1)).toBe(
      "I mapped my wealth, Vision and next moves with Networth MAP. I now have 1 action assessed and 1 additional area to review. Build yours in about 20 minutes.",
    );
  });

  it("uses plural labels for multiple results", () => {
    expect(buildMapShareText(3, 2)).toContain(
      "3 actions assessed and 2 additional areas to review",
    );
  });

  it("does not include financial amounts or free-text assessment answers", () => {
    const result = buildMapShareText(2, 0);

    expect(result).not.toMatch(/[₹$€£]/u);
    expect(result).not.toMatch(/net worth|income|asset|liabilit/iu);
  });
});
