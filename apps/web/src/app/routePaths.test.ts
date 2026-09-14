import { describe, expect, it } from "vitest";
import { resolveHashView } from "./routePaths";

describe("landing and application routes", () => {
  it("opens the landing at the root and supports its section links", () => {
    for (const hash of ["", "#", "#home", "#how-it-works", "#experience", "#before-you-start", "#landing-main"]) {
      expect(resolveHashView(hash)).toBe("landing");
    }
  });
  it("preserves existing app deep links and the unknown-route fallback", () => {
    for (const view of ["now", "capture", "habits", "review", "study", "settings", "admin"]) {
      expect(resolveHashView(`#${view}`)).toBe(view);
    }
    expect(resolveHashView("#not-a-page")).toBe("now");
  });
});
