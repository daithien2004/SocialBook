import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { Comment as CommentEntity } from '@/modules/comments/domain/entities/comment.entity';
import {
  ICommentRepository,
  ParentResolutionResult,
} from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentDepth } from '@/modules/comments/domain/value-objects/comment-depth.vo';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { CommentTargetType } from '@/modules/comments/domain/value-objects/comment-target-type.vo';
import { TargetId } from '@/modules/comments/domain/value-objects/target-id.vo';
import { CommentMapper } from './comment.mapper';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findById(id: CommentId): Promise<CommentEntity | null> {
    const row = await this.transactionHost.tx.comment.findUnique({
      where: { id: id.toString(), isDeleted: false },
    });
    return row ? CommentMapper.toDomain(row) : null;
  }

  async save(comment: CommentEntity): Promise<void> {
    const data = CommentMapper.toCreateInput(comment);
    await this.transactionHost.tx.comment.upsert({
      where: { id: comment.id.toString() },
      create: data,
      update: {
        targetType: data.targetType,
        targetId: data.targetId,
        parentId: data.parentId,
        content: data.content,
        likesCount: data.likesCount,
        isFlagged: data.isFlagged,
        moderationReason: data.moderationReason,
        moderationStatus: data.moderationStatus,
        updatedAt: data.updatedAt,
      },
    });
  }

  async delete(id: CommentId): Promise<void> {
    await this.transactionHost.tx.comment.updateMany({
      where: { id: id.toString(), isDeleted: false },
      data: { isDeleted: true },
    });
  }

  async resolveParentId(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: string | null,
  ): Promise<ParentResolutionResult> {
    if (!parentId)
      return { effectiveParentId: null, level: CommentDepth.create(1) };
    const target = await this.transactionHost.tx.comment.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        targetId: true,
        targetType: true,
        parentId: true,
        isDeleted: true,
      },
    });
    if (!target || target.isDeleted)
      throw new NotFoundException('Parent comment not found');
    if (target.targetId !== targetId.toString())
      throw new ForbiddenException(
        'Parent comment does not belong to this target',
      );
    if (target.targetType !== targetType.toString())
      throw new ForbiddenException('Parent comment target type mismatch');
    if (!target.parentId)
      return { effectiveParentId: target.id, level: CommentDepth.create(2) };
    const parent = await this.transactionHost.tx.comment.findUnique({
      where: { id: target.parentId },
      select: { id: true, parentId: true, isDeleted: true },
    });
    if (!parent || parent.isDeleted)
      throw new NotFoundException('Parent comment not found');
    return {
      effectiveParentId: parent.parentId ? parent.id : target.id,
      level: CommentDepth.maxAllowed(),
    };
  }
}
