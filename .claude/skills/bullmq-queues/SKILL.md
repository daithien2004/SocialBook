---
name: bullmq-queues
description: BullMQ job queue patterns for NestJS with Clean Architecture. Covers port/adapter decoupling, @InjectQueue, WorkerHost processors, job payloads, retry/backoff, and idempotent job handling. Triggers on tasks involving job queues, BullMQ, processors, workers, background jobs, or async task processing.
---

# BullMQ Job Queues

## Overview

This project uses **BullMQ** with `@nestjs/bullmq` for async job processing. Queues follow Clean Architecture: **Port** interfaces in `application/ports/`, **Adapter** implementations in `infrastructure/queue/`, and **Worker**/processors consuming jobs.

## Trigger

Activate when working on:
- Queue jobs and job payloads (`*-job.payload.ts`)
- Queue port interfaces (`application/ports/*-queue.port.ts`)
- Queue adapter implementations (`infrastructure/queue/*-queue.adapter.ts`)
- Worker processors (`@Processor`, `WorkerHost`)
- Background tasks (notification sending, audio generation, posts, chapters, analytics)

## Directory & Convention

```
backend/src/
├── application/
│   ├── ports/
│   │   ├── notification-queue.port.ts   # INotificationQueuePort
│   │   └── audio-queue.port.ts          # IAudioQueuePort
│   ├── notifications/jobs/
│   │   └── notification-job.payload.ts   # Job payload interfaces
│   └── text-to-speech/jobs/
│       └── tts-job.payload.ts            # GenerateAudioJobPayload
├── infrastructure/
│   ├── queue/
│   │   ├── notification-queue.adapter.ts  # NotificationQueueAdapter
│   │   ├── audio-queue.adapter.ts
│   │   └── queue.module.ts
│   └── queues/
│       ├── chapters-import/
│       └── post-moderation/
├── presentation/gateways/
│   ├── notification.worker.ts  # @Processor('notifications')
│   └── audio.worker.ts          # @Processor('audio-generation')
└── application/analytics/processors/
    └── analytics.processor.ts
```

## Clean Architecture: Port & Adapter Pattern

### 1. Port Interface (Domain/Application Layer)

Define each queue as a **symbol-injected interface** so adapters are swappable:

```typescript
// backend/src/application/ports/notification-queue.port.ts
import {
  CommentCreatedJobPayload,
  LikeToggledJobPayload,
  UserFollowedJobPayload,
  PostModeratedJobPayload,
} from '../notifications/jobs/notification-job.payload';

export const INotificationQueuePort = Symbol('INotificationQueuePort');

export interface INotificationQueuePort {
  queueCommentCreated(payload: CommentCreatedJobPayload): Promise<void>;
  queueLikeToggled(payload: LikeToggledJobPayload): Promise<void>;
  queueUserFollowed(payload: UserFollowedJobPayload): Promise<void>;
  queuePostModerated(payload: PostModeratedJobPayload): Promise<void>;
}
```

### 2. Job Payloads

Typed payload interfaces co-located with their domain:

```typescript
// backend/src/application/notifications/jobs/notification-job.payload.ts
export interface CommentCreatedJobPayload {
  userId: string;
  commentId: string;
  postId: string;
  actorId: string;
}

export interface LikeToggledJobPayload {
  userId: string;
  postId: string;
  actorId: string;
  liked: boolean;
}
```

### 3. Queue Adapter (Infrastructure Layer)

Implements the port with `@InjectQueue`, configures retry/backoff:

```typescript
// backend/src/infrastructure/queue/notification-queue.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INotificationQueuePort, CommentCreatedJobPayload } from '@/application/ports/notification-queue.port';

@Injectable()
export class NotificationQueueAdapter implements INotificationQueuePort {
  private readonly logger = new Logger(NotificationQueueAdapter.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async queueCommentCreated(payload: CommentCreatedJobPayload): Promise<void> {
    try {
      await this.notificationQueue.add('comment.created', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failed jobs for debugging
      });
      this.logger.debug(`Queued comment.created job for user ${payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to queue comment.created job', error);
      throw error;
    }
  }

  // ... other methods follow the same pattern
}
```

### 4. Worker Processor (Consumer)

Extend `WorkerHost` and dispatch by job name:

```typescript
// backend/src/presentation/gateways/notification.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notifications', {
  concurrency: 5,
})
@Injectable()
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(/* inject services */) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} (${job.name})`);

    try {
      switch (job.name) {
        case 'comment.created':
          // await this.notificationsService.send(...);
          break;
        case 'like.toggled':
          // await this.notificationsService.send(...);
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing notification job ${job.id} (${job.name}):`,
        error,
      );
      throw error; // Let BullMQ handle retries
    }
  }
}
```

### 5. Audio Worker (Full Example)

From `backend/src/presentation/gateways/audio.worker.ts`:

```typescript
@Processor('audio-generation', {
  concurrency: 2, // Prevent rate-limiting from TTS provider
})
@Injectable()
export class AudioWorker extends WorkerHost {
  private readonly logger = new Logger(AudioWorker.name);

