import { useReadingRoomStore } from './useReadingRoomStore';

describe('useReadingRoomStore.markRoomEnded', () => {
  afterEach(() => {
    useReadingRoomStore.getState().clearRoom();
  });

  it('marks the matching room ended and clears active members and presences', () => {
    useReadingRoomStore.getState().setRoom({
      roomId: 'room-1',
      bookId: 'book-1',
      hostId: 'user-1',
      mode: 'sync',
      status: 'active',
      currentChapterSlug: 'chapter-1',
    });
    useReadingRoomStore
      .getState()
      .setMembers([{ userId: 'user-1', role: 'host' }]);
    useReadingRoomStore.getState().updatePresences([
      {
        userId: 'user-1',
        displayName: 'Reader',
        currentChapterSlug: 'chapter-1',
      },
    ]);
    useReadingRoomStore.getState().setConnection('joined');

    useReadingRoomStore.getState().markRoomEnded('room-1');

    const state = useReadingRoomStore.getState();
    expect(state.room?.status).toBe('ended');
    expect(state.connection).toBe('idle');
    expect(state.members).toEqual([]);
    expect(state.presences).toEqual({});
    expect(state.byParagraph).toEqual({});
  });

  it('does not change a different room', () => {
    useReadingRoomStore.getState().setRoom({
      roomId: 'room-1',
      bookId: 'book-1',
      hostId: 'user-1',
      mode: 'sync',
      status: 'active',
      currentChapterSlug: 'chapter-1',
    });

    useReadingRoomStore.getState().markRoomEnded('room-2');

    expect(useReadingRoomStore.getState().room?.status).toBe('active');
  });
});
