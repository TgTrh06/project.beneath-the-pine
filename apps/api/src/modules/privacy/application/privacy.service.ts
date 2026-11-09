import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import type { UnitOfWork } from '../../../shared/kernel/unit-of-work';
import type { AccountRemoval, IdentityAccess } from '../../identity/public-api';
import type { PrivacySources } from './privacy.ports';

export class PrivacyService {
  constructor(private readonly sources: PrivacySources, private readonly accounts: AccountRemoval,
    private readonly identity: Pick<IdentityAccess, 'verifyAccountPassword' | 'notifyAccountDeleted'>,
    private readonly transactions: UnitOfWork, private readonly clock: Clock) {}
  async export(accountId: string) {
    const { profile: profiles, preferences: settings, seeds, camps, pacts: pactData, focus, memory } = this.sources;
    const [profile, preferences, seed, memberships, declinedInvites, pacts, sessions, pactReminders] = await Promise.all([
      profiles.get(accountId), settings.exportPreferences(accountId), seeds.get(accountId),
      camps.exportMemberships(accountId), camps.exportDeclines(accountId), pactData.exportPacts(accountId),
      focus.exportSessions(accountId), pactData.exportReminders(accountId),
    ]);
    const milestones = await memory.list(accountId);
    const personalMemories = await memory.exportPersonal(accountId);
    return { exportedAt: this.clock.now().toISOString(), profile, preferences, openSeed: seed,
      camps: memberships, declinedCampInvites: declinedInvites, pacts, pactReminders, sessions, milestones, personalMilestones: personalMemories };
  }
  async remove(accountId: string, password: string) {
    const email = await this.accounts.email(accountId) ?? '';
    if (!await this.identity.verifyAccountPassword(email, password)) throw new BusinessError('FORBIDDEN');
    await this.transactions.run(async context => {
      await this.sources.camps.releaseOwnedCamps(accountId, context);
      await this.accounts.remove(accountId, context);
    });
    this.identity.notifyAccountDeleted(accountId);
  }
}
