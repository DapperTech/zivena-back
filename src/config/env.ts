import dotenv from "dotenv";

dotenv.config();

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DB_NAME ?? "zivena",
  dnsServers: process.env.DNS_SERVERS?.split(",").map((server) => server.trim()).filter(Boolean) ?? [],
  allowedOrigins:
    process.env.ALLOWED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [],
  authBypass: parseBoolean(process.env.AUTH_BYPASS, process.env.NODE_ENV !== "production"),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  firebaseCheckRevoked: parseBoolean(
    process.env.FIREBASE_CHECK_REVOKED,
    process.env.NODE_ENV === "production"
  )
};

export const isProduction = env.nodeEnv === "production";
