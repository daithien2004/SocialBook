export abstract class IPresencePort {
  abstract removeRoomPresences(roomId: string): Promise<void>;
}
