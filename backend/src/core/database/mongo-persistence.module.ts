import { Module } from '@nestjs/common';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { MongoSessionContext } from './mongo-session.context';
import { MongoUnitOfWork } from './mongo-unit-of-work';

@Module({
  providers: [
    MongoSessionContext,
    MongoUnitOfWork,
    { provide: UnitOfWorkPort, useExisting: MongoUnitOfWork },
  ],
  exports: [MongoSessionContext, MongoUnitOfWork, UnitOfWorkPort],
})
export class MongoPersistenceModule {}
