import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { circleMemberships, circles } from '../circle/public-api';
import { accounts, IdentityStore, verifyPassword } from '../identity/public-api';
import { circleMilestones } from '../memory/public-api';
import { focusPactParticipants, focusPacts } from '../pact/public-api';
import { profiles } from '../profile/public-api';
import { openSeeds } from '../seed/public-api';
import { focusSessions, sessionParticipants } from '../focus/public-api';

@Injectable()
export class PrivacyService {
  constructor(private readonly database: DatabaseService, private readonly identity: IdentityStore) {}
  async export(accountId: string) {
    const [profile, seed, memberships, pacts, sessions] = await Promise.all([
      this.database.db.select().from(profiles).where(eq(profiles.accountId, accountId)), this.database.db.select().from(openSeeds).where(eq(openSeeds.accountId, accountId)),
      this.database.db.select({ circleId: circles.id, name: circles.name, status: circles.status, role: circleMemberships.role, joinedAt: circleMemberships.joinedAt }).from(circleMemberships).innerJoin(circles, eq(circles.id, circleMemberships.circleId)).where(eq(circleMemberships.accountId, accountId)),
      this.database.db.select({ id: focusPacts.id, circleId: focusPacts.circleId, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes, status: focusPacts.status, response: focusPactParticipants.response }).from(focusPactParticipants).innerJoin(focusPacts, eq(focusPacts.id, focusPactParticipants.pactId)).where(eq(focusPactParticipants.accountId, accountId)),
      this.database.db.select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, intention: sessionParticipants.intention, outcome: sessionParticipants.outcome }).from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId)),
    ]);
    const circleIds = memberships.map(value => value.circleId); const milestones = circleIds.length ? await this.database.db.select().from(circleMilestones).where(inArray(circleMilestones.circleId, circleIds)) : [];
    return { exportedAt: new Date().toISOString(), profile: profile[0] ?? null, openSeed: seed[0] ?? null, circles: memberships, pacts, sessions, milestones };
  }
  async remove(accountId: string, password: string) {
    const account = await this.identity.findAccount((await this.database.db.select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)))[0]?.email ?? '');
    if (!account || !await verifyPassword(password, account.passwordHash)) throw new ForbiddenException();
    await this.database.db.transaction(async tx => {
      const owned = await tx.select().from(circles).where(eq(circles.ownerAccountId, accountId)).for('update');
      for (const circle of owned) { const [successor] = await tx.select().from(circleMemberships).where(and(eq(circleMemberships.circleId, circle.id), eq(circleMemberships.status, 'active'), ne(circleMemberships.accountId, accountId))).orderBy(asc(circleMemberships.joinedAt)).limit(1); if (successor) { await tx.update(circleMemberships).set({ role: 'owner' }).where(eq(circleMemberships.id, successor.id)); await tx.update(circles).set({ ownerAccountId: successor.accountId, updatedAt: new Date() }).where(eq(circles.id, circle.id)); } else await tx.delete(circles).where(eq(circles.id, circle.id)); }
      await tx.delete(accounts).where(eq(accounts.id, accountId));
    });
  }
}
