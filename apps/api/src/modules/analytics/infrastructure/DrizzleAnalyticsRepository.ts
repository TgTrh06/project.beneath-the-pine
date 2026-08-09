import { and, count, eq } from "drizzle-orm";
import type { AiQuotaKind, ProductEventName } from "@beneath-the-pine/contracts";
import type { Database } from "../../../db/client.js";
import { aiUsage, productEvents } from "../../../db/schema.js";
import type { AnalyticsRepository } from "../domain/AnalyticsRepository.js";
export class DrizzleAnalyticsRepository implements AnalyticsRepository { public constructor(private readonly db: Database) {} public async recordEvent(userId: string, name: ProductEventName): Promise<void> { await this.db.insert(productEvents).values({ userId, name }); } public async countAiUse(userId: string, kind: AiQuotaKind, weekStart: string): Promise<number> { const [row] = await this.db.select({ total: count() }).from(aiUsage).where(and(eq(aiUsage.userId, userId), eq(aiUsage.kind, kind), eq(aiUsage.weekStart, weekStart))); return row?.total ?? 0; } public async recordAiUse(userId: string, kind: AiQuotaKind, weekStart: string): Promise<void> { await this.db.insert(aiUsage).values({ userId, kind, weekStart }); } }
