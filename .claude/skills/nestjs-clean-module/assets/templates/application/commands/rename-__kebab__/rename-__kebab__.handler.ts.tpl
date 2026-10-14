import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { __Name__NotFoundError } from '../../../domain/errors/__kebab__.errors';
import { __Name__Repository } from '../../../domain/repositories/__kebab__.repository';
import { Rename__Name__Command } from './rename-__kebab__.command';

// Mẫu cho command sửa bản ghi: nạp aggregate -> kiểm tra quyền theo bản ghi -> đổi trạng thái -> lưu.
// Command không phát event nên đặt @Transactional() thẳng trên execute.
@CommandHandler(Rename__Name__Command)
export class Rename__Name__Handler implements ICommandHandler<Rename__Name__Command, void> {
  constructor(private readonly repository: __Name__Repository) {}

  @Transactional()
  async execute({ id, title, actor }: Rename__Name__Command): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new __Name__NotFoundError(id);
    // Nếu TypeScript phàn nàn về kiểu của subject, map entity sang object phẳng trước khi kiểm tra.
    ForbiddenError.from(actor.ability).throwUnlessCan('update', subject('__Name__', entity));
    entity.rename(title);
    await this.repository.save(entity);
  }
}
