import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import * as schema from "./schema.js";

export function createDatabase() {
  if (!env.DATABASE_URL) return null;
  const client = postgres(env.DATABASE_URL, { prepare: false, max: 5 });
  return drizzle({ client, schema });
}

export type Database = NonNullable<ReturnType<typeof createDatabase>>;
