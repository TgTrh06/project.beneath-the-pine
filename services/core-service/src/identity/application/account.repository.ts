export type Account = { id: string; email: string; passwordHash: string; enabled: boolean };

export abstract class AccountRepository {
  abstract findByEmail(email: string): Promise<Account | undefined>;
  abstract create(account: Account): Promise<void>;
}
