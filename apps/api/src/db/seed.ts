import { createDatabase } from "./client.js";

const db = createDatabase();
if (!db) throw new Error("DATABASE_URL is required for seeding.");
// Deliberately no sample private content: create beta members through the admin flow.
console.log("Database is ready. No personal data was seeded.");
