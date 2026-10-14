import { IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { ReactivateRoomCommand } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.command';

export class ReactivateRoomRequestDto {
  @IsString()
  code!: string;

  toCommand(actor: Actor): ReactivateRoomCommand {
    return new ReactivateRoomCommand(actor, this.code);
  }
}
