import type { PreferencesAccess } from '../../preferences/public-api';
import type { PactListQuery } from '@pyneath/contracts';
import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import type { CursorCodec } from '../../../shared/kernel/pagination';
import type { TransactionContext, UnitOfWork } from '../../../shared/kernel/unit-of-work';
import type { Analytics } from '../../analytics/public-api';
import type { CampAccess } from '../../camp/public-api';
import { pactExpiryTime, pactIsExpired, type CreatePact, type DueReminder } from '../domain/pact';
import type { PactAccess, PactRepository } from './pact.ports';

export class PactService implements PactAccess {
  exportPacts(accountId: string) { return this.repository.exportPacts(accountId); }
  exportReminders(accountId: string) { return this.repository.exportReminders(accountId); }
  constructor(private readonly repository: PactRepository, private readonly transactions: UnitOfWork, private readonly camps: CampAccess,
    private readonly analytics: Analytics, private readonly clock: Clock, private readonly cursors: CursorCodec, private readonly preferences: PreferencesAccess) {}
  lock(pactId: string, context: TransactionContext) { return this.repository.find(pactId, context, true); }
  expire(pactId: string, now: Date, context: TransactionContext) { return this.repository.setStatus(pactId, 'expired', now, context); }
  activate(pactId: string, sessionId: string, now: Date, context: TransactionContext) { return this.repository.activate(pactId, sessionId, now, context); }
  completeActive(pactId: string, now: Date, context: TransactionContext) { return this.repository.completeActive(pactId, now, context); }
  async claimDueReminders(accountId: string) {
    return this.transactions.run(async context => {
      if (!await this.preferences.lockReminders(accountId, context)) return { serverNow: this.clock.now(), items: [] };
      const due = await this.repository.dueReminders(accountId, this.clock.now(), context), claimed: DueReminder[] = [];
      for (const pact of due) {
        if (!await this.repository.claimReminder(pact.id, accountId, context)) continue;
        if (await this.repository.status(pact.id, context) === 'scheduled') claimed.push(pact);
      }
      return { serverNow: this.clock.now(), items: claimed };
    });
  }
  async create(campId: string, actorId: string, input: CreatePact, requestKey: string) {
    if (!await this.camps.membership(campId, actorId)) throw new BusinessError('NOT_FOUND');
    const requested = [...new Set([actorId, ...input.participantIds])], active = await this.camps.activeMemberIds(campId);
    if (requested.length > 8 || requested.some(id => !active.includes(id))) throw new BusinessError('FORBIDDEN');
    const existing = await this.repository.byRequest(actorId, requestKey);
    if (existing) return this.get(existing.id, actorId);
    let created = false;
    const pactId = await this.transactions.run(async context => {
      await this.repository.lockActor(actorId, context);
      const group = await this.camps.lock(campId, context);
      if (!group || group.status !== 'active') throw new BusinessError('STATE_CONFLICT');
      const members = await this.camps.activeMemberIds(campId, context);
      if (!members.includes(actorId) || requested.some(id => !members.includes(id))) throw new BusinessError('NOT_FOUND');
      const retry = await this.repository.byRequest(actorId, requestKey, context);
      if (retry) return retry.id;
      created = true;
      const pact = await this.repository.create({ campId, creatorAccountId: actorId, startsAt: new Date(input.startsAt), durationMinutes: input.durationMinutes, requestKey }, context);
      await this.repository.addParticipants(requested.map(accountId => ({ pactId: pact.id, accountId, response: accountId === actorId ? 'accepted' : 'invited', respondedAt: accountId === actorId ? this.clock.now() : null })), context);
      return pact.id;
    });
    if (created) await this.analytics.record(actorId, 'pact_created', pactId, { durationMinutes: input.durationMinutes });
    return this.get(pactId, actorId);
  }
  async requireParticipant(pactId: string, accountId: string, context?: TransactionContext) {
    const value = await this.repository.participant(pactId, accountId, context);
    if (!value) throw new BusinessError('NOT_FOUND');
    const pact = await this.raw(pactId, context);
    if (!await this.camps.membership(pact.campId, accountId, context)) throw new BusinessError('NOT_FOUND');
    return value;
  }
  async raw(pactId: string, context?: TransactionContext) {
    const value = await this.repository.find(pactId, context);
    if (!value) throw new BusinessError('NOT_FOUND');
    return value;
  }
  async get(pactId: string, actorId: string) {
    await this.requireParticipant(pactId, actorId);
    const now = this.clock.now();
    await this.repository.expireScheduled(now, pactExpiryTime(now), undefined, { pactId });
    const pact = await this.raw(pactId), participants = await this.repository.participants(pactId);
    return { id: pact.id, campId: pact.campId, creatorId: pact.creatorAccountId, startsAt: pact.startsAt, durationMinutes: pact.durationMinutes, status: pact.status, sessionId: pact.startedSessionId, participants, createdAt: pact.createdAt };
  }
  async listUpcoming(accountId: string) { await this.expireScheduled(); return this.repository.upcoming(accountId); }
  async respond(pactId: string, actorId: string, response: 'accepted' | 'declined') {
    const hint = await this.raw(pactId);
    const result = await this.transactions.run(async context => {
      await this.camps.lock(hint.campId, context);
      const participant = await this.requireParticipant(pactId, actorId, context);
      const pact = (await this.repository.find(pactId, context, true))!;
      const now = this.clock.now();
      if (pact.status === 'scheduled' && pactIsExpired(pact, now)) {
        await this.repository.setStatus(pactId, 'expired', now, context);
        return { changed: false, expired: true };
      }
      if (pact.status !== 'scheduled') throw new BusinessError('STATE_CONFLICT');
      if (participant.response === response) return { changed: false, expired: false };
      await this.repository.respond(participant.id, response, now, context);
      return { changed: true, expired: false };
    });
    if (result.expired) throw new BusinessError('STATE_CONFLICT');
    if (result.changed && response === 'accepted') await this.analytics.record(actorId, 'pact_accepted', pactId);
    return this.get(pactId, actorId);
  }
  async cancel(pactId: string, actorId: string) {
    const hint = await this.raw(pactId);
    const result = await this.transactions.run(async context => {
      await this.camps.lock(hint.campId, context);
      await this.requireParticipant(pactId, actorId, context);
      const pact = (await this.repository.find(pactId, context, true))!;
      if (pact.creatorAccountId !== actorId) throw new BusinessError('FORBIDDEN');
      if (pact.status === 'cancelled') return { changed: false, expired: false };
      if (pact.status !== 'scheduled') throw new BusinessError('STATE_CONFLICT');
      const now = this.clock.now();
      if (pactIsExpired(pact, now)) {
        await this.repository.setStatus(pactId, 'expired', now, context);
        return { changed: false, expired: true };
      }
      await this.repository.setStatus(pactId, 'cancelled', now, context);
      return { changed: true, expired: false };
    });
    if (result.expired) throw new BusinessError('STATE_CONFLICT');
    if (result.changed) await this.analytics.record(actorId, 'pact_cancelled', pactId);
    return this.get(pactId, actorId);
  }
  async list(actorId: string, query: PactListQuery, campId?: string) {
    if (campId && !await this.camps.membership(campId, actorId)) throw new BusinessError('NOT_FOUND');
    await this.expireScheduled();
    const scope = `${actorId}:${campId ?? 'all'}:${query.group}`, cursor = this.cursors.decode(query.cursor, scope);
    const rows = await this.repository.list(actorId, query, cursor, campId);
    const page = rows.slice(0, query.limit), last = page.at(-1);
    return { items: page.map(({ creatorId, ...item }) => ({ ...item, isCreator: creatorId === actorId })),
      nextCursor: rows.length > query.limit && last ? this.cursors.encode(last.startsAt, last.id, scope) : null };
  }
  expireScheduled() { return this.repository.expireScheduled(this.clock.now(), pactExpiryTime(this.clock.now())); }
  updateCamp(campId: string, actorId: string, input: { name?: string; status?: 'active' | 'archived' }) {
    return this.transactions.run(async context => {
      const group = await this.camps.lock(campId, context), member = await this.camps.membership(campId, actorId, context);
      if (!group || !member) throw new BusinessError('NOT_FOUND');
      if (member.role !== 'owner') throw new BusinessError('FORBIDDEN');
      if (input.status === 'archived') {
        await this.repository.expireScheduled(this.clock.now(), pactExpiryTime(this.clock.now()), context, { campId });
        if (await this.repository.hasOpen(campId, context)) throw new BusinessError('STATE_CONFLICT');
        await this.camps.revokePendingInvites(campId, context);
      }
      return this.camps.update(campId, input, context);
    });
  }
}
