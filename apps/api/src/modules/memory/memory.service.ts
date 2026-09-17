import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { circleMemberships } from '../circle/public-api';
import { circleMilestones } from './infrastructure/memory.schema';
@Injectable()
export class MemoryService {
  constructor(private readonly database: DatabaseService) {}
  async list(accountId: string) { return this.database.db.select({ id: circleMilestones.id, circleId: circleMilestones.circleId, sessionId: circleMilestones.sessionId, type: circleMilestones.type, recordedAt: circleMilestones.recordedAt }).from(circleMilestones).innerJoin(circleMemberships, eq(circleMemberships.circleId, circleMilestones.circleId)).where(and(eq(circleMemberships.accountId, accountId), eq(circleMemberships.status, 'active'))); }
}
