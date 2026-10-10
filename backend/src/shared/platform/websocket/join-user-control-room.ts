export interface UserControlRoomSocket {
  join(room: string): void | Promise<void>;
  disconnect(close?: boolean): void;
}

export async function joinUserControlRoom(
  socket: UserControlRoomSocket,
  userId: string,
  namespace: string,
  logError: (message: string) => void,
): Promise<void> {
  try {
    await socket.join(`user:${userId}`);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    logError(
      `Failed to join user control room in ${namespace} for user ${userId}: ${detail}`,
    );
    socket.disconnect(true);
  }
}
