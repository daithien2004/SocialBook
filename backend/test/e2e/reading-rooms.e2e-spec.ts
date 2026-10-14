import { ValidationPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { HttpExceptionFilter } from '@/shared/platform/filters/http-exception.filter';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomsController } from '@/modules/reading-rooms/presentation/http/reading-rooms.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineReadingRoomAbilities } from '@/modules/reading-rooms/application/policies/reading-room.ability';

describe('ReadingRoomsController (e2e)', () => {
  it('creates a room with one command dispatch and returns its identifier', async () => {
    const queryExecute = jest.fn().mockResolvedValue(undefined);
    const commandExecute = jest.fn().mockResolvedValue('ROOM01');
    const app = await createApp(queryExecute, commandExecute);

    await request(app.getHttpServer())
      .post('/reading-rooms')
      .set('Idempotency-Key', 'create-room-001')
      .send({
        bookId: '550e8400-e29b-41d4-a716-446655440000',
        chapterId: '550e8400-e29b-41d4-a716-446655440001',
        mode: 'sync',
      })
      .expect(201, { roomId: 'ROOM01' });

    expect(commandExecute).toHaveBeenCalledTimes(1);
    expect(queryExecute).not.toHaveBeenCalled();
    await app.close();
  });

  it('reactivates a room with one command dispatch and no response body', async () => {
    const queryExecute = jest.fn();
    const commandExecute = jest.fn().mockResolvedValue(undefined);
    const app = await createApp(queryExecute, commandExecute);

    await request(app.getHttpServer())
      .patch('/reading-rooms/ROOM01/reactivate')
      .expect(204);

    expect(commandExecute).toHaveBeenCalledTimes(1);
    expect(queryExecute).not.toHaveBeenCalled();
    await app.close();
  });

  it('validates pagination and returns the standard page response', async () => {
    const execute = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const app = await createApp(execute);

    await request(app.getHttpServer())
      .get('/reading-rooms/my-active')
      .query({ limit: 10 })
      .expect(200)
      .expect({
        data: [],
        meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      });

    await request(app.getHttpServer())
      .get('/reading-rooms/my-active')
      .query({ limit: 101 })
      .expect(400);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: expect.objectContaining({
          userId: 'user-1',
          roles: ['user'],
        }),
      }),
    );
    await app.close();
  });

  it('rejects a request without an authenticated principal', async () => {
    const execute = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const app = await createApp(execute);

    await request(app.getHttpServer())
      .get('/reading-rooms/my-active')
      .set('x-test-anonymous', 'true')
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
    await app.close();
  });

  it('maps a not-found application error to the shared Problem Details contract', async () => {
    const execute = jest.fn().mockRejectedValue(new ReadingRoomNotFoundError());
    const app = await createApp(execute);

    const response = await request(app.getHttpServer())
      .get('/reading-rooms/ROOM01')
      .expect(404);

    expect(response.body).toMatchObject({
      code: 'READING_ROOM_NOT_FOUND',
      status: 404,
    });
    await app.close();
  });
});

async function createApp(
  execute: jest.Mock<Promise<unknown>, [query: unknown]>,
  commandExecute: jest.Mock<Promise<unknown>, [command: unknown]> = jest.fn(),
) {
  const moduleRef = await Test.createTestingModule({
    controllers: [ReadingRoomsController],
    providers: [
      PoliciesGuard,
      {
        provide: AbilityFactory,
        useFactory: () => new AbilityFactory([defineReadingRoomAbilities]),
      },
      { provide: Reflector, useValue: new Reflector() },
      { provide: CommandBus, useValue: { execute: commandExecute } },
      { provide: QueryBus, useValue: { execute } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.header('x-test-anonymous') !== 'true') {
      Object.assign(req, { user: { id: 'user-1', role: 'user' } });
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}
