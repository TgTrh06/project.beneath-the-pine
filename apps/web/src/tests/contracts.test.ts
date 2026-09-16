import { describe, expect, it } from "vitest";
import { durationMinutesSchema, productEventNames } from "@beneath-the-pine/contracts";

describe("core contracts", () => {
  it("keeps duration choices and private core events explicit", () => {
    expect(durationMinutesSchema.safeParse(25).success).toBe(true);
    expect(durationMinutesSchema.safeParse(30).success).toBe(false);
    expect(productEventNames).toContain("pact_created");
  });
});
