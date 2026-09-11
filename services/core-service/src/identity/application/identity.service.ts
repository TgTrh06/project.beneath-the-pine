import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../shared/error/app-error';
import { AccountRepository } from './account.repository';

export class IdentityService {
  private readonly dummyHash = hash(randomUUID(), 12);
  constructor(private readonly accounts: AccountRepository) {}

  async register(email: string, password: string) {
    const account = { id: randomUUID(), email: email.trim().toLowerCase(), passwordHash: await hash(password, 12), enabled: true };
    await this.accounts.create(account);
    return { id: account.id, email: account.email };
  }

  async login(email: string, password: string) {
    const account = await this.accounts.findByEmail(email.trim().toLowerCase());
    // Spring BCrypt hashes use $2a$ or $2b$, both supported by bcryptjs.
    const valid = await compare(password, account?.passwordHash ?? await this.dummyHash);
    if (!account || !account.enabled || !valid) {
      throw new AppError('INVALID_CREDENTIALS', 'The email or password is incorrect.', 401);
    }
    return { id: account.id, email: account.email };
  }
}
