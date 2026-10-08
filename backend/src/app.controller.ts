import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiOkResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'timestamp'],
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
