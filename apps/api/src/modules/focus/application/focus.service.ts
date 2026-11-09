import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import type { TransactionContext, UnitOfWork } from '../../../shared/kernel/unit-of-work';
import type { Analytics } from '../../analytics/public-api';
import type { CampAccess } from '../../camp/public-api';
import type { PactAccess } from '../../pact/public-api';
import type { SeedAccess } from '../../seed/public-api';
import type { SharedMemory } from '../../memory/public-api';
import { ActiveSessionCollision, nextPresence, visibleParticipants, type CheckoutInput, type FocusSession, type FocusSnapshot, type Presence, type SoloInput } from '../domain/focus';
import type { FocusAccess, FocusEvents, FocusRepository } from './focus.ports';

export class FocusService implements FocusAccess {
  exportSessions(accountId: string) { return this.repository.exportSessions(accountId); }
  readonly changes;
  readonly presenceChanges;
  constructor(private readonly repository: FocusRepository, private readonly transactions: UnitOfWork,
    private readonly camps: CampAccess, private readonly pacts: PactAccess, private readonly seeds: SeedAccess,
    private readonly memory: SharedMemory, private readonly analytics: Analytics, private readonly clock: Clock,
    private readonly events: FocusEvents) {
    this.changes = { subscribe: events.changes.subscribe.bind(events.changes) };
    this.presenceChanges = { subscribe: events.presenceChanges.subscribe.bind(events.presenceChanges) };
  }
  private async ensureFree(accountId: string, context?: TransactionContext) {
    if (await this.repository.activeSlot(accountId, context)) throw new BusinessError('STATE_CONFLICT');
  }
  private async releaseRevokedSlot(accountId: string) {
    const row = await this.repository.activeSlot(accountId);
    if (!row) return;
    const session = await this.repository.find(row.sessionId);
    if (!session?.campId || !session.pactId) return;
    await this.transactions.run(async context => {
      await this.camps.lock(session.campId!, context);
      try { await this.pacts.requireParticipant(session.pactId!, accountId, context); }
      catch (error) {
        if (!(error instanceof BusinessError && error.code === 'NOT_FOUND')) throw error;
        await this.repository.stopRevokedSlot(row.id, accountId, this.clock.now(), context);
      }
    });
  }
  async startSolo(accountId: string, input: SoloInput, requestKey: string) {
    await this.releaseRevokedSlot(accountId);
    const existing = await this.repository.byRequest(accountId, requestKey);
    if (existing) return this.snapshot(existing.id, accountId);
    const now = this.clock.now(), endsAt = new Date(now.getTime() + input.durationMinutes * 60000);
    let id: string;
    try {
      id = await this.transactions.run(async context => {
        const session = await this.repository.create({ kind: 'solo', startedByAccountId: accountId, durationMinutes: input.durationMinutes, startedAt: now, endsAt, requestKey }, context);
        await this.repository.addParticipant(session.id, accountId, context, input.intention);
        return session.id;
      });
    } catch (error) {
      if (!(error instanceof ActiveSessionCollision)) throw error;
      const winner = await this.repository.byRequest(accountId, requestKey);
      if (winner) return this.snapshot(winner.id, accountId);
      throw new BusinessError('STATE_CONFLICT');
    }
    await this.analytics.record(accountId, 'solo_session_started', id, { durationMinutes: input.durationMinutes });
    this.events.changes.next(id);
    return this.snapshot(id, accountId);
  }
  async startPact(pactId: string, accountId: string, requestKey: string) {
    const hint = await this.pacts.raw(pactId);
    const result = await this.transactions.run(async context => {
      const group = await this.camps.lock(hint.campId, context);
      const participant = await this.pacts.requireParticipant(pactId, accountId, context);
      const pact = (await this.pacts.lock(pactId, context))!;
      if (pact.creatorAccountId !== accountId || participant.response !== 'accepted') throw new BusinessError('FORBIDDEN');
      if (pact.startedSessionId) {
        if (pact.status !== 'active') throw new BusinessError('STATE_CONFLICT');
        return { id: pact.startedSessionId, expired: false };
      }
      const now = this.clock.now();
      if (pact.status === 'scheduled' && pact.startsAt.getTime() + 1800000 < now.getTime()) {
        await this.pacts.expire(pactId, now, context);
        return { id: null, expired: true };
      }
      if (!group || group.status !== 'active' || pact.status !== 'scheduled') throw new BusinessError('STATE_CONFLICT');
      if (now.getTime() < pact.startsAt.getTime() - 600000 || now.getTime() > pact.startsAt.getTime() + 1800000) throw new BusinessError('STATE_CONFLICT');
      await this.ensureFree(accountId, context);
      const session = await this.repository.create({ kind: 'pact', pactId, campId: pact.campId, startedByAccountId: accountId, durationMinutes: pact.durationMinutes, startedAt: now, endsAt: new Date(now.getTime() + pact.durationMinutes * 60000), requestKey }, context);
      await this.repository.addParticipant(session.id, accountId, context);
      await this.pacts.activate(pactId, session.id, now, context);
      return { id: session.id, expired: false };
    });
    if (result.expired || !result.id) throw new BusinessError('STATE_CONFLICT');
    this.events.changes.next(result.id);
    return this.snapshot(result.id, accountId);
  }
  private async stopParticipantsAndPact(session: FocusSession, now: Date, context: TransactionContext) {
    await this.repository.stopParticipants(session.id, now, context);
    if (session.pactId) await this.pacts.completeActive(session.pactId, now, context);
  }
  async join(sessionId: string, accountId: string) {
    const hint = await this.repository.find(sessionId);
    if (!hint?.pactId || !hint.campId) throw new BusinessError('NOT_FOUND');
    const expired = await this.transactions.run(async context => {
      await this.camps.lock(hint.campId!, context);
      const session = await this.repository.find(sessionId, context, true);
      if (!session) throw new BusinessError('NOT_FOUND');
      const invite = await this.pacts.requireParticipant(session.pactId!, accountId, context);
      if (invite.response !== 'accepted') throw new BusinessError('FORBIDDEN');
      const now = this.clock.now();
      if (session.status === 'active' && session.endsAt <= now) {
        await this.repository.complete(sessionId, now, context, 'expired');
        await this.stopParticipantsAndPact(session, now, context);
        return true;
      }
      if (session.status !== 'active') throw new BusinessError('STATE_CONFLICT');
      const existing = await this.repository.participant(sessionId, accountId, context);
      if (existing) {
        if (existing.presence === 'checked_out') throw new BusinessError('STATE_CONFLICT');
        return false;
      }
      await this.ensureFree(accountId, context);
      await this.repository.addParticipant(sessionId, accountId, context);
      return false;
    });
    if (expired) {
      await this.deriveMilestone(sessionId); this.events.changes.next(sessionId);
      throw new BusinessError('STATE_CONFLICT');
    }
    this.events.changes.next(sessionId);
    return this.snapshot(sessionId, accountId);
  }
  async active(accountId: string) {
    const row = await this.repository.activeSlot(accountId);
    if (!row) return null;
    let session;
    try { session = await this.snapshot(row.sessionId, accountId); }
    catch (error) {
      if (error instanceof BusinessError && error.code === 'NOT_FOUND') { await this.releaseRevokedSlot(accountId); return null; }
      throw error;
    }
    return session.status === 'active' && session.participants.some(person => person.accountId === accountId && person.presence !== 'checked_out') ? session : null;
  }
  async snapshot(sessionId: string, accountId: string): Promise<FocusSnapshot> {
    const hint = await this.repository.find(sessionId);
    if (!hint) throw new BusinessError('NOT_FOUND');
    if (hint.pactId) await this.pacts.requireParticipant(hint.pactId, accountId);
    await this.reconcile(hint);
    return this.transactions.run(async context => {
      const session = await this.repository.find(sessionId, context);
      if (!session) throw new BusinessError('NOT_FOUND');
      if (session.pactId) await this.pacts.requireParticipant(session.pactId, accountId, context);
      const mine = await this.repository.participant(sessionId, accountId, context);
      if (!mine) throw new BusinessError('NOT_FOUND');
      const participants = visibleParticipants(await this.repository.participantViews(sessionId, context), accountId);
      return { id: session.id, kind: session.kind, pactId: session.pactId, status: session.status, startedAt: session.startedAt, endsAt: session.endsAt, serverNow: this.clock.now(), intention: mine.intention, participants };
    }, { isolationLevel: 'repeatable read' });
  }
  async checkout(sessionId: string, accountId: string, input: CheckoutInput) {
    const hint = await this.repository.find(sessionId);
    if (!hint) throw new BusinessError('NOT_FOUND');
    const result = await this.transactions.run(async context => {
      if (hint.campId) await this.camps.lock(hint.campId, context);
      const current = await this.repository.find(sessionId, context, true);
      if (!current) throw new BusinessError('NOT_FOUND');
      if (current.pactId) await this.pacts.requireParticipant(current.pactId, accountId, context);
      const mine = await this.repository.participant(sessionId, accountId, context, true);
      if (!mine) throw new BusinessError('NOT_FOUND');
      if (mine.presence === 'checked_out' || current.status !== 'active') return { changed: false, finished: false };
      const now = this.clock.now();
      if (current.endsAt <= now) {
        await this.repository.complete(sessionId, now, context, 'expired');
        await this.stopParticipantsAndPact(current, now, context);
        return { changed: false, finished: true };
      }
      await this.repository.checkOutParticipant(mine.id, input.outcome, now, context);
      if (input.openSeed === null) await this.seeds.remove(accountId, context);
      else if (input.openSeed !== undefined) await this.seeds.upsert(accountId, { text: input.openSeed, sourceSessionId: sessionId }, context);
      const remaining = await this.repository.hasRemaining(sessionId, context);
      const waiting = current.pactId && current.campId ? await this.repository.hasWaiting(current.pactId, current.campId, sessionId, context) : false;
      let finished = false;
      if (!remaining && !waiting) {
        finished = await this.repository.complete(sessionId, now, context, 'active');
        if (finished && current.pactId) await this.pacts.completeActive(current.pactId, now, context);
      }
      return { changed: true, finished };
    });
    if (result.finished) await this.deriveMilestone(sessionId);
    if (result.changed) await this.analytics.record(accountId, 'session_checked_out', sessionId, { outcome: input.outcome });
    if (result.changed || result.finished) this.events.changes.next(sessionId);
    return this.snapshot(sessionId, accountId);
  }
  setPresence(sessionId: string, accountId: string, presence: Presence) { return this.updatePresence(sessionId, accountId, presence, false); }
  markConnected(sessionId: string, accountId: string) { return this.updatePresence(sessionId, accountId, 'active', true); }
  private async updatePresence(sessionId: string, accountId: string, presence: Presence, preserveBreak: boolean) {
    const hint = await this.repository.find(sessionId);
    if (!hint) throw new BusinessError('NOT_FOUND');
    const result = await this.transactions.run(async context => {
      if (hint.campId) await this.camps.lock(hint.campId, context);
      const session = await this.repository.find(sessionId, context, true);
      if (!session) throw new BusinessError('NOT_FOUND');
      if (session.pactId) await this.pacts.requireParticipant(session.pactId, accountId, context);
      const participant = await this.repository.participant(sessionId, accountId, context, true);
      if (!participant) throw new BusinessError('NOT_FOUND');
      const now = this.clock.now();
      if (session.status === 'active' && session.endsAt <= now) {
        await this.repository.complete(sessionId, now, context, 'expired');
        await this.stopParticipantsAndPact(session, now, context);
        return { changed: false, finished: true, presence: null };
      }
      if (session.status !== 'active' || participant.presence === 'checked_out') {
        if (preserveBreak) return { changed: false, finished: false, presence: null };
        throw new BusinessError('STATE_CONFLICT');
      }
      const next = nextPresence(participant.presence, presence, preserveBreak);
      if (participant.presence === next) return { changed: false, finished: false, presence: null };
      await this.repository.setPresence(participant.id, next, context);
      return { changed: true, finished: false, presence: next };
    });
    if (result.finished) {
      await this.deriveMilestone(sessionId); this.events.changes.next(sessionId);
      throw new BusinessError('STATE_CONFLICT');
    }
    if (result.changed) { this.events.changes.next(sessionId); this.events.presenceChanges.next({ sessionId, accountId, presence: result.presence! }); }
  }
  history(accountId: string) { return this.repository.history(accountId); }
  recentPartners(campId: string, accountId: string) {
    return this.transactions.run(async context => {
      if (!await this.repository.activeCampMember(campId, accountId, context)) throw new BusinessError('NOT_FOUND');
      return this.repository.recentPartners(campId, accountId, context);
    }, { isolationLevel: 'repeatable read' });
  }
  private async reconcile(session: FocusSession) {
    if (session.status !== 'active') return;
    if (session.endsAt <= this.clock.now()) await this.finishExpiredSession(session.id);
    else if (session.pactId) await this.finishAbandonedSession(session.id);
  }
  private async finishAbandonedSession(sessionId: string) {
    const hint = await this.repository.find(sessionId);
    if (!hint?.pactId || !hint.campId) return;
    const finished = await this.transactions.run(async context => {
      await this.camps.lock(hint.campId!, context);
      const session = await this.repository.find(sessionId, context, true);
      if (!session || session.status !== 'active' || session.endsAt <= this.clock.now()) return false;
      const now = this.clock.now();
      await this.repository.stopRevokedParticipants(sessionId, session.campId!, now, context);
      if (await this.repository.hasRemaining(sessionId, context, true)) return false;
      if (await this.repository.hasWaiting(session.pactId!, session.campId!, sessionId, context)) return false;
      await this.repository.complete(sessionId, now, context, 'locked');
      await this.pacts.completeActive(session.pactId!, now, context);
      return true;
    });
    if (finished) { await this.deriveMilestone(sessionId); this.events.changes.next(sessionId); }
  }
  private async finishExpiredSession(sessionId: string) {
    const hint = await this.repository.find(sessionId);
    if (!hint) return;
    const finished = await this.transactions.run(async context => {
      if (hint.campId) await this.camps.lock(hint.campId, context);
      const session = await this.repository.find(sessionId, context, true), now = this.clock.now();
      if (!session || session.status !== 'active' || session.endsAt > now) return false;
      if (!await this.repository.complete(sessionId, now, context, 'expired')) return false;
      await this.stopParticipantsAndPact(session, now, context);
      return true;
    });
    if (finished) { await this.deriveMilestone(sessionId); this.events.changes.next(sessionId); }
  }
  private async deriveMilestone(sessionId: string) {
    const session = await this.repository.find(sessionId);
    if (!session?.campId || session.status !== 'completed') return;
    const joined = await this.repository.joinedAccountIds(sessionId);
    const id = await this.memory.record(session.campId, sessionId, joined.length);
    if (id) await this.analytics.record(session.startedByAccountId ?? joined[0], 'camp_milestone_recorded', id);
  }
  async finalizeExpired() {
    for (const id of await this.repository.expired(this.clock.now())) await this.finishExpiredSession(id);
    for (const id of await this.repository.activePacts()) await this.finishAbandonedSession(id);
  }
}
