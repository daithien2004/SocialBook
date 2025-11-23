import { Injectable } from '@nestjs/common';
import { Role, RoleDocument } from './schemas/role.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }
}
