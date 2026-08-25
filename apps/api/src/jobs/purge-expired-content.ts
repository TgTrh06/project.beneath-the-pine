import { createDatabase } from "../db/client.js";
import { PurgeExpiredContent } from "../modules/capture/application/use-cases/PurgeExpiredContent.js";
import { DrizzleCaptureRepository } from "../modules/capture/infrastructure/DrizzleCaptureRepository.js";
import { DrizzleResearchRepository } from "../modules/research/infrastructure/DrizzleResearchRepository.js";

const db = createDatabase();
if (!db) throw new Error("DATABASE_URL is required for the purge job.");
const now = new Date();
const deleted = await new PurgeExpiredContent(new DrizzleCaptureRepository(db), () => now).execute();
const researchDeleted = await new DrizzleResearchRepository(db).purgeExpired(now);
console.log(`Purged ${deleted} expired private record(s) and ${researchDeleted} expired pilot enrollment(s).`);
