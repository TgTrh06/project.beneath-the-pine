import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IdentityCrypto } from '../application/identity.ports';
import { hashPassword, verifyPassword } from './password';
export const sessionHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const identityCrypto: IdentityCrypto = {
  token: () => randomBytes(32).toString('hex'), hashToken: sessionHash,
  equal: (left, right) => timingSafeEqual(Buffer.from(left), Buffer.from(right)), hashPassword, verifyPassword,
};
