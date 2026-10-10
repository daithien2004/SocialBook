import { ReadingRoomsController } from '@/modules/reading-rooms/presentation/http/reading-rooms.controller';

describe('ReadingRoomsController throttling', () => {
  it('uses limits keyed to the configured global throttler', () => {
    const prototype = ReadingRoomsController.prototype;

    expect(
      Reflect.getMetadata('THROTTLER:LIMITglobal', prototype.createRoom),
    ).toBe(10);
    expect(
      Reflect.getMetadata('THROTTLER:LIMITglobal', prototype.getRoomHighlights),
    ).toBe(20);
    expect(
      Reflect.getMetadata('THROTTLER:LIMITglobal', prototype.getRoom),
    ).toBe(20);
  });
});
