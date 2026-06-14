import "server-only";
import { MongoClient, type Db, type Collection } from "mongodb";

type MongoSource = {
  uri: string;
  db: string;
  collection: string;
};

const globalForMongo = globalThis as unknown as {
  mongoClient?: Promise<MongoClient>;
};

function getClient(uri: string) {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri).connect();
  }
  return globalForMongo.mongoClient;
}

export async function getMongoCollection(source: MongoSource): Promise<Collection> {
  const client = await getClient(source.uri);
  const db: Db = client.db(source.db);
  return db.collection(source.collection);
}
