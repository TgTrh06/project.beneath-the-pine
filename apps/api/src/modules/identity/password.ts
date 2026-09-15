import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(12).max(64),
}).strict();
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, hash) => error ? reject(error) : resolve(hash));
});
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  const [scheme, salt, hash] = (encoded ?? '').split('$');
  const actual = await derive(password, salt || 'missing-account-dummy-salt');
  if (scheme !== 'scrypt' || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false;
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
