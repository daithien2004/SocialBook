import type { AppAbility } from './app-ability';

export interface Actor {
  readonly userId: string;
  readonly roles: readonly string[];
  readonly ability: AppAbility;
}
