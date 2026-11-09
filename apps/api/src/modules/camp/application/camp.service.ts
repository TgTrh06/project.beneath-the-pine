import type { CampInvitePreview, InviteListQuery } from '@pyneath/contracts';
import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import type { CursorCodec } from '../../../shared/kernel/pagination';
import type { TransactionContext, UnitOfWork } from '../../../shared/kernel/unit-of-work';
import type { Analytics } from '../../analytics/public-api';
import { requireActiveCamp, requirePendingInvite, validateInviteToken, type CampUpdate } from '../domain/camp';
import type { CampAccess, CampRepository, InviteTokens } from './camp.ports';

export class CampService implements CampAccess {
  constructor(private readonly repository: CampRepository, private readonly transactions: UnitOfWork,
    private readonly analytics: Analytics, private readonly clock: Clock, private readonly tokens: InviteTokens,
    private readonly cursors: CursorCodec) {}
  exportMemberships(accountId: string) { return this.repository.exportMemberships(accountId); }
  exportDeclines(accountId: string) { return this.repository.exportDeclines(accountId); }
  async releaseOwnedCamps(accountId: string, context: TransactionContext) {
    const owned = await this.repository.lockOwned(accountId, context);
    for (const camp of owned) {
      const successor = await this.repository.successor(camp.id, accountId, context);
      if (successor) {
        await this.repository.promoteMember(successor.id, context);
        await this.repository.transfer(camp.id, successor.accountId, this.clock.now(), context);
      } else await this.repository.delete(camp.id, context);
    }
  }
  lock(campId: string, context: TransactionContext) { return this.repository.find(campId, context, true); }
  update(campId: string, input: CampUpdate, context: TransactionContext) { return this.repository.update(campId, input, this.clock.now(), context); }
  revokePendingInvites(campId: string, context: TransactionContext) { return this.repository.revokePendingInvites(campId, context); }
  membership(campId: string, accountId: string, context?: TransactionContext) { return this.repository.membership(campId, accountId, context); }
  activeMemberIds(campId: string, context?: TransactionContext) { return this.repository.activeMemberIds(campId, context); }
  private async requireMember(campId: string, accountId: string, context?: TransactionContext) {
    const value = await this.membership(campId, accountId, context);
    if (!value) throw new BusinessError('NOT_FOUND');
    return value;
  }
  private async requireOwner(campId: string, accountId: string, context?: TransactionContext) {
    const value = await this.requireMember(campId, accountId, context);
    if (value.role !== 'owner') throw new BusinessError('FORBIDDEN');
    return value;
  }
  private inviteHash(token: string) { return this.tokens.hash(validateInviteToken(token)); }
  async create(accountId: string, name: string) {
    const camp = await this.transactions.run(async context => {
      const created = await this.repository.create(accountId, name, context);
      await this.repository.addOwner(created.id, accountId, context);
      return created;
    });
    await this.analytics.record(accountId, 'camp_created', camp.id);
    return camp;
  }
  async list(accountId: string) {
    const mine = await this.repository.list(accountId);
    return Promise.all(mine.map(async camp => ({ ...camp, memberCount: (await this.activeMemberIds(camp.id)).length })));
  }
  async get(campId: string, accountId: string) {
    const mine = await this.requireMember(campId, accountId);
    const camp = await this.repository.find(campId);
    if (!camp) throw new BusinessError('NOT_FOUND');
    const members = await this.repository.members(campId);
    return { ...camp, myRole: mine.role, memberCount: members.length, members };
  }
  async listInvites(campId: string, accountId: string, query: InviteListQuery) {
    await this.requireOwner(campId, accountId);
    const scope = `invites:${campId}:${accountId}`, cursor = this.cursors.decode(query.cursor, scope);
    const rows = await this.repository.invites(campId, query.limit + 1, cursor);
    const page = rows.slice(0, query.limit), last = page.at(-1);
    return { items: page.map(row => ({ ...row, status: row.status === 'pending' && row.expiresAt <= this.clock.now() ? 'expired' : row.status })),
      nextCursor: rows.length > query.limit && last ? this.cursors.encode(last.createdAt, last.id, scope) : null };
  }
  async invite(campId: string, accountId: string, hours: number) {
    return this.transactions.run(async context => {
      const group = await this.repository.find(campId, context, true);
      await this.requireOwner(campId, accountId, context);
      requireActiveCamp(group);
      const token = this.tokens.create();
      const invite = await this.repository.createInvite({ campId, createdByAccountId: accountId, tokenHash: this.tokens.hash(token), expiresAt: new Date(this.clock.now().getTime() + hours * 3600000) }, context);
      return { id: invite.id, campId: invite.campId, createdAt: invite.createdAt, expiresAt: invite.expiresAt, status: invite.status, token };
    });
  }
  async revoke(campId: string, inviteId: string, accountId: string) {
    await this.transactions.run(async context => {
      await this.repository.find(campId, context, true);
      await this.requireOwner(campId, accountId, context);
      const invite = await this.repository.inviteById(campId, inviteId, context);
      if (!invite) throw new BusinessError('NOT_FOUND');
      if (invite.status === 'revoked') return;
      requirePendingInvite(invite, this.clock.now());
      await this.repository.setInviteStatus(inviteId, 'revoked', context);
    });
  }
  async preview(token: string, accountId: string): Promise<CampInvitePreview> {
    const result = await this.repository.preview(this.inviteHash(token));
    if (!result) throw new BusinessError('NOT_FOUND');
    if (result.campStatus !== 'active') throw new BusinessError('STATE_CONFLICT');
    requirePendingInvite(result, this.clock.now());
    if (await this.repository.declined(result.inviteId, accountId)) throw new BusinessError('STATE_CONFLICT');
    return { campName: result.campName, inviterName: result.inviterName };
  }
  async decline(token: string, accountId: string) {
    await this.transactions.run(async context => {
      const hint = await this.repository.inviteHint(this.inviteHash(token), context);
      if (!hint) throw new BusinessError('NOT_FOUND');
      requireActiveCamp(await this.repository.find(hint.campId, context, true));
      const invite = await this.repository.lockInvite(this.inviteHash(token), context);
      if (!invite) throw new BusinessError('STATE_CONFLICT');
      requirePendingInvite(invite, this.clock.now());
      await this.repository.decline(invite.id, accountId, context);
    });
  }
  async accept(token: string, accountId: string) {
    const result = await this.transactions.run(async context => {
      const hint = await this.repository.inviteHint(this.inviteHash(token), context);
      if (!hint) throw new BusinessError('NOT_FOUND');
      requireActiveCamp(await this.repository.find(hint.campId, context, true));
      const invite = await this.repository.lockInvite(this.inviteHash(token), context);
      if (!invite) throw new BusinessError('NOT_FOUND');
      if (invite.status !== 'pending' || invite.expiresAt <= this.clock.now()) {
        if (invite.status === 'pending') await this.repository.setInviteStatus(invite.id, 'expired', context);
        // Preserve the existing rollback: the expiry marker is not committed on this path.
        throw new BusinessError('STATE_CONFLICT');
      }
      if (await this.repository.declined(invite.id, accountId, context)) throw new BusinessError('STATE_CONFLICT');
      const active = await this.repository.lockActiveMembers(invite.campId, context);
      const existing = active.find(value => value.accountId === accountId);
      if (!existing && active.length >= 8) throw new BusinessError('STATE_CONFLICT');
      if (!existing) await this.repository.join(invite.campId, accountId, this.clock.now(), context);
      await this.repository.accept(invite.id, accountId, this.clock.now(), context);
      return invite.campId;
    });
    await this.analytics.record(accountId, 'camp_invite_accepted', result);
    return result;
  }
  async remove(campId: string, targetId: string, actorId: string) {
    await this.transactions.run(async context => {
      await this.repository.find(campId, context, true);
      await this.requireOwner(campId, actorId, context);
      if (targetId === actorId) throw new BusinessError('STATE_CONFLICT');
      if (!await this.repository.removeMember(campId, targetId, this.clock.now(), context)) throw new BusinessError('NOT_FOUND');
    });
  }
  async leave(campId: string, accountId: string) {
    await this.transactions.run(async context => {
      await this.repository.find(campId, context, true);
      const mine = await this.requireMember(campId, accountId, context);
      if (mine.role === 'owner') throw new BusinessError('STATE_CONFLICT');
      await this.repository.leave(mine.id, this.clock.now(), context);
    });
  }
  async transfer(campId: string, targetId: string, actorId: string) {
    await this.transactions.run(async context => {
      await this.repository.find(campId, context, true);
      await this.requireOwner(campId, actorId, context);
      const target = await this.requireMember(campId, targetId, context);
      if (targetId === actorId) return;
      await this.repository.demoteOwner(campId, actorId, context);
      await this.repository.promoteMember(target.id, context);
      await this.repository.transfer(campId, targetId, this.clock.now(), context);
    });
  }
}
