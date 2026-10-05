import { Command } from '@nestjs/cqrs';

import { UserLocationSummary } from '@/application/statistics/commands/check-user-locations/check-user-locations.handler';

export class CheckUserLocationsCommand extends Command<UserLocationSummary> {
  constructor() {
    super();
  }
}
