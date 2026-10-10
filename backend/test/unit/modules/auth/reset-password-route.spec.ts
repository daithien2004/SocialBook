import { AuthController } from '@/modules/auth/presentation/auth/auth.controller';
import { IS_PUBLIC_KEY } from '@/shared/platform/decorators/custom.decorator';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';

describe('AuthController reset-password route', () => {
  it('is public so a user can reset a password with an OTP before logging in', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'resetPassword',
    );

    if (!descriptor) {
      throw new Error('resetPassword route is missing');
    }

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, descriptor.value)).toBe(true);
    expect(
      Reflect.getMetadata(`${THROTTLER_LIMIT}global`, descriptor.value),
    ).toBe(3);
  });
});
