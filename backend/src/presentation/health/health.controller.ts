import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { RedisOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get('liveness')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  checkReadiness() {
    const redisHost = this.configService.get<string>('env.REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('env.REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('env.REDIS_PASSWORD', '');

    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () =>
        this.microservice.pingCheck<RedisOptions>('redis', {
          transport: Transport.REDIS,
          options: {
            host: redisHost,
            port: redisPort,
            password: redisPassword,
          },
        }),
    ]);
  }
}
