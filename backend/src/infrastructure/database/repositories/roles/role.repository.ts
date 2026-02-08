import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { Role as RoleEntity } from '@/domain/roles/entities/role.entity';
import { RoleMapper } from '@/infrastructure/mappers/role.mapper';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findByName(name: string): Promise<RoleEntity | null> {
    const role = await this.roleModel.findOne({ name }).exec();
    return role ? RoleMapper.toDomain(role) : null;
  }

  async findById(id: string): Promise<RoleEntity | null> {
    const role = await this.roleModel.findById(id).exec();
    return role ? RoleMapper.toDomain(role) : null;
  }
}

