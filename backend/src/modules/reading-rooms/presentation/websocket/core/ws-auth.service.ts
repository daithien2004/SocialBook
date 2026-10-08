import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Socket } from 'socket.io';
import { SocketData } from '../reading-room.types';
import {
  MAX_CONNECTIONS_PER_USER,
  CONN_STALE_MS,
} from '../reading-room.constants';
import { ErrorCode } from '@/shared/domain/error-codes';
import { AuthException } from '@/shared/domain/common-exceptions';

import { createHash } from 'crypto';

export interface JwtAuthPayload {
  sub: string;
  iat: number;
  role?: string;
  displayName: string;
  avatarUrl?: string;
}

@Injectable()
export class WsAuthService {
  private readonly logger = new Logger(WsAuthService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async authenticate(socket: Socket): Promise<SocketData> {
    const ticket = this.extractTicket(socket);
    const payload = await this.verifyTicket(ticket);
    await this.reserveConnectionSlot(payload.userId, socket.id);

    return {
      userId: payload.userId,
      role: payload.role,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
    };
  }

  private extractTicket(socket: Socket): string {
    const auth: unknown = socket.handshake.auth;
    if (typeof auth !== 'object' || auth === null || !('ticket' in auth)) {
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
    const ticket = auth.ticket;
    if (typeof ticket !== 'string') {
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
    if (ticket.length > 200) {
      this.logger.warn('WS connection rejected: ticket too long');
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
    return ticket;
  }

  private async verifyTicket(ticket: string): Promise<SocketData> {
    const hash = createHash('sha256').update(ticket).digest('hex');
    let raw: unknown;
    try {
      if (typeof this.redis.getdel === 'function') {
        raw = await this.redis.getdel(`wsticket:${hash}`);
      } else {
        raw = await this.redis.call('GETDEL', `wsticket:${hash}`);
      }
    } catch (e) {
      this.logger.error(
        'Redis GETDEL error',
        e instanceof Error ? e.stack : String(e),
      );
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }

    if (typeof raw !== 'string' || !raw) {
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }

    try {
      const data: unknown = JSON.parse(raw);
      if (typeof data !== 'object' || data === null)
        throw new Error('Invalid ticket data');

      if (
        !('userId' in data) ||
        typeof data.userId !== 'string' ||
        data.userId.length === 0
      ) {
        throw new Error('Missing userId in ticket');
      }

      if (
        !('displayName' in data) ||
        typeof data.displayName !== 'string' ||
        data.displayName.trim().length === 0
      ) {
        throw new Error('Missing displayName in ticket');
      }

      return {
        userId: data.userId,
        role:
          'role' in data && typeof data.role === 'string' ? data.role : 'user',
        displayName: data.displayName,
        avatarUrl:
          'avatarUrl' in data && typeof data.avatarUrl === 'string'
            ? data.avatarUrl
            : undefined,
      };
    } catch {
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
  }

  /**
   * Đăng ký socket vào Redis sorted set của user và giới hạn số kết nối đồng thời.
   * Trước khi đếm, xóa các slot đã quá hạn; nếu vượt giới hạn, thử gỡ slot mới
   * rồi từ chối kết nối. Lỗi Redis được ghi log và xử lý theo hướng fail-open.
   */
  private async reserveConnectionSlot(
    userId: string,
    socketId: string,
  ): Promise<void> {
    const key = `ws:conns:${userId}`;
    const now = Date.now();
    try {
      const res = await this.redis
        .multi()
        .zremrangebyscore(key, 0, now - CONN_STALE_MS)
        .zadd(key, now, socketId)
        .zcard(key)
        .pexpire(key, CONN_STALE_MS)
        .exec();

      const count = Number(res?.[2]?.[1] ?? 0);
      if (count > MAX_CONNECTIONS_PER_USER) {
        await this.redis.zrem(key, socketId);
        throw new AuthException(ErrorCode.TOO_MANY_CONNECTIONS);
      }
    } catch (error) {
      if (error instanceof AuthException) throw error;
      this.logger.warn(
        `Redis error during connection slot reservation for ${userId}, fail-open`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async touchConnection(userId: string, socketId: string): Promise<void> {
    const key = `ws:conns:${userId}`;
    try {
      await this.redis
        .multi()
        .zadd(key, 'XX', Date.now(), socketId) // chỉ cập nhật member đã tồn tại
        .pexpire(key, CONN_STALE_MS)
        .exec();
    } catch (error) {
      this.logger.debug(
        `touchConnection failed for ${userId}: ${String(error)}`,
      );
    }
  }

  async releaseConnectionSlot(userId: string, socketId: string): Promise<void> {
    if (!userId || !socketId) return;
    const key = `ws:conns:${userId}`;
    try {
      await this.redis.zrem(key, socketId);
    } catch (error) {
      this.logger.error(
        `Redis error during connection slot release for ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
