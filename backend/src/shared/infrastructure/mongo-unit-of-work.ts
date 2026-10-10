import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UnitOfWorkPort } from '../application/unit-of-work.port';
import { MongoSessionContext } from './mongo-session.context';

@Injectable()
export class MongoUnitOfWork implements UnitOfWorkPort {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly sessionContext: MongoSessionContext,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.sessionContext.currentSession) {
      return operation();
    }

    const session = await this.connection.startSession();
    const transactionOutcome: {
      outcome: { completed: false } | { completed: true; value: T };
    } = {
      outcome: { completed: false },
    };

    try {
      await session.withTransaction(async () => {
        transactionOutcome.outcome = {
          completed: true,
          value: await this.sessionContext.run(session, operation),
        };
      });

      if (!transactionOutcome.outcome.completed) {
        throw new Error(
          'MongoDB transaction completed without running its operation',
        );
      }

      return transactionOutcome.outcome.value;
    } finally {
      await session.endSession();
    }
  }
}
