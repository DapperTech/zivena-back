import { createApp } from "../app/createApp";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { disconnect } from "mongoose";

const bootstrap = async () => {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.info(`[server] Running on port ${env.port}`);
  });

  const shutdown = (signal: string): void => {
    console.info(`[server] ${signal} received, shutting down`);
    server.close(() => {
      void disconnect().finally(() => process.exit(0));
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
};

bootstrap().catch((error) => {
  console.error("[server] Failed to bootstrap application", error);
  process.exit(1);
});
