import { ForbiddenError } from '@casl/ability';
import type { Actor } from '@/shared/casl/actor';

export function assertCanReadStatistics(actor: Actor): void {
  ForbiddenError.from(actor.ability).throwUnlessCan('read', 'Statistics');
}
