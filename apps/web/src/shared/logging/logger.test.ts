import { describe, expect, it } from "vitest";
import { safeFrontendErrorRecord } from "./logger";

describe("frontend error logging", () => {
  it("keeps unexpected sensitive fields out of the console record", () => {
    const record = safeFrontendErrorRecord({ event: "api_request_failed", area: "api", method: "POST", path: "/brain-dumps", status: 500, code: "INTERNAL_ERROR", secret: "must-not-log" } as never);
    expect(record).toEqual({ event: "api_request_failed", area: "api", method: "POST", path: "/brain-dumps", status: 500, code: "INTERNAL_ERROR" });
    expect(JSON.stringify(record)).not.toContain("must-not-log");
  });
});
