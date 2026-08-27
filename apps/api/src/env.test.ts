import { describe, expect, it } from "vitest";
import { env, getEnvDiagnostics, type BackendEnv } from "./env.js";

function configuredEnv(overrides: Partial<BackendEnv> = {}): BackendEnv {
  return {
    ...env,
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/beneath_the_pine",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "server-only-secret",
    CONTENT_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
    ...overrides,
  };
}

describe("backend environment diagnostics", () => {
  it("reports missing core variables by name without exposing secret values", () => {
    const diagnostics = getEnvDiagnostics(configuredEnv({
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      CONTENT_ENCRYPTION_KEY: "not-a-valid-encryption-key",
    }));
    expect(diagnostics).toContainEqual(expect.objectContaining({
      level: "warn",
      code: "BACKEND_ENV_PARTIAL",
      missing: ["SUPABASE_SERVICE_ROLE_KEY", "CONTENT_ENCRYPTION_KEY"],
    }));
    expect(JSON.stringify(diagnostics)).not.toContain("server-only-secret");
    expect(JSON.stringify(diagnostics)).not.toContain("not-a-valid-encryption-key");
  });

  it("logs an error-level diagnostic when the selected AI provider is incomplete", () => {
    const diagnostics = getEnvDiagnostics(configuredEnv({ AI_PROVIDER: "openai", OPENAI_API_KEY: undefined }));
    expect(diagnostics).toContainEqual(expect.objectContaining({
      level: "error",
      code: "AI_PROVIDER_MISCONFIGURED",
      missing: ["OPENAI_API_KEY"],
    }));
  });

  it("does not require provider credentials in manual fallback mode", () => {
    expect(getEnvDiagnostics(configuredEnv({ AI_PROVIDER: "manual_fallback", OPENAI_API_KEY: undefined }))).not.toContainEqual(expect.objectContaining({ code: "AI_PROVIDER_MISCONFIGURED" }));
  });
});
