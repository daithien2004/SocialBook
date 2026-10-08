import { Role as RoleEntity } from '../../domain/entities/role.entity';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { RoleMapper } from './role.mapper';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findByName(name: string): Promise<RoleEntity | null> {
    const role = await this.roleModel.findOne({ name }).lean().exec();
    return role ? RoleMapper.toDomain(role) : null;
  }

  async findById(id: string): Promise<RoleEntity | null> {
    const role = await this.roleModel.findById(id).lean().exec();
    return role ? RoleMapper.toDomain(role) : null;
  }
}
