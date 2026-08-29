import { describe, expect, it } from "vitest";
import { weeklyQuota } from "@beneath-the-pine/contracts";

describe("private beta UI limits", () => {
  it("shows the same quota policy as the API", () => {
    expect(weeklyQuota.weekly_review).toBe(1);
    expect(weeklyQuota.brain_dump).toBe(3);
  });
});
