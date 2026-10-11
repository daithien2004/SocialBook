import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { RedisOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiOkResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get('live')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['ok'] } },
    },
  })
  @Version(VERSION_NEUTRAL)
  @Public()
  @SkipThrottle()
  checkLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'info', 'error', 'details'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        info: { type: 'object', additionalProperties: { type: 'object' } },
        error: { type: 'object', additionalProperties: { type: 'object' } },
        details: { type: 'object', additionalProperties: { type: 'object' } },
      },
    },
  })
  @Version(VERSION_NEUTRAL)
  @Public()
  @SkipThrottle()
  @HealthCheck()
  checkReadiness() {
    const redisHost = this.configService.get<string>(
      'env.REDIS_HOST',
      'localhost',
    );
    const redisPort = this.configService.get<number>('env.REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>(
      'env.REDIS_PASSWORD',
      '',
    );

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
