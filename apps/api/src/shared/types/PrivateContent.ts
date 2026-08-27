export type EncryptedContent = { ciphertext: string; iv: string; keyVersion: string };
export interface ContentCipher { encrypt(value: string): EncryptedContent; decrypt(value: EncryptedContent): string; }
