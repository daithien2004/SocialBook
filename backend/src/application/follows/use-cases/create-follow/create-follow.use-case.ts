import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Follow } from '@/domain/follows/entities/follow.entity';
import { FollowId } from '@/domain/follows/value-objects/follow-id.vo';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { CreateFollowCommand } from './create-follow.command';

@Injectable()
export class CreateFollowUseCase {
  private readonly logger = new Logger(CreateFollowUseCase.name);

  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: CreateFollowCommand): Promise<Follow> {
    try {
      const userId = UserId.create(command.userId);
      const targetId = TargetId.create(command.targetId);

      if (userId.getValue() === targetId.getValue()) {
        throw new BadRequestDomainException('User cannot follow themselves');
      }

      const existingFollow = await this.followRepository.exists(
        userId,
        targetId,
      );

      if (existingFollow) {
        existingFollow.toggleStatus();
        await this.followRepository.save(existingFollow);

        this.logger.log(
          `Follow status toggled to ${existingFollow.isActive()} successfully: ${existingFollow.id.toString()} (User: ${command.userId} -> Target: ${command.targetId})`,
        );

        return existingFollow;
      } else {
        const newFollow = Follow.create({
          id: FollowId.create(this.idGenerator.generate()),
          userId: command.userId,
          targetId: command.targetId,
          status: true,
        });

        await this.followRepository.save(newFollow);

        this.logger.log(
          `Follow created successfully: ${newFollow.id.toString()} (User: ${command.userId} -> Target: ${command.targetId})`,
        );

        this.eventEmitter.emit('user.followed', {
          userId: command.userId,
          targetId: command.targetId,
        });

        return newFollow;
      }
    } catch (error) {
      this.logger.error(
        `Failed to create follow: ${command.userId} -> ${command.targetId}`,
        error,
      );
      throw error;
    }
  }
}
