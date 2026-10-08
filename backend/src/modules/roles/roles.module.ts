import { Module } from '@nestjs/common';
import { RolesApplicationModule } from './application/roles-application.module';

@Module({ imports: [RolesApplicationModule] })
export class RolesModule {}
