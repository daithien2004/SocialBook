import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class UsersSeed {
  private readonly logger = new Logger(UsersSeed.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  run(): Promise<void> {
    return this.seedUsers();
  }

  async seedUsers(): Promise<void> {
    await this.prisma.user.deleteMany({});
    const [adminRole, userRole] = await Promise.all([
      this.prisma.role.findUnique({ where: { name: 'admin' } }),
      this.prisma.role.findUnique({ where: { name: 'user' } }),
    ]);
    if (!adminRole || !userRole) {
      throw new Error('Roles not found. Run RolesSeed first.');
    }

    const adminPassword = this.configService.get<string>(
      'env.ADMIN_PASSWORD',
      '',
    );
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD is not set. Cannot seed admin users.');
    }
    const password = await bcrypt.hash(adminPassword, 10);
    const entries = [
      {
        username: this.configService.get<string>('env.ADMIN_USERNAME', 'admin'),
        email: this.configService.get<string>(
          'env.ADMIN_EMAIL',
          'admin@example.com',
        ),
        password,
        isVerified: true,
        provider: 'local',
        image: '/user1.png',
        location: 'Vietnam',
        roleId: adminRole.id,
      },
      {
        username: 'lyhung',
        email: 'lyhung10nctlop95@gmail.com',
        password,
        isVerified: true,
        provider: 'local',
        image: '/user2.jpg',
        location: 'Vietnam',
        roleId: adminRole.id,
      },
      {
        username: 'thien',
        email: 'thien@example.com',
        password,
        isVerified: true,
        provider: 'local',
        image: '/user3.jpg',
        location: 'USA',
        roleId: userRole.id,
      },
      {
        username: 'vinh',
        email: 'vinh@example.com',
        password,
        isVerified: true,
        provider: 'local',
        image: '/user4.jpg',
        location: 'UK',
        roleId: userRole.id,
      },
      {
        username: 'thanh',
        email: 'thanh@example.com',
        password,
        isVerified: true,
        provider: 'local',
        image: '/user5.jpg',
        location: 'Japan',
        roleId: userRole.id,
      },
    ];

    await this.prisma.user.createMany({
      data: entries.map((entry) => ({ id: createSeedId(), ...entry })),
    });
    this.logger.log(`Seeded ${entries.length} users.`);
  }
}
