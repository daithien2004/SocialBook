import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { ReadingRoomPresenceService } from '@/application/reading-rooms/presence/reading-room-presence.service';
import { ReadingRoomServerEvent } from './reading-room.events';
import { PRESENCE_BROADCAST_DEBOUNCE_MS } from './reading-room.constants';
import { RoomSocket } from './reading-room.types';
import { PresenceData } from '@/domain/reading-rooms/interfaces/presence-cache.port';

@Injectable()
export class ReadingRoomPresenceCoordinator {
  private readonly logger = new Logger(ReadingRoomPresenceCoordinator.name);
  private readonly presenceBroadcastPending = new Map<string, NodeJS.Timeout>();
  private server!: Namespace;

  constructor(private readonly presenceService: ReadingRoomPresenceService) {}

  setServer(server: Namespace) {
    this.server = server;
  }

  private toRoom(roomId: string) {
    return this.server.to(`room:${roomId}`);
  }

  private async hasOtherTabsInRoom(
    userId: string,
    roomId: string,
  ): Promise<boolean> {
    const userSockets = await this.server.in(`user:${userId}`).fetchSockets();
    return userSockets.some((s) => s.rooms.has(`room:${roomId}`));
  }

  scheduleBroadcast(roomId: string): void {
    if (this.presenceBroadcastPending.has(roomId)) return;
    const timer = setTimeout(() => {
      this.presenceBroadcastPending.delete(roomId);
      this.presenceService
        .getRoomPresences(roomId)
        .then((presences) => {
          this.toRoom(roomId).emit(
            ReadingRoomServerEvent.PRESENCE_UPDATE,
            presences,
          );
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Failed to broadcast presences for room ${roomId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }, PRESENCE_BROADCAST_DEBOUNCE_MS);
    this.presenceBroadcastPending.set(roomId, timer);
  }

  async onJoin(
    roomId: string,
    userId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<PresenceData[]> {
    await this.presenceService.upsertPresence(roomId, userId, data);
    return await this.presenceService.getRoomPresences(roomId);
  }

  async onLeave(
    roomId: string,
    userId: string,
    force = false,
  ): Promise<PresenceData[]> {
    if (force) {
      await this.presenceService.removePresence(roomId, userId);
    } else {
      const hasOtherTabs = await this.hasOtherTabsInRoom(userId, roomId);
      if (!hasOtherTabs) {
        await this.presenceService.removePresence(roomId, userId);
      }
    }
    return await this.presenceService.getRoomPresences(roomId);
  }

  async onHeartbeat(
    roomId: string,
    userId: string,
    payload: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void> {
    await this.presenceService.upsertPresence(roomId, userId, payload);
    this.scheduleBroadcast(roomId);
  }

  async onDisconnect(socket: RoomSocket): Promise<void> {
    const { userId, roomId } = socket.data;
    if (!roomId || !userId) return;

    try {
      const hasOtherTabs = await this.hasOtherTabsInRoom(userId, roomId);

      if (!hasOtherTabs) {
        await this.presenceService.removePresence(roomId, userId);
        const roomPresences =
          await this.presenceService.getRoomPresences(roomId);
        this.toRoom(roomId).emit(
          ReadingRoomServerEvent.PRESENCE_UPDATE,
          roomPresences,
        );
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
