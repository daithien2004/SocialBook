import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { WsAuthService } from './core/ws-auth.service';

import { ReadingRoomPresenceCoordinator } from './reading-room-presence.coordinator';
import { ReadingProgressTracker } from './reading-progress.tracker';

import { JoinRoomCommand } from '@/modules/reading-rooms/application/commands/join-room/join-room.command';
import { LeaveRoomCommand } from '@/modules/reading-rooms/application/commands/leave-room/leave-room.command';

import { RoomSocket, SocketData, RoomSnapshot } from './reading-room.types';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { ReadingRoomServerEvent } from '../../reading-room.events';

import { toReadingRoomSnapshot } from './reading-room-snapshot.mapper';
import { WsAckResponse } from '@/shared/presentation/ws-ack.type';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';
import { UserOperationLock } from './user-operation-lock';
import { DISCONNECT_PRESENCE_GRACE_MS } from './reading-room.constants';

const roomChannel = (id: string) => `room:${id}`;
const userChannel = (id: string) => `user:${id}`;

@Injectable()
export class ReadingRoomConnectionHandler {
  private readonly logger = new Logger(ReadingRoomConnectionHandler.name);
  constructor(
    private readonly commandBus: CommandBus,
    private readonly presenceCoordinator: ReadingRoomPresenceCoordinator,
    private readonly progressTracker: ReadingProgressTracker,
    private readonly wsAuth: WsAuthService,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
    private readonly userOperationLock: UserOperationLock,
  ) {}

  /**
   * Xử lý hành động người dùng xin tham gia vào một Phòng đọc sách.
   * Các bước:
   * 1. Gửi command `JoinRoomCommand` để kiểm tra và lấy thông tin phòng từ DB.
   * 2. Thoát khỏi phòng cũ (nếu có) trên socket hiện tại để tránh xung đột.
   * 3. Thiết lập các thông tin cơ bản về phòng vào dữ liệu socket (SocketData).
   * 4. Cho socket join vào room channel.
   * 5. Đăng ký/cập nhật sự hiện diện (presence) của user trong phòng.
   * 6. Thông báo (broadcast) cho các thành viên khác trong phòng về người mới join.
   * 7. Trả về thông tin chi tiết (snapshot) của phòng cho người vừa tham gia.
   *
   * @param socket Socket của client yêu cầu join.
   * @param sd Thông tin phiên (SocketData) chứa userId và các state hiện tại.
   * @param body Payload yêu cầu join chứa roomCode.
   * @returns WsAckResponse chứa snapshot của phòng đọc.
   */
  async handleJoinRoom(
    socket: RoomSocket,
    sd: SocketData,
    body: JoinRoomDto,
  ): Promise<WsAckResponse<{ snapshot: RoomSnapshot }>> {
    return this.userOperationLock.runExclusive(sd.userId, async () => {
      const userId = sd.userId;
      const { roomCode } = body;

      const room = await this.commandBus.execute(
        new JoinRoomCommand(userId, roomCode),
      );
      const roomId = room.roomId;

      await this.leaveOldRoomIfNeeded(socket, sd, roomId);

      const displayName = sd.displayName;
      const avatarUrl = sd.avatarUrl || '';

      sd.roomId = roomId;
      sd.bookId = room.bookId;
      sd.displayName = displayName;
      sd.avatarUrl = avatarUrl;

      await socket.join(roomChannel(roomId));

      const presences = await this.presenceCoordinator.onJoin(
        roomId,
        userId,
        socket.id,
        {
          userId,
          displayName,
          avatarUrl,
          currentChapterSlug: room.currentChapterSlug,
        },
      );

      socket
        .to(roomChannel(roomId))
        .emit(ReadingRoomServerEvent.MEMBER_JOINED, {
          userId,
          displayName,
        });

      return {
        ok: true,
        snapshot: toReadingRoomSnapshot(room, presences),
      };
    });
  }

