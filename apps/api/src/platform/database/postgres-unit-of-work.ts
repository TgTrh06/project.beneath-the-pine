import { Injectable } from '@nestjs/common';
import type { TransactionContext, TransactionOptions, UnitOfWork } from '../../shared/kernel/unit-of-work';
import { DatabaseService } from './database.service';

type Database = DatabaseService['db'];
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

@Injectable()
export class PostgresUnitOfWork implements UnitOfWork {
  private readonly transactions = new WeakMap<TransactionContext, Transaction>();
  constructor(private readonly database: DatabaseService) {}

  reader(context?: TransactionContext): Database | Transaction {
    if (!context) return this.database.db;
    const transaction = this.transactions.get(context);
    if (!transaction) throw new Error('Unknown or completed transaction context');
    return transaction;
  }

  run<T>(work: (context: TransactionContext) => Promise<T>, options?: TransactionOptions): Promise<T> {
    return this.database.db.transaction(async transaction => {
      const context = Object.freeze({}) as TransactionContext;
      this.transactions.set(context, transaction);
      try { return await work(context); }
      finally { this.transactions.delete(context); }
    }, options);
  }
}
