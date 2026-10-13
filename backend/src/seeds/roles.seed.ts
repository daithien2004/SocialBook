import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class RolesSeed {
  private readonly logger = new Logger(RolesSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    for (const name of ['user', 'admin']) {
      const existing = await this.prisma.role.findUnique({ where: { name } });
      if (existing) {
        this.logger.log(`Role exists: ${name}`);
        continue;
      }
      await this.prisma.role.create({ data: { id: createSeedId(), name } });
      this.logger.log(`Role created: ${name}`);
    }
  }
}
