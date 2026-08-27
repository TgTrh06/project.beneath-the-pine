import { createDatabase } from "../db/client.js";
import { PurgeExpiredContent } from "../modules/capture/application/use-cases/PurgeExpiredContent.js";
import { DrizzleCaptureRepository } from "../modules/capture/infrastructure/DrizzleCaptureRepository.js";
import { DrizzleResearchRepository } from "../modules/research/infrastructure/DrizzleResearchRepository.js";
import { logger } from "../shared/infrastructure/logging/logger.js";

const db = createDatabase();
if (!db) throw new Error("DATABASE_URL is required for the purge job.");
const now = new Date();
const deleted = await new PurgeExpiredContent(new DrizzleCaptureRepository(db), () => now).execute();
const researchDeleted = await new DrizzleResearchRepository(db).purgeExpired(now);
logger.info({ event: "expired_content_purged", deleted, researchDeleted }, "Expired private content purge completed");
