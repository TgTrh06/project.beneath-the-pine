import { BusinessError } from '../../../shared/kernel/business-error';
import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayInit, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { heartbeatSchema, realtimeEvents, setPresenceSchema, subscribeSessionSchema } from '@pyneath/contracts';
import { API_CONFIG, ApiConfig } from '../../../platform/config/api-config';
import { Inject } from '@nestjs/common';
import { IDENTITY_ACCESS, type IdentityAccess } from '../../identity/public-api';
import { sessionTokenFromCookie } from '../../../platform/http/session-cookie';
import type { EventSubscription } from '../../../shared/kernel/events';
import { FOCUS_ACCESS, type FocusAccess } from '../../focus/public-api';
import { PREFERENCES_ACCESS, type PreferencesAccess } from '../../preferences/public-api';

type PineSocket = Socket & { data: { account?: { id: string; email: string }; sessions?: Set<string> } };
@Injectable()
@WebSocketGateway({ namespace: '/realtime' })
export class PresenceGateway implements OnGatewayInit, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server!: Namespace;
  private readonly sockets = new Map<string, PineSocket>();
  private readonly expiryTimers = new Map<string, NodeJS.Timeout>();
  private readonly disconnectTimers = new Set<NodeJS.Timeout>();
  private readonly identitySubscriptions: EventSubscription[] = [];
  private destroyed = false;
  private subscription?: EventSubscription;
  private presenceSubscription?: EventSubscription;
  private preferenceSubscription?: EventSubscription;
  constructor(@Inject(IDENTITY_ACCESS) private readonly identity: IdentityAccess, @Inject(FOCUS_ACCESS) private readonly focus: FocusAccess, @Inject(PREFERENCES_ACCESS) private readonly preferences: PreferencesAccess, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  onModuleInit() {
    this.identitySubscriptions.push(
      this.identity.revokedSessions.subscribe(hash => {
        for (const socket of this.sockets.values()) {
          const token = sessionTokenFromCookie(socket.handshake.headers.cookie);
          if (token && this.identity.hashToken(token) === hash) this.deny(socket, 'UNAUTHENTICATED');
        }
      }),
      this.identity.deletedAccounts.subscribe(id => {
        for (const socket of this.sockets.values()) if (socket.data.account?.id === id) this.deny(socket, 'UNAUTHENTICATED');
      })
    );
    this.subscription = this.focus.changes.subscribe(id => void this.publish(id));
    this.presenceSubscription = this.focus.presenceChanges.subscribe(change => void this.publishPresence(change));
    this.preferenceSubscription = this.preferences.presenceSharingChanges.subscribe(accountId => void this.refreshSharedSession(accountId));
  }
  onModuleDestroy() {
    this.destroyed = true;
    this.subscription?.unsubscribe(); this.presenceSubscription?.unsubscribe(); this.preferenceSubscription?.unsubscribe();
    this.identitySubscriptions.forEach(subscription => subscription.unsubscribe());
    this.expiryTimers.forEach(timer => clearTimeout(timer)); this.expiryTimers.clear();
    this.disconnectTimers.forEach(timer => clearTimeout(timer)); this.disconnectTimers.clear();
    for (const socket of this.sockets.values()) socket.disconnect(true);
    this.sockets.clear();
  }
  private deny(socket: PineSocket, code: 'UNAUTHENTICATED' | 'SERVICE_UNAVAILABLE') {
    this.fail(socket, code);
    socket.disconnect(true);
    clearTimeout(this.expiryTimers.get(socket.id));
    this.expiryTimers.delete(socket.id);
    this.sockets.delete(socket.id);
  }
  private async authenticated(socket: PineSocket): Promise<boolean> {
    if (this.destroyed || !socket.connected || !this.sockets.has(socket.id)) return false;
    try {
      const current = await this.identity.session(sessionTokenFromCookie(socket.handshake.headers.cookie));
      if (!socket.connected || !this.sockets.has(socket.id)) return false;
      if (!current?.account || current.account.id !== socket.data.account?.id || current.session.expiresAt.getTime() <= Date.now()) {
        this.deny(socket, 'UNAUTHENTICATED'); return false;
      }
      return true;
    } catch { this.deny(socket, 'SERVICE_UNAVAILABLE'); return false; }
  }
  afterInit(server: Namespace) {
    // Complete asynchronous authentication before Socket.IO announces connect;
    // otherwise the client's first subscribe can arrive before account is set.
    server.use((socket: PineSocket, next) => {
      void (async () => {
        const current = socket.handshake.headers.origin === this.config.API_WEB_ORIGIN
          ? await this.identity.session(sessionTokenFromCookie(socket.handshake.headers.cookie)) : undefined;
        if (!current?.account || current.session.expiresAt.getTime() <= Date.now()) return next(new Error('Authentication required'));
        if (this.destroyed || socket.conn.readyState !== 'open') return next(new Error('Authentication unavailable'));
        socket.conn.once('close', () => {
          clearTimeout(this.expiryTimers.get(socket.id));
          this.expiryTimers.delete(socket.id);
          this.sockets.delete(socket.id);
        });
        socket.data.account = current.account;
        socket.data.sessions = new Set();
        this.sockets.set(socket.id, socket);
        const timer = setTimeout(() => this.deny(socket, 'UNAUTHENTICATED'), Math.max(1, current.session.expiresAt.getTime() - Date.now()));
        timer.unref(); this.expiryTimers.set(socket.id, timer);
        next();
      })().catch(() => next(new Error('Authentication unavailable')));
    });
  }
  async handleDisconnect(socket: PineSocket) {
    clearTimeout(this.expiryTimers.get(socket.id)); this.expiryTimers.delete(socket.id); this.sockets.delete(socket.id);
    const account = socket.data.account;
    if (!account || this.destroyed) return;
    for (const sessionId of socket.data.sessions ?? []) {
      const timer = setTimeout(() => {
        this.disconnectTimers.delete(timer);
        void this.markDisconnectedIfAbsent(sessionId, account.id).catch(() => undefined);
      }, 15000);
      timer.unref(); this.disconnectTimers.add(timer);
    }
  }
  @SubscribeMessage(realtimeEvents.subscribe)
  async subscribe(@ConnectedSocket() socket: PineSocket, @MessageBody() payload: unknown) {
    const parsed = subscribeSessionSchema.safeParse(payload);
    if (!parsed.success || !socket.data.account) return this.fail(socket, 'VALIDATION_FAILED');
    if (!await this.authenticated(socket)) return;
    const { sessionId } = parsed.data;
    try {
      // Authorize before joining, then join before the final snapshot so updates
      // cannot fall into a gap between the snapshot and room subscription.
      await this.focus.snapshot(sessionId, socket.data.account.id);
      await socket.join(this.room(sessionId));
      socket.data.sessions?.add(sessionId);
      if (!await this.authenticated(socket)) return;
      await this.focus.markConnected(sessionId, socket.data.account.id);
      const snapshot = await this.focus.snapshot(sessionId, socket.data.account.id);
      if (!await this.authenticated(socket)) return;
      socket.emit(realtimeEvents.snapshot, snapshot);
      if (snapshot.status !== 'active') await this.unsubscribe(socket, sessionId);
    } catch (error) {
      await this.unsubscribe(socket, sessionId);
      this.fail(socket, this.errorCode(error, 'FORBIDDEN'));
    }
  }
  @SubscribeMessage(realtimeEvents.heartbeat)
  async heartbeat(@ConnectedSocket() socket: PineSocket, @MessageBody() payload: unknown) {
    const parsed = heartbeatSchema.safeParse(payload);
    if (!parsed.success || !socket.data.account || !socket.data.sessions?.has(parsed.data.sessionId)) return this.fail(socket, 'FORBIDDEN');
    if (!await this.authenticated(socket)) return;
    try {
      await this.focus.markConnected(parsed.data.sessionId, socket.data.account.id);
      const snapshot = await this.focus.snapshot(parsed.data.sessionId, socket.data.account.id);
      if (!await this.authenticated(socket)) return;
      socket.emit(snapshot.status === 'active' ? realtimeEvents.sessionUpdated : realtimeEvents.ended, snapshot);
      if (snapshot.status !== 'active') await this.unsubscribe(socket, parsed.data.sessionId);
    } catch (error) {
      if (this.shouldLeave(error)) await this.unsubscribe(socket, parsed.data.sessionId);
      this.fail(socket, this.errorCode(error, 'NOT_FOUND'));
    }
  }
  @SubscribeMessage(realtimeEvents.setPresence)
  async setPresence(@ConnectedSocket() socket: PineSocket, @MessageBody() payload: unknown) {
    const parsed = setPresenceSchema.safeParse(payload);
    if (!parsed.success || !socket.data.account || !socket.data.sessions?.has(parsed.data.sessionId)) return this.fail(socket, 'FORBIDDEN');
    if (!await this.authenticated(socket)) return;
    try { await this.focus.setPresence(parsed.data.sessionId, socket.data.account.id, parsed.data.presence); }
    catch (error) {
      if (this.shouldLeave(error)) await this.unsubscribe(socket, parsed.data.sessionId);
      this.fail(socket, this.errorCode(error, 'NOT_FOUND'));
    }
  }
  private room(id: string) { return `session:${id}`; }
  private fail(socket: PineSocket, code: string) { socket.emit(realtimeEvents.error, { code, message: 'Realtime request could not be completed.' }); }
  private async unsubscribe(socket:PineSocket,sessionId:string) { socket.data.sessions?.delete(sessionId); await socket.leave(this.room(sessionId)); }
  private errorCode(error: unknown, fallback: string) {
    if (error instanceof BusinessError) {
      if (error.code === 'STATE_CONFLICT') return 'CONFLICT';
      return ['FORBIDDEN', 'NOT_FOUND'].includes(error.code) ? error.code : fallback;
    }
    return error instanceof ForbiddenException ? 'FORBIDDEN' : error instanceof NotFoundException ? 'NOT_FOUND' : error instanceof ConflictException ? 'CONFLICT' : fallback;
  }
  private shouldLeave(error: unknown) {
    if (error instanceof BusinessError) return ['FORBIDDEN', 'NOT_FOUND', 'STATE_CONFLICT'].includes(error.code);
    return error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof ConflictException;
  }
  private async publishPresence(change: { sessionId: string; accountId: string; presence: 'active' | 'break' | 'disconnected' }) {
    if (!this.server) return;
    const sockets = [...this.sockets.values()].filter(socket => socket.rooms.has(this.room(change.sessionId)));
    for (const socket of sockets) {
      const account = socket.data.account;
      if (!account || !await this.authenticated(socket)) continue;
      try {
        const snapshot = await this.focus.snapshot(change.sessionId, account.id);
        const current = snapshot.participants.find(person => person.accountId === change.accountId);
        if (current && current.presence !== 'checked_out' && await this.authenticated(socket)) {
          socket.emit(realtimeEvents.presenceUpdated, {sessionId:change.sessionId,accountId:change.accountId,presence:current.presence});
        }
      } catch {
        /* Membership changed; stop exposing the room. */
        await this.unsubscribe(socket,change.sessionId);
      }
    }
  }
  private async publish(sessionId: string) {
    if (!this.server) return;
    for (const socket of [...this.sockets.values()].filter(value => value.rooms.has(this.room(sessionId)))) {
      const account = socket.data.account;
      if (!account || !await this.authenticated(socket)) continue;
      try {
        const snapshot = await this.focus.snapshot(sessionId, account.id);
        if (!await this.authenticated(socket)) continue;
        socket.emit(snapshot.status === 'active' ? realtimeEvents.sessionUpdated : realtimeEvents.ended, snapshot);
        if (snapshot.status !== 'active') await this.unsubscribe(socket, sessionId);
      } catch { this.fail(socket, 'FORBIDDEN'); await this.unsubscribe(socket, sessionId); }
    }
  }
  private async refreshSharedSession(accountId: string) {
    try {
      const session = await this.focus.active(accountId);
      if (session?.kind === 'pact') await this.publish(session.id);
    } catch { /* The preference was saved; the next heartbeat still sends a fresh snapshot. */ }
  }
  private async markDisconnectedIfAbsent(sessionId: string, accountId: string) { const sockets = await this.server.in(this.room(sessionId)).fetchSockets(); if (sockets.some(socket => (socket.data as { account?: { id: string } }).account?.id === accountId)) return; try { await this.focus.setPresence(sessionId, accountId, 'disconnected'); } catch { /* Terminal or removed participant. */ } }
}
