import { Injectable, Logger } from '@nestjs/common';
import { Dispatcher } from '@/application/common/dispatcher';
import { WsAuthService } from '../core/ws-auth.service';

import { ReadingRoomPresenceCoordinator } from './reading-room-presence.coordinator';
import { ReadingRoomEmitter } from './reading-room.emitter';
import { ReadingProgressTracker } from './reading-progress.tracker';

import { JoinRoomCommand } from '@/application/reading-rooms/commands/join-room/join-room.command';
import { LeaveRoomCommand } from '@/application/reading-rooms/commands/leave-room/leave-room.command';

import { RoomSocket, SocketData, RoomSnapshot } from './reading-room.types';
import { JoinRoomDto } from '../dto/join-room.dto';
import { LeaveRoomDto } from '../dto/leave-room.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { ReadingRoomServerEvent } from './reading-room.events';

import { toReadingRoomSnapshot } from './reading-room-snapshot.mapper';
import { WsAckResponse } from '@/shared/presentation/ws-ack.type';
import { KeyedQueue } from './utils/keyed-queue';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';

const roomChannel = (id: string) => `room:${id}`;
const userChannel = (id: string) => `user:${id}`;

@Injectable()
export class ReadingRoomConnectionHandler {
  private readonly logger = new Logger(ReadingRoomConnectionHandler.name);
  private readonly userQueue = new KeyedQueue();

  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly presenceCoordinator: ReadingRoomPresenceCoordinator,
    private readonly emitter: ReadingRoomEmitter,
    private readonly progressTracker: ReadingProgressTracker,
    private readonly wsAuth: WsAuthService,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
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
    return this.userQueue.enqueue(sd.userId, async () => {
      const userId = sd.userId;
      const { roomCode } = body;

      const room = await this.dispatcher.command(
        new JoinRoomCommand(userId, roomCode),
      );
      const roomId = room.roomId;

      await this.leaveOldRoomIfNeeded(socket, sd, roomId);

      const displayName = sd.displayName || 'Khách';
      const avatarUrl = sd.avatarUrl || '';

      sd.roomId = roomId;
      sd.bookId = room.bookId;
      sd.displayName = displayName;
      sd.avatarUrl = avatarUrl;

      await socket.join(roomChannel(roomId));

      const presences = await this.presenceCoordinator.onJoin(roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: room.currentChapterSlug,
      });

      this.broadcastJoinEvents(socket, roomId, userId, displayName);

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
    return this.userQueue.enqueue(sd.userId, async () => {
      const userId = sd.userId;
      const roomId = body.roomId;

      await this.progressTracker.flush(socket);

      const command = new LeaveRoomCommand(userId, roomId, body.newHostId);
      const result = await this.dispatcher.command(command);

      await this.presenceCoordinator.onLeave(roomId, userId, {
        forceRemove: true,
      });

      try {
        this.namespaceProvider
          .getServer()
          .in(userChannel(userId))
          .socketsLeave(roomChannel(roomId));
      } catch {
        // Server not initialized
      }
      delete sd.roomId;

      if (result.roomEnded) {
        await this.presenceCoordinator.removeAllFromRoom(roomId);
      }

      this.broadcastLeaveEvents(roomId, userId);
    });
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
    const { userId, displayName = '', avatarUrl = '' } = sd;

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

    if (displayName && sd.roomId) {
      await this.presenceCoordinator.onHeartbeat(sd.roomId, userId, {
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
    } else {
      this.logger.warn(
        `Heartbeat bị bỏ qua do thiếu displayName hoặc roomId cho user ${userId}`,
      );
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
      await this.presenceCoordinator.onLeave(sd.roomId, sd.userId);
    }
  }

  /**
   * Phát đi các sự kiện khi có một người dùng mới gia nhập phòng.
   * Các bước:
   * 1. Emit sự kiện `MEMBER_JOINED` đến toàn bộ những người khác trong phòng.
   * 2. Emit toàn bộ danh sách presence mới nhất đến toàn bộ phòng để cập nhật UI danh sách người online.
   *
   * @param socket Socket của người vừa join.
   * @param roomId ID của phòng.
   * @param userId ID của người dùng.
   * @param displayName Tên hiển thị.
   * @param presences Danh sách online hiện tại.
   */
  private broadcastJoinEvents(
    socket: RoomSocket,
    roomId: string,
    userId: string,
    displayName: string,
  ) {
    socket.to(roomChannel(roomId)).emit(ReadingRoomServerEvent.MEMBER_JOINED, {
      userId,
      displayName,
    });
  }

  /**
   * Phát đi các sự kiện khi có một người dùng rời phòng đọc.
   * Các bước:
   * 1. Báo tin `MEMBER_LEFT` cho những người còn lại biết user này đã đi.
   * 2. Emit lại toàn bộ danh sách presence mới nhất.
   *
   * @param roomId ID phòng.
   * @param userId ID người rời đi.
   * @param result Kết quả trả về từ `LeaveRoomCommand`.
   * @param presences Danh sách online sau khi user đi.
   */
  private broadcastLeaveEvents(roomId: string, userId: string) {
    const room = this.emitter.toRoom(roomId);
    room.emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });
  }
}
