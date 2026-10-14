import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma/runtime';
import type { Actor } from './actor';
import type { AppAbility } from './app-ability';

export interface AbilityPrincipal {
  readonly userId: string;
  readonly roles: readonly string[];
}

export type AbilityDefinition = (
  principal: AbilityPrincipal,
  builder: AbilityBuilder<AppAbility>,
) => void;

export class AbilityFactory {
  constructor(private readonly definitions: readonly AbilityDefinition[]) {}

  createActor(principal: AbilityPrincipal): Actor {
    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
    for (const defineAbilities of this.definitions) {
      defineAbilities(principal, builder);
    }
    return { ...principal, ability: builder.build() };
  }
}
