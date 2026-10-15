import type { Actor } from '@/shared/casl/actor';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineLibraryAbilities } from './library.ability';

export function createLibraryActor(userId: string): Actor {
  return new AbilityFactory([defineLibraryAbilities]).createActor({
    userId,
    roles: [],
  });
}
