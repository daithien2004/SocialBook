import { GetRoleByNameQuery } from './get-role-by-name.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { Role } from '@/domain/roles/entities/role.entity';

@QueryHandler(GetRoleByNameQuery)
export class GetRoleByNameHandler {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(query: GetRoleByNameQuery): Promise<Role | null> {
    return this.roleRepository.findByName(query.name);
  }
}
