import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "inclusive_learning";

let client;
let db;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('inclusive');
    console.log("✅ Connected to MongoDB Atlas:", DB_NAME);
  }
  return db;
}
