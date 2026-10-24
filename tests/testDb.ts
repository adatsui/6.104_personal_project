import { afterAll } from "bun:test";
import { MongoClient, type Db } from "mongodb";

/**
 * A separate database for tests, so they never touch the app's data. Each test
 * file gets its own database (named after the file) so files can run in parallel.
 */
export function testDb(name: string): Db {
  const client = new MongoClient(process.env.MONGODB_URL!);
  afterAll(async () => {
    await client.db(`threadtracker_test_${name}`).dropDatabase();
    await client.close();
  });
  return client.db(`threadtracker_test_${name}`);
}

/** Empties every collection, between tests. */
export async function clear(db: Db): Promise<void> {
  for (const { name } of await db.listCollections().toArray()) {
    await db.collection(name).deleteMany({});
  }
}
