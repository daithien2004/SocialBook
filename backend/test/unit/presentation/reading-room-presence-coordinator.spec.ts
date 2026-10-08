import { Namespace } from 'socket.io';
import { ReadingRoomPresenceService } from '@/modules/reading-rooms/application/presence/reading-room-presence.service';
import { ReadingRoomNamespaceProvider } from '@/modules/reading-rooms/presentation/websocket/reading-room.namespace-provider';
import { ReadingRoomPresenceCoordinator } from '@/modules/reading-rooms/presentation/websocket/reading-room-presence.coordinator';
import { ReadingRoomServerEvent } from '@/modules/reading-rooms/reading-room.events';
import { fakeOf } from '../../support/typed-fake';
import type { RoomSocket } from '@/modules/reading-rooms/presentation/websocket/reading-room.types';

describe('ReadingRoomPresenceCoordinator.scheduleBroadcast', () => {
  let coordinator: ReadingRoomPresenceCoordinator;
  let emit: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();

    emit = jest.fn();
    const roomOperator = fakeOf<ReturnType<Namespace['to']>>({ emit });
    const namespace = fakeOf<Namespace>({ to: () => roomOperator });
    const namespaceProvider = fakeOf<ReadingRoomNamespaceProvider>({
      getServer: () => namespace,
    });
    const presenceService = fakeOf<ReadingRoomPresenceService>({});

    coordinator = new ReadingRoomPresenceCoordinator(
      presenceService,
      namespaceProvider,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('promotes a pending lazy broadcast and emits the latest change for that user', async () => {
    const roomId = 'room-1';
    const userId = 'user-1';

    coordinator.scheduleBroadcast(roomId, 'lazy', {
      action: 'upsert',
      presence: {
        userId,
        displayName: 'Reader',
        avatarUrl: '',
        currentChapterSlug: 'chapter-1',
        lastSeen: 1,
      },
    });
    coordinator.scheduleBroadcast(roomId, 'urgent', {
      action: 'remove',
      userId,
    });

    await jest.advanceTimersByTimeAsync(300);

    expect(emit).toHaveBeenCalledWith(ReadingRoomServerEvent.PRESENCE_UPDATE, [
      { action: 'remove', userId },
    ]);
  });

  it('removes only the disconnected socket and keeps the user present when another socket remains', async () => {
    const presence = {
      userId: 'user-1',
      displayName: 'Reader',
      avatarUrl: '',
      currentChapterSlug: 'chapter-2',
      lastSeen: 10,
    };
    const removeSocketPresence = jest.fn(
      (_roomId: string, _userId: string, _socketId: string) =>
        Promise.resolve(true),
    );
    const getRoomPresences = jest.fn((_roomId: string) =>
      Promise.resolve([presence]),
    );
    const presenceService = fakeOf<ReadingRoomPresenceService>({
      removeSocketPresence,
      getRoomPresences,
    });
    const roomOperator = fakeOf<ReturnType<Namespace['to']>>({ emit });
    coordinator = new ReadingRoomPresenceCoordinator(
      presenceService,
      fakeOf<ReadingRoomNamespaceProvider>({
        getServer: () => fakeOf<Namespace>({ to: () => roomOperator }),
      }),
    );
    const socket = fakeOf<RoomSocket>({
      id: 'socket-1',
      data: { userId: 'user-1', role: 'member', roomId: 'ROOM_A' },
    });

    await coordinator.onDisconnect(socket);
    await jest.advanceTimersByTimeAsync(300);

    expect(removeSocketPresence).toHaveBeenCalledWith(
      'ROOM_A',
      'user-1',
      'socket-1',
    );
    expect(emit).toHaveBeenCalledWith(ReadingRoomServerEvent.PRESENCE_UPDATE, [
      { action: 'upsert', presence },
    ]);
  });
});
