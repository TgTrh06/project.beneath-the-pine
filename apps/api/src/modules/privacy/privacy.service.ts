import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { campInviteDeclines, campInvites, campMemberships, camps } from '../camp/public-api';
import { accounts, IdentityStore, verifyPassword } from '../identity/public-api';
import { campMilestones } from '../memory/public-api';
import { focusPactParticipants, focusPacts, pactReminderReceipts } from '../pact/public-api';
import { profiles } from '../profile/public-api';
import { accountPreferences } from '../preferences/public-api';
import { openSeeds } from '../seed/public-api';
import { focusSessions, sessionParticipants } from '../focus/public-api';

@Injectable()
export class PrivacyService {
  constructor(private readonly database: DatabaseService, private readonly identity: IdentityStore) {}
  async export(accountId: string) {
    const [profile, preferences, seed, memberships, declinedInvites, pacts, sessions, pactReminders] = await Promise.all([
      this.database.db.select().from(profiles).where(eq(profiles.accountId, accountId)),
      this.database.db.select().from(accountPreferences).where(eq(accountPreferences.accountId, accountId)),
      this.database.db.select().from(openSeeds).where(eq(openSeeds.accountId, accountId)),
      this.database.db.select({ campId: camps.id, name: camps.name, status: camps.status, role: campMemberships.role, joinedAt: campMemberships.joinedAt }).from(campMemberships).innerJoin(camps, eq(camps.id, campMemberships.campId)).where(eq(campMemberships.accountId, accountId)),
      this.database.db.select({ inviteId: campInviteDeclines.inviteId, campId: campInvites.campId, declinedAt: campInviteDeclines.declinedAt }).from(campInviteDeclines).innerJoin(campInvites, eq(campInvites.id, campInviteDeclines.inviteId)).where(eq(campInviteDeclines.accountId, accountId)),
      this.database.db.select({ id: focusPacts.id, campId: focusPacts.campId, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes, status: focusPacts.status, response: focusPactParticipants.response }).from(focusPactParticipants).innerJoin(focusPacts, eq(focusPacts.id, focusPactParticipants.pactId)).where(eq(focusPactParticipants.accountId, accountId)),
      this.database.db.select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, intention: sessionParticipants.intention, outcome: sessionParticipants.outcome }).from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId)),
      this.database.db.select().from(pactReminderReceipts).where(eq(pactReminderReceipts.accountId, accountId)),
    ]);
    const campIds = memberships.map(value => value.campId); const milestones = campIds.length ? await this.database.db.select().from(campMilestones).where(inArray(campMilestones.campId, campIds)) : [];
    return { exportedAt: new Date().toISOString(), profile: profile[0] ?? null, preferences: preferences[0] ?? null, openSeed: seed[0] ?? null, camps: memberships, declinedCampInvites: declinedInvites, pacts, pactReminders, sessions, milestones };
  }
  async remove(accountId: string, password: string) {
    const account = await this.identity.findAccount((await this.database.db.select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)))[0]?.email ?? '');
    if (!account || !await verifyPassword(password, account.passwordHash)) throw new ForbiddenException();
    await this.database.db.transaction(async tx => {
      const owned = await tx.select().from(camps).where(eq(camps.ownerAccountId, accountId)).for('update');
      for (const camp of owned) { const [successor] = await tx.select().from(campMemberships).where(and(eq(campMemberships.campId, camp.id), eq(campMemberships.status, 'active'), ne(campMemberships.accountId, accountId))).orderBy(asc(campMemberships.joinedAt)).limit(1); if (successor) { await tx.update(campMemberships).set({ role: 'owner' }).where(eq(campMemberships.id, successor.id)); await tx.update(camps).set({ ownerAccountId: successor.accountId, updatedAt: new Date() }).where(eq(camps.id, camp.id)); } else await tx.delete(camps).where(eq(camps.id, camp.id)); }
      await tx.delete(accounts).where(eq(accounts.id, accountId));
    });
  }
}
