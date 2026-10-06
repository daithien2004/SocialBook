import mongoose from 'mongoose';

const LOCAL_MONGO_HOSTS = new Set(['localhost', '127.0.0.1', 'mongo']);
const TARGET_DATABASE = 'socialbook';
const APPLY_CHANGES = process.argv.includes('--apply');

async function removeReadingRoomChatMessages(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI must point to the local development database.');
  }

  const target = new URL(mongoUri);
  const databaseName = decodeURIComponent(target.pathname.replace(/^\/+/, ''));
  if (
    !LOCAL_MONGO_HOSTS.has(target.hostname) ||
    databaseName !== TARGET_DATABASE
  ) {
    throw new Error(
      `Refusing target ${target.hostname}/${databaseName}; expected a local Mongo host and ${TARGET_DATABASE}.`,
    );
  }

  const connection = await mongoose.createConnection(mongoUri).asPromise();
  try {
    const collection = connection.collection('reading_rooms');
    const filter = { chatMessages: { $exists: true } };
    const documentsWithField = await collection.countDocuments(filter);

    if (!APPLY_CHANGES) {
      console.info(
        `Dry run: ${String(documentsWithField)} reading_rooms documents contain chatMessages on ${target.hostname}/${databaseName}. Pass --apply to unset the field.`,
      );
      return;
    }

    const result = await collection.updateMany(filter, {
      $unset: { chatMessages: '' },
    });
    console.info(
      `Removed chatMessages from ${String(result.modifiedCount)} reading_rooms documents on ${target.hostname}/${databaseName}.`,
    );
  } finally {
    await connection.close();
  }
}

void removeReadingRoomChatMessages().catch((error: unknown) => {
  console.error(
    'Reading Room chat field cleanup failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
