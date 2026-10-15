import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

const TEST_USER_EMAIL = 'reading-room-test@example.test';
const TEST_USERNAME = 'reading-room-test';

@Injectable()
export class ReadingRoomTestSeed {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async run(): Promise<void> {
    const password =
      this.configService.getOrThrow<string>('env.ADMIN_PASSWORD');
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.$transaction(async (transaction) => {
      const [userRole, adminRole] = await Promise.all([
        transaction.role.upsert({
          where: { name: 'user' },
          create: { id: createSeedId(), name: 'user' },
          update: {},
        }),
        transaction.role.upsert({
          where: { name: 'admin' },
          create: { id: createSeedId(), name: 'admin' },
          update: {},
        }),
      ]);

      const usernameOwner = await transaction.user.findUnique({
        where: { username: TEST_USERNAME },
        select: { email: true },
      });
      if (usernameOwner && usernameOwner.email !== TEST_USER_EMAIL) {
        throw new Error(
          `Cannot seed ${TEST_USERNAME}: username is already in use.`,
        );
      }

      await transaction.user.upsert({
        where: { email: TEST_USER_EMAIL },
        create: {
          id: createSeedId(),
          roleId: userRole.id,
          username: TEST_USERNAME,
          email: TEST_USER_EMAIL,
          password: passwordHash,
          isVerified: true,
          provider: 'local',
        },
        update: {
          roleId: userRole.id,
          username: TEST_USERNAME,
          password: passwordHash,
          isVerified: true,
          isBanned: false,
          provider: 'local',
          providerId: null,
        },
      });

      if (userRole.id === adminRole.id) {
        throw new Error('User and admin roles must be distinct.');
      }
    });
  }
}
