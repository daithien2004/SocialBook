import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEvent, UserEventSchema } from '../../schemas/user-event.schema';
import {
  UserPreference,
  UserPreferenceSchema,
} from '../../schemas/user-preference.schema';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { MongooseUserAnalyticsRepository } from './mongoose-user-analytics.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEvent.name, schema: UserEventSchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
    ]),
  ],
  providers: [
    {
      provide: IUserAnalyticsRepository,
      useClass: MongooseUserAnalyticsRepository,
    },
  ],
  exports: [IUserAnalyticsRepository],
})
export class AnalyticsRepositoryModule {}
