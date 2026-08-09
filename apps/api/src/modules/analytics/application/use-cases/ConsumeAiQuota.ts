import { weeklyQuota, type AiQuotaKind } from "@beneath-the-pine/contracts";
import { RateLimitError } from "../../../../shared/errors/RateLimitError.js";
import type { AnalyticsRepository } from "../../domain/AnalyticsRepository.js";
export class ConsumeAiQuota { public constructor(private readonly analytics: AnalyticsRepository, private readonly weekStart: () => string) {} public async check(userId: string, kind: AiQuotaKind): Promise<void> { if (await this.analytics.countAiUse(userId, kind, this.weekStart()) >= weeklyQuota[kind]) throw new RateLimitError("Bạn đã dùng hết quota AI của tuần này."); } public async commit(userId: string, kind: AiQuotaKind): Promise<void> { await this.analytics.recordAiUse(userId, kind, this.weekStart()); } }
