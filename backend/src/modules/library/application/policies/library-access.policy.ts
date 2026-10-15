import { ForbiddenError, subject } from '@casl/ability';
import type { AppAction } from '@/shared/casl/app-ability';
import type { Actor } from '@/shared/casl/actor';

export function assertLibraryAccess(
  actor: Actor,
  action: AppAction,
  userId: string,
): void {
  ForbiddenError.from(actor.ability).throwUnlessCan(
    action,
    subject('Library', { userId }),
  );
}
