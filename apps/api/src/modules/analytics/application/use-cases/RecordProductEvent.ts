import type { ProductEventName } from "@beneath-the-pine/contracts";
import type { AnalyticsRepository } from "../../domain/AnalyticsRepository.js";
export class RecordProductEvent { public constructor(private readonly analytics: AnalyticsRepository) {} public async execute(userId: string, name: ProductEventName): Promise<void> { await this.analytics.recordEvent(userId, name); } }
