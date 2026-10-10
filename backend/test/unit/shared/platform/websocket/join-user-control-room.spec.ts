import {
  joinUserControlRoom,
  UserControlRoomSocket,
} from '@/shared/platform/websocket/join-user-control-room';

class SocketFake implements UserControlRoomSocket {
  joinedRooms: string[] = [];
  disconnected: boolean | undefined;
  joinError: Error | undefined;

  join(room: string): Promise<void> {
    if (this.joinError) {
      return Promise.reject(this.joinError);
    }
    this.joinedRooms.push(room);
    return Promise.resolve();
  }

  disconnect(close?: boolean): void {
    this.disconnected = close;
  }
}

describe('joinUserControlRoom', () => {
  it('joins the user control room', async () => {
    const socket = new SocketFake();
    const loggedErrors: string[] = [];
    const logError = (message: string): void => {
      loggedErrors.push(message);
    };

    await joinUserControlRoom(socket, 'user-123', 'notifications', logError);

    expect(socket.joinedRooms).toEqual(['user:user-123']);
    expect(socket.disconnected).toBeUndefined();
    expect(loggedErrors).toEqual([]);
  });

  it('logs and disconnects when joining the control room fails', async () => {
    const socket = new SocketFake();
    socket.joinError = new Error('Redis adapter unavailable');
    const loggedErrors: string[] = [];
    const logError = (message: string): void => {
      loggedErrors.push(message);
    };

    await expect(
      joinUserControlRoom(socket, 'user-123', 'notifications', logError),
    ).resolves.toBeUndefined();

    expect(socket.disconnected).toBe(true);
    expect(loggedErrors).toEqual([
      'Failed to join user control room in notifications for user user-123: Redis adapter unavailable',
    ]);
  });
});
