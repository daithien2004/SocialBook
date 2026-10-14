import { AbilityBuilder } from '@casl/ability';
import type { Actor } from '@/shared/casl/actor';
import {
  AbilityFactory,
  type AbilityPrincipal,
} from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export type ReadingRoomPrincipal = AbilityPrincipal;

export type ReadingRoomActor = Actor;

export function createReadingRoomAbility(
  principal: ReadingRoomPrincipal,
): AppAbility {
  return new AbilityFactory([defineReadingRoomAbilities]).createActor(principal)
    .ability;
}

export function defineReadingRoomAbilities(
  principal: ReadingRoomPrincipal,
  builder: AbilityBuilder<AppAbility>,
): void {
  const { can } = builder;

  if (principal.roles.includes('admin')) {
    can('manage', 'all');
    return;
  }

  can('create', 'ReadingRoom');
  can('read', 'ReadingRoom', { status: 'active' });
  can('read', 'ReadingRoom', { hostId: principal.userId });
  can('read', 'ReadingRoom', {
    members: { some: { userId: principal.userId } },
  });
  can('update', 'ReadingRoom', { hostId: principal.userId });
  can('join', 'ReadingRoom', { status: 'active' });
  can('update', 'ReadingRoomMember', { userId: principal.userId });
  can('delete', 'ReadingRoomHighlight', { userId: principal.userId });
}

export function createReadingRoomActor(
  userId: string,
  role: string,
): ReadingRoomActor {
  const principal = {
    userId,
    roles: [role],
  };
  return {
    ...principal,
    ability: createReadingRoomAbility(principal),
  };
}
