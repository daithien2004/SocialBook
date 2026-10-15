import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { ForbiddenError } from '@casl/ability';
import {
  ReadingRoomConflictError,
  ReadingRoomConcurrencyError,
  ReadingRoomNotFoundError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { DEFAULT_MAX_MEMBERS } from '@/modules/reading-rooms/domain/constants/reading-room.constants';
import {
  CreateRoomWriteCollision,
  CreateRoomStore,
} from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import {
  createIdempotencyFingerprint,
  matchesIdempotencyFingerprint,
} from '@/shared/application/idempotency/create-idempotency-fingerprint';
import { CreateRoomCommand } from './create-room.command';
import { TouchBookForReadingRoomCommand } from '@/modules/books';
import { TouchChapterForReadingRoomCommand } from '@/modules/chapters';

const MAX_CREATE_ATTEMPTS = 5;

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<
  CreateRoomCommand,
  string
> {
  constructor(
    private readonly createRoomStore: CreateRoomStore,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: CreateRoomCommand): Promise<string> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'ReadingRoom',
    );
    const maxMembers = command.maxMembers ?? DEFAULT_MAX_MEMBERS;
    const fingerprintPayload = {
      bookId: command.bookId,
      chapterId: command.chapterId,
      mode: command.mode,
      maxMembers,
    };
    const fingerprint = createIdempotencyFingerprint(
      'reading-room.create',
      1,
      fingerprintPayload,
    );

    // Resolve a retry before touching Books or Chapters; the persisted key is the source of truth.
    const existingRequest = await this.createRoomStore.findByRequestKey(
      command.actor.userId,
      command.idempotencyKey,
    );
    if (existingRequest) {
      this.assertFingerprintMatches(
        fingerprintPayload,
        existingRequest.fingerprint,
      );
      return existingRequest.roomId;
    }

    for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        // Each attempt gets its own transaction and newly generated room code.
        return await this.createRoomOnce(command, maxMembers, fingerprint);
      } catch (error: unknown) {
        if (!(error instanceof CreateRoomWriteCollision)) throw error;
        // Only a room-code collision is safe to solve by creating a fresh aggregate.
        if (error.kind === 'room-code') {
          if (attempt < MAX_CREATE_ATTEMPTS) continue;
          throw new ReadingRoomConflictError(
            'Could not generate a unique room code after multiple attempts.',
          );
        }

        const concurrentRequest = await this.createRoomStore.findByRequestKey(
          command.actor.userId,
          command.idempotencyKey,
        );
        if (!concurrentRequest) {
          if (attempt < MAX_CREATE_ATTEMPTS) continue;
          throw new ReadingRoomConcurrencyError(
            'Room creation is still being resolved; retry with the same idempotency key.',
          );
        }
        this.assertFingerprintMatches(
          fingerprintPayload,
          concurrentRequest.fingerprint,
        );
        return concurrentRequest.roomId;
      }
    }

    throw new ReadingRoomConflictError(
      'Could not generate a unique room code after multiple attempts.',
    );
  }

  @Transactional()
  private async createRoomOnce(
    command: CreateRoomCommand,
    maxMembers: number,
    fingerprint: string,
  ): Promise<string> {
    // Touching the references makes their active-state check conflict with a concurrent soft delete.
    const bookIsActive = await this.commandBus.execute(
      new TouchBookForReadingRoomCommand(command.actor, command.bookId),
    );
    if (!bookIsActive) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    const chapterSlug = await this.commandBus.execute(
      new TouchChapterForReadingRoomCommand(
        command.actor,
        command.bookId,
        command.chapterId,
      ),
    );
    if (!chapterSlug) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    const room = ReadingRoom.create({
      bookId: command.bookId,
      currentChapterId: command.chapterId,
      hostId: command.actor.userId,
      mode: command.mode,
      maxMembers,
      currentChapterSlug: chapterSlug,
    });

    return this.createRoomStore.createIdempotently(
      room,
      command.idempotencyKey,
      fingerprint,
    );
  }

  private assertFingerprintMatches(
    payload: {
      bookId: string;
      chapterId: string;
      mode: string;
      maxMembers: number;
    },
    existingFingerprint: string,
  ): void {
    if (
      !matchesIdempotencyFingerprint(
        'reading-room.create',
        payload,
        existingFingerprint,
      )
    ) {
      throw new ReadingRoomConflictError(
        'Idempotency-Key was already used with a different room request.',
      );
    }
  }
}