  /**
   * Xử lý hành động người dùng chủ động rời phòng đọc.
   * Các bước:
   * 1. Flush (lưu ngay lập tức) tiến độ đọc đang chờ (nếu có) vào DB.
   * 2. Gửi command `LeaveRoomCommand` để cập nhật trạng thái phòng (đổi host, đổi mode, hoặc kết thúc phòng) vào DB.
   * 3. Buộc gỡ bỏ sự hiện diện (presence) của user khỏi bộ đệm Redis.
   * 4. Ép tất cả các tab/thiết bị của user này (userChannel) rời khỏi room channel.
   * 5. Xóa thông tin phòng khỏi SocketData.
   * 6. Thông báo (broadcast) cho những người còn lại về việc user rời đi.
   *
   * @param socket Socket của client.
   * @param sd Thông tin phiên.
   * @param body Payload yêu cầu rời phòng chứa roomId.
   */
  async handleLeaveRoom(
    socket: RoomSocket,
    sd: SocketData,
    body: LeaveRoomDto,
  ): Promise<void> {
    await this.progressTracker.flush(socket);

    return this.userOperationLock.runExclusive(sd.userId, async () => {
      const userId = sd.userId;
      const roomId = body.roomId;

      const command = new LeaveRoomCommand(userId, roomId, body.newHostId);
      const result = await this.commandBus.execute(command);

      await this.presenceCoordinator.onLeave(roomId, userId, socket.id, {
        forceRemove: true,
      });

      if (result.roomEnded) {
        try {
          const namespace = this.namespaceProvider.getServer();
          namespace
            .to(roomChannel(roomId))
            .emit(ReadingRoomServerEvent.ROOM_ENDED, { roomId });
          namespace.in(roomChannel(roomId)).socketsLeave(roomChannel(roomId));
        } catch {
          // Server not initialized
        }
        await this.presenceCoordinator.removeAllFromRoom(roomId);
      } else {
        try {
          const namespace = this.namespaceProvider.getServer();
          namespace.in(userChannel(userId)).socketsLeave(roomChannel(roomId));
          namespace
            .to(roomChannel(roomId))
            .emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });
        } catch {
          // Server not initialized
        }
      }
      delete sd.roomId;
    });
  }

  async handleDisconnect(socket: RoomSocket): Promise<void> {
    const { userId, roomId } = socket.data;
    try {
      await this.progressTracker.dispose(socket);
    } catch (error) {
      this.logger.error(
        'Error disposing progress tracker',
        error instanceof Error ? error.stack : String(error),
      );
    }

    if (!roomId) return;

    try {
      await this.userOperationLock.runExclusive(userId, () => {
        const timer = setTimeout(() => {
          void this.userOperationLock
            .runExclusive(userId, async () => {
              await this.presenceCoordinator.onDisconnect(socket);
            })
            .catch((error: unknown) => {
              this.logger.error(
                `Failed delayed disconnect cleanup for user ${userId}`,
                error instanceof Error ? error.stack : String(error),
              );
            });
        }, DISCONNECT_PRESENCE_GRACE_MS);
        timer.unref();
        return Promise.resolve();
      });
    } catch (error) {
      this.logger.error(
        `Failed to schedule disconnect cleanup for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Xử lý tín hiệu Heartbeat từ client để duy trì trạng thái online và cập nhật tiến độ đọc.
   * Các bước:
   * 1. Cập nhật thời gian online cuối cùng của kết nối vào WsAuthService.
   * 2. Kiểm tra xem tab/socket này có đang bị "cướp quyền" bởi tab khác không (mất room channel). Nếu có, dừng xử lý.
   * 3. Ghi nhận thông tin hiện diện (tọa độ đọc, % tiến độ) vào PresenceCoordinator để không bị timeout.
   * 4. Đặt lịch (schedule) lưu tiến độ đọc (progress) vào DB theo cơ chế debounce.
   *
   * @param socket Socket của client.
   * @param sd Thông tin phiên hiện tại.
   * @param body Payload chứa chương đang đọc, đoạn đang xem và % tiến độ.
   */
  async handleHeartbeat(
    socket: RoomSocket,
    sd: SocketData,
    body: HeartbeatDto,
  ): Promise<void> {
    const { userId, displayName, avatarUrl = '' } = sd;

    await this.wsAuth.touchConnection(userId, socket.id);

    // Bị tab khác thay đổi room
    if (sd.roomId && !socket.rooms.has(roomChannel(sd.roomId))) {
      this.logger.debug(
        `Socket ${socket.id} bị loại khỏi phòng ${sd.roomId} bởi một tab khác`,
      );
      delete sd.roomId;
      return;
    }

    const chapterSlug = body.chapterSlug || '';
    const chapterId = body.chapterId;
    const paragraphId = body.paragraphId || undefined;
    const progress =
      body.progress !== undefined ? Math.round(body.progress) : undefined;

    if (sd.roomId) {
      await this.presenceCoordinator.onHeartbeat(sd.roomId, userId, socket.id, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: chapterSlug,
        paragraphId: paragraphId,
        progress: progress,
      });

      if (sd.bookId && chapterId && progress !== undefined) {
        this.progressTracker.schedule(socket, sd.bookId, chapterId, progress);
      }
    }
  }

  /**
   * Thoát socket khỏi phòng cũ nếu người dùng chuyển từ một phòng sang phòng khác trên cùng một tab.
   * Lưu ý: Chỉ leave khỏi channel và xóa presence, KHÔNG gửi `LeaveRoomCommand` vì có thể user
   * vẫn đang mở phòng cũ ở một tab khác, tránh việc lỡ out cả phiên.
   *
   * @param socket Socket của client.
   * @param sd Thông tin phiên hiện tại.
   * @param newRoomId ID của phòng mới sắp join.
   */
  private async leaveOldRoomIfNeeded(
    socket: RoomSocket,
    sd: SocketData,
    newRoomId: string,
  ) {
    if (sd.roomId && sd.roomId !== newRoomId) {
      // Gọi leave socket nhưng không bắn LeaveRoomCommand vì có thể user chỉ switch tab
      await socket.leave(roomChannel(sd.roomId));
      await this.presenceCoordinator.onLeave(sd.roomId, sd.userId, socket.id);
    }
  }
}
