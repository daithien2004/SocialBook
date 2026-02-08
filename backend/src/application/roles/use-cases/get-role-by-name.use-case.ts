import { Injectable } from '@nestjs/common';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { Role } from '@/domain/roles/entities/role.entity';

@Injectable()
export class GetRoleByNameUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(name: string): Promise<Role | null> {
    return this.roleRepository.findByName(name);
  }
}

