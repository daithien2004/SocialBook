import { AppAbility } from '@socialbook/shared';

export interface DeleteUserHighlightCommand {
  highlightId: string;
  userId: string;
  ability: AppAbility;
}
