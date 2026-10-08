import { Command } from '@nestjs/cqrs';

import { UserLocationSummary } from '@/modules/statistics/application/commands/check-user-locations/check-user-locations.handler';

export class CheckUserLocationsCommand extends Command<UserLocationSummary> {
  constructor() {
    super();
  }
}
