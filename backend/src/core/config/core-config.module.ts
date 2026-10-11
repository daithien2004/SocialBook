import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './env.config';
import { shouldSkipEnvValidation, validateEnv } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validate: shouldSkipEnvValidation(
        process.env.NODE_ENV,
        process.env.SKIP_ENV_VALIDATION,
      )
        ? undefined
        : validateEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class CoreConfigModule {}
