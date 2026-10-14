import { Injectable, Logger } from '@nestjs/common';
import {
  PresenceCachePort,
  PresenceData,
} from '@/modules/reading-rooms/application/ports/external/presence-cache.port';
import { ReadingRoomServerEvent } from './reading-room.socket-events';
import { PRESENCE_BROADCAST_DEBOUNCE_MS } from './reading-room.constants';
import { RoomSocket } from './reading-room.types';
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
    private readonly presenceCache: PresenceCachePort,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
  ) {}

  private toRoom(roomId: string) {
    return this.namespaceProvider.getServer().to(`room:${roomId}`);
  }

  /**
   */
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
      this.scheduleUrgentBroadcast(roomId);
      return;
    }

    this.scheduleLazyBroadcast(roomId);
  }

  private scheduleUrgentBroadcast(roomId: string): void {
    if (this.urgentBroadcastPending.has(roomId)) return;
    if (this.lazyBroadcastPending.has(roomId)) {
      clearTimeout(this.lazyBroadcastPending.get(roomId));
      this.lazyBroadcastPending.delete(roomId);
    }

    const timer = setTimeout(() => {
      this.doBroadcast(roomId, 'urgent');
    }, 300);
    this.urgentBroadcastPending.set(roomId, timer);
  }

  private scheduleLazyBroadcast(roomId: string): void {
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

  /**
   */
  async onJoin(
    roomId: string,
    userId: string,
    socketId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<PresenceData[]> {
    await this.presenceCache.upsertPresence(roomId, userId, socketId, data);
    this.scheduleBroadcast(roomId, 'urgent', {
      action: 'upsert',
      presence: { ...data, lastSeen: Date.now() },
    });
    return this.presenceCache.getRoomPresences(roomId);
  }

  /**
   */
  async onLeave(
    roomId: string,
    userId: string,
    socketId: string,
    options: { forceRemove?: boolean } = {},
  ): Promise<PresenceData[]> {
    if (options.forceRemove) {
      await this.presenceCache.removeUserPresences(roomId, userId);
    } else {
      const anotherSocketRemains =
        await this.presenceCache.removeSocketPresence(roomId, userId, socketId);
      if (anotherSocketRemains) {
        const presences = await this.presenceCache.getRoomPresences(roomId);
        const remainingPresence = presences.find(
          (presence) => presence.userId === userId,
        );
        if (remainingPresence) {
          this.scheduleBroadcast(roomId, 'urgent', {
            action: 'upsert',
            presence: remainingPresence,
          });
        }
        return presences;
      }
    }
    this.scheduleBroadcast(roomId, 'urgent', { action: 'remove', userId });
    return this.presenceCache.getRoomPresences(roomId);
  }

  async onHeartbeat(
    roomId: string,
    userId: string,
    socketId: string,
    payload: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void> {
    const { created, chapterChanged } = await this.presenceCache.upsertPresence(
      roomId,
      userId,
      socketId,
      payload,
    );
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
      const anotherSocketRemains =
        await this.presenceCache.removeSocketPresence(
          roomId,
          userId,
          socket.id,
        );

      if (!anotherSocketRemains) {
        this.scheduleBroadcast(roomId, 'urgent', { action: 'remove', userId });
      } else {
        const presences = await this.presenceCache.getRoomPresences(roomId);
        const remainingPresence = presences.find(
          (presence) => presence.userId === userId,
        );
        if (remainingPresence) {
          this.scheduleBroadcast(roomId, 'urgent', {
            action: 'upsert',
            presence: remainingPresence,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to check sockets on disconnect for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async removeAllFromRoom(roomId: string): Promise<void> {
    await this.presenceCache.removeRoomPresences(roomId);
  }
}

type PresenceChange =
  | { action: 'upsert'; presence: PresenceData }
  | { action: 'remove'; userId: string };
