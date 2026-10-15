import { Module } from '@nestjs/common';
import { RolesInfrastructureModule } from './infrastructure/roles-infrastructure.module';

@Module({ imports: [RolesInfrastructureModule] })
export class RolesModule {}
