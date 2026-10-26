import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { campMemberships } from '../camp/public-api';
import { campMilestones } from './infrastructure/memory.schema';

@Injectable()
export class MemoryService {
  constructor(private readonly database: DatabaseService) { }
  async list(accountId: string) {
    return this.database.db.select({
      id: campMilestones.id,
      campId: campMilestones.campId,
      sessionId: campMilestones.sessionId,
      type: campMilestones.type,
      recordedAt: campMilestones.recordedAt
    }).from(campMilestones)
      .innerJoin(campMemberships, eq(campMemberships.campId, campMilestones.campId))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')));
  }
} 
