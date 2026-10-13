import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { Like as LikeEntity } from '@/modules/likes/domain/entities/like.entity';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';
import { UserId } from '@/modules/likes/domain/value-objects/user-id.vo';
import { LikeMapper } from './like.mapper';

@Injectable()
export class LikeRepository implements ILikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(like: LikeEntity): Promise<void> {
    await this.prisma.like.upsert({
      where: {
        userId_targetType_targetId: {
          userId: like.userId.toString(),
          targetType: like.targetType,
          targetId: like.targetId.toString(),
        },
      },
      create: {
        id: like.id,
        userId: like.userId.toString(),
        targetId: like.targetId.toString(),
        targetType: like.targetType,
        status: like.status,
        createdAt: like.createdAt,
        updatedAt: like.updatedAt,
      },
      update: { status: like.status, updatedAt: like.updatedAt },
    });
  }

  async findByUserAndTarget(
    userId: UserId,
    targetId: TargetId,
    targetType: TargetType,
  ): Promise<LikeEntity | null> {
    const row = await this.prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: userId.toString(),
          targetType,
          targetId: targetId.toString(),
        },
      },
    });
    return row ? LikeMapper.toDomain(row) : null;
  }

  countByTarget(targetId: TargetId, targetType: TargetType): Promise<number> {
    return this.prisma.like.count({
      where: { targetId: targetId.toString(), targetType, status: true },
    });
  }
}
