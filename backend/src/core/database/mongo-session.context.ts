import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ClientSession } from 'mongoose';

@Injectable()
export class MongoSessionContext {
  private readonly storage = new AsyncLocalStorage<ClientSession>();

  get currentSession(): ClientSession | undefined {
    return this.storage.getStore();
  }

  run<T>(session: ClientSession, operation: () => Promise<T>): Promise<T> {
    return this.storage.run(session, operation);
  }
}
