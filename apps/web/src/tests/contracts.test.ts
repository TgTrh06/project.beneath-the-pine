import { describe, expect, it } from "vitest";
import { credentialsSchema, idSchema, dateTimeSchema, utcDateTimeSchema, durationMinutesSchema, productEventNames } from "@pyneath/contracts";

describe("core contracts", () => {
  it("keeps duration choices and private core events explicit", () => {
    expect(durationMinutesSchema.safeParse(25).success).toBe(true);
    expect(durationMinutesSchema.safeParse(30).success).toBe(false);
    expect(productEventNames).toContain("pact_created");
  });
});

describe("Zod 4 wire compatibility", () => {
  it("preserves UUID formats accepted before the upgrade", () => {
    for (const id of ["12345678-1234-1234-1234-123456789abc", "00000000-0000-0000-0000-000000000000", "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"]) expect(idSchema.safeParse(id).success).toBe(true);
    for (const id of ["not-an-id", "12345678-1234-1234-1234-123456789abg", "12345678123412341234123456789abc"]) expect(idSchema.safeParse(id).success).toBe(false);
  });
  it("preserves datetime precision and offset syntax while validating dates", () => {
    for (const time of ["2026-11-02T10:20Z", "2026-11-02T10:20:30+0700", "2024-02-29T23:59:59.123456-07:00"]) expect(dateTimeSchema.safeParse(time).success).toBe(true);
    for (const time of ["2026-02-29T10:20Z", "2026-11-31T10:20Z", "2026-11-02T24:00Z", "2026-11-02T10:20", "2026-11-02T10:60Z"]) expect(dateTimeSchema.safeParse(time).success).toBe(false);
    expect(utcDateTimeSchema.safeParse("2026-11-02T10:20Z").success).toBe(true);
    expect(utcDateTimeSchema.safeParse("2026-11-02T10:20+0700").success).toBe(false);
  });
  it("keeps email normalization, password bounds and strict input objects", () => {
    expect(credentialsSchema.parse({email: "  Example@EXAMPLE.COM  ", password: "x".repeat(12)}).email).toBe("example@example.com");
    for (const password of ["x".repeat(11), "x".repeat(65)]) expect(credentialsSchema.safeParse({email: "a@example.com", password}).success).toBe(false);
    expect(credentialsSchema.safeParse({email: "a@example.com", password: "x".repeat(12), admin: true}).success).toBe(false);
    expect(credentialsSchema.safeParse({email: "a..b@example.com", password: "x".repeat(12)}).success).toBe(false);
  });
});
