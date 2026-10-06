import { Injectable, Logger } from '@nestjs/common';
import { ReadingRoomPresenceService } from '@/application/reading-rooms/presence/reading-room-presence.service';
import { ReadingRoomServerEvent } from './reading-room.events';
import { PRESENCE_BROADCAST_DEBOUNCE_MS } from './reading-room.constants';
import { RoomSocket } from './reading-room.types';
import { PresenceData } from '@/domain/reading-rooms/interfaces/presence-cache.port';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';

@Injectable()
export class ReadingRoomPresenceCoordinator {
  private readonly logger = new Logger(ReadingRoomPresenceCoordinator.name);
  private readonly lazyBroadcastPending = new Map<string, NodeJS.Timeout>();
  private readonly urgentBroadcastPending = new Map<string, NodeJS.Timeout>();
  private readonly pendingChanges = new Map<
    string,
    Map<string, PresenceChange>
  >();

  constructor(
    private readonly presenceService: ReadingRoomPresenceService,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
  ) {}

  private toRoom(roomId: string) {
    return this.namespaceProvider.getServer().to(`room:${roomId}`);
  }

  private async hasOtherTabsInRoom(
    userId: string,
    roomId: string,
  ): Promise<boolean> {
    const userSockets = await this.namespaceProvider
      .getServer()
      .in(`user:${userId}`)
      .fetchSockets();
    return userSockets.some((s) => s.rooms.has(`room:${roomId}`));
  }

  scheduleBroadcast(
    roomId: string,
    urgency: 'urgent' | 'lazy' = 'urgent',
    change?: PresenceChange,
  ): void {
    if (change) {
      const roomChanges =
        this.pendingChanges.get(roomId) ?? new Map<string, PresenceChange>();
      roomChanges.set(
        change.action === 'upsert' ? change.presence.userId : change.userId,
        change,
      );
      this.pendingChanges.set(roomId, roomChanges);
    }

    if (urgency === 'urgent') {
      if (this.urgentBroadcastPending.has(roomId)) return;
      if (this.lazyBroadcastPending.has(roomId)) {
        clearTimeout(this.lazyBroadcastPending.get(roomId));
        this.lazyBroadcastPending.delete(roomId);
      }
      const timer = setTimeout(
        () => {
          this.doBroadcast(roomId, 'urgent');
        },
        300, // 300ms debounce cho các sự kiện tức thì
      );
      this.urgentBroadcastPending.set(roomId, timer);
    } else {
      if (
        this.urgentBroadcastPending.has(roomId) ||
        this.lazyBroadcastPending.has(roomId)
      ) {
        return;
      }
      const timer = setTimeout(() => {
        this.doBroadcast(roomId, 'lazy');
      }, PRESENCE_BROADCAST_DEBOUNCE_MS);
      this.lazyBroadcastPending.set(roomId, timer);
    }
  }

  private doBroadcast(roomId: string, urgency: 'urgent' | 'lazy'): void {
    if (urgency === 'urgent') this.urgentBroadcastPending.delete(roomId);
    if (urgency === 'lazy') this.lazyBroadcastPending.delete(roomId);

    try {
      const changes = [...(this.pendingChanges.get(roomId)?.values() ?? [])];
      this.pendingChanges.delete(roomId);
      if (changes.length === 0) return;
      this.toRoom(roomId).emit(ReadingRoomServerEvent.PRESENCE_UPDATE, changes);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast presences for room ${roomId}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
  }

  async onJoin(
    roomId: string,
    userId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<PresenceData[]> {
    await this.presenceService.upsertPresence(roomId, userId, data);
    this.scheduleBroadcast(roomId, 'urgent', {
      action: 'upsert',
      presence: { ...data, lastSeen: Date.now() },
    });
    return this.presenceService.getRoomPresences(roomId);
  }

  async onLeave(
    roomId: string,
    userId: string,
    options: { forceRemove?: boolean } = {},
  ): Promise<PresenceData[]> {
    let removed = false;
    if (options.forceRemove) {
      await this.presenceService.removePresence(roomId, userId);
      removed = true;
    } else {
      const hasOtherTabs = await this.hasOtherTabsInRoom(userId, roomId);
      if (!hasOtherTabs) {
        await this.presenceService.removePresence(roomId, userId);
        removed = true;
      }
    }
    if (removed) {
      this.scheduleBroadcast(roomId, 'urgent', { action: 'remove', userId });
    }
    return this.presenceService.getRoomPresences(roomId);
  }

  async onHeartbeat(
    roomId: string,
    userId: string,
    payload: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void> {
    const { created, chapterChanged } =
      await this.presenceService.upsertPresence(roomId, userId, payload);
    const urgency = created || chapterChanged ? 'urgent' : 'lazy';
    this.scheduleBroadcast(roomId, urgency, {
      action: 'upsert',
      presence: { ...payload, lastSeen: Date.now() },
    });
  }

  async onDisconnect(socket: RoomSocket): Promise<void> {
    const { userId, roomId } = socket.data;
    if (!roomId || !userId) return;

    try {
      const hasOtherTabs = await this.hasOtherTabsInRoom(userId, roomId);

      if (!hasOtherTabs) {
        await this.presenceService.removePresence(roomId, userId);
        this.scheduleBroadcast(roomId, 'urgent', { action: 'remove', userId });
      }
    } catch (error) {
      this.logger.error(
        `Failed to check sockets on disconnect for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async removeAllFromRoom(roomId: string): Promise<void> {
    const presences = await this.presenceService.getRoomPresences(roomId);
    await Promise.all(
      presences.map((p) =>
        this.presenceService.removePresence(roomId, p.userId),
      ),
    );
  }
}

type PresenceChange =
  | { action: 'upsert'; presence: PresenceData }
  | { action: 'remove'; userId: string };
