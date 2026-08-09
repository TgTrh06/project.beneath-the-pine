import { describe, expect, it } from "vitest";
import { weeklyQuota } from "@beneath-the-pine/contracts";

describe("weekly beta quota", () => {
  it("keeps the low-cost beta limits explicit", () => {
    expect(weeklyQuota).toEqual({ brain_dump: 3, help_me_start: 5, weekly_review: 1 });
  });
});
