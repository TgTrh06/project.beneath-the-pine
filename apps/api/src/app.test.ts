import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "./app.js";

describe("API composition root", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); });
  it("keeps the health endpoint available without configured storage", async () => {
    app = await createApp();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
  });
  it("retains the waitlist endpoint path when storage is unavailable", async () => {
    app = await createApp();
    const response = await app.inject({ method: "POST", url: "/api/v1/waitlist", payload: { email: "linh@example.com" } });
    expect([201, 503]).toContain(response.statusCode);
  });
});