  constructor(
    private readonly ttsRepository: ITextToSpeechRepository,
    private readonly ttsProvider: ITextToSpeechPort,
    private readonly chapterRepository: IChapterRepository,
  ) { super(); }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case 'generate.audio':
          await this.handleGenerateAudio(job.data as GenerateAudioJobPayload);
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}`, error);
      throw error; // Rethrow for BullMQ retry
    }
  }

  private async handleGenerateAudio(payload: GenerateAudioJobPayload) {
    // 1. Fetch record
    const ttsRecord = await this.ttsRepository.findById(payload.ttsRecordId);
    if (!ttsRecord) {
      this.logger.warn(`TTS Record ${payload.ttsRecordId} not found, skipping job.`);
      return; // Non-retryable: skip silently
    }

    // 2. Idempotency check
    if (ttsRecord.status === TTSStatus.COMPLETED) {
      this.logger.warn(`TTS Record ${payload.ttsRecordId} already completed, skipping.`);
      return;
    }

    // 3. Mark PROCESSING, do work, save result
    await this.ttsRepository.updateStatus(ttsRecord.id, TTSStatus.PROCESSING);
    // ... generate audio ...
    ttsRecord.complete(audioUrl, format, duration);
    await this.ttsRepository.save(ttsRecord);

    // 4. On failure: record error + rethrow for retry
    // ttsRecord.fail(errorMessage);
    // await this.ttsRepository.save(ttsRecord);
    // throw error;
  }
}
```

## Key Conventions

### Queue Options

| Option | Value | Rationale |
|--------|-------|-----------|
| `attempts` | `3` | Retry twice after initial failure |
| `backoff.type` | `'exponential'` | 2s → 4s → 8s backoff |
| `backoff.delay` | `2000` | Initial delay in ms |
| `removeOnComplete` | `true` | Don't accumulate successful jobs |
| `removeOnFail` | `100` | Keep last 100 failures for debugging |
| `concurrency` | `2`–`5` | Based on external API rate limits |

### Job Naming

Use `entity.action` format: `comment.created`, `like.toggled`, `user.followed`, `post.moderated`, `generate.audio`.

### Queue Name

Use a descriptive queue name as the `@Processor('queue-name')` / `@InjectQueue('queue-name')` identifier: `'notifications'`, `'audio-generation'`, `'post-moderation'`.

## Idempotency & Error Handling

1. **Idempotency check first**: Check if the entity is already in `COMPLETED`/terminal state before doing work. Return early (not throw) to avoid wasting retries on already-done work.
2. **Gracefully skip missing entities**: If the target record isn't found, `return` not `throw` — it's a stale job, not a retryable failure.
3. **Update status early**: Set `PROCESSING` at the start of `handleGenerateAudio` so concurrent retries see the lock.
4. **Catch locally, rethrow globally**: Each `case` catches domain errors, records them (e.g. `ttsRecord.fail()`), then rethrows so BullMQ schedules a retry.
5. **Don't throw on unknown job.name**: Log warning, return. Prevents the worker from stalling on unknown job types.

## Module Registration

```typescript
// backend/src/infrastructure/queue/queue.module.ts
import { BullModule } from '@nestjs/bullmq';
import { NotificationQueueAdapter } from './notification-queue.adapter';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'audio-generation' },
    ),
  ],
  providers: [
    NotificationQueueAdapter,
    { provide: INotificationQueuePort, useClass: NotificationQueueAdapter },
    NotificationWorker,
    AudioWorker,
  ],
  exports: [INotificationQueuePort],
})
export class QueueModule {}
```

## Testing

```typescript
// Unit test the adapter with a mock Queue.
const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };
const adapter = new NotificationQueueAdapter(mockQueue as any);
await adapter.queueCommentCreated(payload);
expect(mockQueue.add).toHaveBeenCalledWith(
  'comment.created',
  payload,
  expect.objectContaining({ attempts: 3 }),
);
```

For workers, mock injected repositories/ports and assert state transitions and error paths.