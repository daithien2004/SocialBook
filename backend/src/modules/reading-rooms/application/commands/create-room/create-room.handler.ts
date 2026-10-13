import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictDomainException,
  ConcurrencyException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { DEFAULT_MAX_MEMBERS } from '@/modules/reading-rooms/domain/constants/reading-room.constants';
import {
  CreateRoomWriteCollision,
  ICreateRoomStore,
} from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type { CreateRoomWriteResult } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import {
  createIdempotencyFingerprint,
  matchesIdempotencyFingerprint,
} from '@/shared/application/idempotency/create-idempotency-fingerprint';
import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { toReadingRoomResult } from '../../mappers/reading-room-result.mapper';
import { CreateRoomCommand } from './create-room.command';
import { BookId, IBookRepository } from '@/modules/books/domain/public-api';
import {
  IChapterRepository,
  BookId as ChapterBookId,
  ChapterId,
} from '@/modules/chapters/domain/public-api';

const MAX_CREATE_ATTEMPTS = 5;

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<
  CreateRoomCommand,
  ReadingRoomResult
> {
  constructor(
    private readonly createRoomStore: ICreateRoomStore,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  async execute(command: CreateRoomCommand): Promise<ReadingRoomResult> {
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

    const existingRequest = await this.createRoomStore.findByRequestKey(
      command.hostId,
      command.idempotencyKey,
    );
    if (existingRequest) {
      this.assertFingerprintMatches(
        fingerprintPayload,
        existingRequest.fingerprint,
      );
      return toReadingRoomResult(existingRequest.room);
    }

    for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        const result = await this.unitOfWork.execute(() =>
          this.createRoomOnce(command, maxMembers, fingerprint),
        );
        if (result.kind === 'replayed') {
          this.assertFingerprintMatches(fingerprintPayload, result.fingerprint);
        }
        return toReadingRoomResult(result.room);
      } catch (error: unknown) {
        if (!(error instanceof CreateRoomWriteCollision)) throw error;
        if (error.kind === 'room-code') {
          if (attempt < MAX_CREATE_ATTEMPTS) continue;
          throw new ConflictDomainException(
            'Could not generate a unique room code after multiple attempts.',
          );
        }

        const concurrentRequest = await this.createRoomStore.findByRequestKey(
          command.hostId,
          command.idempotencyKey,
        );
        if (!concurrentRequest) {
          if (attempt < MAX_CREATE_ATTEMPTS) continue;
          throw new ConcurrencyException(
            'Room creation is still being resolved; retry with the same idempotency key.',
          );
        }
        this.assertFingerprintMatches(
          fingerprintPayload,
          concurrentRequest.fingerprint,
        );
        return toReadingRoomResult(concurrentRequest.room);
      }
    }

    throw new ConflictDomainException(
      'Could not generate a unique room code after multiple attempts.',
    );
  }

  private async createRoomOnce(
    command: CreateRoomCommand,
    maxMembers: number,
    fingerprint: string,
  ): Promise<CreateRoomWriteResult> {
    const bookIsActive = await this.bookRepository.touchIfActive(
      BookId.create(command.bookId),
    );
    if (!bookIsActive) {
      throw new NotFoundDomainException(
        'Book does not exist or is no longer active.',
      );
    }

    const chapterSlug = await this.chapterRepository.touchIfInBook(
      ChapterId.create(command.chapterId),
      ChapterBookId.create(command.bookId),
    );
    if (!chapterSlug) {
      throw new NotFoundDomainException(
        'Chapter does not exist in the selected book.',
      );
    }

    const room = ReadingRoom.create({
      bookId: command.bookId,
      currentChapterId: command.chapterId,
      hostId: command.hostId,
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
      throw new ConflictDomainException(
        'Idempotency-Key was already used with a different room request.',
      );
    }
  }
}
