import { Injectable, Logger } from '@nestjs/common';
import { ReadingRoomPresenceService } from '@/modules/reading-rooms/application/presence/reading-room-presence.service';
import { ReadingRoomServerEvent } from '../../reading-room.events';
import { PRESENCE_BROADCAST_DEBOUNCE_MS } from './reading-room.constants';
import { RoomSocket } from './reading-room.types';
import { PresenceData } from '@/modules/reading-rooms/domain/interfaces/presence-cache.port';
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

  /**
   * Gom delta đang chờ theo phòng; với cùng một user, change mới nhất thay change cũ.
   * Sau đó đảm bảo phòng có lịch gọi `doBroadcast` để phát các delta đã gom:
   * - `urgent` (mặc định): lên lịch sau 300 ms, thay thế timer `lazy` nếu đang chờ.
   * - `lazy`: dùng debounce cấu hình, không tạo timer mới nếu phòng đã có lịch.
   * Nếu không truyền `change`, hàm chỉ đảm bảo lịch broadcast được đặt.
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
   * Đăng ký hoặc cập nhật presence của user khi vào phòng, rồi trả danh sách presence hiện tại.
   * Sau khi lưu presence, hàm gom delta `upsert` và lên lịch broadcast urgent;
   * event sẽ được emit sau khi timer chạy, không phải ngay tại đây.
   */
  async onJoin(
    roomId: string,
    userId: string,
    socketId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<PresenceData[]> {
    await this.presenceService.upsertPresence(roomId, userId, socketId, data);
    this.scheduleBroadcast(roomId, 'urgent', {
      action: 'upsert',
      presence: { ...data, lastSeen: Date.now() },
    });
    return this.presenceService.getRoomPresences(roomId);
  }

  /**
   * Xóa presence của user khỏi phòng khi họ rời đi, rồi trả danh sách presence hiện tại.
   * Mặc định chỉ xóa nếu user không còn tab/socket nào trong phòng; `forceRemove`
   * bỏ qua bước kiểm tra đó. Khi xóa, lên lịch broadcast delta `remove` khẩn cấp.
   */
  async onLeave(
    roomId: string,
    userId: string,
    socketId: string,
    options: { forceRemove?: boolean } = {},
  ): Promise<PresenceData[]> {
    if (options.forceRemove) {
      await this.presenceService.removeUserPresences(roomId, userId);
    } else {
      const anotherSocketRemains =
        await this.presenceService.removeSocketPresence(
          roomId,
          userId,
          socketId,
        );
      if (anotherSocketRemains) {
        const presences = await this.presenceService.getRoomPresences(roomId);
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
    return this.presenceService.getRoomPresences(roomId);
  }

  async onHeartbeat(
    roomId: string,
    userId: string,
    socketId: string,
    payload: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void> {
    const { created, chapterChanged } =
      await this.presenceService.upsertPresence(
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
        await this.presenceService.removeSocketPresence(
          roomId,
          userId,
          socket.id,
        );

      if (!anotherSocketRemains) {
        this.scheduleBroadcast(roomId, 'urgent', { action: 'remove', userId });
      } else {
        const presences = await this.presenceService.getRoomPresences(roomId);
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
    await this.presenceService.removeRoomPresences(roomId);
  }
}

type PresenceChange =
  | { action: 'upsert'; presence: PresenceData }
  | { action: 'remove'; userId: string };
