import { createDatabase } from "../db/client.js";
import { PurgeExpiredContent } from "../modules/capture/application/use-cases/PurgeExpiredContent.js";
import { DrizzleCaptureRepository } from "../modules/capture/infrastructure/DrizzleCaptureRepository.js";

const db = createDatabase();
if (!db) throw new Error("DATABASE_URL is required for the purge job.");
const deleted = await new PurgeExpiredContent(new DrizzleCaptureRepository(db), () => new Date()).execute();
console.log(`Purged ${deleted} expired private record(s).`);
