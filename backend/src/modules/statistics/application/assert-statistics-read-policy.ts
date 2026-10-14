import { ForbiddenError } from '@casl/ability';
import type { Actor } from '@/shared/casl/actor';

export function assertStatisticsReadAllowed(actor: Actor): void {
  ForbiddenError.from(actor.ability).throwUnlessCan('read', 'Statistics');
}
