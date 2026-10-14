import { IsEnum, IsInt, IsUUID, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import { CreateRoomCommand } from '@/modules/reading-rooms/application/commands/create-room/create-room.command';

export class CreateRoomRequestDto {
  @ApiProperty({ description: 'Book ID (UUID string)' })
  @IsUUID('4')
  bookId!: string;

  @ApiProperty({ description: 'Chapter ID (UUID string)' })
  @IsUUID('4')
  chapterId!: string;

  @IsEnum(['sync', 'free'])
  @ApiProperty({ enum: ['sync', 'free'] })
  mode!: 'sync' | 'free';

  @IsInt()
  @Min(2)
  @Max(50)
  @IsOptional()
  maxMembers?: number;

  toCommand(actor: Actor, idempotencyKey: string): CreateRoomCommand {
    return new CreateRoomCommand(
      actor,
      this.bookId,
      this.chapterId,
      this.mode,
      idempotencyKey,
      this.maxMembers,
    );
  }
}
