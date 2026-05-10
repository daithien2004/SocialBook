import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEvent } from '@/domain/analytics/entities/user-event.entity';
import { TrackUserEventDto } from '@/presentation/analytics/dto/track-user-event.dto';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class TrackUserEventUseCase {
  constructor(
    private readonly analyticsRepository: IUserAnalyticsRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, dto: TrackUserEventDto): Promise<void> {
    const event = UserEvent.create({
      id: this.idGenerator.generate(),
      userId,
      ...dto,
    });

    await this.analyticsRepository.saveEvent(event);

    this.eventEmitter.emit('user-event.tracked', {
      userId,
      event,
    });
  }
}
