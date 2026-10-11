import { Connection } from 'mongoose';

export function isMongoTransactionCapableTopology(
  hello: Record<string, unknown>,
): boolean {
  return typeof hello.setName === 'string' || hello.msg === 'isdbgrid';
}

export async function assertMongoTransactionCapability(
  connection: Connection,
): Promise<void> {
  const database = connection.db;
  if (!database) {
    throw new Error('MongoDB connection has no selected database.');
  }
  const hello = await database.admin().command({ hello: 1 });
  if (!isMongoTransactionCapableTopology(hello)) {
    throw new Error(
      'MongoDB transactions require a replica set or sharded cluster (mongos). Configure MONGO_URI with a replica set.',
    );
  }
}
