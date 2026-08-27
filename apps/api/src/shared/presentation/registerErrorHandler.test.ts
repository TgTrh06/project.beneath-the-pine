import { describe, expect, it } from "vitest";
import type { FastifyRequest } from "fastify";
import { safeRequestErrorDetails } from "./registerErrorHandler.js";

describe("safe request error details", () => {
  it("keeps request payloads and error messages out of logs", () => {
    const details = safeRequestErrorDetails({
      id: "request-1",
      method: "POST",
      routeOptions: { url: "/api/v1/brain-dumps" },
    } as FastifyRequest, new Error("private brain dump must not appear here"));
    expect(details).toMatchObject({ event: "api_request_failed", method: "POST", route: "/api/v1/brain-dumps", statusCode: 500, code: "INTERNAL_ERROR" });
    expect(JSON.stringify(details)).not.toContain("private brain dump");
  });
});
