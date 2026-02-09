import { Injectable } from '@nestjs/common';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { Role } from '@/domain/roles/entities/role.entity';
import { GetRoleByNameQuery } from './get-role-by-name.query';

@Injectable()
export class GetRoleByNameUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
  ) { }

  async execute(query: GetRoleByNameQuery): Promise<Role | null> {
    return this.roleRepository.findByName(query.name);
  }
}
