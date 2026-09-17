import { describe, expect, it } from "vitest";
import { resolveHashRoute, resolveHashView } from "./routePaths";

describe("landing and application routes", () => {
  it("opens the landing at the root and supports its section links", () => {
    for (const hash of ["", "#", "#home", "#how-it-works", "#experience", "#before-you-start", "#landing-main"]) {
      expect(resolveHashView(hash)).toBe("landing");
    }
  });
  it("preserves existing app deep links and the unknown-route fallback", () => {
    for (const view of ["login", "register", "return", "circles", "memory", "settings"]) {
      expect(resolveHashView(`#${view}`)).toBe(view);
    }
    expect(resolveHashView("#not-a-page")).toBe("return");
    expect(resolveHashRoute("#circle/f9194eb2-3b02-47da-97fe-9ac81a6095ca")).toEqual({ view: "circle", id: "f9194eb2-3b02-47da-97fe-9ac81a6095ca" });
  });
});
