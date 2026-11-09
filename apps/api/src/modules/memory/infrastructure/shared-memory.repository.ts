import { Injectable } from '@nestjs/common';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { SharedMemoryRepository } from '../application/shared-memory.ports';
import { campMilestones } from './memory.schema';
@Injectable()
export class DrizzleSharedMemoryRepository implements SharedMemoryRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async insert(campId: string, sessionId: string) {
    return (await this.transactions.reader().insert(campMilestones).values({ campId, sessionId }).onConflictDoNothing().returning({ id: campMilestones.id }))[0]?.id ?? null;
  }
}
