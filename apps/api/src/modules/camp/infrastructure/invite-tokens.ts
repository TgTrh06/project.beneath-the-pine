import { createHash, randomBytes } from 'node:crypto';
import type { InviteTokens } from '../application/camp.ports';
export const inviteTokens: InviteTokens = {
  create: () => randomBytes(32).toString('hex'),
  hash: token => createHash('sha256').update(token).digest('hex'),
};
