import { Module } from '@nestjs/common';
import { RolesRepositoryModule } from './repositories/roles-repository.module';

@Module({
  imports: [RolesRepositoryModule],
  exports: [RolesRepositoryModule],
})
export class RolesInfrastructureModule {}
