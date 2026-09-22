import { AbilityBuilder, createMongoAbility, type CreateAbility } from '@casl/ability';
import type { MongoAbility } from '@casl/ability';
import type { AppAction } from './actions';
import type { AppSubject } from './subjects';

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export type PrincipalRole = 'user' | 'writer' | 'admin';

export function defineRulesFor(role: PrincipalRole | string): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createAppAbility);
  const { can } = builder;

  if (role === 'admin') {
    can('manage', 'all');
  }

  return builder.build();
}

export function canAccess(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
): boolean {
  return ability.can(action, subject);
}