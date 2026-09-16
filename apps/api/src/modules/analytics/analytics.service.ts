import { Injectable } from '@nestjs/common';
import type { ProductEventName } from '@beneath-the-pine/contracts';
import { DatabaseService } from '../../platform/database/database.service';
import { productEvents } from './infrastructure/analytics.schema';
@Injectable()
export class AnalyticsService { constructor(private readonly database: DatabaseService) {} async record(accountId: string, name: ProductEventName, subjectId?: string, metadata: Record<string, string | number | boolean | null> = {}) { try { await this.database.db.insert(productEvents).values({ accountId, name, subjectId, metadata }); } catch { /* Analytics is deliberately best effort. */ } } }
