import { createDatabase } from "./client.js";
import { logger } from "../shared/infrastructure/logging/logger.js";

const db = createDatabase();
if (!db) throw new Error("DATABASE_URL is required for seeding.");
// Deliberately no sample private content: create beta members through the admin flow.
logger.info({ event: "database_seed_checked" }, "Database is ready; no personal data was seeded");
