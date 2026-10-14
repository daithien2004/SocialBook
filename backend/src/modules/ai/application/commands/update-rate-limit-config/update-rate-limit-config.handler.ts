import { ForbiddenError } from '@casl/ability';
import { CommandHandler } from '@nestjs/cqrs';
import { AIRateLimitConfigPort } from '../../ports/ai-rate-limit-config.port';
import { UpdateRateLimitConfigCommand } from './update-rate-limit-config.command';

@CommandHandler(UpdateRateLimitConfigCommand)
export class UpdateRateLimitConfigHandler {
  constructor(private readonly config: AIRateLimitConfigPort) {}

  async execute(command: UpdateRateLimitConfigCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      'AIRateLimitConfiguration',
    );
    await this.config.update(command.config);
  }
}
