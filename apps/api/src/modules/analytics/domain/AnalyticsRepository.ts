import type { AiQuotaKind, ProductEventName } from "@beneath-the-pine/contracts";
export interface AnalyticsRepository { recordEvent(userId: string, name: ProductEventName): Promise<void>; countAiUse(userId: string, kind: AiQuotaKind, weekStart: string): Promise<number>; recordAiUse(userId: string, kind: AiQuotaKind, weekStart: string): Promise<void>; }
