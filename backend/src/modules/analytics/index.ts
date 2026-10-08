export { AnalyticsModule } from './analytics.module';
export { AnalyticsApplicationModule } from './application/analytics-application.module';
export { AnalyticsInfrastructureModule } from './infrastructure/analytics-infrastructure.module';
export { AudioPlayedEvent } from './application/events/audio-played.event';
export { BookViewedEvent } from './application/events/book-viewed.event';
export { IUserAnalyticsRepository } from './domain/repositories/user-analytics.repository.interface';
export { UserEventType } from './domain/enums/user-event-type.enum';
export {
  UserEvent as UserEventSchemaModel,
  UserEventSchema,
} from './infrastructure/schemas/user-event.schema';
export type { UserEventDocument } from './infrastructure/schemas/user-event.schema';
export {
  UserPreference as UserPreferenceSchemaModel,
  UserPreferenceSchema,
} from './infrastructure/schemas/user-preference.schema';
export type { UserPreferenceDocument } from './infrastructure/schemas/user-preference.schema';
