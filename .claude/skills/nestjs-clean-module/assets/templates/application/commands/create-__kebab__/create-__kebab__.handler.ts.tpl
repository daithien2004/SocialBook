import { randomUUID } from 'node:crypto';
import { ForbiddenError } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DomainEvent } from '@/shared/domain/domain-event';
import { __Name__ } from '../../../domain/entities/__kebab__.entity';
import { __Name__Repository } from '../../../domain/repositories/__kebab__.repository';
import { Create__Name__Command } from './create-__kebab__.command';

@CommandHandler(Create__Name__Command)
export class Create__Name__Handler implements ICommandHandler<Create__Name__Command, string> {
  constructor(
    private readonly repository: __Name__Repository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: Create__Name__Command): Promise<string> {
    const { id, events } = await this.create(cmd); // transaction kết thúc ở đây
    this.eventBus.publishAll(events); // publish sau khi đã commit
    return id;
  }

  @Transactional()
  private async create({
    title,
    actor,
  }: Create__Name__Command): Promise<{ id: string; events: DomainEvent[] }> {
    ForbiddenError.from(actor.ability).throwUnlessCan('create', '__Name__');
    const entity = __Name__.create({ id: randomUUID(), ownerId: actor.userId, title });
    await this.repository.save(entity);
    return { id: entity.id, events: entity.pullEvents() };
  }
}
