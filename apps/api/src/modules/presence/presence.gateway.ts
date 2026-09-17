import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayInit, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { heartbeatSchema, realtimeEvents, setPresenceSchema, subscribeSessionSchema } from '@beneath-the-pine/contracts';
import { API_CONFIG, ApiConfig } from '../../platform/config/api-config';
import { Inject } from '@nestjs/common';
import { IdentityService } from '../identity/public-api';
import { FocusService } from '../focus/public-api';
import type { Subscription } from 'rxjs';

type PineSocket = Socket & { data: { account?: { id: string; email: string }; sessions?: Set<string> } };
@Injectable()
@WebSocketGateway({ namespace: '/realtime' })
export class PresenceGateway implements OnGatewayInit, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server!: Namespace;
  private subscription?: Subscription;
  constructor(private readonly identity: IdentityService, private readonly focus: FocusService, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  onModuleInit() { this.subscription = this.focus.changes.subscribe(id => void this.publish(id)); }
  onModuleDestroy() { this.subscription?.unsubscribe(); }
  afterInit(server: Namespace) {
    // Complete asynchronous authentication before Socket.IO announces connect;
    // otherwise the client's first subscribe can arrive before account is set.
    server.use((socket: PineSocket, next) => {
      void (async () => {
        const current = socket.handshake.headers.origin === this.config.API_WEB_ORIGIN
          ? await this.identity.sessionFromCookie(socket.handshake.headers.cookie) : undefined;
        if (!current?.account) return next(new Error('Authentication required'));
        socket.data.account = current.account;
        socket.data.sessions = new Set();
        next();
      })().catch(() => next(new Error('Authentication unavailable')));
    });
  }
  async handleDisconnect(socket: PineSocket) { const account = socket.data.account; if (!account) return; for (const sessionId of socket.data.sessions ?? []) setTimeout(() => void this.markDisconnectedIfAbsent(sessionId, account.id), 15000).unref(); }
  @SubscribeMessage(realtimeEvents.subscribe)
  async subscribe(@ConnectedSocket() socket: PineSocket, @MessageBody() payload: unknown) { const parsed = subscribeSessionSchema.safeParse(payload); if (!parsed.success || !socket.data.account) return this.fail(socket, 'VALIDATION_FAILED'); try { const snapshot = await this.focus.snapshot(parsed.data.sessionId, socket.data.account.id); await socket.join(this.room(parsed.data.sessionId)); socket.data.sessions?.add(parsed.data.sessionId); await this.focus.setPresence(parsed.data.sessionId, socket.data.account.id, 'active'); socket.emit(realtimeEvents.snapshot, snapshot); } catch { this.fail(socket, 'FORBIDDEN'); } }
  @SubscribeMessage(realtimeEvents.heartbeat)
  async heartbeat(@ConnectedSocket() socket: PineSocket, @MessageBody() payload: unknown) { const parsed = heartbeatSchema.safeParse(payload); if (!parsed.success || !socket.data.account || !socket.data.sessions?.has(parsed.data.sessionId)) return this.fail(socket, 'FORBIDDEN'); try { await this.focus.setPresence(parsed.data.sessionId, socket.data.account.id, 'active'); socket.emit(realtimeEvents.snapshot, await this.focus.snapshot(parsed.data.sessionId, socket.data.account.id)); } catch { this.fail(socket, 'NOT_FOUND'); } }
  @SubscribeMessage(realtimeEvents.setPresence)
  async setPresence(@ConnectedSocket() socket: PineSocket, @MessageBody() payload: unknown) { const parsed = setPresenceSchema.safeParse(payload); if (!parsed.success || !socket.data.account || !socket.data.sessions?.has(parsed.data.sessionId)) return this.fail(socket, 'FORBIDDEN'); try { await this.focus.setPresence(parsed.data.sessionId, socket.data.account.id, parsed.data.presence); } catch { this.fail(socket, 'NOT_FOUND'); } }
  private room(id: string) { return `session:${id}`; }
  private fail(socket: PineSocket, code: string) { socket.emit(realtimeEvents.error, { code, message: 'Realtime request could not be completed.' }); }
  private async publish(sessionId: string) { if (!this.server) return; const sockets = await this.server.in(this.room(sessionId)).fetchSockets(); for (const socket of sockets as unknown as PineSocket[]) { const account = socket.data.account; if (!account) continue; try { const snapshot = await this.focus.snapshot(sessionId, account.id); socket.emit(snapshot.status === 'active' ? realtimeEvents.sessionUpdated : realtimeEvents.ended, snapshot); } catch { /* Membership changed; stop exposing the room. */ await socket.leave(this.room(sessionId)); } } }
  private async markDisconnectedIfAbsent(sessionId: string, accountId: string) { const sockets = await this.server.in(this.room(sessionId)).fetchSockets(); if (sockets.some(socket => (socket.data as { account?: { id: string } }).account?.id === accountId)) return; try { await this.focus.setPresence(sessionId, accountId, 'disconnected'); } catch { /* Terminal or removed participant. */ } }
}
