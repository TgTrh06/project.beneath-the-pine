import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { accounts } from './infrastructure/identity.schema';
import { credentialsSchema, hashPassword } from './password';

export function seedCredentials(env: NodeJS.ProcessEnv) {
  const parsed = credentialsSchema.safeParse({ email: env.PINE_KEEPER_EMAIL, password: env.PINE_KEEPER_PASSWORD });
  if (!parsed.success) throw new Error('Set valid PINE_KEEPER_EMAIL and PINE_KEEPER_PASSWORD (12–64 characters).');
  return parsed.data;
}
export async function seedKeeper(db: NodePgDatabase, env: NodeJS.ProcessEnv): Promise<'created' | 'unchanged'> {
  const input = seedCredentials(env);
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async tx => {
    const inserted = await tx.insert(accounts).values({ email: input.email, passwordHash, role: 'pine_keeper' }).onConflictDoNothing().returning({ id: accounts.id });
    if (inserted.length) return 'created';
    const [existing] = await tx.select({ role: accounts.role }).from(accounts).where(eq(accounts.email, input.email));
    if (existing?.role !== 'pine_keeper') throw new Error('Seed conflict: this email belongs to a Wanderer. No role or password was changed.');
    return 'unchanged';
  });
}
