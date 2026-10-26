import { describe, expect, it } from "vitest";
import { resolveHashRoute, resolveHashView } from "./routePaths";

describe("landing and application routes", () => {
  it("opens the landing at the root and supports its section links", () => {
    for (const hash of ["", "#", "#home", "#how-it-works", "#experience", "#before-you-start", "#landing-main"]) {
      expect(resolveHashView(hash)).toBe("landing");
    }
  });
  it("uses Camp deep links and routes old Circle hashes to the safe fallback", () => {
    for (const view of ["login", "register", "return", "camps", "memory", "settings"]) {
      expect(resolveHashView(`#${view}`)).toBe(view);
    }
    expect(resolveHashView("#not-a-page")).toBe("return");
    expect(resolveHashRoute("#camp/f9194eb2-3b02-47da-97fe-9ac81a6095ca")).toEqual({ view: "camp", id: "f9194eb2-3b02-47da-97fe-9ac81a6095ca" });
    expect(resolveHashView("#circles")).toBe("return");
    expect(resolveHashView("#circle/f9194eb2-3b02-47da-97fe-9ac81a6095ca")).toBe("return");
  });
});
