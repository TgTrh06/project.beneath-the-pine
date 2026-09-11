import { Injectable } from '@nestjs/common';
import { Database } from '../../shared/database/database.module';
import { AppError } from '../../shared/error/app-error';
import { Account, AccountRepository } from '../application/account.repository';

@Injectable()
export class PgAccountRepository extends AccountRepository {
  constructor(private readonly database: Database) { super(); }
  async findByEmail(email: string): Promise<Account | undefined> {
    const result = await this.database.pool.query<Account>(
      'SELECT id, email, password_hash AS "passwordHash", enabled FROM core.accounts WHERE email = $1', [email]);
    return result.rows[0];
  }
  async create(account: Account): Promise<void> {
    try {
      await this.database.pool.query(
        'INSERT INTO core.accounts (id, email, password_hash, enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now())',
        [account.id, account.email, account.passwordHash, account.enabled]);
    } catch (error) {
      if ((error as { code?: string; constraint?: string }).code === '23505'
          && (error as { constraint?: string }).constraint === 'accounts_email_unique') {
        throw new AppError('ACCOUNT_ALREADY_EXISTS', 'An account with this email already exists.', 409);
      }
      throw error;
    }
  }
}
