import { subject } from '@casl/ability';
import { createReadingRoomAbility } from '@/modules/reading-rooms/application/policies/reading-room.ability';

describe('Reading Room abilities', () => {
  it('allows authenticated users to create and join active rooms', () => {
    const ability = createReadingRoomAbility({
      userId: 'user-1',
      roles: ['user'],
    });

    expect(ability.can('create', 'ReadingRoom')).toBe(true);
    expect(
      ability.can(
        'join',
        subject('ReadingRoom', {
          id: 'ROOM01',
          hostId: 'host-1',
          status: 'active',
        }),
      ),
    ).toBe(true);
  });

  it('limits room updates to the host and lets admins manage rooms', () => {
    const userAbility = createReadingRoomAbility({
      userId: 'user-1',
      roles: ['user'],
    });
    const room = subject('ReadingRoom', {
      id: 'ROOM01',
      hostId: 'host-2',
      status: 'ended',
    });

    expect(userAbility.can('update', room)).toBe(false);
    expect(
      createReadingRoomAbility({ userId: 'admin-1', roles: ['admin'] }).can(
        'update',
        room,
      ),
    ).toBe(true);
  });
});
