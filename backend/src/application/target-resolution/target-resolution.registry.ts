import { Inject, Injectable } from '@nestjs/common';
import {
  ITargetTypeHandler,
  TargetResolution,
} from './interfaces/target-type-handler.interface';

@Injectable()
export class TargetResolverRegistry {
  private readonly handlers: Map<string, ITargetTypeHandler> = new Map();

  constructor(@Inject(ITargetTypeHandler) handlers: ITargetTypeHandler[]) {
    for (const handler of handlers) {
      this.handlers.set(handler.type(), handler);
    }
  }

  async resolve(
    targetType: string,
    targetId: string,
  ): Promise<TargetResolution> {
    let currentType = targetType;
    let currentId = targetId;
    const visited = new Set<string>();

    while (currentType && !visited.has(currentType)) {
      visited.add(currentType);
      const handler = this.handlers.get(currentType);
      if (!handler) {
        return new TargetResolution();
      }
      const result = await handler.resolve(currentId);
      if (result.redirect) {
        currentType = result.redirect.targetType;
        currentId = result.redirect.targetId;
        continue;
      }
      return result;
    }

    return new TargetResolution();
  }
}
