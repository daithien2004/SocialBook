import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Socket } from 'socket.io';
import { SocketData } from './reading-room.types';
import { MAX_CONNECTIONS_PER_USER, CONN_STALE_MS } from './reading-room.constants';
import { ErrorCode } from '@/shared/domain/error-codes';
import { AuthException } from '@/shared/domain/common-exceptions';

export interface JwtAuthPayload {
  sub: string;
  iat: number;
  role?: string;
  displayName?: string;
  avatarUrl?: string;
}

@Injectable()
export class WsAuthService {
  private readonly logger = new Logger(WsAuthService.name);

  constructor(
    private readonly jwt: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async authenticate(socket: Socket): Promise<SocketData> {
    const token = this.extractToken(socket);
    const payload = await this.verifyToken(token);
    await this.assertNotRevoked(payload);
    await this.reserveConnectionSlot(payload.sub, socket.id);

    return {
      userId: payload.sub,
      role: payload.role ?? 'user',
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
    };
  }

  private extractToken(socket: Socket): string {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
    if (token.length > 2000) {
      this.logger.warn('WS connection rejected: token too long');
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
    return token;
  }

  private async verifyToken(token: string): Promise<JwtAuthPayload> {
    let payload: Partial<JwtAuthPayload>;
    try {
      payload = await this.jwt.verifyAsync<Partial<JwtAuthPayload>>(token, {
        algorithms: ['HS256'],
      });
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      throw new AuthException(
        name === 'TokenExpiredError' ? ErrorCode.TOKEN_EXPIRED : ErrorCode.UNAUTHORIZED,
      );
    }
    
    if (!payload.sub || typeof payload.iat !== 'number') {
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }

    return payload as JwtAuthPayload;
  }

  private async assertNotRevoked(payload: JwtAuthPayload): Promise<void> {
    let revokedAt: string | null;
    try {
      revokedAt = await this.redis.get(`auth:revoked:${payload.sub}`);
    } catch (error) {
      this.logger.error(
        `Redis error during revoke check for ${payload.sub}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new AuthException(ErrorCode.UNAUTHORIZED);
    }
    
    if (!revokedAt) return;

    const revokedAtSec = Math.floor(Number(revokedAt) / 1000);
    if (!Number.isFinite(revokedAtSec) || payload.iat < revokedAtSec) {
      this.logger.warn(`WS handshake rejected: token revoked for user ${payload.sub}`);
      throw new AuthException(ErrorCode.TOKEN_REVOKED);
    }
  }

  private async reserveConnectionSlot(userId: string, socketId: string): Promise<void> {
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
      this.logger.debug(`touchConnection failed for ${userId}: ${String(error)}`);
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
