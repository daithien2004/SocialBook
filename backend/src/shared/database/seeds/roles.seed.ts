import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '@/src/modules/roles/schemas/role.schema';

@Injectable()
export class RolesSeed {
  private readonly logger = new Logger(RolesSeed.name);

  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) { }

  async run() {
    const defaultRoles = [
      { name: 'user' },
      { name: 'admin' },
    ];

    for (const role of defaultRoles) {
      const existed = await this.roleModel.findOne({ name: role.name }).lean();
      if (existed) {
        this.logger.log(`Role exists: ${role.name}`);
        continue;
      }

      await this.roleModel.create(role);
      this.logger.log(`Role created: ${role.name}`);
    }
  }
}
