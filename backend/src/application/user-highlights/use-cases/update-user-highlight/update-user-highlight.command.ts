import { AppAbility } from '@socialbook/shared';

export interface UpdateUserHighlightCommand {
  highlightId: string;
  userId: string;
  ability: AppAbility;
  color?: string;
  note?: string;
}
