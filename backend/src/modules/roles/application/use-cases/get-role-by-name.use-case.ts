import { Injectable } from '@nestjs/common';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';

@Injectable()
export class GetRoleByNameUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(name: string): Promise<Role | null> {
    return this.roleRepository.findByName(name);
  }
}
