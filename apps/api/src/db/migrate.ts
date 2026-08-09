import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./client.js";

const db = createDatabase();
if (!db) throw new Error("DATABASE_URL is required for migrations.");
await migrate(db, { migrationsFolder: "../../supabase/migrations" });
