import { beforeEach, describe, expect, it } from "vitest";

describe("private content encryption", () => {
  beforeEach(() => { process.env.CONTENT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); });
  it("round-trips a private note without keeping plaintext in ciphertext", async () => {
    const { AesGcmContentCipher } = await import("./shared/infrastructure/security/AesGcmContentCipher.js");
    const secret = "Nội dung chỉ dành cho mình";
    const cipher = new AesGcmContentCipher();
    const encrypted = cipher.encrypt(secret);
    expect(encrypted.ciphertext).not.toContain(secret);
    expect(cipher.decrypt(encrypted)).toBe(secret);
  });
});
