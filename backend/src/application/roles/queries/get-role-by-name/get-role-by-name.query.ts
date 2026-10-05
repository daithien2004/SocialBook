import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IRoleRepository } from "@/domain/roles/repositories/role.repository.interface";
import { Role } from "@/domain/roles/entities/role.entity";

export class GetRoleByNameQuery extends Query<Role | null> {
  constructor(public readonly name: string) { super(); }
}
