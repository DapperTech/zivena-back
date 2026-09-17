import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env";

export const connectDatabase = async (): Promise<void> => {
  if (!env.mongoUri) {
    console.warn("[db] MONGO_URI is not set. Skipping MongoDB connection.");
    return;
  }

  if (env.dnsServers.length > 0) {
    dns.setServers(env.dnsServers);
  }

  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDbName,
    autoCreate: false,
    autoIndex: false
  });
  console.info(`[db] Connected to MongoDB database "${mongoose.connection.name}".`);
};
